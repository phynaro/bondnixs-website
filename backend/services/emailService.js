const { Resend } = require('resend')

// Initialize Resend client lazily
let resend = null
const getResendClient = () => {
  if (!resend) {
    const apiKey = process.env.RESEND_API_TOKEN
    if (!apiKey) {
      throw new Error('RESEND_API_TOKEN environment variable is required')
    }
    resend = new Resend(apiKey)
  }
  return resend
}

/**
 * Send contact notification email to admin recipients
 * @param {Object} contactData - Contact form data
 * @param {Array} recipients - Array of recipient objects
 * @returns {Promise<Object>} - Resend API response
 */
const sendContactNotification = async (contactData, recipients) => {
  const { name, email, company, phone, subject, message, is_document_download, product_name, product_model, document_name, document_type } = contactData
  
  // Check if this is a document download notification
  const isDownload = is_document_download === true
  
  // Format subject options for display (only for regular contact forms)
  const subjectOptions = {
    'product-inquiry': 'Product Inquiry',
    'quote-request': 'Quote Request',
    'technical-support': 'Technical Support',
    'partnership': 'Partnership',
    'other': 'Other'
  }
  
  const displaySubject = isDownload ? subject : (subjectOptions[subject] || subject)
  
  // Create professional email template
  const emailHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${isDownload ? 'Document Download Request' : 'New Contact Form Submission'} - BONDNIXS</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #1e40af; color: white; padding: 20px; text-align: center; }
        .content { background-color: #f8fafc; padding: 30px; }
        .field { margin-bottom: 20px; }
        .label { font-weight: bold; color: #374151; margin-bottom: 5px; }
        .value { background-color: white; padding: 10px; border-left: 4px solid #1e40af; }
        .footer { background-color: #e5e7eb; padding: 15px; text-align: center; font-size: 12px; color: #6b7280; }
        .message-content { background-color: white; padding: 15px; border: 1px solid #d1d5db; border-radius: 4px; white-space: pre-wrap; }
        .download-info { background-color: #eff6ff; padding: 15px; border-left: 4px solid #3b82f6; margin: 20px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>BONDNIXS</h1>
          <h2>${isDownload ? 'Document Download Request' : 'New Contact Form Submission'}</h2>
        </div>
        
        <div class="content">
          <p>Dear BONDNIXS Team,</p>
          
          <p>${isDownload ? 'A user has downloaded a product document from the company website. Please review the details below:' : 'A new contact form submission has been received through the company website. Please review the details below:'}</p>
          
          <div class="field">
            <div class="label">Contact Information:</div>
            <div class="value">
              <strong>Name:</strong> ${name}<br>
              <strong>Email:</strong> ${email}<br>
              ${company ? `<strong>Company:</strong> ${company}<br>` : ''}
              ${phone ? `<strong>Phone:</strong> ${phone}<br>` : ''}
            </div>
          </div>
          
          ${isDownload ? `
          <div class="download-info">
            <div class="label">Download Information:</div>
            <div>
              <strong>Product:</strong> ${product_name || 'N/A'} (${product_model || 'N/A'})<br>
              <strong>Document:</strong> ${document_name || 'N/A'}<br>
              <strong>Document Type:</strong> ${document_type || 'N/A'}
            </div>
          </div>
          ` : `
          <div class="field">
            <div class="label">Inquiry Details:</div>
            <div class="value">
              <strong>Subject:</strong> ${displaySubject}
            </div>
          </div>
          
          <div class="field">
            <div class="label">Message:</div>
            <div class="message-content">${message}</div>
          </div>
          `}
          
          <div class="field">
            <div class="label">Submission Details:</div>
            <div class="value">
              <strong>Submitted:</strong> ${new Date().toLocaleString('en-US', { 
                timeZone: 'Asia/Bangkok',
                year: 'numeric', 
                month: 'long', 
                day: 'numeric', 
                hour: '2-digit', 
                minute: '2-digit' 
              })} (Bangkok Time)
            </div>
          </div>
          
          <p>${isDownload ? 'This user may be interested in this product. Consider following up with them.' : 'Please respond to this inquiry promptly to maintain our professional service standards.'}</p>
          
          <p>Best regards,<br>
          BONDNIXS Website System</p>
        </div>
        
        <div class="footer">
          <p>This is an automated notification from the BONDNIXS ${isDownload ? 'document download' : 'contact form'} system.</p>
          <p>BONDNIXS - Precision Dispensing Solutions</p>
        </div>
      </div>
    </body>
    </html>
  `
  
  const emailText = `
BONDNIXS - ${isDownload ? 'Document Download Request' : 'New Contact Form Submission'}

Dear BONDNIXS Team,

${isDownload ? 'A user has downloaded a product document from the company website.' : 'A new contact form submission has been received through the company website.'}

Contact Information:
- Name: ${name}
- Email: ${email}
${company ? `- Company: ${company}` : ''}
${phone ? `- Phone: ${phone}` : ''}

${isDownload ? `
Download Information:
- Product: ${product_name || 'N/A'} (${product_model || 'N/A'})
- Document: ${document_name || 'N/A'}
- Document Type: ${document_type || 'N/A'}
` : `
Inquiry Details:
- Subject: ${displaySubject}

Message:
${message}
`}

Submitted: ${new Date().toLocaleString('en-US', { 
  timeZone: 'Asia/Bangkok',
  year: 'numeric', 
  month: 'long', 
  day: 'numeric', 
  hour: '2-digit', 
  minute: '2-digit' 
})} (Bangkok Time)

${isDownload ? 'This user may be interested in this product. Consider following up with them.' : 'Please respond to this inquiry promptly to maintain our professional service standards.'}

Best regards,
BONDNIXS Website System

---
This is an automated notification from the BONDNIXS ${isDownload ? 'document download' : 'contact form'} system.
BONDNIXS - Precision Dispensing Solutions
  `
  
  try {
    const emailSubject = isDownload 
      ? `Document Download Request - ${document_name || 'Product Document'} - BONDNIXS`
      : `New Contact Form Submission - ${displaySubject} - BONDNIXS`
    
    const result = await getResendClient().emails.send({
      from: 'noreply@notify.bondnixs.co.th',
      to: recipients.map(r => r.email),
      subject: emailSubject,
      html: emailHtml,
      text: emailText
    })
    
    return result
  } catch (error) {
    console.error('Error sending contact notification email:', error)
    throw error
  }
}

/**
 * Send confirmation email to customer
 * @param {Object} contactData - Contact form data
 * @returns {Promise<Object>} - Resend API response
 */
const sendContactConfirmation = async (contactData) => {
  const { name, email, subject, message } = contactData
  
  // Format subject options for display
  const subjectOptions = {
    'product-inquiry': 'Product Inquiry',
    'quote-request': 'Quote Request',
    'technical-support': 'Technical Support',
    'partnership': 'Partnership',
    'other': 'Other'
  }
  
  const displaySubject = subjectOptions[subject] || subject
  
  // Create professional confirmation email template
  const emailHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Thank You for Contacting BONDNIXS</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #1e40af; color: white; padding: 20px; text-align: center; }
        .content { background-color: #f8fafc; padding: 30px; }
        .field { margin-bottom: 20px; }
        .label { font-weight: bold; color: #374151; margin-bottom: 5px; }
        .value { background-color: white; padding: 10px; border-left: 4px solid #1e40af; }
        .footer { background-color: #e5e7eb; padding: 15px; text-align: center; font-size: 12px; color: #6b7280; }
        .message-content { background-color: white; padding: 15px; border: 1px solid #d1d5db; border-radius: 4px; white-space: pre-wrap; }
        .business-hours { background-color: #f0f9ff; padding: 15px; border-radius: 4px; margin: 20px 0; }
        .contact-info { background-color: #f9fafb; padding: 15px; border-radius: 4px; margin: 20px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>BONDNIXS</h1>
          <h2>Thank You for Your Inquiry</h2>
        </div>
        
        <div class="content">
          <p>Dear ${name},</p>
          
          <p>Thank you for contacting BONDNIXS. We have successfully received your inquiry and our team will review it promptly.</p>
          
          <div class="field">
            <div class="label">Your Inquiry Summary:</div>
            <div class="value">
              <strong>Subject:</strong> ${displaySubject}<br>
              <strong>Submitted:</strong> ${new Date().toLocaleString('en-US', { 
                timeZone: 'Asia/Bangkok',
                year: 'numeric', 
                month: 'long', 
                day: 'numeric', 
                hour: '2-digit', 
                minute: '2-digit' 
              })} (Bangkok Time)
            </div>
          </div>
          
          <div class="field">
            <div class="label">Your Message:</div>
            <div class="message-content">${message}</div>
          </div>
          
          <div class="business-hours">
            <h3>Our Response Time</h3>
            <p>We typically respond to inquiries within 24 hours during business days. For urgent matters, please contact us directly at the phone number below.</p>
          </div>
          
          <div class="contact-info">
            <h3>Additional Contact Information</h3>
            <p><strong>Email:</strong> Hathaipat.w@bondnixs.co.th</p>
            <p><strong>Phone:</strong> +66 92 549 5845</p>
            <p><strong>Address:</strong> 88/55 Centro Village, Moo 11, Soi Kingkaew 37, Kingkaew Road, Racha Thewa, Bang Phli, Samut Prakan 10540, Thailand</p>
          </div>
          
          <p>We appreciate your interest in BONDNIXS precision dispensing solutions and look forward to assisting you with your requirements.</p>
          
          <p>Best regards,<br>
          BONDNIXS Team</p>
        </div>
        
        <div class="footer">
          <p>BONDNIXS - Precision Dispensing Solutions</p>
          <p>This is an automated confirmation email. Please do not reply to this message.</p>
        </div>
      </div>
    </body>
    </html>
  `
  
  const emailText = `
BONDNIXS - Thank You for Your Inquiry

Dear ${name},

Thank you for contacting BONDNIXS. We have successfully received your inquiry and our team will review it promptly.

Your Inquiry Summary:
- Subject: ${displaySubject}
- Submitted: ${new Date().toLocaleString('en-US', { 
  timeZone: 'Asia/Bangkok',
  year: 'numeric', 
  month: 'long', 
  day: 'numeric', 
  hour: '2-digit', 
  minute: '2-digit' 
})} (Bangkok Time)

Your Message:
${message}

Our Response Time:
We typically respond to inquiries within 24 hours during business days. For urgent matters, please contact us directly at the phone number below.

Additional Contact Information:
- Email: Hathaipat.w@bondnixs.co.th
- Phone: +66 92 549 5845
- Address: 88/55 Centro Village, Moo 11, Soi Kingkaew 37, Kingkaew Road, Racha Thewa, Bang Phli, Samut Prakan 10540, Thailand

We appreciate your interest in BONDNIXS precision dispensing solutions and look forward to assisting you with your requirements.

Best regards,
BONDNIXS Team

---
BONDNIXS - Precision Dispensing Solutions
This is an automated confirmation email. Please do not reply to this message.
  `
  
  try {
    const result = await getResendClient().emails.send({
      from: 'noreply@notify.bondnixs.co.th',
      to: [email],
      subject: `Thank You for Contacting BONDNIXS - ${displaySubject}`,
      html: emailHtml,
      text: emailText
    })
    
    return result
  } catch (error) {
    console.error('Error sending contact confirmation email:', error)
    throw error
  }
}

module.exports = {
  sendContactNotification,
  sendContactConfirmation
}
