"""Update AI views to use useAICallWithAdGate hook."""
import re
from pathlib import Path

# Map of views to their config
VIEWS = [
    {
        'file': '/home/z/my-project/src/components/views/ai-salary-view.tsx',
        'api_url': '/api/ai/salary-predict',
        'tool': 'salaryPredictions',
        'tool_label': 'Salary Predictor',
        'fn_name': 'predict',
        'body_keys': ['role', 'company', 'location', 'experienceYears', 'skills'],
    },
    {
        'file': '/home/z/my-project/src/components/views/ats-score-view.tsx',
        'api_url': '/api/ai/ats-score',
        'tool': 'atsChecks',
        'tool_label': 'ATS Score Checker',
        'fn_name': 'check',
        'body_keys': ['resume', 'jobDescription'],
    },
    {
        'file': '/home/z/my-project/src/components/views/skill-gap-view.tsx',
        'api_url': '/api/ai/skill-gap',
        'tool': 'skillGapAnalyses',
        'tool_label': 'Skill Gap Analyzer',
        'fn_name': 'analyze',
        'body_keys': ['currentSkills', 'targetRole', 'experienceYears'],
    },
]

for view in VIEWS:
    fpath = Path(view['file'])
    content = fpath.read_text()
    
    # 1. Add import after the last existing import line (before the first 'export function')
    if 'useAICallWithAdGate' not in content:
        # Find the line with "export function" and inject import before it
        # Find the last import line before export function
        match = re.search(r"(import [^\n]+\n)(\n*export function )", content)
        if match:
            content = content[:match.end(1)] + "import { useAICallWithAdGate } from '@/lib/use-ai-call-with-ad-gate'\n" + content[match.end(1):]
    
    # 2. Add hook after the last useState line in the function
    # Pattern: const [state, setState] = React.useState(...)
    # We add after the last one before "async function"
    if 'useAICallWithAdGate()' not in content:
        # Find "async function" and inject hook before it
        match = re.search(r"(\s+)(async function " + view['fn_name'] + r")", content)
        if match:
            content = content[:match.start()] + match.group(1) + "const { call, adGateModal } = useAICallWithAdGate()\n" + match.group(1) + match.group(2) + content[match.end():]
    
    # 3. Replace the fetch call
    # Old pattern:
    #   const r = await fetch('/api/ai/...', {
    #     method: 'POST',
    #     headers: { 'Content-Type': 'application/json' },
    #     body: JSON.stringify({...}),
    #   })
    #   const d = await r.json()
    #   if (!r.ok) throw new Error(d.error || 'Request failed')
    #   setResult(d.result) or similar
    
    body_keys_str = ', '.join(view['body_keys'])
    
    # Use regex to match the fetch + json + ok check pattern
    fetch_pattern = re.compile(
        r"const r = await fetch\('" + re.escape(view['api_url']) + r"', \{\s*"
        r"method: 'POST',\s*"
        r"headers: \{ 'Content-Type': 'application/json' \},\s*"
        r"body: JSON\.stringify\(([^)]+)\),\s*"
        r"\}\)\s*"
        r"const d = await r\.json\(\)\s*"
        r"if \(!r\.ok\) throw new Error\(d\.error \|\| 'Request failed'\)",
        re.DOTALL
    )
    
    replacement = (
        f"const r = await call('{view['api_url']}', {{\n"
        f"        tool: '{view['tool']}',\n"
        f"        toolLabel: '{view['tool_label']}',\n"
        f"        body: {view['body_keys'][0] if len(view['body_keys']) == 1 else '{' + body_keys_str + '}'},\n"
        f"      }})\n"
        f"      if (!r.ok) throw new Error(r.error || 'Request failed')"
    )
    
    # Actually, the body is a JSON object — let's extract the original keys and keep them
    match = fetch_pattern.search(content)
    if match:
        # The body keys variable is the captured group — let's just use it
        body_content = match.group(1).strip()
        replacement = (
            f"const r = await call('{view['api_url']}', {{\n"
            f"        tool: '{view['tool']}',\n"
            f"        toolLabel: '{view['tool_label']}',\n"
            f"        body: {body_content},\n"
            f"      }})\n"
            f"      if (!r.ok) throw new Error(r.error || 'Request failed')"
        )
        content = content[:match.start()] + replacement + content[match.end():]
        
        # Now replace d.result with r.data.result
        # And d.<field> with r.data.<field>
        content = re.sub(r'\bd\.result\b', 'r.data.result', content)
        content = re.sub(r'\bd\.rawText\b', 'r.data.rawText', content)
        content = re.sub(r'\bd\.error\b', 'r.error', content)
    
    # 4. Add {adGateModal} before the last </div> inside the main return
    # Find the closing pattern of the main return
    # This is tricky — let's just add it before the last "    </div>\n  )\n}"
    if '{adGateModal}' not in content:
        # Match the closing of the main return: "      </div>\n    </div>\n  )\n}"
        # We want to inject {adGateModal} just before "    </div>\n  )"
        content = re.sub(
            r'(\s+)(</div>\s*\n)(\s*\)\s*\n\})',
            r'\1</div>\n\1  {adGateModal}\n\1</div>\n\3',
            content,
            count=1
        )
        # Simpler: just inject before the LAST "</div>" that comes before "  )\n}"
        # Actually let's use a simpler approach — find "  )\n}" (the closing of the function return)
        # And the </div> right before it
        pass
    
    fpath.write_text(content)
    print(f"Updated: {fpath}")

print("\nDone.")
