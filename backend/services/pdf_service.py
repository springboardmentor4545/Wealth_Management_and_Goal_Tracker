from reportlab.lib.pagesizes import letter, A4
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, PageBreak
from reportlab.lib.enums import TA_CENTER, TA_RIGHT
from datetime import datetime
import io


class PDFReportService:
    """Generate comprehensive PDF reports"""
    
    @staticmethod
    def generate_portfolio_report(user_data, portfolio_data, goals_data, recommendations_data):
        """
        Generate complete portfolio report PDF
        
        Includes:
        - User profile
        - Portfolio summary
        - Holdings table
        - Goals summary
        - Recommendations
        """
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=letter)
        story = []
        styles = getSampleStyleSheet()
        
        # Custom styles
        title_style = ParagraphStyle(
            'CustomTitle',
            parent=styles['Heading1'],
            fontSize=24,
            textColor=colors.HexColor('#7c3aed'),
            spaceAfter=30,
            alignment=TA_CENTER
        )
        
        heading_style = ParagraphStyle(
            'CustomHeading',
            parent=styles['Heading2'],
            fontSize=16,
            textColor=colors.HexColor('#7c3aed'),
            spaceAfter=12,
            spaceBefore=12
        )
        
        # 1. Header
        story.append(Paragraph("Wealth Management Report", title_style))
        story.append(Paragraph(f"Generated on: {datetime.now().strftime('%B %d, %Y')}", styles['Normal']))
        story.append(Spacer(1, 0.3*inch))
        
        # 2. User Profile Section
        story.append(Paragraph("User Profile", heading_style))
        user_table_data = [
            ['Name:', user_data.get('name', 'N/A')],
            ['Email:', user_data.get('email', 'N/A')],
            ['Risk Profile:', user_data.get('risk_profile', 'N/A').title()],
            ['Risk Score:', str(user_data.get('risk_score', 'N/A'))]
        ]
        user_table = Table(user_table_data, colWidths=[2*inch, 4*inch])
        user_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (0, -1), colors.HexColor('#f3e8ff')),
            ('TEXTCOLOR', (0, 0), (-1, -1), colors.black),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
            ('GRID', (0, 0), (-1, -1), 1, colors.grey)
        ]))
        story.append(user_table)
        story.append(Spacer(1, 0.3*inch))
        
        # 3. Portfolio Summary Section
        story.append(Paragraph("Portfolio Summary", heading_style))
        portfolio_summary_data = [
            ['Total Invested', f"₹{portfolio_data.get('total_invested', 0):,.2f}"],
            ['Current Value', f"₹{portfolio_data.get('current_value', 0):,.2f}"],
            ['Total Returns', f"₹{portfolio_data.get('profit_loss', 0):,.2f}"],
            ['Total Assets', str(portfolio_data.get('total_assets', 0))]
        ]
        portfolio_table = Table(portfolio_summary_data, colWidths=[3*inch, 3*inch])
        portfolio_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#7c3aed')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 11),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 10),
            ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
            ('GRID', (0, 0), (-1, -1), 1, colors.black)
        ]))
        story.append(portfolio_table)
        story.append(Spacer(1, 0.3*inch))
        
        # 4. Holdings Section
        if portfolio_data.get('holdings'):
            story.append(Paragraph("Current Holdings", heading_style))
            holdings_data = [['Symbol', 'Units', 'Avg Price', 'Current Value', 'P&L %']]
            for holding in portfolio_data['holdings']:
                holdings_data.append([
                    holding.get('symbol', ''),
                    f"{holding.get('units_held', 0):.2f}",
                    f"₹{holding.get('avg_buy_price', 0):.2f}",
                    f"₹{holding.get('current_value', 0):,.2f}",
                    f"{holding.get('profit_loss_percentage', 0):.2f}%"
                ])
            
            holdings_table = Table(holdings_data, colWidths=[1.2*inch, 1*inch, 1.2*inch, 1.5*inch, 1*inch])
            holdings_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#ec4899')),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, -1), 9),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
                ('GRID', (0, 0), (-1, -1), 1, colors.black),
                ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.lightgrey])
            ]))
            story.append(holdings_table)
            story.append(Spacer(1, 0.3*inch))
        
        # 5. Goals Section
        if goals_data:
            story.append(PageBreak())
            story.append(Paragraph("Financial Goals", heading_style))
            goals_table_data = [['Goal', 'Target Amount', 'Target Date', 'Status']]
            for goal in goals_data:
                goals_table_data.append([
                    goal.get('goal_type', '').title(),
                    f"₹{goal.get('target_amount', 0):,.2f}",
                    goal.get('target_date', ''),
                    goal.get('status', 'Active').title()
                ])
            
            goals_table = Table(goals_table_data, colWidths=[2*inch, 2*inch, 1.5*inch, 1.5*inch])
            goals_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#10b981')),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, -1), 9),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
                ('GRID', (0, 0), (-1, -1), 1, colors.black),
                ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.lightgrey])
            ]))
            story.append(goals_table)
            story.append(Spacer(1, 0.3*inch))
        
        # 6. Recommendations Section
        if recommendations_data:
            story.append(Paragraph("Portfolio Recommendations", heading_style))
            
            # Current vs Recommended Allocation
            rec_data = [
                ['Category', 'Current %', 'Recommended %', 'Difference'],
                [
                    'Equity',
                    f"{recommendations_data['current_allocation']['equity']}%",
                    f"{recommendations_data['recommended_allocation']['equity']}%",
                    f"{recommendations_data['current_allocation']['equity'] - recommendations_data['recommended_allocation']['equity']:+.1f}%"
                ],
                [
                    'Debt',
                    f"{recommendations_data['current_allocation']['debt']}%",
                    f"{recommendations_data['recommended_allocation']['debt']}%",
                    f"{recommendations_data['current_allocation']['debt'] - recommendations_data['recommended_allocation']['debt']:+.1f}%"
                ],
                [
                    'Cash',
                    f"{recommendations_data['current_allocation']['cash']}%",
                    f"{recommendations_data['recommended_allocation']['cash']}%",
                    f"{recommendations_data['current_allocation']['cash'] - recommendations_data['recommended_allocation']['cash']:+.1f}%"
                ]
            ]
            
            rec_table = Table(rec_data, colWidths=[1.5*inch, 1.5*inch, 1.5*inch, 1.5*inch])
            rec_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#7c3aed')),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, -1), 10),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
                ('GRID', (0, 0), (-1, -1), 1, colors.black),
                ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.lightgrey])
            ]))
            story.append(rec_table)
            story.append(Spacer(1, 0.2*inch))
            
            # Suggestions
            if recommendations_data.get('rebalancing', {}).get('suggestions'):
                story.append(Paragraph("Action Items:", styles['Heading3']))
                for i, sug in enumerate(recommendations_data['rebalancing']['suggestions'], 1):
                    story.append(Paragraph(
                        f"{i}. {sug['action']} (Priority: {sug['priority'].title()})",
                        styles['Normal']
                    ))
                    story.append(Spacer(1, 0.1*inch))
        
        # Footer
        story.append(Spacer(1, 0.5*inch))
        footer_text = "This report is for informational purposes only and does not constitute financial advice."
        story.append(Paragraph(footer_text, styles['Italic']))
        
        # Build PDF
        doc.build(story)
        buffer.seek(0)
        return buffer