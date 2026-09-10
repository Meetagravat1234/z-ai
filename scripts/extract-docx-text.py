"""Extract text from docx in document order, preserving headings, bullets, and tables."""
from docx import Document
from docx.text.paragraph import Paragraph
from docx.table import Table

d = Document('/home/z/my-project/download/Hirebase_SEO_Action_Plan.docx')

print('=' * 70)
print('HIREBASE - SEO ACTION PLAN & FEATURE ROADMAP')
print('=' * 70)
print()

body = d.element.body
for child in body.iterchildren():
    tag = child.tag.split('}')[-1]
    if tag == 'p':
        p = Paragraph(child, d)
        text = p.text.strip()
        if not text:
            continue
        style_name = p.style.name if p.style else ''
        if 'Heading 1' in style_name or 'Title' in style_name:
            print()
            print('# ' + text)
            print('=' * 70)
        elif 'Heading 2' in style_name:
            print()
            print('## ' + text)
            print('-' * 50)
        elif 'Heading 3' in style_name:
            print()
            print('### ' + text)
        elif 'List Bullet' in style_name:
            print('  * ' + text)
        elif 'List Number' in style_name:
            print('  ' + text)
        else:
            print(text)
        print()
    elif tag == 'tbl':
        t = Table(child, d)
        print()
        print('[TABLE]')
        for row in t.rows:
            cells = [c.text.strip().replace('\n', ' / ') for c in row.cells]
            print('  | ' + ' | '.join(cells) + ' |')
        print('[/TABLE]')
        print()
