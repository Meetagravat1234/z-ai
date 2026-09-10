## Why the Amazon SDE interview is different

Amazon's software development engineer (SDE) interview is famously rigorous, but it's also one of the most predictable interviews in Big Tech. Unlike Google or Meta, which often test obscure algorithmic problems, Amazon tests a specific, well-documented set of skills — and even more importantly, they test your alignment with their 16 Leadership Principles.

If you're targeting an SDE-I (fresher), SDE-II (mid-level), or SDE-III (senior) role at Amazon India (Hyderabad, Bengaluru, or remote), this guide covers exactly what to expect, the real questions you'll face, and how to prepare.

## The Amazon SDE interview structure

A typical Amazon SDE interview process has 4-5 rounds:

### Round 1: Online Assessment (OA)

- **Duration:** 90 minutes
- **Format:** 2 coding problems + 1 leadership principles essay
- **Difficulty:** 1 medium + 1 hard LeetCode-style problem
- **Languages allowed:** Java, Python, C++, C, JavaScript, Go, Ruby, Kotlin, Scala, Swift
- **What they test:** DSA fluency + ability to write clean, working code under time pressure

**Common OA problem types:**
- Two-sum variants (medium)
- Sliding window problems (medium)
- Graph traversal (DFS/BFS with custom logic)
- Greedy scheduling (medium-hard)
- String parsing with state machine (hard)

### Round 2-4: Technical interviews (3 rounds)

- **Duration:** 45-60 minutes each
- **Format:** 1-2 DSA problems + system design basics (for SDE-II+) + leadership principles
- **What they test:** Problem-solving, coding, communication, behavioural fit

### Round 5: "Bar Raiser" round

- **Duration:** 60 minutes
- **Format:** Mostly behavioural (Leadership Principles deep-dive) + sometimes 1 light coding problem
- **What they test:** Whether you raise the Amazon "bar" — i.e., are you better than 50% of current Amazonians at your level?

The Bar Raiser round is the most under-appreciated. Many strong engineers fail here because they treat it as a casual chat. Prepare for it as seriously as you prepare for coding.

## The 16 Leadership Principles — what Amazon actually asks

Amazon's 16 Leadership Principles (LPs) are not HR fluff. Interviewers write down specific STAR-format stories you tell them, then score you against each LP. Here are the 6 LPs that come up most in SDE interviews, with sample questions:

### 1. Customer Obsession

**Sample questions:**
- "Tell me about a time you went above and beyond for a customer."
- "Describe a project where you had to balance customer needs with technical constraints."

**What they want:** Concrete examples where you put the customer first — not just "I built features". Talk about how you understood a customer's actual problem, not just what they asked for.

### 2. Ownership

**Sample questions:**
- "Tell me about a time you took on a task outside your job scope."
- "Describe a situation where you had to make a decision without your manager's input."

**What they want:** Stories where you stepped up without being asked. Amazon hates "not my job" mentalities.

### 3. Deliver Results

**Sample questions:**
- "Tell me about a project you delivered under tight constraints."
- "Describe a time you had to cut scope to hit a deadline."

**What they want:** Quantified outcomes ("shipped X% faster", "reduced errors by Y%"). They want to see you make trade-offs to ship, not perfectionism.

### 4. Invent and Simplify

**Sample questions:**
- "Tell me about a time you simplified a complex system."
- "Describe a project where you had to find a creative solution to a hard problem."

**What they want:** Stories of reducing complexity — eliminating steps, automating manual work, etc. Not "inventing" in the sense of patents.

### 5. Learn and Be Curious

**Sample questions:**
- "Tell me about a time you learned a new skill to solve a problem."
- "Describe something you recently learned that wasn't required for your job."

**What they want:** Genuine curiosity. Side projects, books you read, technologies you explored on your own time.

### 6. Bias for Action

**Sample questions:**
- "Tell me about a time you had to make a decision with incomplete information."
- "Describe a situation where you took action without waiting for permission."

**What they want:** Speed + judgement. Stories where you calculated risk and moved forward, rather than waiting for perfect data.

## Real Amazon SDE interview questions

These are problems that have actually appeared in Amazon SDE interviews (SDE-I and SDE-II) in the past 12-18 months. Practise these until you can solve them in 20-25 minutes.

### Easy problems

1. **Two Sum** — return indices of two numbers that add up to target. (Hash map, O(n))
2. **Valid Parentheses** — check if a string of brackets is balanced. (Stack)
3. **Merge Two Sorted Lists** — merge two sorted linked lists. (Linked list traversal)
4. **Best Time to Buy and Sell Stock** — max profit from one transaction. (Tracking min so far)
5. **Palindrome Linked List** — check if a linked list is a palindrome. (Slow/fast pointer + reverse half)

### Medium problems

1. **Top K Frequent Elements** — return k most frequent elements in array. (Bucket sort or heap)
2. **LRU Cache** — design LRU cache with O(1) get/put. (Hash map + doubly linked list)
3. **Number of Islands** — count islands in a 2D grid. (BFS/DFS)
4. **Word Break** — check if a string can be segmented into dictionary words. (Dynamic programming)
5. **Course Schedule** — detect cycle in directed graph of courses. (Topological sort)
6. **Longest Substring Without Repeating Characters** — sliding window.
7. **Kth Largest Element in Array** — quickselect or heap.
8. **Rotting Oranges** — multi-source BFS.

### Hard problems

1. **Median of Two Sorted Arrays** — O(log(min(m,n))) solution required. (Binary search on partition)
2. **Merge K Sorted Lists** — divide and conquer or heap-based merge.
3. **Sliding Window Maximum** — O(n) using deque.
4. **Word Ladder II** — BFS + backtracking. (Rarer but appears.)

### System design (for SDE-II and above)

- Design a URL shortener (Bitly).
- Design a rate limiter.
- Design Twitter's timeline.
- Design an online chat app (WhatsApp-style).
- Design Amazon's product search ranking system.

For SDE-I, system design is usually light — they might ask you to design a parking lot or a simple in-memory file system. For SDE-II, expect a 30-45 min system design round.

## How to prepare — a 8-week plan

### Weeks 1-2: DSA fundamentals

- Complete NeetCode's "NeetCode 150" — covers all common patterns.
- Practise on LeetCode India: focus on medium problems first.
- Topics: arrays, strings, hash maps, two pointers, sliding window, stacks, queues, linked lists.

### Weeks 3-4: Advanced DSA

- Trees (BST, traversals), graphs (BFS, DFS, topological sort, Dijkstra).
- Dynamic programming (1D and 2D patterns).
- Heaps, tries, union-find.
- Aim: 100 problems solved, 60% mediums, 30% hard.

### Weeks 5-6: System design + LPs

- Watch NeetCode's system design playlist.
- Read "Designing Data-Intensive Applications" chapters 1-7.
- Write down 6-8 STAR-format stories covering all 16 LPs.
- Practise telling each story in 2-3 minutes out loud.

### Weeks 7-8: Mock interviews

- Use Hirebase's [AI Mock Interview tool](/?view=ai-mock-interview) for free practice.
- Book 5-10 mock interviews on platforms like Pramp or interviewing.io.
- Practise whiteboarding on paper or a blank doc — not in your IDE.

## Common mistakes that fail Amazon interviews

### Mistake 1: Solving the problem but not talking

Amazon interviewers evaluate your thought process, not just your code. If you silently type for 25 minutes then say "done", you'll fail even with correct code.

**Fix:** Talk through your approach before coding. Explain trade-offs. Ask clarifying questions before jumping in.

### Mistake 2: Weak LP stories

A generic "I worked hard on a project" story will fail. Amazon interviewers are trained to probe for specifics: "What was the impact?", "What did you do specifically?", "What would you do differently?"

**Fix:** Use STAR format religiously. Quantify every outcome. Have 8-10 stories ready that cover all 16 LPs.

### Mistake 3: Brute-forcing when an optimal solution exists

Amazon interviewers will accept a brute-force solution if you discuss the optimal approach and explain why you're starting brute-force. They will reject you if you submit a brute-force solution and act like it's optimal.

**Fix:** Always mention "The optimal solution would be X with O(Y) complexity. I'll start with brute force to make sure I understand the problem, then optimize."

### Mistake 4: Not asking clarifying questions

Amazon tests "Customer Obsession" partly through clarifying questions. If the interviewer says "design a URL shortener" and you start designing immediately, you've failed the customer-obsession check.

**Fix:** Ask: "What's the expected QPS?", "Should URLs expire?", "Should it support custom aliases?" — even if you know the answers.

### Mistake 5: Ignoring edge cases

Amazon specifically tests for robustness. A correct solution that doesn't handle empty inputs, negative numbers, or duplicate values will lose points.

**Fix:** Always list 3-5 edge cases before submitting. Walk through your code with at least one edge case.

## Salary expectations at Amazon India (2026)

If you make it through, here's what Amazon India pays (verified via Hirebase listings + levels.fyi data):

- **SDE-I (Fresher):** ₹28 - 45 LPA total comp (base ₹15-22 LPA + RSUs ₹10-20 LPA + joining bonus ₹3-5 LPA)
- **SDE-II (3-5 years):** ₹55 - 90 LPA total comp
- **SDE-III (6-10 years):** ₹90 - 1.5 Cr total comp
- **Principal SDE (10+ years):** ₹1.5 - 3 Cr total comp

RSUs vest over 4 years (5%, 15%, 40%, 40% — back-loaded). Keep this in mind when comparing offers — Amazon's first-year cash comp is lower than Google/Microsoft for the same total comp.

## Frequently asked questions

### How many rounds are there in Amazon SDE interview?

Amazon SDE interviews typically have 4-5 rounds: 1 online assessment (2 coding problems + LP essay), 3 technical interviews (1-2 DSA problems each + system design for SDE-II+), and 1 Bar Raiser round (mostly leadership principles deep-dive). The entire process takes 4-8 weeks from application to offer.

### Is Amazon SDE interview hard?

Yes, Amazon SDE interview is hard but predictable. The DSA problems are LeetCode medium-hard level (Top K Frequent, LRU Cache, Number of Islands are common). The Leadership Principles round is where most candidates fail — Amazon scores you against 16 specific LPs. Prepare 8-10 STAR-format stories covering all LPs and you'll do well.

### How much does Amazon pay SDE freshers in India?

Amazon pays SDE-I (fresher) in India ₹28-45 LPA total compensation: ₹15-22 LPA base + ₹10-20 LPA in RSUs (vesting over 4 years) + ₹3-5 LPA joining bonus. This is among the highest fresher packages in Indian tech, comparable to Microsoft and slightly below Google.

### How long is the Amazon SDE interview process?

Amazon SDE interview process takes 4-8 weeks: 1-2 weeks from application to OA, 1-2 weeks from OA to on-site, 1 week for on-site rounds, 1-2 weeks for decision + offer. You can speed this up by getting a referral from a current Amazonian.

### What is the Bar Raiser round at Amazon?

The Bar Raiser round is Amazon's unique final interview round. A "Bar Raiser" is a specially-trained Amazon employee (not from the team you're applying to) who evaluates whether you raise the Amazon "bar" — i.e., are you better than 50% of current Amazonians at your level? This round is mostly behavioural, focused on Leadership Principles. Many strong engineers fail here because they treat it casually.

## Ready to crack Amazon?

**Step 1:** Read our complete [Software Engineer Salary in Bengaluru guide](/insights/software-engineer-salary-bengaluru-2026) to know your market worth before negotiating.

**Step 2:** Use our [AI Mock Interview tool](/?view=ai-mock-interview) to practise Amazon-style behavioural + technical questions for free.

**Step 3:** Browse [Software Engineer jobs at Amazon](/jobs/bengaluru) and other top companies on Hirebase — every listing shows salary range + required skills.

**Step 4:** Use our [Skill Gap Analyzer](/?view=skill-gap) to identify what skills you're missing for the Amazon SDE role and get a personalised learning path.

Want more interview prep? Read our [ATS-friendly resume guide](/insights/ats-friendly-resume-guide) to make sure your resume even gets shortlisted for the Amazon OA.
