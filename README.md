# Boardroom-AI Analytics Platform

Boardroom-AI is an enterprise-grade local analytics platform designed for managers overseeing 250+ employees. It allows users to upload any business data file (Excel, CSV, JSON, TSV, TXT), automatically cleans and profiles it, detects relevant key performance indicators (KPIs), performs statistical analysis, builds interactive visualization dashboards, and provides an interactive natural language chat interface to query the data.

## Features

- **Smart File Upload**: Drag-and-drop file upload with support for files up to 50MB. Auto-detects delimiters and encodings.
- **Data Processing & Cleaning**: Automatic removal of duplicate rows, formatting of percentages and currencies, datetime normalizations, and IQR outlier detection.
- **KPI Detection Engine**: Semantic tagging of metrics and auto-generation of category-specific (HR, Sales, Finance, Support, Custom) dashboards.
- **Deep Statistical Analysis**: Computes descriptive stats, correlations, linear forecasts, anomalies (using isolation forest), and K-Means clustering.
- **Auto-Visualization**: Fully animated, dark-theme compatible charts (Line, Bar, Donut, Scatter, Heatmap, Histogram, Treemap, Radar, etc.) using Apache ECharts.
- **Interactive Narrative Insights**: Dynamic executive summaries, highlights, concerns, and meeting talking points.
- **Natural Language Query Interface**: Search, filter, and aggregate dataset columns using plain English queries.
- **One-Click Exports**: Full professional reports in PDF (ReportLab), PPT (python-pptx), and Excel (openpyxl) formats.
- **Meeting Mode**: One-click fullscreen presentation mode showing key talking points, concerns, and actionable decisions.

## Tech Stack

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS, shadcn/ui, Zustand, Apache ECharts.
- **Backend**: Python FastAPI, Pandas, NumPy, SciPy, scikit-learn.
- **Exports**: ReportLab, python-pptx, openpyxl.

## Setup Instructions

See the implementation plan and directories for building steps.
