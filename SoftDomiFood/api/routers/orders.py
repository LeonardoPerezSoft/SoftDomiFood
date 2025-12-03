from fastapi import APIRouter, Depends, HTTPException
from typing import List, Optional
from pydantic import BaseModel
from enum import Enum
from datetime import timezone

from routers.auth import get_current_user
from services.database_service import (
    create_order,
    get_order_status,
    get_user_orders,
    get_product_by_id,
    get_address_by_id,
    validate_coupon_for_user,
    register_coupon_usage,
    get_coupon_by_code
)
from services.rabbitmq import publish_order

router = APIRouter()

class PaymentMethod(str, Enum):
    CASH = "CASH"
    CARD = "CARD"

class OrderItem(BaseModel):
    productId: str
    quantity: int
    price: Optional[float] = None

class CreateOrderRequest(BaseModel):
    addressId: str
    items: List[OrderItem]
    total: Optional[float] = None
    paymentMethod: PaymentMethod = PaymentMethod.CASH
    notes: Optional[str] = None
    couponCode: Optional[str] = None
    scheduledFor: Optional[str] = None  # 👈 NUEVO (ISO string)

@router.post("/")
async def create_new_order(
    order_data: CreateOrderRequest,
    current_user: dict = Depends(get_current_user)
):
    """Crear nuevo pedido - Soporta pedido programado"""
    try:
        if not current_user or not current_user.get("userId"):
            raise HTTPException(status_code=401, detail="Usuario no autenticado")

        if not order_data.items:
            raise HTTPException(status_code=422, detail="El pedido debe contener al menos un producto")

        if not order_data.addressId:
            raise HTTPException(status_code=422, detail="Debe seleccionar una dirección de entrega")

        # Validar dirección existe y pertenece al usuario
        address = await get_address_by_id(order_data.addressId)
        if not address:
            raise HTTPException(status_code=404, detail="Dirección no encontrada")
        if str(address.get("userId")) != str(current_user["userId"]):
            raise HTTPException(status_code=403, detail="La dirección no pertenece al usuario")

        # Validar items y calcular total
        validated_items = []
        calculated_total = 0.0

        for item in order_data.items:
            if item.quantity <= 0:
                raise HTTPException(status_code=422, detail=f"La cantidad del producto {item.productId} debe ser mayor a 0")

            product = await get_product_by_id(item.productId)
            if not product:
                raise HTTPException(status_code=404, detail=f"Producto {item.productId} no encontrado")

            if not product.get("isAvailable", True):
                raise HTTPException(status_code=400, detail=f"El producto {product.get('name')} no está disponible")

            item_price = item.price if item.price is not None else float(product.get("price", 0))
            item_total = item_price * item.quantity
            calculated_total += item_total

            validated_items.append({
                "productId": item.productId,
                "quantity": item.quantity,
                "price": item_price
            })

        final_total = order_data.total if order_data.total is not None else calculated_total
        if final_total <= 0:
            raise HTTPException(status_code=422, detail="El total del pedido debe ser mayor a 0")

        # Cupón
        discount_applied = 0.0
        if order_data.couponCode:
            validation = await validate_coupon_for_user(order_data.couponCode, current_user["userId"])
            if not validation.get("valid"):
                raise HTTPException(status_code=400, detail=f"Cupón inválido: {validation.get('reason')}")
            coupon = validation.get("coupon", {})

            if coupon.get("discount_type") == "PERCENTAGE":
                pct = float(coupon.get("percentage", 0))
                discount_applied = round(final_total * (pct / 100.0), 2)
            elif coupon.get("discount_type") == "AMOUNT":
                discount_applied = float(coupon.get("amount", 0))

            discount_applied = max(0.0, min(discount_applied, final_total))
            final_total = round(final_total - discount_applied, 2)

        # 👇 Pedido programado: validar y setear status + scheduled_for
        status_value = "PENDING"
        scheduled_for_dt = None

        if order_data.scheduledFor:
            from services.schedule_service import parse_client_datetime, validate_schedule
            scheduled_local = parse_client_datetime(order_data.scheduledFor)
            validate_schedule(scheduled_local)

            # Guardamos en UTC sin timezone info (Postgres timestamp without time zone)
            scheduled_for_dt = scheduled_local.astimezone(timezone.utc).replace(tzinfo=None)
            status_value = "SCHEDULED"

        # Crear orden
        order = await create_order(
            user_id=current_user["userId"],
            address_id=order_data.addressId,
            items=validated_items,
            total=final_total,
            payment_method=order_data.paymentMethod.value,
            notes=order_data.notes,
            coupon_code=order_data.couponCode if order_data.couponCode else None,
            discount_applied=discount_applied,
            status=status_value,
            scheduled_for=scheduled_for_dt
        )

        if not order:
            raise HTTPException(status_code=500, detail="Error creating order")

        # Registrar uso cupón
        if order_data.couponCode:
            try:
                c = await get_coupon_by_code(order_data.couponCode)
                if c and order.get("id"):
                    await register_coupon_usage(c["id"], current_user["userId"], order["id"])
            except Exception as e:
                print(f"⚠️  Error registrando uso de cupón: {e}")

        # Publicar a Rabbit SOLO si NO es programado
        if status_value != "SCHEDULED":
            try:
                await publish_order(order)
            except Exception as mq_error:
                print(f"⚠️  Error publicando a RabbitMQ: {mq_error}")
                print("   La orden se creó pero no se publicó a la cola")

        msg = "Order created successfully" if status_value != "SCHEDULED" else "Order scheduled successfully"
        return {
            "order": order,
            "message": msg,
            "discountApplied": discount_applied,
            "scheduled": (status_value == "SCHEDULED")
        }

    except HTTPException:
        raise
    except ValueError as ve:
        # validaciones de schedule_service
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error creating order: {str(e)}")

@router.get("/{order_id}")
async def get_order(
    order_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Obtener estado de un pedido"""
    order = await get_order_status(order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return {"order": order}

@router.get("/")
async def get_orders(
    current_user: dict = Depends(get_current_user)
):
    """Obtener todos los pedidos del usuario autenticado"""
    if not current_user or not current_user.get("userId"):
        raise HTTPException(status_code=401, detail="Usuario no autenticado")

    orders = await get_user_orders(current_user["userId"])
    return {"orders": orders}
