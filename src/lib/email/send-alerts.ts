import { Resend } from 'resend'

interface JobAlertEmail {
  to: string
  userName?: string
  alertCriteria: {
    query?: string | null
    category?: string | null
    location?: string | null
    workMode?: string | null
  }
  jobs: Array<{
    id: string
    title: string
    company: string
    logo?: string | null
    location: string
    salary: string
    workMode: string
    category: string
    applyUrl?: string | null
  }>
  // Token used to build the one-click unsubscribe link in the email footer.
  // Without this, the footer just shows a "Manage your alerts" link.
  unsubscribeToken?: string | null
}

// Site base URL — env var so staging/preview deployments send links that
// point back to themselves rather than the production domain.
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://www.hirebase.in'

// From address — must use a verified Resend sending domain.
// Default to alerts@hirebase.in which is what we'll set up in the Resend
// dashboard. If you haven't verified the domain yet, set RESEND_FROM_EMAIL
// in your env to fall back to onboarding@resend.dev (sandbox) temporarily.
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'alerts@hirebase.in'

export async function sendJobAlertEmail({ to, userName, alertCriteria, jobs, unsubscribeToken }: JobAlertEmail) {
  try {
    const resend = new Resend(process.env.RESEND_API_KEY)

    if (!process.env.RESEND_API_KEY) {
      return { success: false, error: 'RESEND_API_KEY not set' }
    }

    const criteriaText = [
      alertCriteria.query && `"${alertCriteria.query}"`,
      alertCriteria.category && alertCriteria.category,
      alertCriteria.location && alertCriteria.location,
      alertCriteria.workMode && alertCriteria.workMode,
    ].filter(Boolean).join(' · ') || 'All jobs'

    const jobCards = jobs.map((job) => `
      <tr>
        <td style="padding: 16px 0; border-bottom: 1px solid #f0f0f0;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td width="48" valign="top" style="padding-right: 12px;">
                <div style="width: 40px; height: 40px; border-radius: 10px; background: #f3f4f6; display: flex; align-items: center; justify-content: center; font-size: 20px;">
                  ${job.logo || '💼'}
                </div>
              </td>
              <td valign="top">
                <div style="font-weight: 700; font-size: 15px; color: #111827; margin-bottom: 2px;">
                  ${job.title}
                </div>
                <div style="font-size: 13px; color: #6b7280; margin-bottom: 4px;">
                  ${job.company} · ${job.location}
                </div>
                <div style="font-size: 12px; color: #6b7280;">
                  ${job.salary} · ${job.workMode} · ${job.category}
                </div>
              </td>
              <td width="80" valign="top" align="right">
                ${job.applyUrl ? `<a href="${job.applyUrl}" style="display: inline-block; padding: 6px 12px; border-radius: 8px; background: #10b981; color: white; text-decoration: none; font-size: 12px; font-weight: 600;">Apply</a>` : ''}
              </td>
            </tr>
          </table>
        </td>
      </tr>
    `).join('')

    // One-click unsubscribe URL — token-based so it works without login.
    // This is required for CAN-SPAM / GDPR compliance.
    const unsubscribeUrl = unsubscribeToken
      ? `${APP_URL}/api/alerts/unsubscribe?token=${unsubscribeToken}`
      : `${APP_URL}/alerts`

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
                Job Alerts
              </div>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding: 32px 24px;">
              <h1 style="font-size: 22px; font-weight: 800; color: #111827; margin: 0 0 8px;">
                ${jobs.length} new ${jobs.length === 1 ? 'job' : 'jobs'} matching your alert${userName ? `, ${userName}` : ''}!
              </h1>
              <p style="font-size: 14px; color: #6b7280; margin: 0 0 24px;">
                Alert criteria: <strong style="color: #374151;">${criteriaText}</strong>
              </p>

              <table width="100%" cellpadding="0" cellspacing="0">
                ${jobCards}
              </table>

              <div style="text-align: center; margin-top: 32px;">
                <a href="${APP_URL}/jobs" style="display: inline-block; padding: 12px 32px; border-radius: 12px; background: #10b981; color: white; text-decoration: none; font-weight: 700; font-size: 15px;">
                  Browse all jobs →
                </a>
              </div>

              <!-- Footer with unsubscribe link -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-top: 40px; border-top: 1px solid #f0f0f0; padding-top: 24px;">
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
      subject: `${jobs.length} new ${jobs.length === 1 ? 'job' : 'jobs'} matching your alert on Hirebase`,
      html,
      // List-Unsubscribe header — required by Gmail/Yahoo/Apple Mail for bulk
      // senders as of Feb 2024. Enables the native "Unsubscribe" button in
      // email clients.
      headers: unsubscribeToken
        ? {
            'List-Unsubscribe': `<${unsubscribeUrl}>`,
            'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
          }
        : undefined,
    })

    if (error) {
      console.error('Resend error:', error)
      return { success: false, error: error.message }
    }

    return { success: true, id: data?.id }
  } catch (e: any) {
    console.error('Email send error:', e)
    return { success: false, error: e.message }
  }
}
