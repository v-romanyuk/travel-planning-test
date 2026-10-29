# Rule compilation

A fact's free text ("No red-eye flights") becomes a rule once, when it's saved. The planner never calls the model to apply a rule. It evaluates the stored test with `evaluateRule` against each catalogue entry. So a wrong test is wrong on every run, silently, until the fact is saved again. Everything here is about making a wrong test fail at save time.

## Why examples

The model returns three things: the test, a one-sentence summary, and 2–6 worked examples (catalogue-shaped entries, each marked as passing or failing). The test can be valid against the grammar and still mean the opposite of the text. In QA, "No red-eye flights" once compiled to "keep flights departing 22:00–05:59", the `not` was missing. Its summary still read "Removes flights departing 22:00–05:59", so nothing on screen gave it away.

The examples are judged from the text, then run through the planner's own `isRuleInScope` + `evaluateRule`. A flipped test disagrees with its own examples, and that error goes back to the model in the existing single retry. The model can still write a wrong example. But a flipped test and a matching flipped set of examples is a much rarer failure than a missing `not`.

## Invariants

- **One evaluator.** The example check calls `isRuleInScope`/`evaluateRule`, never a copy. If the two disagreed, an example could pass here and the rule fail in the planner.
- **Outcome means what the planner does.** For a hard rule, an example outside the rule's scope counts as kept, because the planner never removes an entry outside the scope. For a preference, it counts as not preferred.
- **Both outcomes present.** At least one passing and one failing example. A set where everything passes says nothing about polarity.
- **Example fields are checked against `RULE_FIELDS`**, the same registry the test is validated against. A field the evaluator can't read would make the example meaningless.
- **Examples are never stored.** They exist only for the check while a rule is compiled; the saved fact holds the test and the summary.

## Failure modes

| Symptom | Cause |
|---|---|
| "We couldn't turn this into a rule…" on save | the test or its examples were still invalid or disagreeing after the one retry; nothing is saved |
| "We couldn't check this right now…" | the model call itself failed (network, provider) |

## Rejected

- **Deriving the summary from the test in code.** It reads worse than the model's sentence for nested tests, and it doesn't catch the actual failure, a test that is consistent but flipped.
- **Testing against the real catalogue at save time.** It needs a catalogue query per save and still can't say which outcome is *right*. Only the text says that.
