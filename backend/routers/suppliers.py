from fastapi import APIRouter, Depends, HTTPException
from typing import List
from .. import schemas, database
from ..core import security

router = APIRouter(
    prefix="/suppliers",
    tags=["suppliers"],
)

@router.post("/", response_model=schemas.Supplier)
def create_supplier(supplier: schemas.SupplierCreate, db = Depends(database.get_db), current_user: schemas.User = Depends(security.get_current_user)):
    db_supplier = db.suppliers.find_one({"name": supplier.name})
    if db_supplier:
        raise HTTPException(status_code=400, detail="Supplier already registered")
    
    # Generate a new ID for the supplier
    last_supplier = list(db.suppliers.find().sort("id", -1).limit(1))
    new_id = 1
    if last_supplier:
        new_id = last_supplier[0]["id"] + 1

    new_supplier_data = supplier.dict()
    new_supplier_data["id"] = new_id
    
    db.suppliers.insert_one(new_supplier_data)
    
    # Return the created supplier, including the generated ID
    return schemas.Supplier(**new_supplier_data)

@router.get("/", response_model=List[schemas.Supplier])
def read_suppliers(skip: int = 0, limit: int = 100, db = Depends(database.get_db), current_user: schemas.User = Depends(security.get_current_user)):
    suppliers = list(db.suppliers.find().skip(skip).limit(limit))
    return suppliers

@router.get("/{supplier_id}", response_model=schemas.Supplier)
def read_supplier(supplier_id: int, db = Depends(database.get_db), current_user: schemas.User = Depends(security.get_current_user)):
    supplier = db.suppliers.find_one({"id": supplier_id})
    if supplier is None:
        raise HTTPException(status_code=404, detail="Supplier not found")
    return supplier

@router.put("/{supplier_id}", response_model=schemas.Supplier)
def update_supplier(supplier_id: int, supplier: schemas.SupplierCreate, db = Depends(database.get_db), current_user: schemas.User = Depends(security.get_current_user)):
    db_supplier = db.suppliers.find_one({"id": supplier_id})
    if db_supplier is None:
        raise HTTPException(status_code=404, detail="Supplier not found")
    
    update_data = supplier.dict(exclude_unset=True)
    db.suppliers.update_one({"id": supplier_id}, {"$set": update_data})
    
    updated_supplier = db.suppliers.find_one({"id": supplier_id})
    return updated_supplier

@router.delete("/{supplier_id}")
def delete_supplier(supplier_id: int, db = Depends(database.get_db), current_user: schemas.User = Depends(security.get_current_user)):
    result = db.suppliers.delete_one({"id": supplier_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Supplier not found")
    
    return {"message": "Supplier deleted successfully"}
