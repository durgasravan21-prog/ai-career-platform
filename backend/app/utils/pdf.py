import os
from datetime import datetime
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from pypdf import PdfReader, PdfWriter

def generate_locked_agreement_pdf(mentor_id: int, mentor_name: str, signature_text_or_data: str, upi_id: str) -> str:
    """
    Generates a PDF for the Mentor Agreement, signed with a signature, and encrypts it with password: mentor@<id>.
    Returns the file path of the encrypted PDF.
    """
    # Define output paths
    target_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "uploads", "agreements"))
    os.makedirs(target_dir, exist_ok=True)
    
    temp_pdf_path = os.path.join(target_dir, f"temp_agreement_{mentor_id}.pdf")
    final_pdf_path = os.path.join(target_dir, f"mentor_agreement_{mentor_id}.pdf")
    
    # Initialize Document
    doc = SimpleDocTemplate(
        temp_pdf_path,
        pagesize=letter,
        rightMargin=40, leftMargin=40, topMargin=40, bottomMargin=40
    )
    
    styles = getSampleStyleSheet()
    
    # Custom styles
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=20,
        textColor=colors.HexColor('#0ea5e9'),
        spaceAfter=15,
        alignment=1 # Center
    )
    
    h2_style = ParagraphStyle(
        'SectionHeader',
        parent=styles['Heading2'],
        fontName='Helvetica-Bold',
        fontSize=12,
        textColor=colors.HexColor('#0284c7'),
        spaceBefore=10,
        spaceAfter=6
    )
    
    body_style = ParagraphStyle(
        'BodyTextCustom',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9.5,
        leading=14,
        textColor=colors.HexColor('#334155'),
        spaceAfter=8
    )
    
    bold_body_style = ParagraphStyle(
        'BoldBodyText',
        parent=body_style,
        fontName='Helvetica-Bold',
        textColor=colors.HexColor('#0f172a')
    )
    
    story = []
    
    # Document Header
    story.append(Paragraph("MEMBER CODE OF CONDUCT & SERVICES AGREEMENT", title_style))
    story.append(Paragraph(f"<b>Effective Date:</b> {datetime.utcnow().strftime('%B %d, %Y')}", body_style))
    story.append(Spacer(1, 10))
    
    # Section 1: Parties
    story.append(Paragraph("1. Contracting Parties", h2_style))
    story.append(Paragraph(
        f"This agreement is entered into by and between the AI Career Platform (the 'Platform') and "
        f"<b>{mentor_name}</b> (the 'Mentor', Profile ID: {mentor_id}). By signing this document, the Mentor "
        f"agrees to comply with all terms and conditions set forth herein.",
        body_style
    ))
    
    # Section 2: Pricing Policy
    story.append(Paragraph("2. Direct Transacting & Pricing Restrictions", h2_style))
    story.append(Paragraph(
        "<b>A. Integrity Policy:</b> The Mentor agrees to process all session bookings, schedules, and payouts "
        "exclusively through the Platform's designated payment interfaces. Under no circumstances is the Mentor "
        "allowed to negotiate payments from students directly, solicit cash/wire transfers, or demand rates "
        "exceeding their official public pricing listed on the Platform.",
        body_style
    ))
    story.append(Paragraph(
        "<b>B. Violation Penalties:</b> Solicitation of external payments or direct transacting outside of the Platform "
        "constitutes a material breach of this Code of Conduct. Penalties for violations include immediate profile suspension, "
        "permanent deletion of the user account, and forfeiture of any pending payouts.",
        body_style
    ))
    
    # Section 3: Commission & Monthly Payments
    story.append(Paragraph("3. Platform Monthly Commissions & Payouts", h2_style))
    story.append(Paragraph(
        "<b>A. Commission Fee:</b> The Mentor agrees to a <b>5% platform commission</b> on all earnings generated "
        "through mentoring sessions completed on the Platform. Commissions are calculated automatically at the end "
        "of each calendar month.",
        body_style
    ))
    story.append(Paragraph(
        "<b>B. Payout and Remittance:</b> At the end of each calendar month, the Platform will calculate the Mentor's "
        "total earnings. The 5% commission must be paid to the designated UPI ID provided by the Platform's administration. "
        "A notification and email will be sent requesting the commission payment on the 30th or 31st of the month. "
        "A popup alert will persist on the Mentor's dashboard until payment proof is uploaded and submitted.",
        body_style
    ))
    story.append(Paragraph(
        "<b>C. Profile Visibility:</b> Failure to remit the monthly commission within the required period may result "
        "in temporary suspension of profile visibility in the public marketplace.",
        body_style
    ))
    
    # Section 4: Signatures
    story.append(Paragraph("4. Verification & Digital Signatures", h2_style))
    story.append(Paragraph(
        "The Mentor declares that all submitted credential documents, professional credentials, corporate email domains, "
        "and identification selfies are true, accurate, and non-fraudulent. Signatures drawn below constitute fully "
        "binding execution of this document.",
        body_style
    ))
    story.append(Spacer(1, 15))
    
    # Signature block representation
    sig_data = [
        [Paragraph("<b>Mentor Signature:</b>", bold_body_style), Paragraph("<b>Platform Representative:</b>", bold_body_style)],
        [Paragraph(f"<font color='#0284c7'><i>Digitally Signed: {mentor_name}</i></font>", body_style), Paragraph("<i>AI Career Platform Admin</i>", body_style)],
        [Paragraph(f"<b>UPI Address for Payouts:</b> {upi_id or 'Not Provided'}", body_style), Paragraph("<b>Authorized Sign-off</b>", body_style)]
    ]
    
    sig_table = Table(sig_data, colWidths=[250, 250])
    sig_table.setStyle(TableStyle([
        ('LINEBELOW', (0,0), (-1,-1), 0.5, colors.HexColor('#e2e8f0')),
        ('TOPPADDING', (0,0), (-1,-1), 6),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
    ]))
    
    story.append(sig_table)
    
    # Build the document
    doc.build(story)
    
    # Encrypt the PDF using pypdf
    password = f"mentor@{mentor_id}"
    
    reader = PdfReader(temp_pdf_path)
    writer = PdfWriter()
    
    # Copy all pages to the writer
    for page in reader.pages:
        writer.add_page(page)
        
    # Encrypt with user password
    writer.encrypt(password)
    
    # Save encrypted version
    with open(final_pdf_path, "wb") as f:
        writer.write(f)
        
    # Delete temporary unencrypted file
    try:
        os.remove(temp_pdf_path)
    except OSError:
        pass
        
    # Return path relative to the backend uploads directory
    relative_path = os.path.join("uploads", "agreements", f"mentor_agreement_{mentor_id}.pdf")
    return relative_path
