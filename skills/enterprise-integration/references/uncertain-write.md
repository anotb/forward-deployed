# Worked recovery: did the review task get created?

Fictional interface semantics and a completed illustrative trace, not a live integration test. Read this when an operation may have succeeded despite a timeout. The example creates a review task; it neither approves credit nor changes a facility. Actual interfaces must be discovered and exercised in the intended environment.

## The useful operation

An analyst accepts a prepared evidence packet for facility F-17 and asks the service to create one review task in the existing case system. Acceptance of the packet authorizes this handoff only. The receiving team still performs its review.

Assume the receiver exposes these semantics in its fictional contract:

- A create operation accepts an intent reference, facility identifier, packet version and expected facility revision. The receiver checks scope and revision atomically with creation.
- The intent reference is unique within the tenant. Repeating the same intent and payload returns the original task. Reusing it with different payload returns a conflict.
- Lookup by intent reads committed task state from the same authority, without replica lag. An accepted lookup identifies the task and its stored packet version. A timeout supplies no business outcome.
- Creation means the task exists in the review queue. It does not mean a reviewer has accepted or completed it.

An illustrative payload is:

```json
{
  "intent": "prepare-F17-review-884",
  "facility": "F-17",
  "packetVersion": "p6",
  "expectedFacilityRevision": 42
}
```

The intent denotes this requested handoff, not every future review for F-17. A stable intent stops a retry from creating a duplicate; it should not collapse legitimately separate work.

## Read the trace through the business result

| Time | Observable event | What can be concluded |
|---|---|---|
| 09:00:00 | Analyst accepts p6 for this handoff at facility revision 42 | The accepted scope and source revision are known. |
| 09:00:02 | Service durably records intent prepare-F17-review-884 before calling create | Recovery can find the same intent after a restart. |
| 09:00:03 | Receiver creates task T-305 with p6; response is lost | Receiver-side trace says committed; caller initially sees only timeout. |
| 09:00:06 | Caller records outcome unknown; it does not issue a fresh-intent create | No duplicate is inferred necessary from missing acknowledgement. |
| 09:00:08 | Intent lookup returns T-305, p6, status queued | The handoff is verified. The correct user result is “T-305 is queued,” not “review complete.” |
| 09:00:10 | Duplicate initiating event arrives | It maps to the recorded intent and task, so no new handoff is created. |
| 09:02:00 | Facility revision 43 changes a material term used in p6 | T-305 exists, but its prepared content may now need refresh. This is a new state change, not evidence that the earlier write failed. |

For the last event, use the case system's supported update or supersession behavior. If it allows an attachment to be marked outdated and replaced with a new version, preserve p6's history and show the reviewer what changed. If the task cannot be edited, notify its owner through the authorized workflow. Do not delete the accepted history or create a second ordinary task merely to hide stale content.

## A different timing changes the action

Suppose revision 43 arrives before the receiver handles create. The expected-revision check rejects the operation without creating a task. Refresh the affected packet and revisit the acceptance only if the material handoff changed. An editorial correction need not be treated like a changed facility or underlying conclusion.

After a payload change, do not reuse the old intent as if it represented the same immutable request. Record the old attempt's terminal rejection and link the revised handoff to it under the receiver's supported semantics. If the old result is still unknown, reconcile that result first. A new reference cannot make an uncertain old effect disappear.

## What if the receiver is weaker?

If lookup uses a lagging search index, “not found” does not prove no creation. If the receiver has neither idempotency nor a reliable business-reference lookup, a blind retry cannot guarantee one task. Inspect available audit records or route the uncertain handoff to the case-system owner. Preserve the intent, time, actor and attempted target so that person can resolve it.

This limitation can change the solution. For low-volume preparation, the analyst may create the native task from a prepared packet and return its identifier. For unattended volume, a supported receiving operation or reconciliation facility may be worth building. Neither a model instruction to “avoid duplicates” nor a successful normal-path demo resolves the missing receiver capability.

## What the first probe should settle

Exercise creation, replay of the same intent, mismatched payload, stale source revision and lost acknowledgement in an authorized test environment. Inspect resulting receiver state, including the number of tasks and stored packet versions. Separate an interface's documented promise from an observed result. The essential engineering question is whether its semantics make the uncertain outcome recoverable, not whether its API has a field named idempotencyKey.
