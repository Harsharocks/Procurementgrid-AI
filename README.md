# ProcureGrid AI

Complete source of the interactive procurement prototype built in this conversation.

## Quick start
1. Extract this ZIP.
2. Open procuregrid-ai/index.html in a modern browser.
3. For consistent browser storage, serve the folder locally instead:
   python -m http.server 8000 --bind 127.0.0.1
   Then visit http://localhost:8000
   On Windows, use py -m http.server 8000 --bind 127.0.0.1 if needed.

No npm install, build step, external assets, API keys, or third-party dependencies are required. HTML, CSS, JavaScript, and fictional seed data are all in index.html.

## Included functionality
- Procurement dashboard with calculated spend and seat savings
- Searchable vendor grid and status filters
- Comparison of 2 to 4 selected vendors
- Vendor detail and fictional evidence summaries
- New procurement request form
- Approve/reject controls with rationale and review attestation
- High-risk approval blocking
- Renewal priority list
- Rule-based procurement copilot
- Browser-local decision history
- CSV export
- Responsive layout

## Demo walkthrough
1. Select Figma and Miro in the vendor grid, then click Compare selected.
2. Open a vendor to inspect its spend, utilization, and review requirements.
3. Create a request; find it under Approvals.
4. Enter a rationale and attest to required reviews to approve it.
5. Open Activity log to see the decision.
6. Ask the copilot about savings, security risks, renewals, or approvals.
7. Export the vendor grid as CSV.

## Data and persistence
All vendors' contract values, usage, risk assessments, renewal windows, and fit scores are fictional examples. Vendor names do not imply endorsement or affiliation. Renewal days are fixed demo offsets, not a live calendar. New requests have an unevaluated fit score of zero.

Changes are stored in this browser's localStorage under pg-v1 and pg-log. They are not shared between devices or users. Clear those two keys in browser developer tools to reset the demo. Do not enter confidential procurement data.

## Scope and limitations
This ZIP contains the complete implemented frontend prototype, not a production enterprise AI platform. The copilot uses deterministic keyword matching and arithmetic; it does not call an LLM. Evidence entries are fictional descriptions, not uploaded documents or verified citations. Approval controls are UI simulations, not secure authorization. The activity log is editable local storage, not an immutable audit log.

There is no backend, database, login, document ingestion, vector retrieval, live Slack connection, external notifications, scheduled renewal service, or real purchase execution. The hosted demo's private access is supplied by its hosting platform and is not included in this portable source.

Potential savings assume linear per-seat pricing, exclude Snowflake usage-based spend, and do not account for minimum commitments or contractual restrictions. Fit scores are seeded illustrative values.

## Production implementation roadmap (not implemented)
1. Add an authenticated API and shared database with tenant isolation and server-enforced roles.
2. Store contracts securely; implement document extraction, permission-aware retrieval, and source citations.
3. Connect an LLM through a server-side provider adapter with evaluations, observability, and cost limits.
4. Integrate approved finance, identity, and Slack APIs with least-privilege access.
5. Add durable approval workflows, immutable audit events, idempotent actions, and renewal scheduling.
6. Validate security, accessibility, data retention, backups, and recovery before enterprise use.

## Deployment
Upload index.html to any static host. No server-side runtime is required for this prototype. Configure authentication separately if the deployment must be private.

## Verification
JavaScript syntax was checked during creation. ZIP integrity and source-byte parity were checked during export. Browser-based interaction and visual testing were not available in the creation environment.
