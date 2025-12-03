from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field
from typing import Optional
from routers.auth import get_current_user
from services.database_service import (
    user_can_review_product, 
    create_review, 
    get_product_reviews,
    check_user_reviewed_product
)

router = APIRouter()

class CreateReviewRequest(BaseModel):
    productId: str = Field(..., min_length=1)
    rating: int = Field(..., ge=1, le=5)
    comment: Optional[str] = Field(default=None, max_length=2000)

@router.post("/reviews")
async def add_review(req: CreateReviewRequest, current_user: dict = Depends(get_current_user)):
    user_id = current_user.get("userId") or current_user.get("id")
    if not user_id:
        raise HTTPException(status_code=401, detail="Usuario no autenticado")

    order_id = await user_can_review_product(user_id, req.productId)
    if not order_id:
        raise HTTPException(status_code=403, detail="Solo puedes reseñar productos entregados en tus pedidos")

    try:
        review = await create_review(user_id, req.productId, order_id, req.rating, req.comment)
        return {"message": "Reseña creada", "review": review}
    except Exception as e:
        if "uq_review_unique" in str(e) or "duplicate key" in str(e).lower():
            raise HTTPException(status_code=409, detail="Ya registraste reseña para este producto")
        print(f"Error creando reseña: {e}")
        raise HTTPException(status_code=500, detail=f"Error creando reseña: {str(e)}")


@router.get("/products/{product_id}/reviews")
async def list_product_reviews(product_id: str):
    try:
        data = await get_product_reviews(product_id)
        return data
    except Exception as e:
        print(f"Error obteniendo reseñas: {e}")
        raise HTTPException(status_code=500, detail=f"Error obteniendo reseñas: {str(e)}")


@router.get("/products/{product_id}/can-review")
async def can_review_product(product_id: str, current_user: dict = Depends(get_current_user)):
    """Verifica si el usuario puede hacer una reseña de este producto"""
    user_id = current_user.get("userId") or current_user.get("id")
    if not user_id:
        raise HTTPException(status_code=401, detail="Usuario no autenticado")
    
    try:
        # Verificar si ya reseñó
        already_reviewed = await check_user_reviewed_product(user_id, product_id)
        if already_reviewed:
            return {"canReview": False, "reason": "Ya has reseñado este producto"}
        
        # Verificar si tiene un pedido entregado con este producto
        order_id = await user_can_review_product(user_id, product_id)
        if not order_id:
            return {"canReview": False, "reason": "Solo puedes reseñar productos que hayas recibido"}
        
        return {"canReview": True, "orderId": order_id}
    except Exception as e:
        print(f"Error verificando si puede reseñar: {e}")
        raise HTTPException(status_code=500, detail=f"Error verificando permisos: {str(e)}")
