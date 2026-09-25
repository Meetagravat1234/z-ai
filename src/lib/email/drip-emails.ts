import { Resend } from 'resend'

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'alerts@hirebase.in'

interface DripEmailData {
  to: string
  userName?: string
}

/**
 * Send Day 1 welcome email — shows the user what AI tools are available.
 */
export async function sendDripDay1Welcome({ to, userName }: DripEmailData) {
  if (!resend) throw new Error('RESEND_API_KEY not set')

  const firstName = userName?.split(' ')[0] || 'there'

  return resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject: `Welcome to Hirebase! Here's how to land your next job 🚀`,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 560px; margin: 0 auto; padding: 32px 24px; color: #1a1a1a;">
        <div style="text-align: center; margin-bottom: 32px;">
          <div style="display: inline-block; width: 48px; height: 48px; background: linear-gradient(135deg, #10b981, #6366f1); border-radius: 12px; line-height: 48px; color: white; font-weight: 800; font-size: 24px;">H</div>
          <h1 style="font-size: 24px; font-weight: 800; margin: 16px 0 8px;">Welcome to Hirebase, ${firstName}! 🎉</h1>
          <p style="color: #6b7280; font-size: 15px; margin: 0;">You're 1 step away from a better resume.</p>
        </div>

        <p style="font-size: 15px; line-height: 1.6;">You now have access to <strong>6 free AI tools</strong> that can help you land your next job faster:</p>

        <div style="background: #f9fafb; border-radius: 12px; padding: 20px; margin: 24px 0;">
          <div style="margin-bottom: 16px;">
            <div style="font-weight: 700; font-size: 15px;">✨ AI Resume Optimizer</div>
            <div style="font-size: 13px; color: #6b7280; margin-top: 2px;">Tailor your resume to any job description in seconds</div>
          </div>
          <div style="margin-bottom: 16px;">
            <div style="font-weight: 700; font-size: 15px;">📊 ATS Score Checker</div>
            <div style="font-size: 13px; color: #6b7280; margin-top: 2px;">Check if your resume passes Applicant Tracking Systems</div>
          </div>
          <div style="margin-bottom: 16px;">
            <div style="font-weight: 700; font-size: 15px;">💬 AI Cover Letter</div>
            <div style="font-size: 13px; color: #6b7280; margin-top: 2px;">Generate a personalized cover letter for any job</div>
          </div>
          <div style="margin-bottom: 16px;">
            <div style="font-weight: 700; font-size: 15px;">🎤 Mock Interview</div>
            <div style="font-size: 13px; color: #6b7280; margin-top: 2px;">Practice with an AI interviewer before the real thing</div>
          </div>
          <div>
            <div style="font-weight: 700; font-size: 15px;">💰 Salary Predictor + 🎯 Skill Gap Analyzer</div>
            <div style="font-size: 13px; color: #6b7280; margin-top: 2px;">Know your worth and what skills to learn next</div>
          </div>
        </div>

        <div style="text-align: center; margin: 32px 0;">
          <a href="https://www.hirebase.in/ai-tools/resume-optimizer" style="display: inline-block; background: #10b981; color: white; padding: 14px 32px; border-radius: 12px; font-weight: 700; font-size: 15px; text-decoration: none;">Try AI Resume Optimizer →</a>
        </div>

        <p style="font-size: 13px; color: #6b7280; text-align: center; margin-top: 24px;">
          You get 1 free use per tool per month. No credit card required.
        </p>

        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 32px 0;">
        <p style="font-size: 12px; color: #9ca3af; text-align: center;">
          Hirebase · <a href="https://www.hirebase.in" style="color: #6b7280;">www.hirebase.in</a>
        </p>
      </div>
    `,
  })
}

/**
 * Send Day 3 reminder — nudge users who haven't tried AI tools yet.
 */
export async function sendDripDay3Reminder({ to, userName }: DripEmailData) {
  if (!resend) throw new Error('RESEND_API_KEY not set')

  const firstName = userName?.split(' ')[0] || 'there'

  return resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject: `${firstName}, your AI tools are waiting ⏰`,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 560px; margin: 0 auto; padding: 32px 24px; color: #1a1a1a;">
        <div style="text-align: center; margin-bottom: 24px;">
          <h1 style="font-size: 22px; font-weight: 800; margin: 0 0 8px;">Your AI tools are waiting, ${firstName} ⏰</h1>
          <p style="color: #6b7280; font-size: 15px; margin: 0;">3 days since you joined — let's get you job-ready.</p>
        </div>

        <p style="font-size: 15px; line-height: 1.6;">Did you know that <strong>resumes tailored to the job description are 3x more likely to get an interview</strong>?</p>

        <p style="font-size: 15px; line-height: 1.6;">Our AI Resume Optimizer does this for you in <strong>under 15 seconds</strong>:</p>

        <ol style="font-size: 15px; line-height: 1.8; padding-left: 24px; margin: 16px 0;">
          <li>Upload your current resume (PDF or DOCX)</li>
          <li>Paste the job description you want to apply for</li>
          <li>Choose from 10 professional templates</li>
          <li>Download your tailored resume in 1 click</li>
        </ol>

        <div style="text-align: center; margin: 32px 0;">
          <a href="https://www.hirebase.in/ai-tools/resume-optimizer" style="display: inline-block; background: #10b981; color: white; padding: 14px 32px; border-radius: 12px; font-weight: 700; font-size: 15px; text-decoration: none;">Optimize My Resume Now →</a>
        </div>

        <div style="background: #fef3c7; border-radius: 12px; padding: 16px; margin: 24px 0; text-align: center;">
          <div style="font-size: 14px; color: #92400e; font-weight: 600;">💡 Pro tip: Also try the ATS Score Checker</div>
          <div style="font-size: 13px; color: #92400e; margin-top: 4px;">Make sure your resume passes Applicant Tracking Systems before applying</div>
        </div>

        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 32px 0;">
        <p style="font-size: 12px; color: #9ca3af; text-align: center;">
          Hirebase · <a href="https://www.hirebase.in" style="color: #6b7280;">www.hirebase.in</a>
        </p>
      </div>
    `,
  })
}

/**
 * Send Day 7 offer — limited-time discount to drive Pro conversion.
 */
export async function sendDripDay7Offer({ to, userName }: DripEmailData) {
  if (!resend) throw new Error('RESEND_API_KEY not set')

  const firstName = userName?.split(' ')[0] || 'there'

  return resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject: `🔥 Limited offer: 50% off Hirebase Pro (this week only)`,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 560px; margin: 0 auto; padding: 32px 24px; color: #1a1a1a;">
        <div style="text-align: center; margin-bottom: 24px;">
          <div style="display: inline-block; background: linear-gradient(135deg, #f59e0b, #ef4444); color: white; padding: 4px 12px; border-radius: 999px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 12px;">Limited time</div>
          <h1 style="font-size: 22px; font-weight: 800; margin: 0 0 8px;">50% off Hirebase Pro 🔥</h1>
          <p style="color: #6b7280; font-size: 15px; margin: 0;">Just for you, ${firstName} — this week only.</p>
        </div>

        <div style="background: linear-gradient(135deg, #fef3c7, #fed7aa); border-radius: 16px; padding: 24px; margin: 24px 0; text-align: center;">
          <div style="font-size: 36px; font-weight: 800; color: #92400e;">₹149/month</div>
          <div style="font-size: 14px; color: #92400e; text-decoration: line-through; margin-top: 4px;">Was ₹299/month</div>
          <div style="font-size: 13px; color: #92400e; margin-top: 8px;">Or ₹1,249/year (was ₹2,499) — save ₹1,250</div>
        </div>

        <p style="font-size: 15px; line-height: 1.6;">With Pro, you get:</p>

        <ul style="font-size: 15px; line-height: 1.8; padding-left: 24px; margin: 16px 0;">
          <li><strong>10x more AI tool uses</strong> (10/month vs 1/month free)</li>
          <li>All <strong>10 professional resume templates</strong> (Tech, Executive, Creative, etc.)</li>
          <li><strong>50 PDF/DOCX downloads</strong> per month</li>
          <li><strong>50 ATS checks</strong> per month</li>
          <li>Priority support</li>
        </ul>

        <div style="text-align: center; margin: 32px 0;">
          <a href="https://www.hirebase.in/upgrade" style="display: inline-block; background: #10b981; color: white; padding: 16px 40px; border-radius: 12px; font-weight: 700; font-size: 16px; text-decoration: none;">Claim 50% Off →</a>
        </div>

        <p style="font-size: 13px; color: #6b7280; text-align: center;">
          ⏰ Offer expires in 7 days. Use it before it's gone.
        </p>

        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 32px 0;">
        <p style="font-size: 12px; color: #9ca3af; text-align: center;">
          Hirebase · <a href="https://www.hirebase.in" style="color: #6b7280;">www.hirebase.in</a>
        </p>
      </div>
    `,
  })
}
