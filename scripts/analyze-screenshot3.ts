import ZAI from 'z-ai-web-dev-sdk'
import fs from 'fs'

async function main() {
  const zai = await ZAI.create()
  const imgPath = '/home/z/my-project/upload/pasted_image_1790106646819.png'
  const buf = fs.readFileSync(imgPath)
  const b64 = buf.toString('base64')

  const response = await zai.chat.completions.createVision({
    messages: [
      {
        role: 'user',
        content: [
          { type: 'text', text: 'Describe this screenshot of an admin dashboard Bulk Fetch tab. What status badges do you see? What numbers are shown for Total/Processed/Saved/Duplicates/Errors? Are URLs showing as Pending/Processing/Saved/Error? Quote exact text. Are there any error messages visible?' },
          { type: 'image_url', image_url: { url: `data:image/png;base64,${b64}` } },
        ],
      },
    ],
    thinking: { type: 'disabled' },
  })

  console.log(response.choices[0]?.message?.content || '(no content)')
}

main().catch((e) => { console.error('ERROR:', e); process.exit(1) })
