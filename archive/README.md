# Archive — superseded AVI documents

**Rule:** nothing in this folder is safe to use as a build guide. Every file here has been replaced by current canon. The archive exists only as historical reference — to see how the thinking evolved, not to copy patterns from.

When canon and archive disagree, **canon wins**. Always.

---

## What's here and why

| File | Why archived | Replaced by |
|---|---|---|
| `AVI_AGENT_DESIGN.md` | Marked DEPRECATED v1.0 in its own header. Used the rejected "4 agents + orchestrator" framing that DECISIONS.md D001 reversed. | `AVI_OPERATING_STANDARD.md` + `/agents/*.md` |
| `AVI_CUSTOMER_FLOW.md` | Marked DEPRECATED v1.0. Old $497 pricing, old 8-field form, old four-agent journey. | `AVI_FLOW_FREE.md`, `AVI_FLOW_PAID.md` |
| `AGENTS.md` | Duplicate of `CLAUDE.md`. One source of truth — `CLAUDE.md`. | `CLAUDE.md` |
| `AVI_BUILD_PLAN.md` | Tactical sequence written before the operating standard. Useful history; out of date for build sequencing. | `AVI_OPERATING_STANDARD.md` §7 (role inventory) + DECISIONS.md (sequence calls) |
| `AVI_FREE_FLOW.md` | Header itself acknowledged pricing drift. Will be rewritten clean against the new canon. | `AVI_FLOW_FREE.md` |
| `AVI_INDEX_REPORT.md` | Described the seven-service pipeline. The six-dim rubric choice (supersedes D002) means architecture description is partially out of date. Will be rewritten clean. | `AVI_FLOW_PAID.md` |

## What's NOT here (and why those weren't archived)

For reference: these AVI-related docs remain at the project root because they describe currently accurate state, not aspirational architecture:

- `AVI_OPS_MONITOR.md` — describes the shipped ops monitor. Still accurate. Keep.
- `AVI_TOOLS.md` — services reference. Still accurate. Keep.

If either of those drifts out of date, archive it the same way.

## Restore policy

Do not restore a file from this folder to root. If something here turns out to contain a useful idea, copy the idea into current canon, cite the archived file as the source, and leave the archive untouched.
