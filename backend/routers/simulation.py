from fastapi import APIRouter, Depends, HTTPException
from .. import database, schemas
import random
from datetime import datetime

router = APIRouter(
    prefix="/simulate",
    tags=["simulation"]
)

@router.post("/generate-order")
def generate_random_order(db = Depends(database.get_db)):
    products = list(db.products.find())
    suppliers = list(db.suppliers.find())
    
    if not products or not suppliers:
        return {"message": "No products or suppliers to simulate orders with."}
    
    product = random.choice(products)
    supplier = random.choice(suppliers)
    
    quantity = random.randint(1, 20)
    
    last_order = list(db.orders.find().sort("id", -1).limit(1))
    new_id = 1
    if last_order:
        new_id = last_order[0]["id"] + 1

    new_order = {
        "id": new_id,
        "product_id": product["id"],
        "supplier_id": supplier["id"],
        "quantity": quantity,
        "status": random.choice(["Pending", "Shipped", "Delivered"]),
        "order_date": datetime.utcnow(),
        "product": product,
        "supplier": supplier
    }
    
    if new_order["status"] in ["Shipped", "Delivered"]:
         new_stock = product["stock_level"] + quantity
         db.products.update_one({"id": product["id"]}, {"$set": {"stock_level": new_stock}})
    
    db.orders.insert_one(new_order)
    
    return {"message": "Random order generated", "order_id": new_order["id"], "product": product["name"], "quantity": quantity}
