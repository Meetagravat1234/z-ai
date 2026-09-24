// Test the resume-optimize endpoint as admin user by getting a real session token
const ADMIN_EMAIL = 'admin@hirebase.in'
const ADMIN_PASSWORD = 'admin123'

async function main() {
  console.log('=== Step 1: Get CSRF token ===')
  const csrfRes = await fetch('https://www.hirebase.in/api/auth/csrf')
  const csrf = await csrfRes.json()
  console.log('  CSRF token:', csrf.csrfToken?.slice(0, 20) + '...')

  console.log('\n=== Step 2: Sign in via NextAuth credentials provider ===')
  const signInRes = await fetch('https://www.hirebase.in/api/auth/callback/credentials', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      csrfToken: csrf.csrfToken,
      callbackUrl: 'https://www.hirebase.in/',
      json: 'true',
    }),
    redirect: 'manual',
  })
  console.log('  Sign-in status:', signInRes.status)
  
  // The body may contain a URL with the session token in next-auth.callback-url cookie
  const body = await signInRes.text()
  console.log('  Body (first 200):', body.slice(0, 200))
  
  // Get the session cookie from Set-Cookie header
  const setCookie = signInRes.headers.get('set-cookie') || ''
  console.log('  Set-Cookie (first 200 chars):', setCookie.slice(0, 200))
  
  // Try to extract session token from cookie (multiple formats)
  const sessionMatch = setCookie.match(/next-auth\.session-token=([^;]+)/) 
    || setCookie.match(/__Secure-next-auth\.session-token=([^;]+)/)
  if (!sessionMatch) {
    console.log('  ❌ No session token received. Trying alternative approach...')
    // Try sending credentials with json=true and parsing JSON response
    const altSignInRes = await fetch('https://www.hirebase.in/api/auth/callback/credentials', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD,
        csrfToken: csrf.csrfToken,
        callbackUrl: 'https://www.hirebase.in/',
      }),
      redirect: 'manual',
    })
    const altSetCookie = altSignInRes.headers.get('set-cookie') || ''
    console.log('  Alt Set-Cookie (first 300):', altSetCookie.slice(0, 300))
    const altMatch = altSetCookie.match(/__Secure-next-auth\.session-token=([^;]+)/) || altSetCookie.match(/next-auth\.session-token=([^;]+)/)
    if (!altMatch) {
      console.log('  ❌ Still no session token')
      return
    }
    var sessionToken = altMatch[1]
  } else {
    var sessionToken = sessionMatch[1]
  }
  console.log('  ✅ Got session token:', sessionToken.slice(0, 30) + '...')

  console.log('\n=== Step 3: Verify session works ===')
  const meRes = await fetch('https://www.hirebase.in/api/auth/me', {
    headers: { Cookie: `next-auth.session-token=${sessionToken}` },
  })
  const me = await meRes.json()
  console.log('  User email:', me.user?.email)
  console.log('  User role:', me.user?.role)
  console.log('  Tier:', me.user?.subscriptionTier)

  console.log('\n=== Step 4: Call resume-optimize ===')
  const start = Date.now()
  const optimizeRes = await fetch('https://www.hirebase.in/api/ai/resume-optimize', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: `next-auth.session-token=${sessionToken}`,
    },
    body: JSON.stringify({
      resume: 'John Doe\nSoftware Engineer with 3 years experience in Python, React\nEmail: john@example.com',
      jobDescription: 'Software Engineer at Google. Requires Python, React, AWS. 3+ years experience.'
    }),
  })
  const elapsed = Date.now() - start
  console.log('  Status:', optimizeRes.status, '| time:', elapsed, 'ms')
  
  const d = await optimizeRes.json()
  if (optimizeRes.ok) {
    console.log('  ✅ Success! Result length:', d.result?.length || 0)
    console.log('  First 200 chars:', d.result?.slice(0, 200))
  } else {
    console.log('  ❌ Error:', d.error)
    console.log('  requiresUpgrade:', d.requiresUpgrade)
    console.log('  requiresAd:', d.requiresAd)
    console.log('  rateLimited:', d.rateLimited)
  }
}

main().catch(e => console.error('ERROR:', e.message))
