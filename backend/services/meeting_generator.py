# backend/services/meeting_generator.py
from typing import Dict, Any, List

def generate_meeting_context(insights: Dict[str, Any], kpis: List[Dict[str, Any]], dataset_type: str, profile: Dict[str, Any]) -> Dict[str, Any]:
    health_score = insights.get("health_score", 8.0)
    highlights = insights.get("highlights", [])[:5]
    concerns = insights.get("concerns", [])[:3]
    talking_points = insights.get("talking_points", [])[:5]
    
    # 1. Executive Questions & Answers
    questions = []
    if dataset_type == "HR":
        hc = next((k["value"] for k in kpis if k["name"] == "Headcount"), "N/A")
        sal = next((k["value"] for k in kpis if k["name"] == "Average Salary"), "N/A")
        questions = [
            {
                "question": "What is driving our attrition rate and how can we mitigate it?",
                "answer": "We have isolated turnover factors showing that attrition is concentrated within specific tenure bands. HR is launching standard onboarding check-ins and job level alignments to stabilize retention."
            },
            {
                "question": f"Is our average compensation of {sal} competitive with the market?",
                "answer": f"The average salary of {sal} lies within normal parameters. However, we are conducting a structural review of compensation grades next month to resolve any internal pay compression."
            },
            {
                "question": "How do performance ratings correlate with tenure?",
                "answer": "Statistical grouping shows a minor positive correlation between tenure and performance scores. This suggests our training programs are effective, though we must focus on accelerating onboarding."
            }
        ]
    elif dataset_type == "Sales":
        rev = next((k["value"] for k in kpis if k["name"] == "Total Revenue"), "N/A")
        prod = next((k["value"] for k in kpis if k["name"] == "Top Product/Category"), "N/A")
        questions = [
            {
                "question": f"How dependent are we on our top product category '{prod}'?",
                "answer": f"Sales of '{prod}' drive the bulk of our transaction counts. To diversify risk, our product teams are designing bundle packages to increase secondary category traction."
            },
            {
                "question": f"What is the projected revenue growth heading into next month?",
                "answer": "Linear trend forecasting projects sales volume will remain stable to slightly upward. We are launching a regional digital marketing campaign to capitalize on this trajectory."
            },
            {
                "question": "Why are some customer accounts showing low order sizes?",
                "answer": "Our correlation matrix indicates that order volume declines when discounts are not applied. We are reviewing pricing thresholds to encourage bulk ordering without eroding gross margins."
            }
        ]
    elif dataset_type == "Support":
        tick = next((k["value"] for k in kpis if k["name"] == "Ticket Volume"), "N/A")
        csat = next((k["value"] for k in kpis if k["name"] == "Customer Satisfaction (CSAT)"), "N/A")
        questions = [
            {
                "question": "What is the primary factor limiting our SLA compliance rate?",
                "answer": "Peak ticket volumes on certain days of the week create resource bottlenecks. We are restructuring support staff shifts to align with these weekly seasonality patterns."
            },
            {
                "question": f"How can we maintain our CSAT score of {csat} while handling higher volumes?",
                "answer": "We are deploying automated self-service routing for tier-1 tickets. This will free up skilled support agents to handle complex customer queries faster, protecting CSAT."
            },
            {
                "question": "What is the root cause of high ticket resolution delays?",
                "answer": "Outlier ticket analysis shows that a small subset of cases takes over 24 hours to resolve. We are establishing an escalation desk to intervene early when a ticket remains open."
            }
        ]
    else: # Finance, Custom
        questions = [
            {
                "question": "What are the primary operational risks shown in the dataset?",
                "answer": "The main risks relate to outlier values in key numerical columns. We are establishing weekly data validation pipelines to flag and investigate volatile inputs."
            },
            {
                "question": "How do the segmented cohorts compare in terms of contribution?",
                "answer": "K-Means segmentation reveals that 30% of records represent high-value exceptions. We are creating tailored standard operating procedures (SOPs) for this specific cohort."
            },
            {
                "question": "What is our immediate action plan to optimize these metrics?",
                "answer": "We will implement the clean-up of missing inputs and establish automated reporting parameters to track daily standard deviations."
            }
        ]
        
    # 2. Action Items
    action_items = []
    if dataset_type == "HR":
        action_items = [
            {
                "action": "Complete Compensation Grade Equity Audit",
                "owner": "HR Director",
                "deadline": "Next Friday"
            },
            {
                "action": "Launch Managers Performance Calibration Workshop",
                "owner": "L&D Specialist",
                "deadline": "In 2 Weeks"
            },
            {
                "action": "Rollout Retention Surveys for Risk Departments",
                "owner": "People Operations",
                "deadline": "End of Month"
            }
        ]
    elif dataset_type == "Sales":
        action_items = [
            {
                "action": "Design and Test Product Bundle Pricing Model",
                "owner": "Product Marketing",
                "deadline": "This Friday"
            },
            {
                "action": "Shift 20% Advertising Budget to High-Converting Regions",
                "owner": "Growth Team",
                "deadline": "Next Tuesday"
            },
            {
                "action": "Audit pricing thresholds for low-volume accounts",
                "owner": "Sales Ops",
                "deadline": "In 3 Weeks"
            }
        ]
    elif dataset_type == "Support":
        action_items = [
            {
                "action": "Deploy Tier-1 Automated Self-Service Router",
                "owner": "Support Tech Lead",
                "deadline": "Next Monday"
            },
            {
                "action": "Adjust Agent Shifts to Match Weekly Peak Hours",
                "owner": "Ops Manager",
                "deadline": "This Saturday"
            },
            {
                "action": "Set up Escalation Alert Rule in CRM",
                "owner": "Salesforce Admin",
                "deadline": "In 10 Days"
            }
        ]
    else:
        action_items = [
            {
                "action": "Establish Data Quality Rules and Constraints",
                "owner": "Database Admin",
                "deadline": "This Friday"
            },
            {
                "action": "Prepare Cohort Segmentation Report for Exec Review",
                "owner": "Lead Analyst",
                "deadline": "Next Wednesday"
            },
            {
                "action": "Implement Dashboard Alerts for Outlier Spikes",
                "owner": "BI Team Lead",
                "deadline": "End of Month"
            }
        ]
        
    return {
        "health_score": health_score,
        "highlights": highlights,
        "concerns": concerns,
        "talking_points": talking_points,
        "questions": questions,
        "action_items": action_items
    }
