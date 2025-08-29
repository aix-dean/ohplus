import { type NextRequest, NextResponse } from "next/server"
import { Resend } from "resend"
import { auth } from "firebase-admin"
import { getFirestore } from "firebase-admin/firestore"
import { initializeApp, getApps, cert } from "firebase-admin/app"

// Initialize Firebase Admin if not already initialized
if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    }),
  })
}

const resend = new Resend(process.env.RESEND_API_KEY)
const db = getFirestore()

export async function POST(request: NextRequest) {
  try {
    const { to, subject, message, attachments, userToken } = await request.json()

    let userPhoneNumber = "+639XXXXXXXXX" // Default fallback

    if (userToken) {
      try {
        // Verify the Firebase token
        const decodedToken = await auth().verifyIdToken(userToken)
        const uid = decodedToken.uid

        // Query the iboard_users collection to get user data
        const usersSnapshot = await db.collection("iboard_users").where("uid", "==", uid).get()

        if (!usersSnapshot.empty) {
          const userData = usersSnapshot.docs[0].data()
          if (userData.phone_number) {
            userPhoneNumber = userData.phone_number
          }
        }
      } catch (error) {
        console.error("Error fetching user phone number:", error)
        // Continue with default phone number if there's an error
      }
    }

    // Create professional HTML email template
    const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${subject}</title>
    <style>
        body { margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8fafc; }
        .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center; }
        .logo { color: #ffffff; font-size: 28px; font-weight: bold; margin: 0; letter-spacing: 1px; }
        .tagline { color: #e2e8f0; font-size: 14px; margin: 8px 0 0 0; }
        .content { padding: 40px 30px; }
        .greeting { font-size: 18px; color: #2d3748; margin-bottom: 20px; font-weight: 600; }
        .message { color: #4a5568; line-height: 1.6; margin-bottom: 30px; font-size: 16px; }
        .highlight-box { background-color: #f7fafc; border-left: 4px solid #667eea; padding: 20px; margin: 25px 0; border-radius: 0 8px 8px 0; }
        .highlight-text { color: #2d3748; font-weight: 600; margin: 0; }
        .cta-button { display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: 600; margin: 20px 0; transition: transform 0.2s; }
        .cta-button:hover { transform: translateY(-2px); }
        .footer { background-color: #f8fafc; padding: 30px; border-top: 1px solid #e2e8f0; }
        .signature { margin-bottom: 25px; }
        .signature-title { color: #667eea; font-size: 18px; font-weight: 600; margin: 0 0 5px 0; }
        .signature-subtitle { color: #718096; font-size: 14px; margin: 0 0 20px 0; }
        .contact-info { background-color: #ffffff; padding: 20px; border-radius: 8px; border: 1px solid #e2e8f0; }
        .company-name { color: #2d3748; font-size: 16px; font-weight: 600; margin: 0 0 10px 0; }
        .contact-item { display: flex; align-items: center; margin: 8px 0; color: #4a5568; font-size: 14px; }
        .contact-icon { width: 16px; height: 16px; margin-right: 10px; }
        .contact-link { color: #667eea; text-decoration: none; }
        .contact-link:hover { text-decoration: underline; }
        .disclaimer { margin-top: 25px; padding-top: 20px; border-top: 1px solid #e2e8f0; color: #a0aec0; font-size: 12px; text-align: center; line-height: 1.5; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1 class="logo">OH PLUS</h1>
            <p class="tagline">Outdoor Advertising Excellence</p>
        </div>
        
        <div class="content">
            <div class="greeting">Hello there!</div>
            
            <div class="message">
                ${message.replace(/\n/g, "<br>")}
            </div>
            
            <div class="highlight-box">
                <p class="highlight-text">📋 Your proposal includes detailed site information and competitive pricing based on our recent discussion.</p>
            </div>
            
            <div style="text-align: center;">
                <a href="#" class="cta-button">View Proposal Details</a>
            </div>
        </div>
        
        <div class="footer">
            <div class="signature">
                <div class="signature-title">Sales Executive</div>
                <div class="signature-subtitle">OH PLUS - Outdoor Advertising</div>
            </div>
            
            <div class="contact-info">
                <div class="company-name">OH PLUS</div>
                
                <div class="contact-item">
                    <svg class="contact-icon" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z"/>
                    </svg>
                    ${userPhoneNumber}
                </div>
                
                <div class="contact-item">
                    <svg class="contact-icon" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z"/>
                        <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z"/>
                    </svg>
                    <a href="mailto:noreply@ohplus.ph" class="contact-link">noreply@ohplus.ph</a>
                </div>
                
                <div class="contact-item">
                    <svg class="contact-icon" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M4.083 9h1.946c.089-1.546.383-2.97.837-4.118A6.004 6.004 0 004.083 9zM10 2a8 8 0 100 16 8 8 0 000-16zm0 2c-.076 0-.232.032-.465.262-.238.234-.497.623-.737 1.182-.389.907-.673 2.142-.766 3.556h3.936c-.093-1.414-.377-2.649-.766-3.556-.24-.559-.499-.948-.737-1.182C10.232 4.032 10.076 4 10 4zm3.971 5c-.089-1.546-.383-2.97-.837-4.118A6.004 6.004 0 0115.917 9h-1.946zm-2.003 2H8.032c.093 1.414.377 2.649.766 3.556.24.559.499.948.737 1.182.233.23.389.262.465.262.076 0 .232-.032.465-.262.238-.234.497-.623.737-1.182.389-.907.673-2.142.766-3.556zm1.166 4.118c.454-1.147.748-2.572.837-4.118h1.946a6.004 6.004 0 01-2.783 4.118zm-6.268 0C6.412 13.97 6.118 12.546 6.03 11H4.083a6.004 6.004 0 002.783 4.118z" clip-rule="evenodd"/>
                    </svg>
                    <a href="https://www.ohplus.ph" class="contact-link">www.ohplus.ph</a>
                </div>
            </div>
            
            <div class="disclaimer">
                This email contains confidential information intended only for the recipient. If you have received this email in error, please notify the sender and delete this message.
            </div>
        </div>
    </div>
</body>
</html>
    `
  } catch (error) {
    console.error("Error sending email:", error)
    return NextResponse.json({ error: "Failed to send email" }, { status: 500 })
  }
}
