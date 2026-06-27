# backend/services/chart_selector.py
from typing import Dict, Any, List

def recommend_charts(profile: Dict[str, Any], stats: Dict[str, Any], dataset_type: str) -> List[Dict[str, Any]]:
    charts = []
    
    numeric_cols = profile.get("numeric_columns", [])
    cat_cols = profile.get("categorical_columns", [])
    date_cols = profile.get("datetime_columns", [])
    
    # Rule 1: Time series -> Line Chart (trend over time)
    if date_cols and numeric_cols:
        primary_date = date_cols[0]
        for col in numeric_cols[:2]: # suggest up to 2 line charts
            charts.append({
                "chart_type": "line",
                "title": f"{col} Trend Over Time",
                "x_column": primary_date,
                "y_column": col,
                "group_by": "",
                "description": f"Historical progression of {col} over the recorded dates.",
                "priority": 10
            })
            
    # Rule 2: Category + Numeric -> Bar Chart / Horizontal Bar Chart
    if cat_cols and numeric_cols:
        primary_cat = cat_cols[0]
        # Check cardinality
        cat_profile = next((p for p in profile.get("column_profiles", []) if p["name"] == primary_cat), None)
        unique_count = cat_profile["unique_count"] if cat_profile else 10
        
        for col in numeric_cols[:2]:
            chart_type = "bar" if unique_count < 8 else "horizontal_bar"
            charts.append({
                "chart_type": chart_type,
                "title": f"Distribution of {col} by {primary_cat}",
                "x_column": primary_cat,
                "y_column": col,
                "group_by": "",
                "description": f"Comparison of average {col} across different {primary_cat} categories.",
                "priority": 9
            })
            
    # Rule 3: Percentage / Ratio -> Pie or Donut Chart
    percentage_cols = [p["name"] for p in profile.get("column_profiles", []) if p["semantic_type"] == "Percentage" or "ratio" in p["name"].lower() or "share" in p["name"].lower()]
    if percentage_cols and cat_cols:
        primary_cat = cat_cols[0]
        charts.append({
            "chart_type": "pie",
            "title": f"{percentage_cols[0]} Breakdown by {primary_cat}",
            "x_column": primary_cat,
            "y_column": percentage_cols[0],
            "group_by": "",
            "description": f"Proportional composition of {percentage_cols[0]} grouped by {primary_cat}.",
            "priority": 8
        })
    elif cat_cols and len(cat_cols) > 0:
        # Fallback: Count of records per category pie chart
        primary_cat = cat_cols[0]
        charts.append({
            "chart_type": "pie",
            "title": f"Record Distribution by {primary_cat}",
            "x_column": primary_cat,
            "y_column": "count",
            "group_by": "",
            "description": f"Percentage of total records in each {primary_cat}.",
            "priority": 7
        })

    # Rule 4: Two numeric columns -> Scatter Plot with trendline
    if len(numeric_cols) >= 2:
        charts.append({
            "chart_type": "scatter",
            "title": f"Relationship: {numeric_cols[0]} vs {numeric_cols[1]}",
            "x_column": numeric_cols[0],
            "y_column": numeric_cols[1],
            "group_by": "",
            "description": f"Correlation check showing data dispersion and regression fit between {numeric_cols[0]} and {numeric_cols[1]}.",
            "priority": 6
        })
        
    # Rule 5: Heatmap Correlation Matrix
    if len(numeric_cols) >= 3:
        charts.append({
            "chart_type": "heatmap",
            "title": "Correlation Matrix Matrix",
            "x_column": "columns",
            "y_column": "columns",
            "group_by": "",
            "description": "Pearson correlation coefficient heatmap showing linear relationships across all numerical attributes.",
            "priority": 5
        })
        
    # Rule 6: Distribution Histogram
    if numeric_cols:
        charts.append({
            "chart_type": "histogram",
            "title": f"Distribution Profile: {numeric_cols[0]}",
            "x_column": numeric_cols[0],
            "y_column": "frequency",
            "group_by": "",
            "description": f"Frequency distribution overlay with theoretical normal distribution curve for {numeric_cols[0]}.",
            "priority": 4
        })
        
    # Rule 7: Category + Subcategory -> Treemap
    if len(cat_cols) >= 2 and numeric_cols:
        charts.append({
            "chart_type": "treemap",
            "title": f"{numeric_cols[0]} Hierarchy ({cat_cols[0]} > {cat_cols[1]})",
            "x_column": cat_cols[0],
            "y_column": numeric_cols[0],
            "group_by": cat_cols[1],
            "description": f"Hierarchical breakdown showing the relative scale of {numeric_cols[0]} for categories and nested subcategories.",
            "priority": 3
        })
        
    # Rule 8: Radar Chart for performance comparisons
    if dataset_type == "HR" and len(numeric_cols) >= 3:
        charts.append({
            "chart_type": "radar",
            "title": "Employee Attributes Balance",
            "x_column": "metrics",
            "y_column": "values",
            "group_by": cat_cols[0] if cat_cols else "",
            "description": "Multivariate analysis comparing average ratings across multiple performance factors.",
            "priority": 2
        })
        
    # Sort by priority descending and slice top 8
    charts.sort(key=lambda x: x["priority"], reverse=True)
    return charts[:8]
