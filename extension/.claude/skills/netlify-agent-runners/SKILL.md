---
name: netlify-agent-runners
description: API reference and workflow guidance for Netlify Agent Runners — the API that powers Netlify's AI agent coding sessions. Use when working with agent runner endpoints, creating or managing agent runners and sessions, polling for status, reviewing diffs, creating PRs, or committing changes via the Netlify API.
---

# Netlify Agent Runners

Agent runners are Netlify's AI-powered coding sessions. Each runner is tied to a site, works from a deploy/branch, and contains one or more sessions (prompts). Sessions produce diffs that can be reviewed, committed, or turned into PRs.

## Base URL

```
https://api.netlify.com/api/v1
```

All endpoints require `Authorization: Bearer <token>`.

## Quick Reference

| Action                      | Method | Endpoint                                              |
| --------------------------- | ------ | ----------------------------------------------------- |
| List runners                | GET    | `/agent_runners?site_id=X&account_id=Y`               |
| Get runner                  | GET    | `/agent_runners/{id}`                                  |
| Create runner               | POST   | `/agent_runners?site_id=X`                             |
| Update runner               | PATCH  | `/agent_runners/{id}`                                  |
| Stop runner                 | DELETE | `/agent_runners/{id}`                                  |
| Archive runner              | POST   | `/agent_runners/{id}/archive`                          |
| Revert runner               | POST   | `/agent_runners/{id}/revert`                           |
| Rebase runner               | POST   | `/agent_runners/{id}/rebase`                           |
| Get diff                    | GET    | `/agent_runners/{id}/diff`                             |
| Create PR                   | POST   | `/agent_runners/{id}/pull_request`                     |
| Commit to branch            | POST   | `/agent_runners/{id}/commit`                           |
| Get upload URL              | POST   | `/agent_runners/upload_url`                            |
| Get delete URL              | POST   | `/agent_runners/delete_url`                            |
| List sessions               | GET    | `/agent_runners/{id}/sessions`                         |
| Get session                 | GET    | `/agent_runners/{id}/sessions/{sid}`                   |
| Create session              | POST   | `/agent_runners/{id}/sessions`                         |
| Update session              | PATCH  | `/agent_runners/{id}/sessions/{sid}`                   |
| Stop session                | DELETE | `/agent_runners/{id}/sessions/{sid}`                   |
| Redeploy session            | POST   | `/agent_runners/{id}/sessions/{sid}/redeploy`          |
| Get session result diff     | GET    | `/agent_runners/{id}/sessions/{sid}/diff/result`       |
| Get session cumulative diff | GET    | `/agent_runners/{id}/sessions/{sid}/diff/cumulative`   |
| Get diff upload URLs        | POST   | `/agent_runners/{id}/sessions/{sid}/diff/upload_urls`  |

## Key Concepts

- **Agent Runner** = a coding task tied to a site. Has state: `new`, `running`, `done`, `error`, `cancelled`, `archived`.
- **Session** = a single prompt/turn within a runner. Has state: `new`, `running`, `done`, `error`, `cancelled`. Modes: `normal`, `redeploy`, `rebase`, `create`, `ask`.
- Runners are scoped to a **site** (`site_id` required on create). The site determines the repo, account, and base deploy.
- The **user** is inferred from the access token.
- Sessions produce **diffs** (result diff = this session's changes, cumulative diff = all changes so far).

## Common Workflow

```bash
export NETLIFY_TOKEN="..."
export SITE_ID="..."
export BASE="https://api.netlify.com/api/v1"

# 1. Create runner (starts first session automatically)
curl -X POST "$BASE/agent_runners?site_id=$SITE_ID" \
  -H "Authorization: Bearer $NETLIFY_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"prompt": "Add a contact form to the homepage"}'

# 2. Poll for completion (check state field)
curl "$BASE/agent_runners/RUNNER_ID" -H "Authorization: Bearer $NETLIFY_TOKEN"

# 3. Send follow-up prompt (creates new session)
curl -X POST "$BASE/agent_runners/RUNNER_ID/sessions" \
  -H "Authorization: Bearer $NETLIFY_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"prompt": "Add form validation"}'

# 4. Review diff
curl "$BASE/agent_runners/RUNNER_ID/diff" -H "Authorization: Bearer $NETLIFY_TOKEN"

# 5. Create PR or commit
curl -X POST "$BASE/agent_runners/RUNNER_ID/pull_request" \
  -H "Authorization: Bearer $NETLIFY_TOKEN"
```

## Important Notes

- State values are **lowercase** in API responses (`running`, `done`, `error`)
- Timestamps are ISO 8601 format
- Nullable fields return `null`, not omitted
- User objects are embedded, not IDs
- `mode` is always present on sessions (defaults to `normal`)
- `source_session_id` only appears on redeploy sessions
- Commit endpoint cannot target the main branch
- Rebase is only for non-git sites

## Detailed References

- **Full API endpoint docs**: See [references/api-reference.md](references/api-reference.md) for complete parameter tables, request/response schemas, data models, and all endpoint details.
- **Response examples**: See [references/response-examples.md](references/response-examples.md) for real API response payloads showing actual field names and data structures.
