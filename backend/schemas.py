from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class SupplierBase(BaseModel):
    name: str
    contact_name: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None
    reliability_score: Optional[float] = 1.0

class SupplierCreate(SupplierBase):
    pass

class Supplier(SupplierBase):
    id: int
    
    class Config:
        orm_mode = True

class ProductBase(BaseModel):
    name: str
    category: str
    price: float
    stock_level: int
    reorder_point: int
    supplier_id: int

class ProductCreate(ProductBase):
    pass

class Product(ProductBase):
    id: int
    supplier: Optional[Supplier] = None

    class Config:
        orm_mode = True

class OrderBase(BaseModel):
    product_id: int
    supplier_id: int
    quantity: int
    status: str = "Pending"

class OrderCreate(OrderBase):
    pass

class Order(OrderBase):
    id: int
    order_date: datetime

    class Config:
        orm_mode = True

class OrderWithDetails(Order):
    product: Optional[Product] = None
    supplier: Optional[Supplier] = None

class UserBase(BaseModel):
    username: str
    email: Optional[str] = None

class UserCreate(UserBase):
    password: str

class User(UserBase):
    id: int
    is_active: bool

    class Config:
        orm_mode = True
