# Venn / Inclusion-Exclusion Verified Problems

> Deterministic verification pass for Pascal-authored Venn, inclusion-exclusion, and neither prompts. Runtime answers are computed from integer counts with exact rational arithmetic; no model or API calls are used.

- **Verified examples:** 7
- **Missing taxonomy needs:** `disjoint-events`, `exactly-one-of-two-events`, `overlapping-events`, `solve-overlap-from-union`, `two-way-table-to-venn`, `venn-region-translation`

## venn-inclusion-0001 - Club signup overlap

- **Candidate:** CAND-VENN-0001
- **Authorship:** Pascal-authored original prompt
- **Difficulty tag:** easy
- **Prompt:** In a class of 30 students, 14 signed up for robotics, 11 signed up for art club, and 5 signed up for both. If one student is picked at random, what is the probability they signed up for robotics or art club?
- **Exact answer:** 2/3
- **Skill tags:** `inclusion-exclusion`, `favorable-over-total`
- **Required missing skills:** `venn-region-translation`
- **Misconception traps:** adds both groups without subtracting overlap; subtracts the overlap twice
- **Verification method:** Compute the union count with |A or B| = |A| + |B| - |A and B|, then reduce union/total.
- **Passed:** yes

### Verification Arithmetic

- 14 + 11 - 5 = 20 in robotics or art club.
- 30 - 20 = 10 in neither group.
- Union probability reduces to 2/3.

## venn-inclusion-0002 - Neither lunch choice

- **Candidate:** CAND-VENN-0002
- **Authorship:** Pascal-authored original prompt
- **Difficulty tag:** medium
- **Prompt:** A lunch survey has 40 students. 18 would choose tacos, 15 would choose noodles, and 6 would choose both if they could. What is the probability that a randomly chosen student chose neither tacos nor noodles?
- **Exact answer:** 13/40
- **Skill tags:** `inclusion-exclusion`, `complement-rule`, `favorable-over-total`
- **Required missing skills:** `venn-region-translation`
- **Misconception traps:** treats neither as the overlap; uses total minus A minus B without adding the overlap back
- **Verification method:** Find the union by inclusion-exclusion, then compute neither as total - union and reduce neither/total.
- **Passed:** yes

### Verification Arithmetic

- 18 + 15 - 6 = 27 in tacos or noodles.
- 40 - 27 = 13 in neither group.
- Union probability reduces to 27/40.
- Neither probability reduces to 13/40.

## venn-inclusion-0003 - Disjoint commute choices

- **Candidate:** CAND-VENN-0003
- **Authorship:** Pascal-authored original prompt
- **Difficulty tag:** easy
- **Prompt:** In a homeroom of 28 students, 9 usually walk to school and 6 usually bike. No student is counted in both groups. What is the probability a randomly chosen student usually walks or bikes?
- **Exact answer:** 15/28
- **Skill tags:** `addition-principle`, `favorable-over-total`
- **Required missing skills:** `disjoint-events`
- **Misconception traps:** looks for an overlap even though the events are disjoint; divides by the counted students instead of the class size
- **Verification method:** Verify the overlap count is 0, so the union count is the direct sum |A| + |B|.
- **Passed:** yes

### Verification Arithmetic

- 9 + 6 - 0 = 15 in walks or bikes.
- 28 - 15 = 13 in neither group.
- Union probability reduces to 15/28.
- Because the overlap is 0, 9 + 6 = 15.

## venn-inclusion-0004 - Overlapping game booths

- **Candidate:** CAND-VENN-0004
- **Authorship:** Pascal-authored original prompt
- **Difficulty tag:** hard
- **Prompt:** At a school fair, 50 students tried at least one activity or skipped both. 32 tried the VR booth, 27 tried the puzzle booth, and 14 tried both. What is the probability a randomly chosen student tried at least one of those two booths?
- **Exact answer:** 9/10
- **Skill tags:** `inclusion-exclusion`, `favorable-over-total`
- **Required missing skills:** `overlapping-events`
- **Misconception traps:** accepts 32 + 27 as 59 students out of 50; forgets that both-booth students were counted twice
- **Verification method:** Use inclusion-exclusion and confirm the union does not exceed the total population.
- **Passed:** yes

### Verification Arithmetic

- 32 + 27 - 14 = 45 in VR booth or puzzle booth.
- 50 - 45 = 5 in neither group.
- Union probability reduces to 9/10.

## venn-inclusion-0005 - Two-way table to Venn

- **Candidate:** CAND-VENN-0005
- **Authorship:** Pascal-authored original prompt
- **Difficulty tag:** medium
- **Prompt:** A club survey of 60 students is shown as a two-way table: 12 are in both drama and band, 9 are in drama but not band, 15 are in band but not drama, and 24 are in neither. Translate the table to a Venn diagram. How many students are in drama or band, and what is the probability?
- **Exact answer:** 36 students; probability 3/5
- **Skill tags:** `sample-space-enumeration`, `inclusion-exclusion`, `favorable-over-total`
- **Required missing skills:** `two-way-table-to-venn`
- **Misconception traps:** adds row and column totals plus the overlap; confuses the neither cell with the overlap cell
- **Verification method:** Translate table regions into A only, B only, both, and neither; verify union = A only + B only + both.
- **Passed:** yes

### Verification Arithmetic

- 21 + 27 - 12 = 36 in drama or band.
- 60 - 36 = 24 in neither group.
- Union probability reduces to 3/5.
- A only is 9; B only is 15; both is 12.

## venn-inclusion-0006 - Recover the overlap

- **Candidate:** CAND-VENN-0006
- **Authorship:** Pascal-authored original prompt
- **Difficulty tag:** hard
- **Prompt:** A survey has 78 students. 41 follow the esports team, 33 follow the puzzle newsletter, and 18 follow neither. How many students follow both, and what is the probability a randomly chosen student follows both?
- **Exact answer:** 14 students; probability 7/39
- **Skill tags:** `inclusion-exclusion`, `complement-rule`, `favorable-over-total`
- **Required missing skills:** `solve-overlap-from-union`
- **Misconception traps:** subtracts neither from both groups directly; forgets that total - neither gives the union
- **Verification method:** Compute union as total - neither, then solve |A and B| = |A| + |B| - |A or B|.
- **Passed:** yes

### Verification Arithmetic

- 41 + 33 - 14 = 60 in esports team or puzzle newsletter.
- 78 - 60 = 18 in neither group.
- Union probability reduces to 10/13.
- 41 + 33 - 60 = 14 in both groups.

## venn-inclusion-0007 - Exactly one badge

- **Candidate:** CAND-VENN-0007
- **Authorship:** Pascal-authored original prompt
- **Difficulty tag:** extreme
- **Prompt:** In a camp app, 36 students can earn a creator badge, a helper badge, both badges, or neither badge. 20 earned creator, 18 earned helper, and 8 earned neither. What is the probability a randomly chosen student earned exactly one of the two badges?
- **Exact answer:** 18 students; probability 1/2
- **Skill tags:** `inclusion-exclusion`, `complement-rule`, `favorable-over-total`
- **Required missing skills:** `exactly-one-of-two-events`
- **Misconception traps:** answers at least one instead of exactly one; counts the both region as part of exactly one
- **Verification method:** Recover the overlap from the complement, then compute exactly one as A only + B only.
- **Passed:** yes

### Verification Arithmetic

- 20 + 18 - 10 = 28 in creator badge or helper badge.
- 36 - 28 = 8 in neither group.
- Union probability reduces to 7/9.
- Exactly one count is (20 - 10) + (18 - 10) = 18.

