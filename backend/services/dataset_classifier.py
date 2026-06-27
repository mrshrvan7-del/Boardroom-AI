# backend/services/dataset_classifier.py
from typing import Dict, Any, List

def classify_dataset(column_names: List[str], sample_rows: List[Dict[str, Any]], dtypes: Dict[str, str], profile: Dict[str, Any]) -> Dict[str, Any]:
    col_names_lower = [col.lower() for col in column_names]
    
    # Keyword scores
    hr_keywords = ["employee", "headcount", "salary", "performance", "gender", "attrition", "hire", "tenure", "termination", "leave", "attendance", "department", "rating", "job", "role", "compensation"]
    sales_keywords = ["revenue", "sale", "order", "price", "quantity", "customer", "product", "discount", "deal", "profit", "invoice", "retail", "transaction", "sales", "unit"]
    support_keywords = ["ticket", "case", "incident", "issue", "support", "resolution", "sla", "csat", "customer satisfaction", "priority", "agent", "escalation", "satisfaction", "respond"]
    finance_keywords = ["income", "expense", "budget", "variance", "ebitda", "margin", "asset", "liability", "cash", "tax", "balance", "cost of goods", "cogs", "loss", "financial"]
    
    scores = {
        "HR": 0,
        "Sales": 0,
        "Support": 0,
        "Finance": 0
    }
    
    # Calculate scores based on column names
    for col in col_names_lower:
        for keyword in hr_keywords:
            if keyword in col:
                scores["HR"] += 2
        for keyword in sales_keywords:
            if keyword in col:
                scores["Sales"] += 2
        for keyword in support_keywords:
            if keyword in col:
                scores["Support"] += 2
        for keyword in finance_keywords:
            if keyword in col:
                scores["Finance"] += 2
                
    # Find dataset type with highest score
    best_type = "Custom"
    max_score = 0
    for dtype_candidate, score in scores.items():
        if score > max_score:
            max_score = score
            best_type = dtype_candidate
            
    # If max score is 0, defaults to Custom
    confidence = min(98, 40 + (max_score * 15)) if max_score > 0 else 90
    
    # Time series check
    has_date = len(profile.get("datetime_columns", [])) > 0
    time_series = has_date
    
    # Geographic check
    geo_keywords = ["country", "region", "state", "city", "location", "territory", "province", "postal", "zip"]
    geographic = any(any(g in col for g in geo_keywords) for col in col_names_lower)
    
    # Determine primary metric
    primary_metric = ""
    numeric_cols = profile.get("numeric_columns", [])
    
    if best_type == "HR":
        # Look for salary, performance, or default to count of employee ID
        salary_cols = [c for c in numeric_cols if "salary" in c.lower() or "compensation" in c.lower()]
        primary_metric = salary_cols[0] if salary_cols else (profile.get("id_columns", [""])[0] or (numeric_cols[0] if numeric_cols else ""))
        domain_context = "Human Resources & Payroll Analytics"
    elif best_type == "Sales":
        rev_cols = [c for c in numeric_cols if "revenue" in c.lower() or "sale" in c.lower() or "amount" in c.lower()]
        primary_metric = rev_cols[0] if rev_cols else (numeric_cols[0] if numeric_cols else "")
        domain_context = "Sales Performance & Customer Transaction Analytics"
    elif best_type == "Support":
        csat_cols = [c for c in numeric_cols if "csat" in c.lower() or "satisfaction" in c.lower()]
        primary_metric = csat_cols[0] if csat_cols else (profile.get("id_columns", [""])[0] or (numeric_cols[0] if numeric_cols else ""))
        domain_context = "Customer Support Tickets & SLA Performance Operations"
    elif best_type == "Finance":
        profit_cols = [c for c in numeric_cols if "profit" in c.lower() or "income" in c.lower() or "net" in c.lower()]
        primary_metric = profit_cols[0] if profit_cols else (numeric_cols[0] if numeric_cols else "")
        domain_context = "Corporate Finance & Budget Analysis"
    else:
        primary_metric = numeric_cols[0] if numeric_cols else ""
        domain_context = "Custom Business Insights Dataset"
        
    detected_entities = []
    if has_date:
        detected_entities.append("Time Dimension")
    if geographic:
        detected_entities.append("Geographic Location")
    if profile.get("id_columns"):
        detected_entities.append("Unique Identifiers")
        
    return {
        "dataset_type": best_type,
        "confidence": confidence,
        "domain_context": domain_context,
        "detected_entities": detected_entities,
        "time_series": time_series,
        "geographic": geographic,
        "primary_metric": primary_metric
    }
