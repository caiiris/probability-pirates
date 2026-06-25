# CL-0001 Review Set — At Least One Via Complement

> Five Pascal-authored practice problems generated from `template-briefs/cl-0001-at-least-one-via-complement.md`.
> Each answer is exact-solver verified and Monte-Carlo checked locally. This is a review artifact, not shipped product content yet.

## Bank Metadata

- **Cluster:** CL-0001
- **Template id:** `at-least-one-via-complement`
- **Topic:** `complement`
- **Skills:** `complement-rule`, `independence`
- **Retrieval form:** `procedural`
- **Interaction kind:** `fill-fraction`
- **Reuse posture:** Pascal-authored wording; source inspiration only from approved harvest brief.

## Problem 1 — cl0001-p01

- **Difficulty:** 945
- **Params:** n=3, p=1/2, scenario=checkInPrompt
- **Prompt:** Pascal sends 3 independent check-in prompts. Each prompt has a 1/2 chance of being noticed. What is the probability that at least one prompt is noticed?
- **Answer:** 7/8 (0.875000)

### Verified Solution

- "At least one" is easier to get by looking at the opposite event: zero successes.
- One attempt fails with probability 1/2.
- Because the attempts are independent, all 3 attempts fail with probability (1/2)^3 = 1/8.
- So P(at least one success) = 1 - 1/8 = 7/8.

### Verification

- **Exact solver:** 1 - ((pDen - pNum) / pDen)^n
- **Exact complement:** 1/8
- **Simulation:** 0.875120 over 50,000 trials
- **Absolute diff:** 0.000120
- **5-sigma threshold:** 0.007395
- **Passed:** yes

## Problem 2 — cl0001-p02

- **Difficulty:** 1050
- **Params:** n=4, p=3/5, scenario=clearPing
- **Prompt:** A sensor sends 4 independent pings. Each ping has a 3/5 chance of arriving clearly. What is the probability that at least one ping arrives clearly?
- **Answer:** 609/625 (0.974400)

### Verified Solution

- "At least one" is easier to get by looking at the opposite event: zero successes.
- One attempt fails with probability 2/5.
- Because the attempts are independent, all 4 attempts fail with probability (2/5)^4 = 16/625.
- So P(at least one success) = 1 - 16/625 = 609/625.

### Verification

- **Exact solver:** 1 - ((pDen - pNum) / pDen)^n
- **Exact complement:** 16/625
- **Simulation:** 0.973780 over 50,000 trials
- **Absolute diff:** 0.000620
- **5-sigma threshold:** 0.003532
- **Passed:** yes

## Problem 3 — cl0001-p03

- **Difficulty:** 1035
- **Params:** n=5, p=1/3, scenario=puzzleStrategy
- **Prompt:** A learner tries 5 independent puzzle strategies. Each strategy has a 1/3 chance of working. What is the probability that at least one strategy works?
- **Answer:** 211/243 (0.868313)

### Verified Solution

- "At least one" is easier to get by looking at the opposite event: zero successes.
- One attempt fails with probability 2/3.
- Because the attempts are independent, all 5 attempts fail with probability (2/3)^5 = 32/243.
- So P(at least one success) = 1 - 32/243 = 211/243.

### Verification

- **Exact solver:** 1 - ((pDen - pNum) / pDen)^n
- **Exact complement:** 32/243
- **Simulation:** 0.868480 over 50,000 trials
- **Absolute diff:** 0.000167
- **5-sigma threshold:** 0.007561
- **Passed:** yes

## Problem 4 — cl0001-p04

- **Difficulty:** 1080
- **Params:** n=6, p=1/4, scenario=qualityCheck
- **Prompt:** A robot runs 6 independent quality checks. Each check has a 1/4 chance of catching a flaw. What is the probability that at least one check catches the flaw?
- **Answer:** 3367/4096 (0.822021)

### Verified Solution

- "At least one" is easier to get by looking at the opposite event: zero successes.
- One attempt fails with probability 3/4.
- Because the attempts are independent, all 6 attempts fail with probability (3/4)^6 = 729/4096.
- So P(at least one success) = 1 - 729/4096 = 3367/4096.

### Verification

- **Exact solver:** 1 - ((pDen - pNum) / pDen)^n
- **Exact complement:** 729/4096
- **Simulation:** 0.823400 over 50,000 trials
- **Absolute diff:** 0.001379
- **5-sigma threshold:** 0.008553
- **Passed:** yes

## Problem 5 — cl0001-p05

- **Difficulty:** 1140
- **Params:** n=4, p=7/10, scenario=checkInPrompt
- **Prompt:** Pascal sends 4 independent check-in prompts. Each prompt has a 7/10 chance of being noticed. What is the probability that at least one prompt is noticed?
- **Answer:** 9919/10000 (0.991900)

### Verified Solution

- "At least one" is easier to get by looking at the opposite event: zero successes.
- One attempt fails with probability 3/10.
- Because the attempts are independent, all 4 attempts fail with probability (3/10)^4 = 81/10000.
- So P(at least one success) = 1 - 81/10000 = 9919/10000.

### Verification

- **Exact solver:** 1 - ((pDen - pNum) / pDen)^n
- **Exact complement:** 81/10000
- **Simulation:** 0.991320 over 50,000 trials
- **Absolute diff:** 0.000580
- **5-sigma threshold:** 0.002004
- **Passed:** yes

## Human Review Checklist

- Are the scenarios age-appropriate and not too dry?
- Do the five prompts feel varied enough for a first template family?
- Is the complement move visible in the worked solution?
- Should any problem use multiple-choice scaffolding before `fill-fraction`?
- If approved, convert this family into `src/features/practice/templates/at-least-one-via-complement.ts` after the problem bank layout is approved.

