import ZAI from 'z-ai-web-dev-sdk'
import fs from 'fs'

async function main() {
  const zai = await ZAI.create()
  const imgPath = '/home/z/my-project/upload/pasted_image_1790104501043.png'
  const buf = fs.readFileSync(imgPath)
  const b64 = buf.toString('base64')

  const response = await zai.chat.completions.createVision({
    messages: [
      {
        role: 'user',
        content: [
          { type: 'text', text: 'This is a screenshot of an admin dashboard Bulk Fetch tab. Please describe in detail: 1) The job status badge visible (Processing/Queued/Completed/Cancelled), 2) The progress bar percentage, 3) The numbers shown for Total/Processed/Saved/Duplicates/Errors, 4) For each visible URL row - what is the status icon and status text shown (Pending/Processing.../Saved/Duplicate/Error), 5) Any error messages visible, 6) The job ID and creation timestamp. Quote exact text.' },
          { type: 'image_url', image_url: { url: `data:image/png;base64,${b64}` } },
        ],
      },
    ],
    thinking: { type: 'disabled' },
  })

  console.log(response.choices[0]?.message?.content || '(no content)')
}

main().catch((e) => { console.error('ERROR:', e); process.exit(1) })
