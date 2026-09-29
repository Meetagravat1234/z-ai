import ZAI from 'z-ai-web-dev-sdk'
import fs from 'fs'

async function main() {
  const zai = await ZAI.create()
  const imgPath = '/home/z/my-project/upload/pasted_image_1790663168039.png'
  const buf = fs.readFileSync(imgPath)
  const b64 = buf.toString('base64')

  const response = await zai.chat.completions.createVision({
    messages: [
      {
        role: 'user',
        content: [
          { type: 'text', text: 'This is a screenshot of the Vercel Analytics dashboard showing resource usage. Please describe in detail: 1) What metrics are shown (ISR Writes, Fluid Active CPU, Storage, etc.)? 2) What are the exact numbers for each metric (used vs limit)? 3) What is the time period shown (e.g., Last 30 days)? 4) Are there any warnings or errors visible? Quote exact text and numbers where possible.' },
          { type: 'image_url', image_url: { url: `data:image/png;base64,${b64}` } },
        ],
      },
    ],
    thinking: { type: 'disabled' },
  })

  console.log(response.choices[0]?.message?.content || '(no content)')
}

main().catch((e) => { console.error('ERROR:', e); process.exit(1) })
