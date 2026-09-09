import { NextResponse } from 'next/server'
import { getZai } from '@/lib/zai-loader'
import fs from 'fs'
import path from 'path'

export async function GET() {
  const results: any = {
    timestamp: new Date().toISOString(),
    cwd: process.cwd(),
    homedir: require('os').homedir(),
    nodeVersion: process.version,
    vercelUrl: process.env.VERCEL_URL || null,
  }

  // Check which config paths exist
  const possiblePaths = [
    path.join(process.cwd(), '.z-ai-config'),
    path.join(__dirname, '..', '..', '..', '..', '.z-ai-config'),
    path.join(__dirname, '..', '..', '..', '..', '..', '.z-ai-config'),
    '/etc/.z-ai-config',
  ]
  results.configPaths = possiblePaths.map(p => ({ path: p, exists: fs.existsSync(p) }))

  // Try to initialize ZAI
  try {
    const zai = await getZai()
    results.zaiInitialized = true
    
    // Try a minimal chat completion
    try {
      const r = await zai.chat.completions.create({
        messages: [{ role: 'user', content: 'Say OK' }],
        thinking: { type: 'disabled' },
      })
      results.chatTest = 'success'
      results.chatResponse = r.choices[0]?.message?.content?.slice(0, 50)
    } catch (e: any) {
      results.chatTest = 'failed'
      results.chatError = e.message.slice(0, 200)
    }

    // Try web_search function
    try {
      const searchResults = await zai.functions.invoke('web_search', {
        query: 'software engineer jobs India',
        num: 2,
      })
      results.webSearchTest = 'success'
      results.webSearchResults = Array.isArray(searchResults) ? searchResults.length : typeof searchResults
    } catch (e: any) {
      results.webSearchTest = 'failed'
      results.webSearchError = e.message.slice(0, 200)
    }

  } catch (e: any) {
    results.zaiInitialized = false
    results.zaiError = e.message.slice(0, 300)
  }

  return NextResponse.json(results, { status: 200 })
}
