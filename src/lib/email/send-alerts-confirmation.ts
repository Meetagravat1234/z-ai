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
    const criteriaParts: Array<{ label: string; value: string }> = []
    if (criteria.query) criteriaParts.push({ label: 'Keywords', value: criteria.query })
    if (criteria.category) criteriaParts.push({ label: 'Category', value: criteria.category })
    if (criteria.location) criteriaParts.push({ label: 'Location', value: criteria.location })
    if (criteria.workMode) criteriaParts.push({ label: 'Work mode', value: criteria.workMode })
    if (criteria.minSalary) criteriaParts.push({ label: 'Min salary', value: `₹${criteria.minSalary} LPA` })
    criteriaParts.push({ label: 'Frequency', value: criteria.frequency })

    const greeting = userName ? `Hi ${userName.split(' ')[0]},` : 'Hi,'
    const unsubscribeUrl = `${APP_URL}/api/alerts/unsubscribe?token=${unsubscribeToken}`
    const criteriaRowsHtml = criteriaParts.map((p) => `
      <tr>
        <td style="padding: 8px 0; font-size: 13px; color: #6b7280; width: 110px; vertical-align: top;">${p.label}</td>
        <td style="padding: 8px 0; font-size: 13px; color: #111827; font-weight: 500;">${p.value}</td>
      </tr>
    `).join('')

    const frequencyDescription = criteria.frequency === 'weekly'
      ? 'once a week (every 6 days, with a 1-day grace window)'
      : 'every day (around 9 AM IST)'

    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="light only">
  <meta name="supported-color-schemes" content="light only">
  <title>Your Hirebase alert is active</title>
</head>
<body style="margin: 0; padding: 0; background: #f4f5f7; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; -webkit-font-smoothing: antialiased;">

  <!-- Preheader -->
  <div style="display: none; max-height: 0; overflow: hidden; opacity: 0;">
    Your job alert is now active. We'll email you ${frequencyDescription} with matching jobs.
  </div>

  <table width="100%" cellpadding="0" cellspacing="0" style="background: #f4f5f7; padding: 24px 12px;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 2px rgba(0,0,0,0.04); border: 1px solid #e5e7eb;">

          <!-- Brand bar -->
          <tr>
            <td style="padding: 20px 32px; border-bottom: 1px solid #f3f4f6;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <div style="font-size: 18px; font-weight: 700; color: #111827; letter-spacing: -0.3px;">
                      Hirebase
                    </div>
                  </td>
                  <td align="right">
                    <span style="font-size: 11px; color: #9ca3af; font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px;">Alert Confirmed</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding: 28px 32px 24px;">
              <p style="font-size: 14px; color: #6b7280; margin: 0 0 4px;">${greeting}</p>
              <h1 style="font-size: 22px; font-weight: 700; color: #111827; margin: 0 0 12px; line-height: 1.3; letter-spacing: -0.4px;">
                Your job alert is active ✅
              </h1>
              <p style="font-size: 14px; color: #6b7280; margin: 0 0 24px; line-height: 1.5;">
                We&rsquo;ll email you <strong style="color: #374151;">${frequencyDescription}</strong> when new jobs match your criteria. Here&rsquo;s what you&rsquo;ll be notified about:
              </p>

              <!-- Criteria card -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background: #fafbfc; border: 1px solid #e5e7eb; border-radius: 8px; padding: 8px 16px; margin-bottom: 24px;">
                <tr>
                  <td style="padding: 8px 16px;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      ${criteriaRowsHtml}
                    </table>
                  </td>
                </tr>
              </table>

              <!-- CTA -->
              <div style="text-align: center;">
                <a href="${APP_URL}/jobs" style="display: inline-block; padding: 12px 28px; border-radius: 8px; background: #111827; color: white; text-decoration: none; font-weight: 600; font-size: 14px;">
                  Browse jobs now →
                </a>
              </div>
            </td>
          </tr>

          <!-- Didn't sign up? warning -->
          <tr>
            <td style="padding: 0 32px 24px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background: #fef3c7; border: 1px solid #fde68a; border-radius: 8px;">
                <tr>
                  <td style="padding: 14px 16px;">
                    <p style="font-size: 13px; color: #92400e; margin: 0; line-height: 1.5;">
                      <strong>Didn&rsquo;t sign up for this?</strong><br>
                      If you didn&rsquo;t create this alert, you can
                      <a href="${unsubscribeUrl}" style="color: #92400e; font-weight: 600; text-decoration: underline;">unsubscribe with one click</a>
                      — no login required.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 24px 32px; background: #fafbfc; border-top: 1px solid #f3f4f6;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <p style="font-size: 12px; color: #9ca3af; margin: 0 0 8px; line-height: 1.5;">
                      You're receiving this because you set up a job alert on Hirebase.
                    </p>
                    <p style="font-size: 12px; margin: 0;">
                      <a href="${APP_URL}/alerts" style="color: #6b7280; text-decoration: underline;">Manage alerts</a>
                      &nbsp;&nbsp;·&nbsp;&nbsp;
                      <a href="${unsubscribeUrl}" style="color: #6b7280; text-decoration: underline;">Unsubscribe</a>
                    </p>
                  </td>
                </tr>
                <tr>
                  <td style="padding-top: 16px; border-top: 1px solid #f3f4f6; margin-top: 16px;">
                    <p style="font-size: 11px; color: #d1d5db; margin: 0; line-height: 1.4;">
                      Hirebase · Bengaluru, India<br>
                      <a href="${APP_URL}" style="color: #d1d5db; text-decoration: none;">www.hirebase.in</a>
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
