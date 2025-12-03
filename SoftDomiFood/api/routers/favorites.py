from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional

from routers.auth import get_current_user
from services.database_service import get_user_favorites, add_favorite, remove_favorite, check_favorite

router = APIRouter()


class FavoriteRequest(BaseModel):
    productId: str


@router.get("/favorites")
async def list_favorites(current_user: dict = Depends(get_current_user)):
    try:
        user_id = current_user.get('userId')
        if not user_id:
            raise HTTPException(status_code=401, detail="Usuario no autenticado")
        favs = await get_user_favorites(user_id)
        return {"favorites": favs}
    except Exception as e:
        print(f"Error in list_favorites: {str(e)}")
        raise HTTPException(status_code=500, detail="Error al cargar favoritos")


@router.post("/favorites")
async def create_favorite(req: FavoriteRequest, current_user: dict = Depends(get_current_user)):
    try:
        user_id = current_user.get('userId')
        if not user_id:
            raise HTTPException(status_code=401, detail="Usuario no autenticado")
        fav = await add_favorite(user_id, req.productId)
        return {"favorite": fav}
    except Exception as e:
        print(f"Error in create_favorite: {str(e)}")
        raise HTTPException(status_code=500, detail="Error al añadir a favoritos")


@router.get("/favorites/check/{product_id}")
async def favorite_check(product_id: str, current_user: dict = Depends(get_current_user)):
    try:
        user_id = current_user.get('userId')
        if not user_id:
            raise HTTPException(status_code=401, detail="Usuario no autenticado")
        exists = await check_favorite(user_id, product_id)
        return {"exists": exists}
    except Exception as e:
        print(f"Error in favorite_check: {str(e)}")
        raise HTTPException(status_code=500, detail="Error al verificar favorito")


@router.delete("/favorites/{product_id}")
async def delete_favorite(product_id: str, current_user: dict = Depends(get_current_user)):
    try:
        user_id = current_user.get('userId')
        if not user_id:
            raise HTTPException(status_code=401, detail="Usuario no autenticado")
        success = await remove_favorite(user_id, product_id)
        if not success:
            raise HTTPException(status_code=404, detail="Favorite not found")
        return {"message": "Favorite removed"}
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error in delete_favorite: {str(e)}")
        raise HTTPException(status_code=500, detail="Error al eliminar favorito")
