from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from .. import database, schemas
from ..core import security
from ..services import reporting
from typing import List

router = APIRouter(
    prefix="/reports",
    tags=["Reports"]
)

@router.get("/orders/export/{format}")
def export_orders(format: str, db = Depends(database.get_db), current_user: schemas.User = Depends(security.get_current_user)):
    orders = list(db.orders.find())
    data = []
    for o in orders:
        product_name = "N/A"
        if "product" in o and o["product"]:
             product_name = o["product"]["name"]
        
        supplier_name = "N/A"
        if "supplier" in o and o["supplier"]:
             supplier_name = o["supplier"]["name"]

        data.append({
            "Order ID": o["id"],
            "Product": product_name,
            "Quantity": o["quantity"],
            "Date": o["order_date"].strftime("%Y-%m-%d"),
            "Status": o["status"],
            "Supplier": supplier_name
        })
    
    if format == "excel":
        file_stream = reporting.generate_excel(data, "orders.xlsx")
        headers = {'Content-Disposition': 'attachment; filename="orders.xlsx"'}
        return StreamingResponse(file_stream, headers=headers, media_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
    
    elif format == "pdf":
        file_stream = reporting.generate_pdf(data, "Orders Report")
        headers = {'Content-Disposition': 'attachment; filename="orders.pdf"'}
        return StreamingResponse(file_stream, headers=headers, media_type='application/pdf')
    
    else:
        raise HTTPException(status_code=400, detail="Invalid format. Use 'excel' or 'pdf'.")

@router.get("/inventory/export/{format}")
def export_inventory(format: str, db = Depends(database.get_db), current_user: schemas.User = Depends(security.get_current_user)):
    products = list(db.products.find())
    data = []
    for p in products:
        supplier_name = "N/A"
        if "supplier" in p and p["supplier"]:
            supplier_name = p["supplier"]["name"]
        elif "supplier_id" in p:
             # Fallback fetch
             s = db.suppliers.find_one({"id": p["supplier_id"]})
             if s: supplier_name = s["name"]

        data.append({
            "ID": p["id"],
            "Name": p["name"],
            "Category": p["category"],
            "Price": p["price"],
            "Stock": p["stock_level"],
            "Reorder Point": p["reorder_point"],
            "Supplier": supplier_name
        })

    if format == "excel":
        file_stream = reporting.generate_excel(data, "inventory.xlsx")
        headers = {'Content-Disposition': 'attachment; filename="inventory.xlsx"'}
        return StreamingResponse(file_stream, headers=headers, media_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
    
    elif format == "pdf":
        file_stream = reporting.generate_pdf(data, "Inventory Report")
        headers = {'Content-Disposition': 'attachment; filename="inventory.pdf"'}
        return StreamingResponse(file_stream, headers=headers, media_type='application/pdf')
    
    else:
        raise HTTPException(status_code=400, detail="Invalid format. Use 'excel' or 'pdf'.")
