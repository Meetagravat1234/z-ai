import ZAI from 'z-ai-web-dev-sdk'
import fs from 'fs'

async function main() {
  const zai = await ZAI.create()
  const imgPath = '/home/z/my-project/upload/pasted_image_1790101001351.png'
  const buf = fs.readFileSync(imgPath)
  const b64 = buf.toString('base64')

  const response = await zai.chat.completions.createVision({
    messages: [
      {
        role: 'user',
        content: [
          { type: 'text', text: 'This is a screenshot of an admin dashboard "Bulk Fetch" tab. Please describe IN DETAIL what you see, including: 1) Any visible status text or labels (especially "Processing" or "Completed" badges), 2) The progress bar state (e.g. 0%, 50%, 100%), 3) The numbers shown for Total, Processed, Saved, Duplicates, Errors, 4) Any visible URL list (statuses of individual URLs - pending, processing, saved, error), 5) Any error messages or toast notifications, 6) Button labels visible (Process now, Recover stuck, Cancel batch, etc.), 7) The job ID and creation timestamp if shown. Be thorough and quote exact text where possible.' },
          { type: 'image_url', image_url: { url: `data:image/png;base64,${b64}` } },
        ],
      },
    ],
    thinking: { type: 'disabled' },
  })

  console.log(response.choices[0]?.message?.content || '(no content)')
}

main().catch((e) => { console.error('ERROR:', e); process.exit(1) })
