# Agent role files

This folder holds the **contracts** for every LLM role inside the AVI pipeline. One file per role. Each file is the source of truth for what that role is permitted to do.

**Code lives in `lib/avi/`.** Specs live here. The two must stay in sync — if you change a system prompt in code, update the spec; if you change a spec, update the code.

When this folder and `AVI_OPERATING_STANDARD.md` disagree, the operating standard wins.

---

## The role-file pattern

Every role file follows the same shape. The header is the contract:

```
ROLE:           <name>
INPUT SCHEMA:   <pointer>
OUTPUT SCHEMA:  <pointer>
RUBRIC SLICE:   <which part of the rubric this role touches, or "n/a">
REFUSAL RULES:  §4 of AVI_OPERATING_STANDARD.md
LOGGING:        writes to api_calls table; replayability required
```

Below the header, every file has:

1. **One-sentence job description.** What this role does, no padding.
2. **What the role does.** Two or three short paragraphs.
3. **What the role must NOT do.** Refusal rules specific to this role, in addition to the universal refusal catalog in operating standard §4.
4. **Sections to write.** System prompt, input schema, output schema, refusal cases, golden examples.
5. **Model and parameters.** Vendor, model, temperature, JSON mode, max tokens.

## The current roles

| File | Role | Status | What it does |
|---|---|---|---|
| `EXTRACTOR.md` | Extractor | Stub | Parses one raw engine response into structured fields |
| `DRIVER_JUDGE.md` | Driver Judge | Stub | Scores one driver dimension on the anchored 0–5 scale |
| `RECOMMENDER.md` | Recommender | Stub | Produces top three fixes ranked by impact-per-hour |
| `CROSS_JUDGE.md` | Cross-Judge | Stub (not yet built) | Independent second-vendor scoring for QA |

Only LLM-bearing services have role files. The pure-code services in the pipeline (Crawler, Corroborator, Query Runner, Aggregator, Composite + Tier computation) do not get role files because they make no LLM judgments — they fetch, compute, and persist.

## What gets added vs. what gets edited

- **Adding a role:** copy `EXTRACTOR.md` as a template, change the contract, write the sections. Add the role to the table above. Bump nothing else automatically — the role doesn't exist until code references it.
- **Editing a role:** changes to the system prompt or output schema bump `AVI_RUBRIC_VERSION` and require a determinism-test rerun per operating standard §5.2.
- **Removing a role:** move the spec file to `archive/` with a one-line note explaining why and what (if anything) replaced it.

## Why role files at all

The point of separating the AI roles into atomic, contract-headed files is the same as the point of the operating standard: **constrain what the AI can do, and make those constraints inspectable**. A reviewer (Marty, a contractor, a future Claude) can read one file and know exactly what that role is allowed to do without reading the whole codebase. The contract is the audit trail.
