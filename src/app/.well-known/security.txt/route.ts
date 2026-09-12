import { NextResponse } from 'next/server'

// GET /.well-known/security.txt — security vulnerability reporting channel
// https://securitytxt.org/
export async function GET() {
  const body = `Contact: mailto:contact@hirebase.in
Expires: 2027-09-12T00:00:00.000Z
Preferred-Languages: en
Canonical: https://www.hirebase.in/.well-known/security.txt
Policy: https://www.hirebase.in/terms
`
  return new NextResponse(body, { headers: { 'Content-Type': 'text/plain' } })
}
