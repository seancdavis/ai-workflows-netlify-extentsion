# Agent Runners Response Examples

Real response examples from Netlify's Agent Runners API. Use these to understand the actual data structure and field names.

## Table of Contents

- [Key Observations](#key-observations)
- [List Agent Runners](#list-agent-runners)
- [Get Single Agent Runner](#get-single-agent-runner)
- [Get Agent Runner Sessions](#get-agent-runner-sessions)
- [Redeploy Session](#redeploy-session)
- [Rebase Agent Runner](#rebase-agent-runner)
- [Field Reference](#field-reference)

---

## Key Observations

- **State values are lowercase** in API responses (`running`, `done`, `error`) - normalize to UPPERCASE when storing
- **Timestamps** are ISO 8601 format
- **Nullable fields** return `null`, not omitted
- **User objects** are embedded, not IDs
- **`mode`** is always present on sessions (defaults to `normal`)
- **`source_session_id`** only appears on redeploy sessions

---

## List Agent Runners

```
GET /api/v1/agent_runners?site_id={SITE_ID}
```

```json
[
  {
    "id": "{RUNNER_ID}",
    "site_id": "{SITE_ID}",
    "created_at": "2026-01-24T13:24:47.547Z",
    "updated_at": "2026-01-24T13:28:35.850Z",
    "title": "Unable to Attach Linear Issues to Research Board in Admin Mode",
    "branch": "main",
    "result_branch": null,
    "pr_url": null,
    "pr_branch": null,
    "pr_is_being_created": false,
    "pr_state": null,
    "pr_number": null,
    "state": "running",
    "done_at": null,
    "parent_agent_runner_id": null,
    "current_task": "Run `git add src/pages/admin/ResearchAdminPage.tsx`",
    "sha": "{COMMIT_SHA}",
    "merge_commit_sha": null,
    "merge_commit_error": null,
    "merge_commit_is_being_created": false,
    "pr_error": null,
    "base_deploy_id": null,
    "last_session_created_at": "2026-01-24T13:24:47.547Z",
    "has_result_diff": false,
    "user": {
      "id": "{USER_ID}",
      "full_name": "Example User",
      "email": "user@example.com",
      "avatar_url": "https://avatars0.githubusercontent.com/u/12345?v=4"
    },
    "contributors": [
      {
        "id": "{USER_ID}",
        "full_name": "Example User",
        "email": "user@example.com",
        "avatar_url": "https://avatars0.githubusercontent.com/u/12345?v=4"
      }
    ],
    "active_session_created_at": "2026-01-24T13:24:47.649Z",
    "attached_file_keys": [
      "user-uploaded-content/{ACCOUNT_ID}/{UUID}/screenshot.png"
    ],
    "latest_session_state": "running"
  },
  {
    "id": "{RUNNER_ID_2}",
    "site_id": "{SITE_ID}",
    "created_at": "2026-01-24T13:02:09.924Z",
    "updated_at": "2026-01-24T13:04:33.231Z",
    "title": "Navigate to previous Friday if current day is a weekend in daily view",
    "branch": "main",
    "result_branch": null,
    "pr_url": null,
    "pr_branch": null,
    "pr_is_being_created": false,
    "pr_state": null,
    "pr_number": null,
    "state": "done",
    "done_at": "2026-01-24T13:04:33.193Z",
    "parent_agent_runner_id": null,
    "current_task": null,
    "sha": "{COMMIT_SHA}",
    "merge_commit_sha": null,
    "merge_commit_error": null,
    "merge_commit_is_being_created": false,
    "pr_error": null,
    "base_deploy_id": null,
    "last_session_created_at": "2026-01-24T13:02:09.924Z",
    "has_result_diff": true,
    "user": {
      "id": "{USER_ID}",
      "full_name": "Example User",
      "email": "user@example.com",
      "avatar_url": "https://avatars0.githubusercontent.com/u/12345?v=4"
    },
    "contributors": [
      {
        "id": "{USER_ID}",
        "full_name": "Example User",
        "email": "user@example.com",
        "avatar_url": "https://avatars0.githubusercontent.com/u/12345?v=4"
      }
    ],
    "attached_file_keys": [],
    "latest_session_deploy_id": "{DEPLOY_ID}",
    "latest_session_deploy_url": "https://agent-{RUNNER_ID}--{SITE_NAME}.netlify.app",
    "latest_session_state": "done"
  },
  {
    "id": "{RUNNER_ID_3}",
    "site_id": "{SITE_ID}",
    "created_at": "2026-01-24T12:33:34.171Z",
    "updated_at": "2026-01-24T12:42:20.392Z",
    "title": "Enable read-only access to research board, hide private SCD tasks",
    "branch": "main",
    "result_branch": "agent-hide-private-scd-tasks-55a5",
    "pr_url": "https://github.com/{OWNER}/{REPO}/pull/2",
    "pr_branch": "agent-hide-private-scd-tasks-55a5",
    "pr_is_being_created": false,
    "pr_state": "open",
    "pr_number": 2,
    "state": "done",
    "done_at": "2026-01-24T12:37:02.068Z",
    "parent_agent_runner_id": null,
    "current_task": null,
    "sha": "{COMMIT_SHA}",
    "merge_commit_sha": null,
    "merge_commit_error": null,
    "merge_commit_is_being_created": false,
    "pr_error": null,
    "base_deploy_id": null,
    "last_session_created_at": "2026-01-24T12:33:34.171Z",
    "has_result_diff": true,
    "user": {
      "id": "{USER_ID}",
      "full_name": "Example User",
      "email": "user@example.com",
      "avatar_url": "https://avatars0.githubusercontent.com/u/12345?v=4"
    },
    "contributors": [
      {
        "id": "{USER_ID}",
        "full_name": "Example User",
        "email": "user@example.com",
        "avatar_url": "https://avatars0.githubusercontent.com/u/12345?v=4"
      }
    ],
    "attached_file_keys": [],
    "latest_session_deploy_id": "{DEPLOY_ID}",
    "latest_session_deploy_url": "https://agent-{RUNNER_ID}--{SITE_NAME}.netlify.app",
    "latest_session_state": "done"
  }
]
```

---

## Get Single Agent Runner

```
GET /api/v1/agent_runners/{RUNNER_ID}
```

```json
{
  "id": "{RUNNER_ID}",
  "site_id": "{SITE_ID}",
  "created_at": "2026-01-24T13:24:47.547Z",
  "updated_at": "2026-01-24T13:29:16.065Z",
  "title": "Unable to Attach Linear Issues to Research Board in Admin Mode",
  "branch": "main",
  "result_branch": null,
  "pr_url": null,
  "pr_branch": null,
  "pr_is_being_created": false,
  "pr_state": null,
  "pr_number": null,
  "state": "done",
  "done_at": "2026-01-24T13:29:16.036Z",
  "parent_agent_runner_id": null,
  "current_task": null,
  "sha": "{COMMIT_SHA}",
  "merge_commit_sha": null,
  "merge_commit_error": null,
  "merge_commit_is_being_created": false,
  "pr_error": null,
  "base_deploy_id": null,
  "last_session_created_at": "2026-01-24T13:24:47.547Z",
  "has_result_diff": false,
  "user": {
    "id": "{USER_ID}",
    "full_name": "Example User",
    "email": "user@example.com",
    "avatar_url": "https://avatars0.githubusercontent.com/u/12345?v=4"
  },
  "contributors": [
    {
      "id": "{USER_ID}",
      "full_name": "Example User",
      "email": "user@example.com",
      "avatar_url": "https://avatars0.githubusercontent.com/u/12345?v=4"
    }
  ],
  "attached_file_keys": [
    "user-uploaded-content/{ACCOUNT_ID}/{UUID}/screenshot.png"
  ],
  "latest_session_state": "done"
}
```

---

## Get Agent Runner Sessions

```
GET /api/v1/agent_runners/{RUNNER_ID}/sessions
```

```json
[
  {
    "id": "{SESSION_ID}",
    "agent_runner_id": "{RUNNER_ID}",
    "created_at": "2026-01-24T13:24:47.649Z",
    "updated_at": "2026-01-24T13:29:16.040Z",
    "title": "Unable to Attach Linear Issues to Research Board in Admin Mode",
    "prompt": "I can no longer attach linear issues to the research board when I am in admin mode.",
    "agent_config": {
      "agent": "gemini",
      "model": null
    },
    "result": "# Fixed: Research Board Linear Issue Attachment\n\nResolved an issue where users were seeing Linear issues...",
    "duration": 255706,
    "steps": [
      {
        "title": "Configuring environment"
      },
      {
        "message": "I will start by reading the CLAUDE.md file...",
        "id": 0
      },
      {
        "title": "Read `CLAUDE.md`",
        "id": 1
      },
      {
        "title": "Run `npm run build`",
        "message": "```\n> build\n> tsc -b && vite build\n...\n```",
        "id": 23
      },
      {
        "title": "Building and deploying the preview"
      }
    ],
    "state": "done",
    "done_at": "2026-01-24T13:29:16.036Z",
    "result_zip_file_name": null,
    "commit_sha": null,
    "attached_file_keys": [
      "user-uploaded-content/{ACCOUNT_ID}/{UUID}/screenshot.png"
    ],
    "is_published": false,
    "is_discarded": false,
    "has_result_diff": false,
    "has_cumulative_diff": false,
    "mode": "normal",
    "dev_server_id": "{DEV_SERVER_ID}",
    "user": {
      "id": "{USER_ID}",
      "full_name": "Example User",
      "email": "user@example.com",
      "avatar_url": "https://avatars0.githubusercontent.com/u/12345?v=4"
    }
  }
]
```

---

## Redeploy Session

```
POST /api/v1/agent_runners/{RUNNER_ID}/sessions/{SESSION_ID}/redeploy
```

```json
{
  "id": "{NEW_SESSION_ID}",
  "agent_runner_id": "{RUNNER_ID}",
  "created_at": "2026-01-25T10:15:22.100Z",
  "updated_at": "2026-01-25T10:15:22.100Z",
  "title": null,
  "prompt": null,
  "agent_config": {},
  "result": null,
  "duration": 0,
  "steps": [],
  "state": "new",
  "done_at": null,
  "result_zip_file_name": null,
  "commit_sha": null,
  "attached_file_keys": [],
  "is_published": false,
  "is_discarded": false,
  "has_result_diff": false,
  "has_cumulative_diff": false,
  "mode": "redeploy",
  "source_session_id": "{SESSION_ID}",
  "user": {
    "id": "{USER_ID}",
    "full_name": "Example User",
    "email": "user@example.com",
    "avatar_url": "https://avatars0.githubusercontent.com/u/12345?v=4"
  }
}
```

---

## Rebase Agent Runner

```
POST /api/v1/agent_runners/{RUNNER_ID}/rebase
```

Returns the newly created rebase session:

```json
{
  "id": "{REBASE_SESSION_ID}",
  "agent_runner_id": "{RUNNER_ID}",
  "created_at": "2026-01-25T14:30:00.000Z",
  "updated_at": "2026-01-25T14:30:00.000Z",
  "title": null,
  "prompt": null,
  "agent_config": {},
  "result": null,
  "duration": 0,
  "steps": [],
  "state": "new",
  "done_at": null,
  "result_zip_file_name": null,
  "commit_sha": null,
  "attached_file_keys": [],
  "is_published": false,
  "is_discarded": false,
  "has_result_diff": false,
  "has_cumulative_diff": false,
  "mode": "rebase",
  "user": {
    "id": "{USER_ID}",
    "full_name": "Example User",
    "email": "user@example.com",
    "avatar_url": "https://avatars0.githubusercontent.com/u/12345?v=4"
  }
}
```

---

## Field Reference

### Agent Runner Fields

| Field                       | Type         | Notes                                                                  |
| --------------------------- | ------------ | ---------------------------------------------------------------------- |
| `state`                     | string       | `new`, `running`, `done`, `error`, `cancelled`, `archived` (lowercase) |
| `pr_url`                    | string\|null | Full GitHub PR URL when PR exists                                      |
| `pr_state`                  | string\|null | `open`, `closed`, `merged`, `draft`                                    |
| `latest_session_deploy_url` | string\|null | Deploy preview URL                                                     |
| `current_task`              | string\|null | What agent is currently doing (when running)                           |
| `has_result_diff`           | boolean      | Whether there are code changes to review                               |
| `active_session_created_at` | string\|null | Only present when a session is active                                  |
| `latest_session_state`      | string\|null | State of the most recent session                                       |

### Session Fields

| Field                 | Type         | Notes                                                      |
| --------------------- | ------------ | ---------------------------------------------------------- |
| `state`               | string       | `new`, `running`, `done`, `error`, `cancelled` (lowercase) |
| `agent_config.agent`  | string\|null | `claude`, `gemini`, `codex`                                |
| `agent_config.model`  | string\|null | Specific model variant                                     |
| `duration`            | number\|null | Milliseconds                                               |
| `steps`               | array        | Progress steps with `title` and optional `message`         |
| `result`              | string\|null | Markdown summary of what was done                          |
| `mode`                | string       | `normal`, `redeploy`, `rebase`, `create`, `ask`            |
| `source_session_id`   | string\|null | Only present on redeploy sessions                          |
| `is_discarded`        | boolean      | `true` if session was discarded via revert                 |
| `has_result_diff`     | boolean      | Whether this session produced a diff                       |
| `has_cumulative_diff` | boolean      | Whether cumulative diff exists up to this session          |
