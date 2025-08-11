import { NextResponse } from "next/server"

export async function POST(req: Request) {
  try {
    const { to, cc, subject, html, pdfBase64, fileName } = (await req.json()) as {
      to: string[]
      cc?: string[]
      subject: string
      html: string
      pdfBase64: string // raw base64, no data: prefix
      fileName: string
    }

    if (!Array.isArray(to) || to.length === 0) {
      return NextResponse.json({ error: "Missing 'to' recipients" }, { status: 400 })
    }
    if (!pdfBase64 || !fileName) {
      return NextResponse.json({ error: "Missing PDF attachment" }, { status: 400 })
    }

    const domain = process.env.NEXT_PUBLIC_APP_URL ? new URL(process.env.NEXT_PUBLIC_APP_URL).hostname : "example.com"
    const from = `Reports <reports@${domain}>`

    const payload = {
      from,
      to,
      ...(cc && cc.length > 0 ? { cc } : {}),
      subject,
      html,
      attachments: [{ filename: fileName, content: pdfBase64 }],
    }

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    })

    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      return NextResponse.json({ error: err?.message || "Resend API error" }, { status: 500 })
    }

    const data = await res.json()
    return NextResponse.json({ success: true, id: data?.id })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Unexpected error" }, { status: 500 })
  }
}
