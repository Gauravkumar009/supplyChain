import pandas as pd
import numpy as np
from sklearn.linear_model import LinearRegression

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
