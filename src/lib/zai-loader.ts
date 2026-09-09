// Shared ZAI loader — works in both sandbox (uses /etc/.z-ai-config) and Vercel
// (uses the .z-ai-config file committed to the repo, found via multiple paths).
import ZAI from 'z-ai-web-dev-sdk'
import fs from 'fs'
import path from 'path'

let zaiInstance: any = null

export async function getZai() {
  if (zaiInstance) return zaiInstance

  // Try the standard ZAI.create() first (works in sandbox where .z-ai-config
  // is at /etc/.z-ai-config, which is one of the SDK's default search paths).
  try {
    zaiInstance = await ZAI.create()
    return zaiInstance
  } catch (e) {
    // Fall through to manual loading
  }

  // Vercel fallback: the SDK can't find .z-ai-config because process.cwd() and
  // os.homedir() point to different places. We manually search a few likely
  // paths and construct the ZAI instance directly.
  const possiblePaths = [
    path.join(process.cwd(), '.z-ai-config'),
    // Serverless function output dir on Vercel
    path.join(process.cwd(), 'api', '.z-ai-config'),
    // When bundled, __dirname might be deep in /var/task/.next/server/
    path.join(__dirname, '..', '..', '..', '..', '.z-ai-config'),
    path.join(__dirname, '..', '..', '..', '..', '..', '.z-ai-config'),
    '/etc/.z-ai-config',
  ]

  for (const p of possiblePaths) {
    try {
      const configStr = fs.readFileSync(p, 'utf-8')
      const config = JSON.parse(configStr)
      if (config.baseUrl && config.apiKey) {
        const ZAIDefault = (ZAI as any).default || ZAI
        zaiInstance = new ZAIDefault(config)
        return zaiInstance
      }
    } catch {
      // Try next path
    }
  }

  throw new Error(
    'Could not initialize z-ai-web-dev-sdk. .z-ai-config not found in any of: ' +
      possiblePaths.join(', ')
  )
}
