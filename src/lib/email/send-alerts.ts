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
  // Total number of matching jobs in the DB (the email only includes the top N).
  // Shown in the footer as "View all N matching jobs →".
  totalMatching?: number
}

// Site base URL — env var so staging/preview deployments send links that
// point back to themselves rather than the production domain.
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://www.hirebase.in'

// From address — must use a verified Resend sending domain.
// Default to alerts@hirebase.in which is what we'll set up in the Resend
// dashboard. If you haven't verified the domain yet, set RESEND_FROM_EMAIL
// in your env to fall back to onboarding@resend.dev (sandbox) temporarily.
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'alerts@hirebase.in'

/**
 * Generate a soft pastel background color from a company name.
 * Used as a fallback when the company has no logo — shows the first letter
 * of the company name on a colored circle (Notion / Linear / Slack style).
 * The same company always gets the same color.
 */
function companyColor(name: string): { bg: string; text: string } {
  if (!name) return { bg: '#e0e7ff', text: '#4338ca' }
  const palette = [
    { bg: '#fef3c7', text: '#92400e' }, // amber
    { bg: '#dbeafe', text: '#1e40af' }, // blue
    { bg: '#dcfce7', text: '#166534' }, // green
    { bg: '#fce7f3', text: '#9d174d' }, // pink
    { bg: '#ede9fe', text: '#5b21b6' }, // violet
    { bg: '#cffafe', text: '#155e75' }, // cyan
    { bg: '#fee2e2', text: '#991b1b' }, // red
    { bg: '#f3e8ff', text: '#86198f' }, // purple
    { bg: '#ecfccb', text: '#3f6212' }, // lime
    { bg: '#fff7ed', text: '#9a3412' }, // orange
  ]
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = ((hash << 5) - hash) + name.charCodeAt(i)
    hash = Math.abs(hash)
  }
  return palette[hash % palette.length]
}

export async function sendJobAlertEmail({ to, userName, alertCriteria, jobs, unsubscribeToken, totalMatching }: JobAlertEmail) {
  try {
    const resend = new Resend(process.env.RESEND_API_KEY)

    if (!process.env.RESEND_API_KEY) {
      return { success: false, error: 'RESEND_API_KEY not set' }
    }

    // Build criteria summary — short chips like "Bengaluru · Remote · Senior Software Engineer"
    const criteriaParts = [
      alertCriteria.query && `"${alertCriteria.query}"`,
      alertCriteria.category && alertCriteria.category,
      alertCriteria.location && alertCriteria.location,
      alertCriteria.workMode && alertCriteria.workMode,
    ].filter(Boolean)
    const criteriaText = criteriaParts.length > 0 ? criteriaParts.join(' · ') : 'All verified jobs'
    const criteriaChipsHtml = criteriaParts.length > 0
      ? criteriaParts.map((p) => `<span style="display: inline-block; padding: 4px 10px; border-radius: 9999px; background: #f3f4f6; color: #374151; font-size: 12px; font-weight: 500; margin: 0 4px 4px 0;">${p}</span>`).join('')
      : `<span style="display: inline-block; padding: 4px 10px; border-radius: 9999px; background: #f3f4f6; color: #374151; font-size: 12px; font-weight: 500;">All verified jobs</span>`

    // Greeting — drop the user's name from the H1 (it can look weird when the
    // email goes to an address that isn't their account email). Use a clean
    // "Hi Meet," line above the headline instead.
    const greeting = userName ? `Hi ${userName.split(' ')[0]},` : 'Hi,'

    const jobsToShow = jobs.slice(0, 10) // limit to top 10 to keep email short
    const remainingCount = (totalMatching || jobs.length) - jobsToShow.length

    const jobCards = jobsToShow.map((job, idx) => {
      // Company logo fallback — colored circle with first initial
      const logo = job.logo
        ? `<img src="${job.logo}" alt="" style="width: 40px; height: 40px; border-radius: 10px; object-fit: cover;" />`
        : (() => {
            const color = companyColor(job.company)
            const initial = (job.company || '?').charAt(0).toUpperCase()
            return `<div style="width: 40px; height: 40px; border-radius: 10px; background: ${color.bg}; color: ${color.text}; display: flex; align-items: center; justify-content: center; font-size: 18px; font-weight: 700;">${initial}</div>`
          })()

      // Alternating row background for readability
      const rowBg = idx % 2 === 0 ? '#ffffff' : '#fafbfc'

      // Salary display — make it stand out if it's an estimate
      const salaryDisplay = job.salary && job.salary !== 'Not disclosed'
        ? `<span style="color: #059669; font-weight: 600;">${job.salary}</span>`
        : `<span style="color: #9ca3af; font-style: italic;">Not disclosed</span>`

      // Job-specific URL on hirebase.in — links to the job detail page
      const jobUrl = `${APP_URL}/jobs/${job.id}-${job.title.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').slice(0, 60)}`

      return `
      <tr>
        <td style="padding: 16px 12px; background: ${rowBg}; border-bottom: 1px solid #f3f4f6;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td width="48" valign="top" style="padding-right: 12px;">
                ${logo}
              </td>
              <td valign="top">
                <a href="${jobUrl}" style="text-decoration: none; color: #111827;">
                  <div style="font-weight: 600; font-size: 15px; color: #111827; margin-bottom: 2px; line-height: 1.3;">
                    ${job.title}
                  </div>
                </a>
                <div style="font-size: 13px; color: #6b7280; margin-bottom: 6px;">
                  ${job.company} · ${job.location.split(',')[0]}
                </div>
                <div style="font-size: 12px; color: #6b7280;">
                  ${salaryDisplay} · ${job.workMode} · ${job.category}
                </div>
              </td>
              <td width="80" valign="middle" align="right">
                ${job.applyUrl ? `<a href="${job.applyUrl}" style="display: inline-block; padding: 7px 14px; border-radius: 8px; background: #111827; color: white; text-decoration: none; font-size: 12px; font-weight: 600;">Apply</a>` : `<a href="${jobUrl}" style="display: inline-block; padding: 7px 14px; border-radius: 8px; background: #f3f4f6; color: #374151; text-decoration: none; font-size: 12px; font-weight: 600;">View</a>`}
              </td>
            </tr>
          </table>
        </td>
      </tr>`
    }).join('')

    // One-click unsubscribe URL — token-based so it works without login.
    // This is required for CAN-SPAM / GDPR compliance.
    const unsubscribeUrl = unsubscribeToken
      ? `${APP_URL}/api/alerts/unsubscribe?token=${unsubscribeToken}`
      : `${APP_URL}/alerts`

    // The "View all matching jobs" button at the bottom — links to the jobs
    // page filtered by the alert's criteria
    const viewAllParams = new URLSearchParams()
    if (alertCriteria.query) viewAllParams.set('q', alertCriteria.query)
    if (alertCriteria.category) viewAllParams.set('category', alertCriteria.category)
    if (alertCriteria.location) viewAllParams.set('location', alertCriteria.location)
    if (alertCriteria.workMode) viewAllParams.set('workMode', alertCriteria.workMode)
    const viewAllUrl = `${APP_URL}/jobs${viewAllParams.toString() ? `?${viewAllParams.toString()}` : ''}`

    const totalJobs = totalMatching || jobs.length
    const headline = `${jobsToShow.length} new ${jobsToShow.length === 1 ? 'job' : 'jobs'} matching your alert`

    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="light only">
  <meta name="supported-color-schemes" content="light only">
  <title>${headline}</title>
</head>
<body style="margin: 0; padding: 0; background: #f4f5f7; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; -webkit-font-smoothing: antialiased;">
  <!-- Preheader (hidden preview text shown in inbox) -->
  <div style="display: none; max-height: 0; overflow: hidden; opacity: 0;">
    ${jobsToShow.length} new ${jobsToShow.length === 1 ? 'job' : 'jobs'} for you on Hirebase — ${jobsToShow.slice(0, 3).map(j => j.title).join(', ')}${jobsToShow.length > 3 ? ' and more' : ''}.
  </div>

  <table width="100%" cellpadding="0" cellspacing="0" style="background: #f4f5f7; padding: 24px 12px;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 2px rgba(0,0,0,0.04); border: 1px solid #e5e7eb;">

          <!-- Brand bar — clean, minimal -->
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
                    <span style="font-size: 11px; color: #9ca3af; font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px;">Job Alert</span>
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
                ${headline}
              </h1>
              <p style="font-size: 14px; color: #6b7280; margin: 0 0 16px; line-height: 1.5;">
                ${totalJobs} ${totalJobs === 1 ? 'job' : 'jobs'} matched your criteria${totalJobs > jobsToShow.length ? ` — showing the ${jobsToShow.length} most recent below` : ''}.
              </p>

              <!-- Criteria chips -->
              <div style="margin-bottom: 8px;">
                ${criteriaChipsHtml}
              </div>
            </td>
          </tr>

          <!-- Job list -->
          <tr>
            <td style="padding: 0 32px 24px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
                ${jobCards}
              </table>
            </td>
          </tr>

          <!-- View all CTA -->
          <tr>
            <td style="padding: 0 32px 32px; text-align: center;">
              ${remainingCount > 0 ? `<p style="font-size: 13px; color: #6b7280; margin: 0 0 16px;">+ ${remainingCount} more matching ${remainingCount === 1 ? 'job' : 'jobs'}</p>` : ''}
              <a href="${viewAllUrl}" style="display: inline-block; padding: 12px 28px; border-radius: 8px; background: #111827; color: white; text-decoration: none; font-weight: 600; font-size: 14px;">
                View all ${totalJobs} ${totalJobs === 1 ? 'job' : 'jobs'} →
              </a>
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
      subject: `${jobsToShow.length} new ${jobsToShow.length === 1 ? 'job' : 'jobs'} matching your alert on Hirebase`,
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
