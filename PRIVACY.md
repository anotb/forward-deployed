# Privacy

The Forward Deployed skills are local instructions. Using a skill does not by itself send data to the publisher. Your AI host and any connected services handle the work under their own permissions and settings.

The optional workspace at `forward-deployed.unsol.dev` processes the information you send to its tools. Stateless mode is the default: the service receives a workspace snapshot, processes the request and returns it without saving the workspace in its database. Your host retains the returned snapshot according to its own settings. The website keeps its active snapshot in browser tab session storage, including through a sign-in redirect. Export work you want to keep.

If you choose **Save online**, the service stores your workspace on Cloudflare, scoped to your signed-in account. This includes the source excerpts, opportunities, requirements, delivery work, scenarios and runs you choose to save. GitHub sign-in requests identity only, with no repository scopes. Its upstream access token is used to read your profile and is not retained. Account sessions and authorization records are stored to support sign-in. The service does not automatically import meetings or write to a Git repository.

Aggregate usage counters record fixed tool names, storage mode, result category, call count and elapsed time. They exclude account IDs, IP addresses, project names, source content, URLs and request payloads. There is no browser analytics script or tracking cookie. You can turn usage reporting off in the workspace, pass `telemetry: false` to a tool, or send `DNT: 1`, `Sec-GPC: 1` or `x-fd-telemetry: off`. Worker request-log storage is disabled; infrastructure providers may still process connection metadata to operate their services.

Exports go to your chosen destination. A Git handoff prepares files for your host's Git tools; it does not grant repository access or push changes. Review an export before sharing it, especially if it includes meeting excerpts or client information.

For questions or saved-data removal requests, contact the maintainer through the [repository](https://github.com/anotb/forward-deployed). Do not post confidential material or credentials in public issues.
