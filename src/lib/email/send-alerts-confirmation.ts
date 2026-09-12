import { Resend } from 'resend'

interface AlertConfirmationEmail {
  to: string
  userName?: string
  criteria: {
    query?: string | null
    category?: string | null
    workMode?: string | null
    location?: string | null
    minSalary?: number | null
    frequency: string
  }
  unsubscribeToken: string
}

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://www.hirebase.in'
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'alerts@hirebase.in'

/**
 * Sends a one-time confirmation email when a user creates a new job alert.
 * This is good practice (a) so the user knows the alert is active, and
 * (b) as a soft form of double opt-in — if they didn't create this alert,
 * they can click unsubscribe immediately.
 */
export async function sendAlertConfirmationEmail({ to, userName, criteria, unsubscribeToken }: AlertConfirmationEmail) {
  try {
    if (!process.env.RESEND_API_KEY) {
      return { success: false, error: 'RESEND_API_KEY not set' }
    }

    const resend = new Resend(process.env.RESEND_API_KEY)

    // Build the human-readable criteria summary
    const criteriaParts: string[] = []
    if (criteria.query) criteriaParts.push(`Keywords: <strong>${criteria.query}</strong>`)
    if (criteria.category) criteriaParts.push(`Category: <strong>${criteria.category}</strong>`)
    if (criteria.location) criteriaParts.push(`Location: <strong>${criteria.location}</strong>`)
    if (criteria.workMode) criteriaParts.push(`Work mode: <strong>${criteria.workMode}</strong>`)
    if (criteria.minSalary) criteriaParts.push(`Min salary: <strong>₹${criteria.minSalary} LPA</strong>`)
    criteriaParts.push(`Frequency: <strong>${criteria.frequency}</strong>`)

    const unsubscribeUrl = `${APP_URL}/api/alerts/unsubscribe?token=${unsubscribeToken}`

    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background: #f9fafb; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background: #f9fafb; padding: 32px 16px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">

          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #10b981, #6366f1); padding: 32px 24px; text-align: center;">
              <div style="font-size: 28px; font-weight: 800; color: white; margin-bottom: 4px;">
                Hirebase
              </div>
              <div style="font-size: 13px; color: rgba(255,255,255,0.8); text-transform: uppercase; letter-spacing: 1px;">
                Alert Confirmed
              </div>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding: 32px 24px;">
              <h1 style="font-size: 22px; font-weight: 800; color: #111827; margin: 0 0 8px;">
                Your alert is active${userName ? `, ${userName}` : ''}! ✅
              </h1>
              <p style="font-size: 14px; color: #6b7280; margin: 0 0 24px;">
                We&rsquo;ll email you ${criteria.frequency} when new jobs match your criteria. Here&rsquo;s what you signed up for:
              </p>

              <table width="100%" cellpadding="0" cellspacing="0" style="background: #f9fafb; border-radius: 12px; padding: 16px; margin-bottom: 24px;">
                <tr>
                  <td style="padding: 16px;">
                    <ul style="margin: 0; padding-left: 20px; font-size: 14px; color: #374151; line-height: 1.8;">
                      ${criteriaParts.map((p) => `<li>${p}</li>`).join('')}
                    </ul>
                  </td>
                </tr>
              </table>

              <div style="text-align: center; margin-top: 24px;">
                <a href="${APP_URL}/jobs" style="display: inline-block; padding: 12px 32px; border-radius: 12px; background: #10b981; color: white; text-decoration: none; font-weight: 700; font-size: 15px;">
                  Browse jobs now →
                </a>
              </div>

              <div style="margin-top: 24px; padding: 16px; background: #fef3c7; border-radius: 8px; border-left: 4px solid #f59e0b;">
                <p style="font-size: 13px; color: #92400e; margin: 0;">
                  <strong>Didn&rsquo;t sign up for this?</strong> If you didn&rsquo;t create this alert, you can
                  <a href="${unsubscribeUrl}" style="color: #92400e; font-weight: 600;">unsubscribe here</a>
                  with one click — no login required.
                </p>
              </div>

              <!-- Footer -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-top: 32px; border-top: 1px solid #f0f0f0; padding-top: 24px;">
                <tr>
                  <td style="text-align: center;">
                    <p style="font-size: 12px; color: #9ca3af; margin: 0 0 8px;">
                      You're receiving this because you set up a job alert on Hirebase.
                    </p>
                    <p style="font-size: 12px; color: #9ca3af; margin: 0;">
                      <a href="${APP_URL}/alerts" style="color: #6b7280;">Manage your alerts</a>
                      &nbsp;·&nbsp;
                      <a href="${unsubscribeUrl}" style="color: #6b7280;">Unsubscribe</a>
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`

    const { data, error } = await resend.emails.send({
      from: `Hirebase <${FROM_EMAIL}>`,
      to,
      subject: '✅ Your Hirebase job alert is active',
      html,
      headers: {
        'List-Unsubscribe': `<${unsubscribeUrl}>`,
        'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
      },
    })

    if (error) {
      console.error('Resend error (welcome email):', error)
      return { success: false, error: error.message }
    }

    return { success: true, id: data?.id }
  } catch (e: any) {
    console.error('Welcome email error:', e)
    return { success: false, error: e.message }
  }
}
