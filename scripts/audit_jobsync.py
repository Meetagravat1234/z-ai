import sqlite3
conn = sqlite3.connect('/home/z/my-project/db/custom.db')
conn.row_factory = sqlite3.Row
cur = conn.cursor()

# Schema of JobSync
cur.execute("PRAGMA table_info(JobSync)")
print('=== JobSync schema ===')
for r in cur.fetchall():
    print(f"  {r['name']:15} {r['type']:15} nullable={r['notnull']==0}")

print()
cur.execute("SELECT COUNT(*) AS n FROM JobSync")
print(f'Total JobSync rows: {cur.fetchone()["n"]}')

# Status breakdown
print('\n=== Status breakdown ===')
cur.execute("SELECT status, COUNT(*) AS n FROM JobSync GROUP BY status")
for r in cur.fetchall():
    print(f"  {r['status']:12} {r['n']}")

# Source breakdown
print('\n=== Source breakdown (all-time) ===')
cur.execute("SELECT source, COUNT(*) AS n, SUM(jobsAdded) AS added, SUM(jobsFound) AS found FROM JobSync GROUP BY source ORDER BY n DESC")
for r in cur.fetchall():
    print(f"  {r['source']:18} runs={r['n']:4}  jobsFound={r['found'] or 0:6}  jobsAdded={r['added'] or 0:6}")

# Recent 25 syncs
print('\n=== 25 most recent syncs ===')
cur.execute("SELECT startedAt, finishedAt, source, sourceParam, status, jobsFound, jobsAdded, jobsSkipped, error, durationMs FROM JobSync ORDER BY startedAt DESC LIMIT 25")
for r in cur.fetchall():
    sa = str(r['startedAt']) if r['startedAt'] is not None else ''
    sp = str(r['sourceParam']) if r['sourceParam'] is not None else ''
    er = str(r['error']) if r['error'] is not None else ''
    print(f"  {sa[:19]}  {str(r['status']):8}  {str(r['source']):18}  param={sp[:25]:25}  found={r['jobsFound']:3}  added={r['jobsAdded']:3}  skip={r['jobsSkipped']:3}  dur={r['durationMs'] or 0}ms  err={er[:40]}")

# Date range
print('\n=== Date range ===')
cur.execute("SELECT MIN(startedAt) AS first, MAX(startedAt) AS last FROM JobSync")
row = cur.fetchone()
print(f"  First sync: {row['first']}")
print(f"  Last sync:  {row['last']}")

# Success rate overall
print('\n=== Overall success rate ===')
cur.execute("SELECT COUNT(*) AS total, SUM(CASE WHEN status='success' THEN 1 ELSE 0 END) AS success, SUM(CASE WHEN status='error' THEN 1 ELSE 0 END) AS err, SUM(CASE WHEN status='running' THEN 1 ELSE 0 END) AS running FROM JobSync")
row = cur.fetchone()
total, succ, err, runn = row['total'], row['success'], row['err'], row['running']
print(f"  total={total}  success={succ}  error={err}  running={runn}")
if total:
    print(f"  success rate: {succ/total*100:.1f}%   error rate: {err/total*100:.1f}%")

# Last 7 days success rate
print('\n=== Last 7 days success rate ===')
cur.execute("SELECT COUNT(*) AS total, SUM(CASE WHEN status='success' THEN 1 ELSE 0 END) AS success, SUM(CASE WHEN status='error' THEN 1 ELSE 0 END) AS err FROM JobSync WHERE startedAt >= datetime('now', '-7 days')")
row = cur.fetchone()
total, succ, err = row['total'], row['success'], row['err']
print(f"  total={total}  success={succ}  error={err}")
if total:
    print(f"  success rate: {succ/total*100:.1f}%   error rate: {err/total*100:.1f}%")

# Total jobs in DB
print('\n=== Job table ===')
cur.execute("SELECT COUNT(*) FROM Job")
print(f"  Total jobs: {cur.fetchone()[0]}")
cur.execute("SELECT source, COUNT(*) AS n FROM Job GROUP BY source ORDER BY n DESC")
print("  By source:")
for r in cur.fetchall():
    print(f"    {r[0]:18} {r[1]}")

# Errors sample
print('\n=== Sample of recent error messages ===')
cur.execute("SELECT startedAt, source, sourceParam, error FROM JobSync WHERE status='error' ORDER BY startedAt DESC LIMIT 10")
for r in cur.fetchall():
    sa = str(r['startedAt']) if r['startedAt'] is not None else ''
    er = str(r['error']) if r['error'] is not None else ''
    print(f"  {sa[:19]}  {str(r['source']):15}  err={er[:80]}")

conn.close()
