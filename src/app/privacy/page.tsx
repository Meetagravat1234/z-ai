import { SiteShell } from '@/components/layout/site-shell'
import type { Metadata } from 'next'

export const dynamic = 'force-static'
export const revalidate = 86400 // 1 day

export const metadata: Metadata = {
  title: 'Privacy Policy | Hirebase',
  description:
    'Hirebase Privacy Policy — how we collect, use, store, and protect your personal data. GDPR + IT Act 2000 compliant.',
  alternates: { canonical: 'https://www.hirebase.in/privacy' },
  robots: { index: true, follow: true },
}

const lastUpdated = '10 September 2026'

export default function PrivacyPolicyPage() {
  return (
    <SiteShell>
      <article className="max-w-3xl mx-auto pb-12">
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">Privacy Policy</h1>
        <p className="mt-2 text-sm text-muted-foreground">Last updated: {lastUpdated}</p>

        <div className="prose prose-sm dark:prose-invert max-w-none mt-8 space-y-4 text-foreground/90">
          <p className="text-base">
            Hirebase (&ldquo;we&rdquo;, &ldquo;our&rdquo;, &ldquo;us&rdquo;) operates the website{' '}
            <a href="https://www.hirebase.in" className="text-primary hover:underline">https://www.hirebase.in</a>{' '}
            (the &ldquo;Service&rdquo;). This Privacy Policy explains how we collect, use, disclose, and safeguard your
            information when you use our Service. By using Hirebase, you consent to the practices described in this
            policy.
          </p>

          <h2 className="text-xl font-bold mt-6 mb-2">1. Information We Collect</h2>
          <p>We collect information in three ways:</p>
          <h3 className="font-semibold mt-3 mb-1">1.1 Information you provide directly</h3>
          <ul className="list-disc ml-6 space-y-1">
            <li><strong>Account information:</strong> name, email address, and password (hashed) when you sign up.</li>
            <li><strong>Profile information:</strong> target role, current skills, experience level, preferred location, and resume file when you upload it.</li>
            <li><strong>Job preferences:</strong> saved jobs, application tracker data, job alert preferences.</li>
            <li><strong>Payment information:</strong> when you upgrade to Pro, Razorpay (our payment processor) handles your card/UPI details — we never see or store your full card number.</li>
            <li><strong>Communications:</strong> any emails or messages you send to us.</li>
          </ul>

          <h3 className="font-semibold mt-3 mb-1">1.2 Information collected automatically</h3>
          <ul className="list-disc ml-6 space-y-1">
            <li><strong>Usage data:</strong> pages visited, time spent, clicks, job listings viewed, search queries used.</li>
            <li><strong>Device information:</strong> IP address, browser type, operating system, screen resolution, device type.</li>
            <li><strong>Cookies and similar technologies:</strong> session cookies for authentication, analytics cookies (Google Analytics 4) for understanding traffic.</li>
          </ul>

          <h3 className="font-semibold mt-3 mb-1">1.3 Information from third parties</h3>
          <ul className="list-disc ml-6 space-y-1">
            <li><strong>Job listings:</strong> job data is aggregated from public APIs (Greenhouse, Ashby, Remotive, Arbeitnow, The Muse, RemoteOK, We Work Remotely) and public career pages. We do not collect personal data from these sources.</li>
            <li><strong>Authentication:</strong> if you sign in via Google, we receive your name, email, and profile picture (basic OAuth scope only).</li>
          </ul>

          <h2 className="text-xl font-bold mt-6 mb-2">2. How We Use Your Information</h2>
          <ul className="list-disc ml-6 space-y-1">
            <li>To provide, operate, and maintain the Service (account, job browsing, AI tools, application tracker).</li>
            <li>To send you email job alerts when you opt in (you can unsubscribe at any time).</li>
            <li>To personalize content and recommendations (e.g., AI Job Match Score, recommended jobs).</li>
            <li>To process payments for Pro subscriptions via Razorpay.</li>
            <li>To detect, prevent, and address technical issues, fraud, and security violations.</li>
            <li>To comply with legal obligations under the Indian Information Technology Act, 2000 and applicable data protection rules.</li>
            <li>To send service-related announcements (e.g., policy changes) — rare, only when legally required.</li>
          </ul>

          <h2 className="text-xl font-bold mt-6 mb-2">3. Cookies and Tracking Technologies</h2>
          <p>We use the following types of cookies:</p>
          <ul className="list-disc ml-6 space-y-1">
            <li><strong>Essential cookies:</strong> required for login, session management, and core functionality. The Service does not work without these.</li>
            <li><strong>Analytics cookies:</strong> Google Analytics 4 to understand how users interact with the Service. Data is anonymized and aggregated.</li>
            <li><strong>Advertising cookies:</strong> Google AdSense may use cookies to serve ads based on your prior visits to our website or other websites. You can opt out of personalized advertising by visiting <a href="https://www.google.com/settings/ads" className="text-primary hover:underline">Google Ads Settings</a>.</li>
          </ul>
          <p>You can control cookies through your browser settings. Disabling essential cookies will prevent you from logging in or using AI tools.</p>

          <h2 className="text-xl font-bold mt-6 mb-2">4. Third-Party Advertising</h2>
          <p className="font-semibold">Third-party vendors, including Google, use cookies to serve ads based on a user&rsquo;s prior visits to our website or other websites.</p>
          <p>Google&rsquo;s use of advertising cookies enables it and its partners to serve ads to you based on your visit to our site and/or other sites on the Internet.</p>
          <p>You may opt out of personalised advertising by visiting <a href="https://www.google.com/settings/ads" className="text-primary hover:underline">Google Ads Settings</a>. You can also opt out of a third-party vendor&rsquo;s use of cookies for personalised advertising by visiting <a href="https://www.aboutads.info" className="text-primary hover:underline">www.aboutads.info</a>.</p>
          <p>We do not share personally identifiable information with advertisers. Advertisers receive only aggregated, anonymized data.</p>

          <h2 className="text-xl font-bold mt-6 mb-2">5. Data Sharing and Disclosure</h2>
          <p>We do <strong>not</strong> sell your personal data. We may share data only in these circumstances:</p>
          <ul className="list-disc ml-6 space-y-1">
            <li><strong>Service providers:</strong> Razorpay (payments), Google Analytics (analytics), Google AdSense (ads), Resend/SendGrid (transactional email). These providers process data only on our behalf and under contractual obligations.</li>
            <li><strong>Legal compliance:</strong> if required by law, court order, or government request, we may disclose data to Indian authorities under the IT Act, 2000 and applicable rules.</li>
            <li><strong>Business transfers:</strong> in the event of a merger, acquisition, or asset sale, user data may be transferred. We will notify you via email 30 days before any transfer.</li>
            <li><strong>With your consent:</strong> we may share data with third parties when you explicitly consent.</li>
          </ul>

          <h2 className="text-xl font-bold mt-6 mb-2">6. Data Security</h2>
          <p>We implement industry-standard security measures to protect your data:</p>
          <ul className="list-disc ml-6 space-y-1">
            <li>Passwords are hashed using bcrypt — never stored in plain text.</li>
            <li>All data in transit is encrypted via HTTPS (TLS 1.3).</li>
            <li>Database access is restricted to authenticated application servers.</li>
            <li>Payment data never touches our servers — Razorpay handles it directly.</li>
            <li>Regular security audits of dependencies and access logs.</li>
          </ul>
          <p>Despite these measures, no internet transmission is 100% secure. We cannot guarantee absolute security, but we will notify affected users within 72 hours of any data breach.</p>

          <h2 className="text-xl font-bold mt-6 mb-2">7. Data Retention</h2>
          <p>We retain your data for as long as your account is active. If you delete your account, we will:</p>
          <ul className="list-disc ml-6 space-y-1">
            <li>Delete your profile, saved jobs, application tracker, and uploaded resumes within 30 days.</li>
            <li>Retain anonymized usage data (without identifiers) for analytics for up to 24 months.</li>
            <li>Retain transaction records (Pro subscription payments) for 7 years as required by Indian tax law.</li>
          </ul>

          <h2 className="text-xl font-bold mt-6 mb-2">8. Your Rights</h2>
          <p>Under Indian data protection rules and international frameworks like GDPR, you have the right to:</p>
          <ul className="list-disc ml-6 space-y-1">
            <li><strong>Access:</strong> request a copy of the personal data we hold about you.</li>
            <li><strong>Rectification:</strong> correct inaccurate or incomplete data.</li>
            <li><strong>Erasure:</strong> request deletion of your account and associated data.</li>
            <li><strong>Restriction:</strong> limit how we use your data (e.g., opt out of marketing emails).</li>
            <li><strong>Data portability:</strong> receive your data in a structured, machine-readable format.</li>
            <li><strong>Objection:</strong> object to processing based on legitimate interests.</li>
          </ul>
          <p>To exercise any of these rights, email <a href="mailto:privacy@hirebase.in" className="text-primary hover:underline">privacy@hirebase.in</a> with the subject &ldquo;Data Subject Request&rdquo;. We will respond within 30 days.</p>

          <h2 className="text-xl font-bold mt-6 mb-2">9. Children&rsquo;s Privacy</h2>
          <p>Our Service is not directed to individuals under the age of 18. We do not knowingly collect personal data from children. If you believe we have collected data from a child, please contact us and we will delete it immediately.</p>

          <h2 className="text-xl font-bold mt-6 mb-2">10. International Data Transfers</h2>
          <p>Your data is stored on servers located in India (Mumbai region) and Singapore. By using our Service, you consent to the transfer of your data to these jurisdictions, which may have different data protection laws than your country of residence.</p>

          <h2 className="text-xl font-bold mt-6 mb-2">11. Changes to This Policy</h2>
          <p>We may update this Privacy Policy from time to time. We will notify you of significant changes by email 30 days before they take effect. The &ldquo;Last updated&rdquo; date at the top of this page indicates when the policy was last revised.</p>

          <h2 className="text-xl font-bold mt-6 mb-2">12. Contact Us</h2>
          <p>If you have questions about this Privacy Policy, please contact:</p>
          <ul className="list-none ml-4 space-y-1">
            <li><strong>Hirebase</strong></li>
            <li>Email: <a href="mailto:privacy@hirebase.in" className="text-primary hover:underline">privacy@hirebase.in</a></li>
            <li>General inquiries: <a href="mailto:contact@hirebase.in" className="text-primary hover:underline">contact@hirebase.in</a></li>
            <li>Contact page: <a href="/contact" className="text-primary hover:underline">/contact</a></li>
          </ul>
        </div>
      </article>
    </SiteShell>
  )
}
