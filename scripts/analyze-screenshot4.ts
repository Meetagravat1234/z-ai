import ZAI from 'z-ai-web-dev-sdk'
import fs from 'fs'

async function main() {
  const zai = await ZAI.create()
  const imgPath = '/home/z/my-project/upload/pasted_image_1790277241995.png'
  const buf = fs.readFileSync(imgPath)
  const b64 = buf.toString('base64')

  const response = await zai.chat.completions.createVision({
    messages: [
      {
        role: 'user',
        content: [
          { type: 'text', text: 'This is a screenshot of a resume template selection page. Please describe: 1) What the template gallery looks like — how many template cards are visible, what they show. 2) Are the template previews showing actual resume mockups (with name, sections, bullet points) or just colored cards with emojis? 3) Does the layout look professional or basic? 4) What specific improvements would make the template previews look like a real resume template gallery (like Canva or Novoresume)? Quote exact text where possible.' },
          { type: 'image_url', image_url: { url: `data:image/png;base64,${b64}` } },
        ],
      },
    ],
    thinking: { type: 'disabled' },
  })

  console.log(response.choices[0]?.message?.content || '(no content)')
}

main().catch((e) => { console.error('ERROR:', e); process.exit(1) })
