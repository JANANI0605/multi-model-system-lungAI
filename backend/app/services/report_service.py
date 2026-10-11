import os
from datetime import datetime
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image as RLImage, KeepTogether, HRFlowable
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from app.config import settings

class PDFReportGenerator:
    def generate_report(self, patient_info: dict, analysis_record: dict) -> str:
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        patient_id = patient_info.get("id", "patient")
        filename = f"Report_{patient_id}_{timestamp}.pdf"
        filepath = os.path.join(settings.REPORTS_DIR, filename)

        doc = SimpleDocTemplate(
            filepath,
            pagesize=letter,
            rightMargin=36,
            leftMargin=36,
            topMargin=36,
            bottomMargin=36
        )

        styles = getSampleStyleSheet()
        
        # Custom styles
        title_style = ParagraphStyle(
            'DocTitle',
            parent=styles['Heading1'],
            fontName='Helvetica-Bold',
            fontSize=20,
            leading=24,
            textColor=colors.HexColor('#0F172A'),
            alignment=0
        )

        subtitle_style = ParagraphStyle(
            'DocSubtitle',
            parent=styles['Normal'],
            fontName='Helvetica',
            fontSize=10,
            leading=14,
            textColor=colors.HexColor('#64748B')
        )

        section_heading = ParagraphStyle(
            'SectionHeading',
            parent=styles['Heading2'],
            fontName='Helvetica-Bold',
            fontSize=13,
            leading=16,
            textColor=colors.HexColor('#0284C7'),
            spaceBefore=12,
            spaceAfter=6
        )

        body_style = ParagraphStyle(
            'BodyTextCustom',
            parent=styles['Normal'],
            fontName='Helvetica',
            fontSize=9.5,
            leading=13,
            textColor=colors.HexColor('#334155')
        )

        disclaimer_style = ParagraphStyle(
            'DisclaimerText',
            parent=styles['Normal'],
            fontName='Helvetica-Oblique',
            fontSize=8.5,
            leading=11,
            textColor=colors.HexColor('#DC2626')
        )

        story = []

        # Header
        story.append(Paragraph("LUNGAI • MULTIMODAL HEALTHCARE ANALYSIS REPORT", title_style))
        story.append(Paragraph("Explainable AI Medical Decision Support System", subtitle_style))
        story.append(Spacer(1, 10))
        story.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor('#0284C7'), spaceBefore=2, spaceAfter=12))

        # Patient Info Table
        patient_data = [
            [
                Paragraph(f"<b>Patient Name:</b> {patient_info.get('name', 'N/A')}", body_style),
                Paragraph(f"<b>Age / Gender:</b> {patient_info.get('age', 'N/A')} / {patient_info.get('gender', 'N/A')}", body_style)
            ],
            [
                Paragraph(f"<b>Email:</b> {patient_info.get('email', 'N/A')}", body_style),
                Paragraph(f"<b>Date of Birth:</b> {patient_info.get('dob', 'N/A')}", body_style)
            ],
            [
                Paragraph(f"<b>Analysis Date:</b> {analysis_record.get('createdAt', datetime.now().strftime('%Y-%m-%d %H:%M'))}", body_style),
                Paragraph(f"<b>Modalities Submitted:</b> {', '.join(analysis_record.get('consolidated', {}).get('availableModalities', []))}", body_style)
            ]
        ]
        info_table = Table(patient_data, colWidths=[270, 270])
        info_table.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#F8FAFC')),
            ('PADDING', (0,0), (-1,-1), 6),
            ('BOX', (0,0), (-1,-1), 0.5, colors.HexColor('#E2E8F0')),
            ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ]))
        story.append(info_table)
        story.append(Spacer(1, 12))

        # Consolidated Findings Banner
        consolidated = analysis_record.get("consolidated", {})
        primary_finding = consolidated.get("primaryFinding", "N/A")
        overall_conf = int(consolidated.get("overallConfidence", 0) * 100)
        
        summary_text = consolidated.get("consolidatedSummary", "")
        banner_data = [
            [
                Paragraph(f"<b>Primary Overall Finding:</b> <font color='#0284C7'>{primary_finding}</font> (Max Confidence: {overall_conf}%)", body_style)
            ],
            [
                Paragraph(f"<b>Multimodal Synthesis:</b> {summary_text}", body_style)
            ]
        ]
        banner_table = Table(banner_data, colWidths=[540])
        banner_table.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#F0F9FF')),
            ('PADDING', (0,0), (-1,-1), 8),
            ('BOX', (0,0), (-1,-1), 1, colors.HexColor('#BAE6FD')),
        ]))
        story.append(banner_table)
        story.append(Spacer(1, 14))

        # 1. Clinical Text Analysis Section
        text_res = analysis_record.get("textResult")
        text_xai = analysis_record.get("textXAI")
        if text_res:
            story.append(Paragraph("1. Clinical Text Analysis", section_heading))
            story.append(Paragraph(f"<b>Submitted Notes:</b> {analysis_record.get('clinicalNotes', 'N/A')}", body_style))
            story.append(Spacer(1, 4))
            story.append(Paragraph(f"<b>Predicted Condition:</b> {text_res.get('predictedClass')} (Confidence: {int(text_res.get('confidence',0)*100)}%)", body_style))
            
            if text_xai and text_xai.get("importantTextFeatures"):
                feat_items = [f"{item['feature']} ({item['impact']}, SHAP: {item.get('shapValue', item.get('contribution'))})" for item in text_xai.get("importantTextFeatures", [])[:5]]
                story.append(Paragraph(f"<b>SHAP Feature Attributions:</b> {', '.join(feat_items)}", body_style))
                if text_xai.get("baseValue") is not None:
                    story.append(Paragraph(f"<b>SHAP Model Base Value:</b> {text_xai.get('baseValue')}", body_style))
            story.append(Spacer(1, 10))

        # 2. Laboratory Record Analysis Section
        lab_res = analysis_record.get("laboratoryResult")
        lab_xai = analysis_record.get("labXAI")
        if lab_res:
            story.append(Paragraph("2. Laboratory Analysis", section_heading))
            story.append(Paragraph(f"<b>Overall Status:</b> {lab_res.get('overallStatus')} | <b>Summary:</b> {lab_res.get('summary')}", body_style))
            story.append(Spacer(1, 6))
            
            # Table of lab tests
            tests = lab_res.get("abnormalParameters", []) + lab_res.get("normalParameters", [])
            if tests:
                lab_table_data = [["Test Name", "Value", "Unit", "Reference Range", "Status"]]
                for t in tests:
                    status_str = t.get("status")
                    if status_str != "Normal":
                        status_cell = Paragraph(f"<font color='#DC2626'><b>{status_str}</b></font>", body_style)
                    else:
                        status_cell = Paragraph(f"<font color='#16A34A'>{status_str}</font>", body_style)
                    
                    lab_table_data.append([
                        Paragraph(t.get("name", ""), body_style),
                        Paragraph(str(t.get("value", "")), body_style),
                        Paragraph(t.get("unit", ""), body_style),
                        Paragraph(t.get("referenceRange", ""), body_style),
                        status_cell
                    ])
                
                lt = Table(lab_table_data, colWidths=[130, 80, 80, 150, 100])
                lt.setStyle(TableStyle([
                    ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#E2E8F0')),
                    ('TEXTCOLOR', (0,0), (-1,0), colors.HexColor('#0F172A')),
                    ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
                    ('PADDING', (0,0), (-1,-1), 5),
                    ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#CBD5E1')),
                ]))
                story.append(lt)
            story.append(Spacer(1, 10))

        # 3. Medical Image Analysis Section
        img_res = analysis_record.get("imageResult")
        img_xai = analysis_record.get("imageXAI")
        if img_res:
            story.append(Paragraph("3. Chest X-Ray Image Analysis", section_heading))
            story.append(Paragraph(f"<b>Primary Finding:</b> {img_res.get('predictedCondition')} (Confidence: {int(img_res.get('confidence',0)*100)}%)", body_style))
            
            detected = img_res.get("detectedFindings", [])
            if detected:
                det_str = ", ".join([f"{d['finding']} (prob: {d['probability']})" for d in detected])
                story.append(Paragraph(f"<b>Detected Conditions:</b> {det_str}", body_style))
            else:
                story.append(Paragraph("<b>Detected Conditions:</b> No acute abnormalities detected beyond threshold.", body_style))
                
            if img_xai and img_xai.get("description"):
                method_name = img_xai.get("method", "Grad-CAM")
                story.append(Paragraph(f"<b>{method_name}:</b> {img_xai.get('description')}", body_style))
            story.append(Spacer(1, 10))

        # Disclaimer
        story.append(Spacer(1, 10))
        story.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor('#E2E8F0'), spaceBefore=5, spaceAfter=8))
        story.append(Paragraph("<b>MEDICAL DISCLAIMER:</b> " + consolidated.get("disclaimer", "This report is generated by a machine-learning-based healthcare support system and is not a medical diagnosis. Clinical interpretation should be performed by a qualified healthcare professional."), disclaimer_style))

        doc.build(story)
        return filename

pdf_generator = PDFReportGenerator()
