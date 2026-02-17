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
        # Simulate features based on reliability_score (higher score = better metrics)
        # reliability_score is roughly 0.0 to 5.0
        score = s.get("reliability_score", 3.0) 
        
        # Inverse logic: Higher score -> Lower delivery time, Lower defect rate
        delivery_time = 10 - (score * 1.5) + np.random.normal(0, 0.5) # Approx 2.5 to 10 days
        defect_rate = 5 - (score * 0.8) + np.random.normal(0, 0.2)   # Approx 1% to 5%
        
        # Clamp values
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

    # Prepare Training Data
    X = df[['delivery_time', 'defect_rate']]
    
    # Define Logic for "Ground Truth" labels (for training demo)
    # real scenario: use historical labeled data
    conditions = [
        (df['reliability_score'] >= 4.0),
        (df['reliability_score'] >= 2.5) & (df['reliability_score'] < 4.0),
        (df['reliability_score'] < 2.5)
    ]
    choices = ['High Performance', 'Average', 'Risk']
    df['tier'] = np.select(conditions, choices, default='Average')

    y = df['tier']

    # Train KNN
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)
    
    # K=3 or less if few samples
    k = min(3, len(df))
    knn = KNeighborsClassifier(n_neighbors=k)
    knn.fit(X_scaled, y)

    # Predict (Self-predict/Validation for demo)
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
        # Annual Demand (D) - simplified estimation based on orders or static field
        # In a real app, calculate D from order history over last year
        # For now, let's assume a standard annual demand or random for demo if not in DB
        annual_demand = p.get("annual_demand", 1000) 
        ordering_cost = 50.0 # Fixed cost per order (setup, shipping)
        holding_cost = p["price"] * 0.2 # 20% of price per year

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
    
    # Sort by status priority (Understocked first)
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
            
        # Basic analysis
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

        # --- Chart Data Logic ---
        chart_data = []
        chart_type = None
        x_axis_key = None
        y_axis_key = None

        # 1. Identify potential Date column for X-axis
        date_cols = [col for col in df.columns if 'date' in col.lower() or 'time' in col.lower()]
        # 2. Identify potential Numeric column for Y-axis (Sales, Quantity, Amount, Profit)
        numeric_cols = df.select_dtypes(include=[np.number]).columns.tolist()
        potential_y = [col for col in numeric_cols if any(x in col.lower() for x in ['sales', 'quantity', 'amount', 'profit', 'revenue', 'cost'])]
        
        # Fallback if no specific numeric keyword found, just take the first numeric col that isn't an ID
        if not potential_y and numeric_cols:
             potential_y = [col for col in numeric_cols if 'id' not in col.lower()]

        if date_cols and potential_y:
            # OPTION A: Time Series (Line Chart)
            x_axis_key = date_cols[0]
            y_axis_key = potential_y[0]
            chart_type = "line"
            
            # Aggregate by date
            try:
                df[x_axis_key] = pd.to_datetime(df[x_axis_key])
                # Group by date and sum
                chart_df = df.groupby(x_axis_key)[y_axis_key].sum().reset_index()
                # Sort by date
                chart_df = chart_df.sort_values(x_axis_key)
                chart_df[x_axis_key] = chart_df[x_axis_key].dt.strftime('%Y-%m-%d') # Format date for JSON
                chart_data = chart_df.to_dict(orient='records')
            except Exception as e:
                print(f"Chart generation error (date): {e}")

        elif potential_y:
             # OPTION B: Categorical (Bar Chart) - e.g. Sales by Product/Category
             # Look for a categorical column (string)
             cat_cols = df.select_dtypes(include=['object', 'string']).columns.tolist()
             potential_x = [col for col in cat_cols if 'date' not in col.lower()]
             
             if potential_x:
                 x_axis_key = potential_x[0]
                 y_axis_key = potential_y[0]
                 chart_type = "bar"
                 
                 try:
                     # Group by category and sum/mean
                     chart_df = df.groupby(x_axis_key)[y_axis_key].sum().reset_index()
                     # Sort by value desc
                     chart_df = chart_df.sort_values(y_axis_key, ascending=False).head(20) # Top 20
                     chart_data = chart_df.to_dict(orient='records')
                 except Exception as e:
                    print(f"Chart generation error (cat): {e}")
        
        if chart_data:
            result = {
                "summary": summary,
                "head": head,
                "columns": columns,
                "row_count": row_count,
                 # Add visualization data
                "chart_data": chart_data,
                "chart_config": {
                    "type": chart_type,
                    "xKey": x_axis_key,
                    "yKey": y_axis_key
                }
            }
            return result
        
        return {
            "summary": summary,
            "head": head,
            "columns": columns,
            "row_count": row_count
        }
    except Exception as e:
        return {"error": str(e)}
