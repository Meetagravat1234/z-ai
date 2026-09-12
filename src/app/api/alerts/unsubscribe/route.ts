import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

/**
 * GET /api/alerts/unsubscribe?token=<token>
 *
 * One-click unsubscribe — flips `isActive` to false on the matching alert.
 *
 * This endpoint is hit when a user clicks the "Unsubscribe" link in the email
 * footer OR when Gmail/Yahoo/Apple Mail's native unsubscribe button fires
 * (we set the List-Unsubscribe header pointing here).
 *
 * No auth required — the token IS the auth. Tokens are 24-char CUIDs
 * generated per-alert, so they're unguessable.
 *
 * Returns a simple HTML page (not JSON) so it renders nicely when a user
 * clicks the link in their email client.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const token = searchParams.get('token')

  if (!token) {
    return new NextResponse(renderPage('Invalid link', 'This unsubscribe link is missing a token. Please use the unsubscribe link from your alert email.'), {
      status: 400,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    })
  }

  try {
    const alert = await db.jobAlert.findUnique({
      where: { unsubscribeToken: token },
      select: { id: true, email: true, isActive: true, query: true, category: true, location: true },
    })

    if (!alert) {
      return new NextResponse(renderPage('Link expired', 'This unsubscribe link is no longer valid. If you&rsquo;re still receiving alerts you didn&rsquo;t sign up for, please contact <a href="mailto:contact@hirebase.in" style="color: #6366f1;">contact@hirebase.in</a>.'), {
        status: 404,
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
      })
    }

    if (!alert.isActive) {
      // Already unsubscribed — be polite, don't show an error
      return new NextResponse(renderPage('Already unsubscribed', 'You&rsquo;re already unsubscribed from this alert. You won&rsquo;t receive any more emails for it.'), {
        status: 200,
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
      })
    }

    await db.jobAlert.update({
      where: { id: alert.id },
      data: { isActive: false },
    })

    // Build a human-readable description of the alert they unsubscribed from
    const criteriaParts = [
      alert.query && `"${alert.query}"`,
      alert.category,
      alert.location,
    ].filter(Boolean)
    const criteriaText = criteriaParts.length > 0 ? criteriaParts.join(' · ') : 'all jobs'

    return new NextResponse(renderPage('Unsubscribed', `You&rsquo;ve been unsubscribed from your <strong>${criteriaText}</strong> alert. You won&rsquo;t receive any more emails for this alert.`), {
      status: 200,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    })
  } catch (e: any) {
    console.error('Unsubscribe error:', e)
    return new NextResponse(renderPage('Something went wrong', 'We couldn&rsquo;t process your unsubscribe request right now. Please try again later or email <a href="mailto:contact@hirebase.in" style="color: #6366f1;">contact@hirebase.in</a>.'), {
      status: 500,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    })
  }
}

/**
 * POST /api/alerts/unsubscribe?token=<token>
 *
 * Handles the Gmail/Yahoo one-click unsubscribe flow (RFC 8058).
 * Email clients POST to this URL with `List-Unsubscribe=One-Click` in the
 * body when a user clicks their native unsubscribe button.
 */
export async function POST(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const token = searchParams.get('token')

  if (!token) {
    return new NextResponse(null, { status: 400 })
  }

  try {
    const alert = await db.jobAlert.findUnique({
      where: { unsubscribeToken: token },
      select: { id: true, isActive: true },
    })

    if (!alert) {
      return new NextResponse(null, { status: 404 })
    }

    if (alert.isActive) {
      await db.jobAlert.update({
        where: { id: alert.id },
        data: { isActive: false },
      })
    }

    // RFC 8058 requires a 200 OK response
    return new NextResponse(null, { status: 200 })
  } catch (e: any) {
    console.error('Unsubscribe POST error:', e)
    return new NextResponse(null, { status: 500 })
  }
}

function renderPage(title: string, message: string): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} | Hirebase</title>
</head>
<body style="margin: 0; padding: 0; background: #f9fafb; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background: #f9fafb; padding: 64px 16px;">
    <tr>
      <td align="center">
        <table width="500" cellpadding="0" cellspacing="0" style="background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
          <tr>
            <td style="background: linear-gradient(135deg, #10b981, #6366f1); padding: 24px; text-align: center;">
              <div style="font-size: 22px; font-weight: 800; color: white;">Hirebase</div>
            </td>
          </tr>
          <tr>
            <td style="padding: 32px 24px; text-align: center;">
              <h1 style="font-size: 22px; font-weight: 800; color: #111827; margin: 0 0 12px;">${title}</h1>
              <p style="font-size: 14px; color: #6b7280; line-height: 1.6; margin: 0 0 24px;">${message}</p>
              <a href="https://www.hirebase.in/jobs" style="display: inline-block; padding: 10px 24px; border-radius: 8px; background: #10b981; color: white; text-decoration: none; font-weight: 600; font-size: 14px;">Browse jobs on Hirebase</a>
            </td>
          </tr>
        </table>
        <p style="font-size: 12px; color: #9ca3af; margin-top: 24px;">
          <a href="https://www.hirebase.in" style="color: #6b7280;">www.hirebase.in</a>
        </p>
      </td>
    </tr>
  </table>
</body>
</html>`
}
