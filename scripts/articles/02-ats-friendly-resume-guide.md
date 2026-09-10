## What is an ATS and why should you care?

An ATS (Applicant Tracking System) is software companies use to collect, sort, and filter job applications. When you apply to a job on a company's careers page or via Naukri, your resume typically goes through an ATS before any human recruiter sees it. Industry estimates suggest 75% of resumes are rejected by ATS before reaching a human — usually because of formatting issues, missing keywords, or unreadable content.

If you're applying to jobs in India in 2026 and your resume isn't ATS-friendly, you're playing with one hand tied behind your back. The good news: making your resume ATS-friendly isn't hard. This guide walks you through everything that matters.

## How ATS actually parses your resume

To make your resume ATS-friendly, you need to understand what an ATS does when it receives your application:

1. **Text extraction:** The ATS opens your file (PDF, DOCX, or sometimes HTML) and extracts plain text. If your resume uses complex formatting (columns, text boxes, embedded images, fancy fonts), text extraction can fail or produce garbage.
2. **Section detection:** The ATS looks for standard sections — Experience, Education, Skills, Summary. If you rename "Experience" to "My Journey", the ATS may not recognize it.
3. **Keyword matching:** The ATS compares extracted text to the job description. If the JD asks for "React" and your resume only mentions "ReactJS", some ATS may miss the match. Most modern ATS are case-insensitive and handle minor variations, but exact matches always rank higher.
4. **Scoring:** Based on keyword match + section completeness + experience relevance, the ATS assigns a score. Resumes below a threshold (often 60-70%) are auto-rejected.

## The 7 rules of ATS-friendly resumes

### Rule 1: Use a single-column layout

Multi-column layouts are the #1 ATS killer. When an ATS reads a 2-column resume, it often concatenates text from both columns in unpredictable order — turning your clean "Software Engineer, Google, 2022-2024" into "Google Software 2022 Engineer 2024". 

**What to do:** Use a single-column layout. Put your name + contact at the top, then Summary, Experience, Education, Skills in that order.

### Rule 2: Save as PDF (not DOCX, never PNG/JPG)

PDF is the universally accepted format that preserves layout while still being text-extractable. DOCX is acceptable but can shift layout depending on the recipient's Word version. PNG/JPG is a hard fail — ATS cannot extract text from images.

**What to do:** Save your resume as `Firstname-Lastname-Resume.pdf`. Keep the filename clean (no spaces, no special characters).

### Rule 3: Use standard section headings

ATS looks for these exact section names:
- Summary (or "Professional Summary")
- Experience (or "Work Experience", "Professional Experience")
- Education
- Skills
- Projects (optional but recommended for freshers)
- Certifications (optional)

Avoid creative names like "My Journey", "What I've Built", "Toolkit". Use the standard names.

### Rule 4: Use standard fonts at 10-12pt

Use Calibri, Arial, Helvetica, or Georgia. Avoid custom fonts, icon fonts (for skills — no Font Awesome icons next to React/Python/etc.), and overly decorative fonts. Body text should be 10-12pt; headings 14-16pt.

### Rule 5: No tables, text boxes, headers/footers

Many ATS cannot read content inside tables (treating each cell as a separate paragraph in random order), text boxes, or document headers/footers. Keep everything in the main body of the document.

**Common mistake:** Putting your contact info in the document header. Move it into the body of the resume.

### Rule 6: Use exact keywords from the job description

This is where most resumes lose points. If the job description says "React.js", use "React.js" (not just "React"). If it says "Python 3", mention "Python 3" specifically. If it says "Kubernetes", make sure "Kubernetes" appears verbatim — not just "k8s".

**Practical tip:** Print the job description. Highlight every technical skill mentioned. Then go through your resume and make sure each highlighted keyword appears at least once (in context, not stuffed).

### Rule 7: Date format consistency

Use a consistent date format throughout: `Month Year - Month Year` (e.g., "Jan 2022 - Present") or `MM/YYYY - MM/YYYY`. Avoid abbreviations like "Jan '22" — some ATS parse these poorly.

## The ideal ATS-friendly resume structure

Here's a structure that works for 95% of software engineering roles in India:

```
[Your Name]
[City, State] | [email] | [phone] | [LinkedIn URL] | [GitHub URL]

PROFESSIONAL SUMMARY
[2-3 lines: who you are, years of experience, primary tech stack, 1 standout achievement]

EXPERIENCE
[Company Name], [Location]
[Job Title] | [Start Month Year] - [End Month Year or "Present"]
- [Achievement 1 with metric: e.g., "Reduced API latency by 40% by implementing Redis caching"]
- [Achievement 2 with metric]
- [Achievement 3 with metric]

[Previous Company], [Location]
[Job Title] | [Dates]
- [Achievements...]

EDUCATION
[Degree], [Specialisation] | [College Name], [University]
[Graduation Year] | [CGPA if >= 8.0]

SKILLS
Languages: Python, JavaScript, TypeScript, Java
Frameworks: React, Node.js, Express, Django, Spring Boot
Databases: PostgreSQL, MongoDB, Redis
Cloud/DevOps: AWS (EC2, S3, Lambda), Docker, Kubernetes, CI/CD
Tools: Git, JIRA, Linux

PROJECTS (for freshers or if you have notable side projects)
[Project Name] | [Tech Stack] | [GitHub Link]
[1-2 line description with impact metric]
```

## Common ATS mistakes that get your resume rejected

### Mistake 1: Including a photo
Indian resumes often include a photo. ATS may try to extract text from the image and produce garbage. Remove the photo — it's also illegal for employers to require one in many jurisdictions.

### Mistake 2: Using icons for skills
"🌟 React | 🐍 Python | ☁️ AWS" — ATS sees "React", "Python", "AWS" if you're lucky, but the emoji characters can cause parsing errors. Use plain text: "React, Python, AWS".

### Mistake 3: Putting skills inside graphics
Designed resumes with skill bars (showing 4/5 stars for Python) look great to humans but are invisible to ATS. Always have a plain-text Skills section.

### Mistake 4: Tables for layout
Even invisible tables (no borders) cause ATS parsing issues. Use tabs or paragraph indentation instead.

### Mistake 5: Custom date formats
"Jan '22 - Present" → ATS may parse as "January 22" instead of "January 2022". Use "January 2022 - Present".

### Mistake 6: Abbreviations without context
"AWS" alone is fine, but if the JD says "Amazon Web Services", include both: "Amazon Web Services (AWS)". Same for "K8s" → "Kubernetes (K8s)".

## The 60-second ATS test

Before you submit your resume, run this quick test:

1. Open your resume PDF in a browser (Chrome/Firefox).
2. Press Ctrl+A (select all) then Ctrl+C (copy).
3. Paste into a plain text editor (Notepad on Windows, TextEdit on Mac set to plain text).
4. Read what came out. If it's mostly readable and in order — your resume is ATS-friendly. If sections are jumbled or skills are missing, you have work to do.

## Frequently asked questions

### How do I check if my resume is ATS-friendly?

Upload your resume to Hirebase's free [ATS Score Checker](/?view=ats-score) — it grades your resume 0-100 against ATS best practices and gives you specific fix recommendations. Most resumes score 50-70 on first try; after fixing, scores jump to 90+.

### What is the best resume format for ATS?

The best ATS-friendly resume format is a single-column, single-page (for <10 years experience) PDF with standard section headings (Experience, Education, Skills), 11pt Calibri/Arial font, no tables, no images, no graphics. Plain text content with clear bullet points starting with action verbs.

### Can ATS read PDF resumes?

Yes, modern ATS can read PDF resumes — PDF is actually the recommended format. Make sure the PDF is text-based (created from Word/Google Docs "Save as PDF"), not a scanned image. To verify: open the PDF and try to select text — if you can select individual words, it's ATS-readable. If the whole page selects as one block, it's an image and ATS will fail.

### Do ATS reject resumes with photos?

Yes, many ATS reject or downrank resumes with photos. Photos are graphic content that ATS cannot parse, and including one can also trigger anti-discrimination filters in some systems. The safer choice is always to omit the photo from your professional resume.

### How many keywords should I include in my resume?

Include every keyword from the job description that you genuinely have. Don't stuff keywords you don't actually know — recruiters will catch this in 30 seconds during the interview. Aim for a 70-80% match between your resume's skills section and the JD's required skills list.

## Ready to make your resume ATS-friendly?

**Step 1:** Run your resume through our free [ATS Score Checker](/?view=ats-score) — get a 0-100 score in 30 seconds.

**Step 2:** Use our [AI Resume Optimizer](/?view=ai-resume) to automatically tailor your resume to any specific job description. The AI rewrites sections, adds missing keywords, and reformats for ATS compatibility.

**Step 3:** Apply to [verified software engineer jobs](/roles/software-engineer) on Hirebase — every listing shows the exact skills the employer is filtering for.

Want to take it further? Read our complete [Software Engineer Salary in Bengaluru guide](/insights/software-engineer-salary-bengaluru-2026) to know exactly what to negotiate for once your resume gets shortlisted.
