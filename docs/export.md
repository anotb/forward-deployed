# Take your work with you

Use **Export → Download ZIP** to save an engagement. The download contains readable opportunities, requirements, delivery work and saved evidence, plus JSON for the workspace, Field Lab definitions and recorded runs. Source IDs and versions remain connected. A checksum manifest identifies the snapshot and every file.

Only the authorized engagement is exported. Export does not fetch meeting history, include application source, or copy account settings and credentials. Evidence includes passages already saved in the workspace and their retained versions. `includeEvidence: false` excludes those passages, source metadata, quoted references and delivery evidence; source IDs and reference versions remain. Written requirements and other derived content can still contain sensitive information, so review the export before sharing it.

## Save to Git

Use **Export → Save to Git** in the connected chat. Forward Deployed prepares the files; the host uses its connected Git tools or CLI to write them to the repository and branch you select. This uses the host's existing access. Signing into Forward Deployed does not grant repository access.

The MCP tool `prepare_git_export` returns relative paths, text content, a suggested commit message and the exported workspace revision and SHA-256 hash. It does not create a repository, commit or push. A host without Git access can still download the ZIP. New repositories should be private unless the user requests otherwise.

Files live under `forward-deployed/<encoded-engagement-id>/`. Subsequent exports reuse the same paths. Keep other repository files intact. Before removing an obsolete generated file, check that the previous manifest lists it and its content still matches that manifest; preserve edited files. Never follow repository symlinks outside the checkout. Verify the destination and resulting remote commit before reporting that the work is saved.

## Format and verification

The ZIP uses the standard uncompressed STORE format with UTF-8 paths and fixed timestamps. Identical snapshots and export options produce identical bytes. File names encode unsafe characters and avoid Windows device names and case collisions. Markdown escapes raw HTML; JSON preserves the original domain text. A scoped `.gitattributes` prevents Git from changing exported bytes on checkout, keeping checksums valid across platforms. The manifest's source hash covers the canonical exported `workspace.json`, so exports with and without evidence have different hashes.

Domain fields are selected explicitly. Credential-shaped fields in simulation state are omitted and listed in the manifest. Synthetic hidden state, such as a simulated parts cost, remains part of a complete rehearsal. This is not a general secret scanner for user-authored prose; avoid saving live credentials in an engagement.

Automated tests verify domain round trips, evidence exclusion, deterministic bytes, ZIP headers and CRCs, manifest hashes, portable paths and credential exclusion. A Git integration test creates a temporary local bare repository, commits and pushes an export, clones it and checks every file, then repeats for an updated revision while preserving unrelated content. On Windows, the test also extracts the ZIP with the operating system's archive reader. This establishes the export and Git file flow; it does not claim a live GitHub push or third-party connector authorization.

Proposals, their before snapshots and review decisions travel with a complete export. When evidence is excluded, review history is also omitted because it can contain copied source passages. Delivery history is preserved.
