import pandas as pd
import numpy as np
from sklearn.linear_model import LinearRegression
from sklearn.neighbors import KNeighborsClassifier
from sklearn.preprocessing import StandardScaler

def calculate_eoq(demand: float, ordering_cost: float, holding_cost: float) -> float:
    """
    Calculate Economic Order Quantity (EOQ).
    EOQ = sqrt((2 * Demand * Ordering Cost) / Holding Cost)
    """
    if holding_cost == 0:
        return 0.0
    return np.sqrt((2 * demand * ordering_cost) / holding_cost)

def get_demand_forecast(db, product_id: int, periods: int = 3):
    """
    Simple linear regression forecast based on order history.
    """
    # MongoDB Query
    orders = list(db.orders.find({"product_id": product_id}).sort("order_date", 1))
    
    if len(orders) < 2:
        return {"error": "Not enough data for forecasting"}

    df = pd.DataFrame([(o["order_date"], o["quantity"]) for o in orders], columns=['date', 'quantity'])
    df['date_ordinal'] = pd.to_datetime(df['date']).map(pd.Timestamp.toordinal)

    X = df[['date_ordinal']]
    y = df['quantity']

    model = LinearRegression()
    model.fit(X, y)

    # Predict for next 'periods' (approx days)
    last_date = df['date'].max()
    future_dates = [last_date + pd.Timedelta(days=i) for i in range(1, periods + 1)]
    future_ordinals = np.array([d.toordinal() for d in future_dates]).reshape(-1, 1)
    
    predictions = model.predict(future_ordinals)
    
    return {
        "dates": [d.strftime("%Y-%m-%d") for d in future_dates],
        "forecast": predictions.tolist()
    }

def abc_analysis(db):
    """
    Perform ABC Analysis based on revenue (Price * Stock/Sold).
    A: Top 20% items (80% value)
    B: Next 30% items (15% value)
    C: Last 50% items (5% value)
    """
    products = list(db.products.find())
    data = []
    
    for p in products:
        # Simplified: using stock value for ABC. Ideally use annual usage value.
        value = p["price"] * p["stock_level"]
        data.append({"product_id": p["id"], "name": p["name"], "value": value})
    
    if not data:
         return []

    df = pd.DataFrame(data)
    df = df.sort_values(by='value', ascending=False)
    
    df['cumulative_value'] = df['value'].cumsum()
    df['total_value'] = df['value'].sum()
    df['percentage'] = df['cumulative_value'] / df['total_value']
    
    def classify(pct):
        if pct <= 0.80: return 'A'
        elif pct <= 0.95: return 'B'
        else: return 'C'
        
    df['category'] = df['percentage'].apply(classify)
    
    return df[['product_id', 'name', 'value', 'category']].to_dict(orient='records')

def classify_suppliers(db):
    """
    Classify suppliers using K-Nearest Neighbors (KNN).
    Features (Simulated): Delivery Time (days), Defect Rate (%)
    Target: Reliability Tier (High, Medium, Low)
    """
    suppliers = list(db.suppliers.find())
    if not suppliers:
        return []

    data = [] 
    for s in suppliers:
        score = s.get("reliability_score", 3.0) 
        
        delivery_time = 10 - (score * 1.5) + np.random.normal(0, 0.5) 
        defect_rate = 5 - (score * 0.8) + np.random.normal(0, 0.2)   
        
        delivery_time = max(1, delivery_time)
        defect_rate = max(0, defect_rate)

        data.append({
            "id": s["id"],
            "name": s["name"],
            "reliability_score": score,
            "delivery_time": round(delivery_time, 1),
            "defect_rate": round(defect_rate, 2)
        })

    df = pd.DataFrame(data)

    X = df[['delivery_time', 'defect_rate']]
    
    conditions = [
        (df['reliability_score'] >= 4.0),
        (df['reliability_score'] >= 2.5) & (df['reliability_score'] < 4.0),
        (df['reliability_score'] < 2.5)
    ]
    choices = ['High Performance', 'Average', 'Risk']
    df['tier'] = np.select(conditions, choices, default='Average')

    y = df['tier']

    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)
    
    k = min(3, len(df))
    knn = KNeighborsClassifier(n_neighbors=k)
    knn.fit(X_scaled, y)

    predictions = knn.predict(X_scaled)
    df['predicted_tier'] = predictions

    return df.to_dict(orient='records')

def get_eoq_data(db):
    """
    Calculate EOQ for all products to identify optimal order quantities.
    Returns products with current stock, EOQ, and status.
    """
    products = list(db.products.find())
    results = []

    for p in products:
        annual_demand = p.get("annual_demand", 1000) 
        ordering_cost = 50.0 
        holding_cost = p["price"] * 0.2 

        eoq = calculate_eoq(annual_demand, ordering_cost, holding_cost)
        
        status = "Good"
        if p["stock_level"] < eoq * 0.5:
             status = "Understocked"
        elif p["stock_level"] > eoq * 2:
             status = "Overstocked"

        results.append({
            "id": p["id"],
            "name": p["name"],
            "current_stock": p["stock_level"],
            "eoq": round(eoq, 0),
            "status": status
        })
    
    results.sort(key=lambda x: 0 if x["status"] == "Understocked" else (1 if x["status"] == "Overstocked" else 2))
    
    return results

def analyze_file(file_content, filename: str):
    """
    Analyze uploaded message file (CSV/Excel).
    Returns summary statistics and head preview.
    """
    try:
        if filename.endswith('.csv'):
            df = pd.read_csv(file_content)
        elif filename.endswith(('.xls', '.xlsx')):
            df = pd.read_excel(file_content)
        else:
            return {"error": "Unsupported file format"}
            
        summary = df.describe().to_dict()
        head = df.head(5).where(pd.notnull(df), None).to_dict(orient='records')
        columns = df.columns.tolist()
        row_count = len(df)
        
        return {
            "summary": summary,
            "head": head,
            "columns": columns,
            "row_count": row_count
        }
    except Exception as e:
        return {"error": str(e)}
