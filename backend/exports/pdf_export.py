# backend/exports/pdf_export.py
import io
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.units import inch
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether
)
from reportlab.pdfgen import canvas
from typing import Dict, Any, List

class NumberedCanvas(canvas.Canvas):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_number(num_pages)
            super().showPage()
        super().save()

    def draw_page_number(self, page_count):
        # Suppress footer on cover page (Page 1)
        if self._pageNumber == 1:
            return
            
        self.saveState()
        self.setFont("Helvetica", 9)
        self.setFillColor(colors.HexColor("#64748B")) # Muted gray
        
        # Header (Top of page)
        self.drawString(54, 750, "Boardroom-AI Analytics Platform | Executive Report")
        self.setStrokeColor(colors.HexColor("#E2E8F0"))
        self.setLineWidth(0.5)
        self.line(54, 742, 558, 742)
        
        # Footer (Bottom of page)
        page_text = f"Page {self._pageNumber} of {page_count}"
        self.drawRightString(558, 40, page_text)
        self.drawString(54, 40, "Confidential - Internal Use Only")
        self.line(54, 52, 558, 52)
        
        self.restoreState()

def generate_pdf_report(session_id: str, filename: str, dataset_type: str, kpis: List[Dict[str, Any]], insights: Dict[str, Any]) -> io.BytesIO:
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        leftMargin=54,
        rightMargin=54,
        topMargin=72,
        bottomMargin=72
    )
    
    styles = getSampleStyleSheet()
    
    # Custom styles
    title_style = ParagraphStyle(
        'CoverTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=32,
        leading=38,
        textColor=colors.HexColor("#0F172A"),
        spaceAfter=15
    )
    
    subtitle_style = ParagraphStyle(
        'CoverSubtitle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=16,
        leading=22,
        textColor=colors.HexColor("#2563EB"),
        spaceAfter=30
    )
    
    meta_style = ParagraphStyle(
        'CoverMeta',
        parent=styles['Normal'],
        fontName='Helvetica-Oblique',
        fontSize=10,
        leading=14,
        textColor=colors.HexColor("#64748B")
    )
    
    h1_style = ParagraphStyle(
        'Header1',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=20,
        leading=24,
        textColor=colors.HexColor("#0F172A"),
        spaceBefore=15,
        spaceAfter=15,
        keepWithNext=True
    )
    
    h2_style = ParagraphStyle(
        'Header2',
        parent=styles['Heading2'],
        fontName='Helvetica-Bold',
        fontSize=14,
        leading=18,
        textColor=colors.HexColor("#1E3A8A"),
        spaceBefore=12,
        spaceAfter=8,
        keepWithNext=True
    )
    
    body_style = ParagraphStyle(
        'BodyTextCustom',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=10.5,
        leading=15,
        textColor=colors.HexColor("#334155"),
        spaceAfter=10
    )
    
    bullet_style = ParagraphStyle(
        'BulletCustom',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=10,
        leading=14,
        textColor=colors.HexColor("#334155"),
        leftIndent=20,
        firstLineIndent=-10,
        spaceAfter=6
    )
    
    story = []
    
    # ----------------------------------------------------
    # Page 1: Cover Page
    # ----------------------------------------------------
    story.append(Spacer(1, 150))
    story.append(Paragraph("Boardroom-AI", subtitle_style))
    story.append(Paragraph("Executive Analytics & Insights Report", title_style))
    story.append(Spacer(1, 20))
    
    # Decorative line
    line_table = Table([[""]], colWidths=[504], rowHeights=[4])
    line_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor("#2563EB")),
        ('TOPPADDING', (0,0), (-1,-1), 0),
        ('BOTTOMPADDING', (0,0), (-1,-1), 0),
    ]))
    story.append(line_table)
    story.append(Spacer(1, 40))
    
    health_score = insights.get("health_score", 8.0)
    story.append(Paragraph(f"Dataset Classified: <b>{dataset_type} Analytics</b>", body_style))
    story.append(Paragraph(f"Source Document: {filename}", body_style))
    story.append(Paragraph(f"Business Health Index: <b>{health_score}/10</b>", body_style))
    
    story.append(Spacer(1, 120))
    story.append(Paragraph("Generated automatically by Boardroom-AI Analytics Platform Engine", meta_style))
    story.append(PageBreak())
    
    # ----------------------------------------------------
    # Page 2: Executive Summary & Highlights/Concerns
    # ----------------------------------------------------
    story.append(Paragraph("Executive Summary", h1_style))
    story.append(Paragraph(insights.get("executive_summary", ""), body_style))
    story.append(Spacer(1, 15))
    
    story.append(Paragraph("Key Highlights", h2_style))
    for highlight in insights.get("highlights", []):
        story.append(Paragraph(f"{highlight.get('emoji', '•')} {highlight.get('text')}", bullet_style))
        
    story.append(Spacer(1, 15))
    story.append(Paragraph("Operational Concerns", h2_style))
    for concern in insights.get("concerns", []):
        sev_color = "red" if concern.get("severity") == "high" else "orange" if concern.get("severity") == "medium" else "gray"
        story.append(Paragraph(f"{concern.get('emoji', '•')} <font color='{sev_color}'><b>[{concern.get('severity').upper()}]</b></font> {concern.get('text')}", bullet_style))
        
    story.append(PageBreak())
    
    # ----------------------------------------------------
    # Page 3: Key Performance Indicators Table
    # ----------------------------------------------------
    story.append(Paragraph("Key Performance Indicators (KPIs)", h1_style))
    story.append(Paragraph("The following table lists core operational metrics calculated from the cleaned dataset, along with trend vectors and insights:", body_style))
    story.append(Spacer(1, 10))
    
    kpi_data = [["Metric", "Value", "Trend", "Insight Summarized"]]
    for k in kpis:
        kpi_data.append([
            Paragraph(f"<b>{k.get('name')}</b>", body_style),
            Paragraph(f"<b>{k.get('value')}</b>", body_style),
            Paragraph(k.get('trend').upper(), body_style),
            Paragraph(k.get('insight'), body_style)
        ])
        
    kpi_table = Table(kpi_data, colWidths=[110, 80, 60, 254])
    kpi_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#0F172A")),
        ('TEXTCOLOR', (0,0), (-1,0), colors.white),
        ('ALIGN', (0,0), (-1,-1), 'LEFT'),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('BOTTOMPADDING', (0,0), (-1,-1), 8),
        ('TOPPADDING', (0,0), (-1,-1), 8),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor("#CBD5E1")),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, colors.HexColor("#F8FAFC")]),
    ]))
    
    table_header_style = ParagraphStyle(
        'TableHeader',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=10,
        textColor=colors.white
    )
    kpi_data[0] = [
        Paragraph("Metric", table_header_style),
        Paragraph("Value", table_header_style),
        Paragraph("Trend", table_header_style),
        Paragraph("Insight Summarized", table_header_style)
    ]
    
    story.append(kpi_table)
    story.append(PageBreak())
    
    # ----------------------------------------------------
    # Page 4: Detailed Insights Section
    # ----------------------------------------------------
    story.append(Paragraph("Statistical & Trend Insights", h1_style))
    story.append(Paragraph("Below are key statistical segmentation and correlation patterns extracted by our analytics engine:", body_style))
    story.append(Spacer(1, 10))
    
    for ins in insights.get("insights", []):
        ins_container = []
        ins_container.append(Paragraph(f"<b>{ins.get('category')}</b> — {ins.get('headline')}", h2_style))
        ins_container.append(Paragraph(ins.get('detail'), body_style))
        ins_container.append(Paragraph(f"Supporting Data Check: <i>{ins.get('data_point')}</i>", meta_style))
        ins_container.append(Spacer(1, 12))
        story.append(KeepTogether(ins_container))
        
    story.append(PageBreak())
    
    # ----------------------------------------------------
    # Page 5: Recommendations
    # ----------------------------------------------------
    story.append(Paragraph("Strategic Actions & Recommendations", h1_style))
    story.append(Paragraph("Actionable business recommendations derived from statistical relationships and operational benchmarks:", body_style))
    story.append(Spacer(1, 10))
    
    for rec in insights.get("recommendations", []):
        rec_container = []
        rec_container.append(Paragraph(f"<b>Priority {rec.get('priority')} - {rec.get('action')}</b>", h2_style))
        rec_container.append(Paragraph(f"<b>Rationale:</b> {rec.get('rationale')}", body_style))
        rec_container.append(Paragraph(f"<b>Expected Business Impact:</b> {rec.get('expected_impact')}", body_style))
        rec_container.append(Spacer(1, 15))
        story.append(KeepTogether(rec_container))
        
    story.append(PageBreak())
    
    # ----------------------------------------------------
    # Page 6: Meeting Talking Points
    # ----------------------------------------------------
    story.append(Paragraph("Executive Meeting Briefing", h1_style))
    story.append(Paragraph("Use these scripted statements for board presentations and leadership meetings:", body_style))
    story.append(Spacer(1, 15))
    
    talking_points = insights.get("talking_points", [])
    for idx, tp in enumerate(talking_points, 1):
        story.append(Paragraph(f"<b>{idx}.</b> {tp}", bullet_style))
        story.append(Spacer(1, 8))
        
    # Build Document
    doc.build(story, canvasmaker=NumberedCanvas)
    
    buffer.seek(0)
    return buffer
