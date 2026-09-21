import { NextResponse } from 'next/server'
import { getZai } from '@/lib/zai-loader'
import fs from 'fs'
import path from 'path'

export async function GET() {
  const results: any = {
    timestamp: new Date().toISOString(),
    cwd: process.cwd(),
    nodeVersion: process.version,
  }

  // Check config
  const configPath = path.join(process.cwd(), '.z-ai-config')
  results.configExists = fs.existsSync(configPath)
  if (results.configExists) {
    try {
      const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'))
      results.configBaseUrl = config.baseUrl
      results.hasApiKey = !!config.apiKey
    } catch (e: any) {
      results.configError = e.message
    }
  }

  // Test 1: Raw fetch to z-ai API (bypassing the SDK)
  try {
    const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'))
    const testUrl = config.baseUrl + '/chat/completions'
    results.testUrl = testUrl
    
    const response = await fetch(testUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`,
        'X-Z-AI-From': 'Z',
      },
      body: JSON.stringify({
        messages: [{ role: 'user', content: 'Say OK' }],
        thinking: { type: 'disabled' },
      }),
      signal: AbortSignal.timeout(15000),
    })
    results.rawFetchStatus = response.status
    results.rawFetchOk = response.ok
    if (response.ok) {
      const data = await response.json()
      results.rawFetchResponse = JSON.stringify(data).slice(0, 200)
    } else {
      results.rawFetchError = (await response.text()).slice(0, 200)
    }
  } catch (e: any) {
    results.rawFetchError = e.message
    results.rawFetchErrorName = e.name
    results.rawFetchCause = e.cause?.message || e.cause?.code || null
  }

  // Test 2: DNS resolution of the API host
  try {
    const dns = await import('dns').then(m => m.promises)
    const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'))
    const url = new URL(config.baseUrl)
    const addresses = await dns.resolve4(url.hostname)
    results.dnsResolved = addresses
  } catch (e: any) {
    results.dnsError = e.message
  }

  return NextResponse.json(results, { status: 200 })
}
