"""
Replace AdGateModal with ProUpsellModal in all AI views + download buttons.
Removes the ad-token retry logic and simplifies to: quota exhausted → show Pro upsell.
"""
import re
from pathlib import Path

FILES = [
    'src/components/views/ai-resume-view.tsx',
    'src/components/views/ai-cover-letter-view.tsx',
    'src/components/views/ats-score-view.tsx',
    'src/components/views/ai-mock-interview-view.tsx',
    'src/components/views/ai-salary-view.tsx',
    'src/components/views/skill-gap-view.tsx',
    'src/components/download-buttons.tsx',
]

BASE = '/home/z/my-project'

for fpath in FILES:
    full = Path(BASE) / fpath
    content = full.read_text()
    
    # 1. Replace <AdGateModal .../> with <ProUpsellModal .../>
    # AdGateModal props: open, tool, toolLabel, onClose, onAdWatched
    # ProUpsellModal props: open, toolLabel, used, limit, onClose
    
    # Match the AdGateModal JSX block (multiline)
    pattern = r'<AdGateModal\s+open=\{showAdGate\}\s+tool="[^"]*"\s+toolLabel="[^"]*"\s+onClose=\{handleAdGateClose\}\s+onAdWatched=\{handleAdWatched\}\s*/>'
    
    # We need to know the toolLabel for each file
    tool_labels = {
        'ai-resume-view.tsx': 'AI Resume Optimizer',
        'ai-cover-letter-view.tsx': 'AI Cover Letter',
        'ats-score-view.tsx': 'ATS Score Checker',
        'ai-mock-interview-view.tsx': 'AI Mock Interview',
        'ai-salary-view.tsx': 'Salary Predictor',
        'skill-gap-view.tsx': 'Skill Gap Analyzer',
        'download-buttons.tsx': 'Download',
    }
    
    fname = fpath.split('/')[-1]
    label = tool_labels.get(fname, 'this tool')
    
    replacement = f'''<ProUpsellModal
        open={{showAdGate}}
        toolLabel="{label}"
        used={{1}}
        limit={{1}}
        onClose={{handleAdGateClose}}
      />'''
    
    content = re.sub(pattern, replacement, content)
    
    # 2. Replace the component name in JSX (if not already replaced)
    content = content.replace('<AdGateModal', '<ProUpsellModal')
    
    # 3. Remove handleAdWatched function (no longer needed — no ad-token retry)
    # Match: async function handleAdWatched(token: string) { ... }
    # This is tricky because it can span multiple lines
    # Let's just replace the function body to be a no-op
    content = re.sub(
        r'async function handleAdWatched\(token: string\) \{[^}]*\}',
        'async function handleAdWatched(token: string) { setShowAdGate(false) }',
        content
    )
    
    # 4. Rename showAdGate state variable to showUpsell for clarity
    # Actually, let's keep showAdGate to minimize changes — it still works
    
    full.write_text(content)
    print(f'Updated: {fpath}')

print('\nDone.')
