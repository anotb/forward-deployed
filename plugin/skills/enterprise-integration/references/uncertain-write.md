# Recovery: did the agent provision the workspace?

Illustrative IT service contract and trace. These are specified interface semantics, not executed calls or claims about a product.

An employee asks the IT service agent for a development workspace. The agent can resolve the user's team, select an approved template, create the environment, verify readiness, and return access details. It has standing authority for this class of request; the provisioning service enforces team entitlement, quota, allowed templates, and lifetime limits.

## Make the operation meaningful

The tool `provision_workspace` accepts an intent reference, team, template version, and expiry. It returns an operation identifier and status. In this example:

- An intent is unique within the tenant. Repeating the same intent and payload returns the original operation; a different payload with that intent returns a conflict.
- The provisioning service validates entitlement, quota, and template version atomically when accepting the request.
- `get_operation_by_intent` reads the authoritative operation record. A temporary failure supplies no conclusion about creation.
- An accepted operation can be queued or running. Readiness requires a workspace identifier, successful health check, and the intended access grant.

The model selects the appropriate template from the employee's requirements and investigates an unusual failure. The receiving service decides whether the request is allowed and whether provisioning succeeded.

An illustrative request is:

```json
{
  "intent": "request-731-workspace",
  "team": "payments-platform",
  "templateVersion": "dev-linux-12",
  "expiresAt": "2026-10-19T17:00:00Z"
}
```

The intent identifies this requested workspace. Another legitimate workspace request gets its own intent.

## Follow the result through interruption

| Event | Required interpretation and continuation |
|---|---|
| The agent resolves team membership and chooses the allowed template. | It has the inputs to request provisioning. |
| The runtime persists the intent and sends the command. | A resumed task can reconcile this same request. |
| The provisioning service accepts operation P-82, but the response is lost. | The caller has an uncertain result. A timeout does not establish failure. |
| The runtime restarts and looks up the recorded intent. | P-82 is running; keep following that operation. |
| P-82 returns workspace W-93 with health passed but access pending. | The workspace exists, but the employee's assignment is unfinished. |
| The supported access check confirms the employee's intended role. | Update the native request with W-93's access details. |
| The request system acknowledges the completed handoff. | Mark the item handled. If that update failed, retain the handoff as pending without provisioning again. |
| The original initiating event is delivered again. | Resolve it to the completed request; do not create another workspace. |

The user receives a working environment. The agent's final statement follows the receiving-system result, not the fact that a create call returned successfully.

If a scheduled run discovers these requests, retain the source's supported cursor and the pending request IDs. A failed next-page read leaves that portion unread. Once request 731 is durably pending, discovery can continue while P-82 runs. Finishing the scan does not complete request 731; its recorded outcome and handoff determine that.

## A changed request is a different decision

If the user changes the requested team while P-82 is running, first establish P-82's state. Do not overwrite its payload or issue a new intent to make the old uncertainty disappear. Use the platform's cancellation or reassignment behavior if supported, then handle the revised request under its own semantics.

If the original request is rejected because the template revision changed, inspect the replacement and its material differences. A compatible replacement can be selected within the existing task scope; a new cost tier or access model can require a different authorization. The tool service still enforces the resulting request.

## Check what the receiver can guarantee

Exercise same-intent replay, payload conflict, lost acknowledgement, and partial readiness in an authorized test environment. Inspect the number of resulting environments and their access state.

A lagging search index cannot establish that no operation exists. If the platform lacks both idempotency and authoritative reconciliation, inspect its audit or request facilities. A supported adapter may need to own those semantics before unattended provisioning is viable. A model instruction to avoid duplicates cannot supply a missing transaction guarantee.

Use this limitation to change the integration, not to reduce every IT agent to a ticket summarizer. The agent can still resolve requirements and complete supported operations while the missing provisioning path is addressed.
