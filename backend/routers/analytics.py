from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from .. import database
from ..services import analytics as scms_analysis

router = APIRouter(
    prefix="/analytics",
    tags=["analytics"],
)

@router.get("/forecast/{product_id}")
def get_forecast(product_id: int, db = Depends(database.get_db)):
    result = scms_analysis.get_demand_forecast(db, product_id)
    return result

@router.get("/abc")
def get_abc_classification(db = Depends(database.get_db)):
    result = scms_analysis.abc_analysis(db)
    return result

@router.get("/supplier-classification")
def get_supplier_classification(db = Depends(database.get_db)):
    result = scms_analysis.classify_suppliers(db)
    return result

@router.get("/eoq")
def get_eoq_analysis(db = Depends(database.get_db)):
    result = scms_analysis.get_eoq_data(db)
    return result

@router.get("/dashboard-stats")
def get_dashboard_stats(db = Depends(database.get_db)):
    # Calculate Total Revenue using Aggregation
    pipeline = [
        {
            "$lookup": {
                "from": "products",
                "localField": "product_id",
                "foreignField": "id",
                "as": "product_info"
            }
        },
        {
            "$unwind": "$product_info"
        },
        {
            "$group": {
                "_id": None,
                "totalRevenue": {
                    "$sum": { "$multiply": ["$quantity", "$product_info.price"] }
                }
            }
        }
    ]
    
    revenue_result = list(db.orders.aggregate(pipeline))
    total_revenue = revenue_result[0]["totalRevenue"] if revenue_result else 0
    
    total_products = db.products.count_documents({})
    low_stock_alerts = db.products.count_documents({"$expr": {"$lte": ["$stock_level", "$reorder_point"]}})
    active_suppliers = db.suppliers.count_documents({})
    
    return {
        "total_revenue": int(total_revenue),
        "total_products": total_products,
        "low_stock_alerts": low_stock_alerts,
        "active_suppliers": active_suppliers
    }

import io

@router.post("/analyze-file")
async def analyze_file_endpoint(file: UploadFile = File(...)):
    contents = await file.read()
    result = scms_analysis.analyze_file(io.BytesIO(contents), file.filename)
    
    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])
        
    return result
