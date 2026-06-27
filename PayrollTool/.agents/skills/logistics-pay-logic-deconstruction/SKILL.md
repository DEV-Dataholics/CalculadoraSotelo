---
name: logistics-pay-logic-deconstruction
description: Reverse-engineer undocumented transport payroll rules from historical route data, movement records, and payout outcomes.
---
# Logistics Pay-Logic Deconstruction Skill

## Purpose
Use this skill when the task is not to apply a known payroll formula, but to infer the hidden logic behind historical payout behavior. This skill is designed for transport and logistics operations where the source system contains movements, routes, stops, timestamps, cargo context, and final pay outcomes, but the true compensation rules are undocumented, partially documented, or contradicted by historical practice.

The goal is to convert messy operational evidence into a defensible logic map that can later be implemented in code, validated against control cases, or reviewed with operations.

This skill is intentionally constrained to transport and logistics payroll reconstruction. It should not generalize conclusions to unrelated compensation systems unless explicitly re-scoped.

## Core Competency
Reverse-engineering undocumented, multi-variable payroll rules from historical route data and payout outcomes.

## Best Fit Inputs
- Historical payroll outcomes tied to route or trip records.
- Movement exports from systems like Genesis.
- Route-level fields such as origin, destination, cargo, timestamps, unit, operator, stop count, and final paid amount.
- Spreadsheet tabs or audit notes with exceptions, bonuses, deductions, or manually adjusted totals.

## Not The Right Use Case
- Simple arithmetic verification when the rule is already known.
- Final legal or HR policy approval.
- High-confidence conclusions from a tiny sample with no repeated patterns.

## Deconstruction Workflow
1. Normalize the evidence.
Strip each case down to the smallest comparable structure: operator, unit, origin, destination, route family, cargo type, timestamps, stop count, distance, crossing context, and total pay. Remove formatting noise, duplicate labels, and spreadsheet-only presentation artifacts.

2. Segment the universe before inferring rules.
Separate records into operational families before comparing them. Typical segment boundaries include local vs. long-haul, loaded vs. empty, domestic vs. cross-border, Pacifico vs. Chihuahua, single-stop vs. multi-stop, and standard route vs. exception route. Do not force one formula across mixed operating modes unless the data supports that.

3. Isolate constants using anchor routes.
Look for recurring route patterns that appear to pay the same amount or nearly the same amount across multiple records. Treat those as candidate baselines. If Route A->B repeatedly resolves to the same pay, that amount is the likely base for that movement family.

4. Run delta analysis on near-matching records.
Compare records where only one meaningful variable appears to change. Focus on cases like same route plus longer duration, same route plus extra stop, same operator family plus cross-border event, or same path with empty return instead of loaded return. Quantify the pay delta and propose the simplest coefficient that explains it.

5. Detect threshold behavior.
Look for step functions rather than purely linear behavior. Common examples include overtime after a cutoff, multi-stop bonuses beginning at stop 2 or 3, deadhead deductions, crossing deductions, minimum guaranteed pay, and weight-class or cargo-class premiums.

6. Form a draft compensation rule.
Translate observed regularities into a provisional formula and a set of if/then conditions. Prefer a minimal rule set that explains most of the data over a highly specific rule that memorizes every exception.

7. Test the hypothesis against out-of-sample records.
Apply the draft rule to cases not used to build it. Record the variance explicitly. If the rule fails in patterned ways, revise the segmentation or add a missing condition. If the failures are sparse and irregular, classify them as exceptions rather than forcing them into the main formula.

8. Produce the logic map.
Return the inferred formula, the rule matrix, the confidence level by rule, and the shadow variables that still appear to influence pay but are not directly represented in the dataset.

9. Promote or hold each rule.
Every inferred rule remains provisional until its confidence score and supporting evidence are strong enough for approval. When new payroll evidence arrives, update the existing rules first, retest them, and only create a new rule when the variance cannot be explained by the current model.

## Decision Rules While Analyzing
- If repeated routes yield stable payouts, start from a route baseline before testing variable modifiers.
- If the same route pays differently across obvious operating modes, split the rule set by mode instead of averaging.
- If a pay gap appears only after a cutoff, treat it as threshold behavior, not a noisy coefficient.
- If one candidate rule explains less variance with fewer assumptions, prefer it over a more complex rule.
- If unexplained variance clusters by weekday, dispatcher, customer, or document type, flag a shadow variable instead of fabricating a rule.
- If the sample is too thin to support a coefficient confidently, label it tentative and state what additional data would confirm it.

## Output Contract
Every analysis performed with this skill must include the following sections.

### 1. Calculated Formula
State the inferred formula in plain language and symbolic form.

Example:

$$
Total = Base + (Miles \times Rate) + \sum(Adjustments)
$$

If the logic is piecewise, show the branches explicitly.

### 2. Rule Matrix
Provide a compact table of inferred conditions and their effect.

Suggested columns:
- Condition
- Inferred effect
- Confidence score (0-100)
- Status (`candidate`, `testing`, `approved`, `rejected`)
- Notes or exceptions

Example conditions:
- If cargo type is electronics, apply a multiplier.
- If route includes cross-border handling, subtract or add a fixed amount.
- If stop count exceeds threshold, add a step bonus.

### 3. Shadow Variable Report
List factors that clearly appear to influence pay but are not explicitly represented in the source fields.

Examples:
- Monday or weekend premium.
- Dispatcher-specific handling.
- Customer-specific exception not encoded in route names.
- Manual override behavior.

For each shadow variable, state why it is suspected and what additional data would validate it.

### 4. Confidence and Residual Variance
State which parts of the rule are high confidence, which are tentative, and which records remain unexplained.

Confidence scoring rules:
- `0-39`: weak signal, not reliable enough to guide implementation.
- `40-69`: plausible but under-tested; keep as `candidate` or `testing`.
- `70-84`: strong working rule with moderate residual variance; eligible for controlled use.
- `85-100`: repeatedly validated across comparable records; eligible for approval.

Approval rule:
- A rule should be marked `approved` only when it explains the dominant pattern in its segment, survives retesting with new records, and does not create contradictory explanations in nearby cases.

Iteration rule:
- When new payroll evidence is provided, re-score existing rules before inventing new ones.
- If a new dataset strengthens a rule, raise the score and keep the same rule identity.
- If a new dataset breaks a rule in a patterned way, split the rule or downgrade it rather than silently overwriting it.

## Quality Bar
The analysis is only complete when:
- The proposed formula explains the dominant pattern rather than isolated anecdotes.
- Similar records do not receive contradictory explanations.
- Threshold rules are distinguished from linear rate rules.
- Exceptions are separated from core logic.
- All major unexplained residuals are surfaced explicitly.
- Every rule includes a numeric confidence score and current lifecycle status.
- The output is implementable by a developer or reviewable by operations without guessing what the inferred rule means.

## Working Style
- Be forensic, not decorative.
- Prefer the smallest rule set that fits the evidence.
- Show the reasoning chain from data pattern to inferred rule.
- Distinguish facts, inferences, and open questions.
- Do not present a tentative coefficient as settled policy.
- Treat the rule set as a living model that matures as more payroll evidence is fed into it.

## Example Prompts
- Deconstruct the payroll logic behind these historical Chihuahua and Pacifico route payouts and infer the compensation formula.
- Compare these similar route records, isolate the pay deltas, and tell me whether the difference is detention, stop count, or a cross-border adjustment.
- Build a rule matrix from this Genesis export plus payout sheet and flag any hidden variables still affecting pay.
- Infer the threshold logic behind these operator payments and tell me where the formula breaks down.

## Rule Ledger Expectations
- Preserve a stable identity for each inferred rule whenever possible.
- Record what evidence increased or decreased confidence.
- Distinguish core rules from local exceptions.
- Aim to converge toward an approved transport payroll core, not to accumulate an endless list of one-off explanations.