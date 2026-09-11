import { SiteShell } from '@/components/layout/site-shell'
import type { Metadata } from 'next'

export const dynamic = 'force-static'
export const revalidate = 86400

export const metadata: Metadata = {
  title: 'Disclaimer | Hirebase',
  description:
    'Hirebase disclaimer regarding job listings, AI tool outputs, third-party advertising, and external links.',
  alternates: { canonical: 'https://www.hirebase.in/disclaimer' },
  robots: { index: true, follow: true },
}

export default function DisclaimerPage() {
  return (
    <SiteShell>
      <article className="max-w-3xl mx-auto pb-12">
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">Disclaimer</h1>
        <p className="mt-2 text-sm text-muted-foreground">Last updated: 10 September 2026</p>

        <div className="prose prose-sm dark:prose-invert max-w-none mt-8 space-y-4 text-foreground/90">
          <p className="text-base">
            The information provided by Hirebase on <a href="https://www.hirebase.in" className="text-primary hover:underline">https://www.hirebase.in</a> is for general informational purposes only. All information is provided in good faith; however, we make no representation or warranty of any kind regarding the accuracy, adequacy, validity, reliability, or completeness of any information on the Service.
          </p>

          <h2 className="text-xl font-bold mt-6 mb-2">1. Job Listing Accuracy</h2>
          <p>Hirebase aggregates job listings from multiple public sources, including:</p>
          <ul className="list-disc ml-6 space-y-1">
            <li>Public job board APIs (Greenhouse, Ashby, Remotive, Arbeitnow, The Muse, RemoteOK, We Work Remotely)</li>
            <li>Employer career pages crawled via public web search</li>
            <li>Manually curated listings</li>
          </ul>
          <p>While we use AI enrichment to clean and structure this data, we cannot guarantee that:</p>
          <ul className="list-disc ml-6 space-y-1">
            <li>The job is still open when you apply (employers may close listings without notifying us).</li>
            <li>Salary ranges, required skills, or experience levels are accurate.</li>
            <li>The employer is legitimate (we recommend verifying on the employer&rsquo;s official website).</li>
            <li>The application link is current (URLs may expire or redirect).</li>
          </ul>
          <p>Always verify job details on the employer&rsquo;s official careers page before applying.</p>

          <h2 className="text-xl font-bold mt-6 mb-2">2. No Employment Guarantee</h2>
          <p>Hirebase is a job discovery platform. Using our Service does not guarantee:</p>
          <ul className="list-disc ml-6 space-y-1">
            <li>Interview calls from employers.</li>
            <li>Job offers or employment.</li>
            <li>Specific salary outcomes.</li>
            <li>Matching with any particular employer.</li>
          </ul>
          <p>Your employment outcomes depend on your skills, experience, interview performance, and the hiring decisions of employers — none of which Hirebase controls.</p>

          <h2 className="text-xl font-bold mt-6 mb-2">3. AI Tool Outputs</h2>
          <p>Our AI tools (Resume Optimizer, ATS Score Checker, Cover Letter Generator, Mock Interview, Skill Gap Analyzer, Salary Predictor, Job Match Score) use large language models that may produce:</p>
          <ul className="list-disc ml-6 space-y-1">
            <li>Inaccurate, biased, or outdated information.</li>
            <li>Suggestions that do not fit your specific situation.</li>
            <li>Generic content that may require editing before use.</li>
          </ul>
          <p>You are solely responsible for reviewing and editing AI-generated content before submitting it to any employer. Hirebase is not liable for any consequences arising from your use of AI tool outputs.</p>

          <h2 className="text-xl font-bold mt-6 mb-2">4. External Links Disclaimer</h2>
          <p>The Service may contain links to external websites that are not provided or maintained by Hirebase. We do not guarantee the accuracy, relevance, timeliness, or completeness of any information on these external websites.</p>
          <p>When you click an &ldquo;Apply&rdquo; button, you will be redirected to the employer&rsquo;s official website. Your interaction with that website is governed by the employer&rsquo;s terms and privacy policy — not ours.</p>

          <h2 className="text-xl font-bold mt-6 mb-2">5. Advertising Disclosure</h2>
          <p className="font-semibold">Hirebase displays third-party advertisements served by Google AdSense and other advertising networks.</p>
          <p>These advertisements:</p>
          <ul className="list-disc ml-6 space-y-1">
            <li>Are not endorsed by Hirebase unless explicitly stated.</li>
            <li>May use cookies to personalize ad content based on your browsing history.</li>
            <li>May link to third-party websites with their own terms and privacy policies.</li>
            <li>Do not influence our job listings, AI tool outputs, or editorial content.</li>
          </ul>
          <p>You can opt out of personalized advertising by visiting <a href="https://www.google.com/settings/ads" className="text-primary hover:underline">Google Ads Settings</a> or <a href="https://www.aboutads.info/choices/" className="text-primary hover:underline">aboutads.info/choices</a>.</p>

          <h2 className="text-xl font-bold mt-6 mb-2">6. Salary and Market Data</h2>
          <p>Salary ranges shown on Hirebase (in job listings, Salary Dashboard, Salary Predictor) are:</p>
          <ul className="list-disc ml-6 space-y-1">
            <li>Aggregated from public job listings and may not reflect the actual salary offered.</li>
            <li>Subject to negotiation, location, experience, and employer discretion.</li>
            <li>Provided as estimates only — do not make career decisions based solely on these numbers.</li>
          </ul>

          <h2 className="text-xl font-bold mt-6 mb-2">7. Professional Advice Disclaimer</h2>
          <p>The Service does not contain professional career advice, legal advice, financial advice, or any other type of professional advice. The AI tool outputs and blog articles are for general informational purposes only and are not a substitute for professional advice from a qualified career counselor, lawyer, or financial advisor.</p>

          <h2 className="text-xl font-bold mt-6 mb-2">8. Use at Your Own Risk</h2>
          <p>Your use of the Service is solely at your own risk. Hirebase, its operators, employees, and affiliates shall not be liable for any direct, indirect, incidental, consequential, or punitive damages arising from:</p>
          <ul className="list-disc ml-6 space-y-1">
            <li>Your use of or inability to use the Service.</li>
            <li>Job listings that are inaccurate, outdated, or fraudulent.</li>
            <li>AI tool outputs that lead to undesirable outcomes.</li>
            <li>Third-party advertisements or websites.</li>
            <li>Any unauthorized access to your account.</li>
          </ul>

          <h2 className="text-xl font-bold mt-6 mb-2">9. Reporting Inaccurate or Fraudulent Content</h2>
          <p>If you encounter:</p>
          <ul className="list-disc ml-6 space-y-1">
            <li>A fraudulent job listing (e.g., asking for payment, personal bank details, or excessive personal information).</li>
            <li>Outdated or expired job listings.</li>
            <li>Inaccurate salary information.</li>
            <li>Harmful or offensive AI tool outputs.</li>
          </ul>
          <p>Please report it immediately via our <a href="/contact" className="text-primary hover:underline">Contact page</a> or email <a href="mailto:contact@hirebase.in" className="text-primary hover:underline">contact@hirebase.in</a>. We will investigate and remove the content within 48 hours if it violates our policies.</p>

          <h2 className="text-xl font-bold mt-6 mb-2">10. Changes to This Disclaimer</h2>
          <p>We reserve the right to update this Disclaimer at any time. Changes will be effective immediately upon posting on this page. We encourage you to review this page periodically.</p>

          <h2 className="text-xl font-bold mt-6 mb-2">11. Contact Us</h2>
          <p>If you have any questions about this Disclaimer, please contact us:</p>
          <ul className="list-none ml-4 space-y-1">
            <li>Email: <a href="mailto:contact@hirebase.in" className="text-primary hover:underline">contact@hirebase.in</a></li>
            <li>Contact page: <a href="/contact" className="text-primary hover:underline">/contact</a></li>
          </ul>
        </div>
      </article>
    </SiteShell>
  )
}
