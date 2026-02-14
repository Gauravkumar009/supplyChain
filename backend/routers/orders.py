from fastapi import APIRouter, Depends, HTTPException
from typing import List
from datetime import datetime
from .. import schemas, database
from ..core import security

router = APIRouter(
    prefix="/orders",
    tags=["orders"],
)

@router.post("/", response_model=schemas.Order)
def create_order(order: schemas.OrderCreate, db = Depends(database.get_db), current_user: schemas.User = Depends(security.get_current_user)):
    # Auto-increment ID
    last_order = list(db.orders.find().sort("id", -1).limit(1))
    new_id = 1
    if last_order:
        new_id = last_order[0]["id"] + 1

    new_order_data = order.dict()
    new_order_data["id"] = new_id
    new_order_data["order_date"] = datetime.utcnow()
    
    # Fetch and embed Product details
    product = db.products.find_one({"id": order.product_id})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    new_order_data["product"] = product
    
    # Fetch and embed Supplier details
    supplier = db.suppliers.find_one({"id": order.supplier_id})
    if not supplier:
         raise HTTPException(status_code=404, detail="Supplier not found")
    new_order_data["supplier"] = supplier

    db.orders.insert_one(new_order_data)
    return new_order_data

@router.get("/", response_model=List[schemas.OrderWithDetails])
def read_orders(skip: int = 0, limit: int = 100, db = Depends(database.get_db), current_user: schemas.User = Depends(security.get_current_user)):
    orders = list(db.orders.find().skip(skip).limit(limit))
    return orders
