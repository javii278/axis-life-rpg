from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from backend.database import get_db
from backend.models import Character, CosmeticItem, UserCosmetic, User
from backend.core.auth import get_current_user

router = APIRouter(prefix="/shop", tags=["shop"])

_CATEGORY_FIELD = {"title": "equipped_title", "aura": "equipped_aura", "border": "equipped_border"}


@router.get("/")
def list_shop(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    items = db.query(CosmeticItem).order_by(CosmeticItem.category, CosmeticItem.price).all()
    owned_keys = {
        uc.cosmetic_key
        for uc in db.query(UserCosmetic).filter(UserCosmetic.user_id == current_user.id).all()
    }
    character = db.query(Character).filter(Character.user_id == current_user.id).first()
    equipped = {
        "title":  character.equipped_title  if character else None,
        "aura":   character.equipped_aura   if character else None,
        "border": character.equipped_border if character else None,
    }

    return [
        {
            "key": item.key, "name": item.name, "category": item.category,
            "value": item.value, "price": item.price,
            "description": item.description, "rarity": item.rarity, "emoji": item.emoji,
            "owned": item.key in owned_keys,
            "equipped": equipped.get(item.category) == item.value,
        }
        for item in items
    ]


@router.post("/{item_key}/buy")
def buy_item(item_key: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    item = db.query(CosmeticItem).filter(CosmeticItem.key == item_key).first()
    if not item:
        raise HTTPException(status_code=404, detail="Ítem no encontrado")

    already_owned = db.query(UserCosmetic).filter(
        UserCosmetic.user_id == current_user.id, UserCosmetic.cosmetic_key == item_key
    ).first()
    if already_owned:
        raise HTTPException(status_code=409, detail="Ya tienes este ítem")

    character = db.query(Character).filter(Character.user_id == current_user.id).first()
    if not character:
        raise HTTPException(status_code=404, detail="Personaje no encontrado")
    if character.coins < item.price:
        raise HTTPException(status_code=402, detail=f"Monedas insuficientes ({character.coins}/{item.price})")

    character.coins -= item.price
    db.add(UserCosmetic(user_id=current_user.id, cosmetic_key=item_key))
    db.commit()

    return {"ok": True, "coins_remaining": character.coins, "item": item.name}


@router.post("/{item_key}/equip")
def equip_item(item_key: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    item = db.query(CosmeticItem).filter(CosmeticItem.key == item_key).first()
    if not item:
        raise HTTPException(status_code=404, detail="Ítem no encontrado")

    owned = db.query(UserCosmetic).filter(
        UserCosmetic.user_id == current_user.id, UserCosmetic.cosmetic_key == item_key
    ).first()
    if not owned:
        raise HTTPException(status_code=403, detail="No tienes este ítem")

    character = db.query(Character).filter(Character.user_id == current_user.id).first()
    if not character:
        raise HTTPException(status_code=404, detail="Personaje no encontrado")

    field = _CATEGORY_FIELD.get(item.category)
    if field:
        setattr(character, field, item.value)
    db.commit()

    return {"ok": True, "equipped": item.name, "field": field, "value": item.value}


@router.post("/{item_key}/unequip")
def unequip_item(item_key: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    item = db.query(CosmeticItem).filter(CosmeticItem.key == item_key).first()
    if not item:
        raise HTTPException(status_code=404, detail="Ítem no encontrado")

    character = db.query(Character).filter(Character.user_id == current_user.id).first()
    if not character:
        raise HTTPException(status_code=404, detail="Personaje no encontrado")

    field = _CATEGORY_FIELD.get(item.category)
    if field:
        setattr(character, field, None)
    db.commit()

    return {"ok": True}
