# Universal query templates

Work for any subject. Loaded for every audit. Substitution rules in `README.md`.

Each template carries an `intent_subtype` per Alexander et al. (ORCAS-I, 2022):
- **factual** — question words ("what", "where"), expects a specific fact
- **instrumental** — "how to" structure, expects a procedural answer
- **exploratory** — amorphous user goal, expects landscape orientation

---

## Informational — Factual

### `INFO_04`
**Query:** `Top [CATEGORY] in [LOCATION]`
**Intent subtype:** factual
**Tests:** Local + Presence — is the subject named when the search is geographically scoped?
**Expected response type:** Ranked or recommendation list

---

## Informational — Instrumental

### `INFO_02`
**Query:** `How do I [PROBLEM]?`
**Intent subtype:** instrumental
**Tests:** Does the subject's content surface as a how-to source for the problem they solve?
**Expected response type:** Definition / explanation

---

## Informational — Exploratory

### `INFO_01`
**Query:** `Best [CATEGORY] for [BUYER_TYPE]`
**Intent subtype:** exploratory
**Tests:** Category-level Presence — does the engine name the subject when asked the most common buyer-side category question?
**Expected response type:** Recommendation list

### `INFO_03`
**Query:** `What should I look for in a [CATEGORY]?`
**Intent subtype:** exploratory
**Tests:** Advisory positioning — is the subject cited as an authority on what to look for?
**Expected response type:** List of criteria

### `INFO_05`
**Query:** `What makes a good [CATEGORY]?`
**Intent subtype:** exploratory
**Tests:** Quality criteria — is the subject's voice part of the "what makes good" conversation?
**Expected response type:** List of qualities

### `EXPL_01`
**Query:** `What are my options for [PROBLEM]?`
**Intent subtype:** exploratory
**Tests:** Pure landscape orientation — when the buyer doesn't yet know what they want, does the engine surface the subject?
**Expected response type:** Open-ended list of approaches or categories

### `EXPL_02`
**Query:** `I'm researching [CATEGORY] — where should I start?`
**Intent subtype:** exploratory
**Tests:** Discovery-mode visibility — does the engine point at the subject as a starting point for someone new to the category?
**Expected response type:** Recommendation of starting resources or providers

### `EXPL_03`
**Query:** `Help me think through [PROBLEM]`
**Intent subtype:** exploratory
**Tests:** Trust positioning — does the engine surface the subject as a thinking partner / advisor for an unstructured problem?
**Expected response type:** Framework, advisory voice, or named resources

---

## Transactional

### `TRANS_01`
**Query:** `Hire a [CATEGORY] near [LOCATION]`
**Tests:** Action queries — does the subject surface when the user signals buying intent?
**Expected response type:** Direct recommendation

### `TRANS_02`
**Query:** `Looking for a [CATEGORY] for [PROBLEM]`
**Tests:** Buyer-intent + problem matching — does the subject get matched to the buyer's specific problem?
**Expected response type:** Recommendation with rationale

---

## Navigational

### `NAV_01`
**Query:** `[SUBJECT_NAME]`
**Tests:** Entity recognition — does the engine know the subject exists?
**Expected response type:** Entity description

### `NAV_02`
**Query:** `[SUBJECT_NAME] reviews`
**Tests:** Reputation surfacing — what does the engine say about the subject's reputation?
**Expected response type:** Review summary / sentiment

### `NAV_03`
**Query:** `Is [SUBJECT_NAME] reputable?`
**Tests:** Sentiment + trust signal
**Expected response type:** Yes/no with rationale
