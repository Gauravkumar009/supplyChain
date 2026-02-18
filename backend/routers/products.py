from fastapi import APIRouter, Depends, HTTPException
from typing import List
from .. import schemas, database
from ..core import security

router = APIRouter(
    prefix="/products",
    tags=["Product"],
)

@router.post("/", response_model=schemas.Product)
def create_product(product: schemas.ProductCreate, db = Depends(database.get_db), current_user: schemas.User = Depends(security.get_current_user)):
    last_product = list(db.products.find().sort("id", -1).limit(1))
    new_id = 1
    if last_product:
        new_id = last_product[0]["id"] + 1

    new_product_data = product.dict()
    new_product_data["id"] = new_id
    
    supplier = db.suppliers.find_one({"id": product.supplier_id})
    if supplier:
        new_product_data["supplier"] = supplier
    
    db.products.insert_one(new_product_data)
    return new_product_data

@router.get("/", response_model=List[schemas.Product])
def read_products(skip: int = 0, limit: int = 100, db = Depends(database.get_db), current_user: schemas.User = Depends(security.get_current_user)):
    products = list(db.products.find().skip(skip).limit(limit))
    return products

@router.get("/{product_id}", response_model=schemas.Product)
def read_product(product_id: int, db = Depends(database.get_db), current_user: schemas.User = Depends(security.get_current_user)):
    product = db.products.find_one({"id": product_id})
    if product is None:
        raise HTTPException(status_code=404, detail="Product not found")
    return product

@router.put("/{product_id}", response_model=schemas.Product)
def update_product(product_id: int, product: schemas.ProductCreate, db = Depends(database.get_db), current_user: schemas.User = Depends(security.get_current_user)):
    db_product = db.products.find_one({"id": product_id})
    if db_product is None:
        raise HTTPException(status_code=404, detail="Product not found")
    
    update_data = product.dict(exclude_unset=True)
    
    if "supplier_id" in update_data:
         supplier = db.suppliers.find_one({"id": update_data["supplier_id"]})
         if supplier:
             update_data["supplier"] = supplier

    db.products.update_one({"id": product_id}, {"$set": update_data})
    return db.products.find_one({"id": product_id})

@router.delete("/{product_id}")
def delete_product(product_id: int, db = Depends(database.get_db), current_user: schemas.User = Depends(security.get_current_user)):
    result = db.products.delete_one({"id": product_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Product not found")
    
    return {"message": "Product deleted successfully"}
