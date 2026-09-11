import { SiteShell } from '@/components/layout/site-shell'
import type { Metadata } from 'next'

export const dynamic = 'force-static'
export const revalidate = 86400

export const metadata: Metadata = {
  title: 'Terms of Service | Hirebase',
  description:
    'Hirebase Terms of Service — the rules and conditions for using our job portal and AI tools.',
  alternates: { canonical: 'https://www.hirebase.in/terms' },
  robots: { index: true, follow: true },
}

const lastUpdated = '10 September 2026'

export default function TermsPage() {
  return (
    <SiteShell>
      <article className="max-w-3xl mx-auto pb-12">
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">Terms of Service</h1>
        <p className="mt-2 text-sm text-muted-foreground">Last updated: {lastUpdated}</p>

        <div className="prose prose-sm dark:prose-invert max-w-none mt-8 space-y-4 text-foreground/90">
          <p className="text-base">
            Welcome to Hirebase. These Terms of Service (&ldquo;Terms&rdquo;) govern your use of{' '}
            <a href="https://www.hirebase.in" className="text-primary hover:underline">https://www.hirebase.in</a>{' '}
            (the &ldquo;Service&rdquo;) operated by Hirebase (&ldquo;we&rdquo;, &ldquo;our&rdquo;, &ldquo;us&rdquo;).
          </p>
          <p>By accessing or using our Service, you agree to be bound by these Terms. If you disagree with any part of these Terms, you may not access the Service.</p>

          <h2 className="text-xl font-bold mt-6 mb-2">1. Eligibility</h2>
          <p>You must be at least 18 years old to use this Service. By using Hirebase, you represent and warrant that you are 18 or older and capable of entering into a binding contract.</p>

          <h2 className="text-xl font-bold mt-6 mb-2">2. Account Registration</h2>
          <ul className="list-disc ml-6 space-y-1">
            <li>You must provide accurate, current, and complete information during registration.</li>
            <li>You are responsible for safeguarding your password and for any activity under your account.</li>
            <li>You agree to notify us immediately of any unauthorized use of your account.</li>
            <li>One person may not create multiple accounts to bypass free-tier usage limits.</li>
            <li>We reserve the right to suspend or terminate accounts that violate these Terms.</li>
          </ul>

          <h2 className="text-xl font-bold mt-6 mb-2">3. Acceptable Use</h2>
          <p>You agree <strong>not</strong> to:</p>
          <ul className="list-disc ml-6 space-y-1">
            <li>Use the Service for any unlawful purpose or in violation of any local, state, national, or international law.</li>
            <li>Submit false or misleading information in your resume, cover letter, or application tracker.</li>
            <li>Attempt to reverse engineer, decompile, or otherwise extract source code from the Service.</li>
            <li>Use automated scripts, bots, or scrapers to extract job listings, company data, or AI tool outputs without our written permission.</li>
            <li>Reproduce, duplicate, copy, or resell any content from Hirebase for commercial purposes.</li>
            <li>Upload viruses, malware, or any other malicious code to the Service.</li>
            <li>Harass, abuse, or impersonate other users.</li>
            <li>Circumvent, disable, or otherwise interfere with security-related features of the Service or features that prevent or restrict use or copying of any content.</li>
            <li>Use the AI tools to generate content that is illegal, defamatory, harassing, or otherwise harmful.</li>
          </ul>

          <h2 className="text-xl font-bold mt-6 mb-2">4. Job Listings and Third-Party Content</h2>
          <p>Hirebase aggregates job listings from public sources (employer career pages, public job APIs like Greenhouse, Ashby, Remotive). We do <strong>not</strong>:</p>
          <ul className="list-disc ml-6 space-y-1">
            <li>Verify the legitimacy of every job listing — we use AI enrichment but cannot guarantee accuracy.</li>
            <li>Endorse any employer or guarantee employment outcomes.</li>
            <li>Take responsibility for the hiring decisions made by employers.</li>
          </ul>
          <p>You acknowledge that:</p>
          <ul className="list-disc ml-6 space-y-1">
            <li>Job listings may be removed by employers without notice.</li>
            <li>Application outcomes (interview calls, offers) depend solely on the employer.</li>
            <li>You should verify job details directly on the employer&rsquo;s official website before applying.</li>
            <li>You should never pay any fee to an employer as a condition of employment — report such listings to us immediately.</li>
          </ul>

          <h2 className="text-xl font-bold mt-6 mb-2">5. AI Tools</h2>
          <p>The Service includes AI-powered tools (Resume Optimizer, ATS Score Checker, Cover Letter Generator, Mock Interview, Skill Gap Analyzer, Salary Predictor, Job Match Score). These tools:</p>
          <ul className="list-disc ml-6 space-y-1">
            <li>Generate content based on AI models that may produce inaccurate, biased, or incomplete outputs.</li>
            <li>Are provided for informational purposes only and should not be the sole basis for any career decision.</li>
            <li>Should be reviewed by you before submission to any employer — you are responsible for the accuracy of your resume and cover letter.</li>
            <li>Do not guarantee employment, interviews, or salary outcomes.</li>
          </ul>
          <p>We reserve the right to modify, suspend, or discontinue any AI tool at any time without notice.</p>

          <h2 className="text-xl font-bold mt-6 mb-2">6. Free and Paid Subscriptions</h2>
          <h3 className="font-semibold mt-3 mb-1">6.1 Free Tier</h3>
          <p>The Service offers a free tier with limited features, including:</p>
          <ul className="list-disc ml-6 space-y-1">
            <li>Unlimited job browsing, search, and application redirects.</li>
            <li>Limited AI tool usage (e.g., 1 AI Resume Optimization per month).</li>
            <li>Limited saved jobs (max 10) and application tracker entries (max 5).</li>
          </ul>

          <h3 className="font-semibold mt-3 mb-1">6.2 Pro Tier</h3>
          <p>Paid subscriptions are billed in advance on a monthly or annual basis through Razorpay. By subscribing, you agree to:</p>
          <ul className="list-disc ml-6 space-y-1">
            <li>Pay all fees associated with your subscription, including applicable taxes (GST as per Indian law).</li>
            <li>Provide accurate billing information.</li>
            <li>Authorize us to charge the recurring fee until you cancel or the subscription expires.</li>
          </ul>
          <p><strong>Refund Policy:</strong> Subscriptions are non-refundable except where required by law. If you cancel within 7 days of your first payment and have not used any Pro features, you may request a full refund by emailing <a href="mailto:contact@hirebase.in" className="text-primary hover:underline">contact@hirebase.in</a>. Subsequent renewals are non-refundable.</p>
          <p><strong>Cancellation:</strong> You may cancel your subscription at any time from your Profile page. Cancellation stops future billing — you retain Pro access until the end of the current billing period.</p>
          <p><strong>Price Changes:</strong> We may change subscription prices with at least 30 days&rsquo; notice. Existing subscribers will continue at their current price until the next renewal cycle.</p>

          <h2 className="text-xl font-bold mt-6 mb-2">7. Intellectual Property</h2>
          <p>The Service and its original content (excluding job listings and user-submitted content), including features, functionality, design, and software, are the exclusive property of Hirebase and are protected by Indian and international copyright, trademark, and other intellectual property laws.</p>
          <p>You retain ownership of all content you submit to the Service (resumes, cover letters, profile information). By submitting content, you grant Hirebase a non-exclusive, royalty-free, worldwide license to use, store, and process your content solely to provide the Service to you.</p>

          <h2 className="text-xl font-bold mt-6 mb-2">8. Advertising</h2>
          <p>The Service may display advertisements served by third-party advertising networks, including Google AdSense. Advertisers may use cookies and similar technologies to serve relevant ads. Your interaction with advertisements is governed by the respective advertiser&rsquo;s terms and privacy policy.</p>
          <p>Hirebase is not responsible for the content of third-party advertisements or the products/services advertised.</p>

          <h2 className="text-xl font-bold mt-6 mb-2">9. Disclaimer of Warranties</h2>
          <p>The Service is provided on an &ldquo;AS IS&rdquo; and &ldquo;AS AVAILABLE&rdquo; basis without warranties of any kind, either express or implied, including but not limited to:</p>
          <ul className="list-disc ml-6 space-y-1">
            <li>Merchantability or fitness for a particular purpose.</li>
            <li>That the Service will be uninterrupted, secure, or error-free.</li>
            <li>That job listings are accurate, current, or complete.</li>
            <li>That AI tool outputs are accurate, reliable, or suitable for your specific situation.</li>
            <li>That you will receive interviews or job offers as a result of using the Service.</li>
          </ul>

          <h2 className="text-xl font-bold mt-6 mb-2">10. Limitation of Liability</h2>
          <p>To the maximum extent permitted by law, Hirebase and its operators shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including without limitation:</p>
          <ul className="list-disc ml-6 space-y-1">
            <li>Loss of profits, data, or business opportunities.</li>
            <li>Failure to obtain employment or interview calls.</li>
            <li>Damage to your device or data.</li>
            <li>Actions taken based on AI tool outputs.</li>
          </ul>
          <p>Our total liability for any claim arising out of or relating to the Service shall not exceed the amount you paid to us in the 6 months preceding the event giving rise to the claim.</p>

          <h2 className="text-xl font-bold mt-6 mb-2">11. Indemnification</h2>
          <p>You agree to indemnify and hold harmless Hirebase and its operators from any claims, damages, liabilities, costs, and expenses (including reasonable attorneys&rsquo; fees) arising from:</p>
          <ul className="list-disc ml-6 space-y-1">
            <li>Your use of the Service.</li>
            <li>Your violation of these Terms.</li>
            <li>Your violation of any third-party rights (including employers&rsquo; rights).</li>
            <li>Content you submit to the Service.</li>
          </ul>

          <h2 className="text-xl font-bold mt-6 mb-2">12. Termination</h2>
          <p>We may terminate or suspend your account and access to the Service at our sole discretion, without notice, for:</p>
          <ul className="list-disc ml-6 space-y-1">
            <li>Violation of these Terms.</li>
            <li>Fraudulent or abusive behavior.</li>
            <li>Non-payment of subscription fees.</li>
            <li>Inactivity for more than 24 months.</li>
          </ul>
          <p>You may terminate your account at any time by emailing <a href="mailto:contact@hirebase.in" className="text-primary hover:underline">contact@hirebase.in</a>. Upon termination, your right to use the Service ceases immediately.</p>

          <h2 className="text-xl font-bold mt-6 mb-2">13. Governing Law</h2>
          <p>These Terms are governed by and construed in accordance with the laws of India. Any disputes arising out of or relating to these Terms shall be subject to the exclusive jurisdiction of the courts of Bengaluru, Karnataka, India.</p>

          <h2 className="text-xl font-bold mt-6 mb-2">14. Changes to These Terms</h2>
          <p>We reserve the right to modify these Terms at any time. We will notify users of significant changes by email 30 days before they take effect. Continued use of the Service after the effective date constitutes acceptance of the revised Terms.</p>

          <h2 className="text-xl font-bold mt-6 mb-2">15. Severability</h2>
          <p>If any provision of these Terms is held to be unenforceable or invalid, that provision will be limited or eliminated to the minimum extent necessary, and the remaining provisions will remain in full force and effect.</p>

          <h2 className="text-xl font-bold mt-6 mb-2">16. Contact Us</h2>
          <p>If you have questions about these Terms, please contact:</p>
          <ul className="list-none ml-4 space-y-1">
            <li><strong>Hirebase</strong></li>
            <li>Email: <a href="mailto:contact@hirebase.in" className="text-primary hover:underline">contact@hirebase.in</a></li>
            <li>Contact page: <a href="/contact" className="text-primary hover:underline">/contact</a></li>
          </ul>
        </div>
      </article>
    </SiteShell>
  )
}
