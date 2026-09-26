import ZAI from 'z-ai-web-dev-sdk'
import fs from 'fs'

async function main() {
  const zai = await ZAI.create()
  const imgPath = '/home/z/my-project/upload/pasted_image_1790430665751.jpg'
  const buf = fs.readFileSync(imgPath)
  const b64 = buf.toString('base64')

  const response = await zai.chat.completions.createVision({
    messages: [
      {
        role: 'user',
        content: [
          { type: 'text', text: 'This is a screenshot of a website viewed on mobile. Please describe in detail: 1) What page is this (homepage, jobs list, job detail, etc.)? 2) What UI issues do you see — is the layout broken, is text cut off, are buttons too small, is there too much empty space, is the sidebar visible? 3) Is the content readable on mobile? 4) What specific improvements would make this look better on mobile? Quote exact text where possible. Be very specific about layout issues.' },
          { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${b64}` } },
        ],
      },
    ],
    thinking: { type: 'disabled' },
  })

  console.log(response.choices[0]?.message?.content || '(no content)')
}

main().catch((e) => { console.error('ERROR:', e); process.exit(1) })
