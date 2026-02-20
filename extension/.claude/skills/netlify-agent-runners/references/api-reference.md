# Agent Runners API Reference

Complete endpoint documentation for the Netlify Agent Runners API.

## Table of Contents

- [Agent Runners](#agent-runners)
  - [List Agent Runners](#list-agent-runners)
  - [Get Agent Runner](#get-agent-runner)
  - [Create Agent Runner](#create-agent-runner)
  - [Update Agent Runner](#update-agent-runner)
  - [Stop Agent Runner](#stop-agent-runner)
  - [Archive Agent Runner](#archive-agent-runner)
  - [Revert Agent Runner](#revert-agent-runner)
  - [Rebase Agent Runner](#rebase-agent-runner)
  - [Get Agent Runner Diff](#get-agent-runner-diff)
  - [Create Pull Request](#create-pull-request)
  - [Commit to Branch](#commit-to-branch)
  - [File Upload URL](#create-file-upload-url)
  - [File Delete URL](#create-file-delete-url)
- [Sessions](#agent-runner-sessions)
  - [List Sessions](#list-sessions)
  - [Get Session](#get-session)
  - [Create Session](#create-session)
  - [Update Session](#update-session)
  - [Stop Session](#stop-session)
  - [Redeploy Session](#redeploy-session)
- [Session Diffs](#session-diffs)
  - [Get Result Diff](#get-result-diff)
  - [Get Cumulative Diff](#get-cumulative-diff)
  - [Create Diff Upload URLs](#create-diff-upload-urls)
- [Data Models](#data-models)
- [Error Responses](#error-responses)

---

## Tying Runs to Sites and Users

### Site Association

Agent runners are always associated with a **site**. When creating an agent runner, provide a `site_id`:

```bash
POST /api/v1/agent_runners?site_id=YOUR_SITE_ID
```

The site determines:
- Which repository the agent works with
- Which account/team is billed
- Which deploy to start from (if not specified, uses main branch)

### User Association

The **user** is automatically determined from the access token. The authenticated user becomes:
- The creator of the agent runner
- Part of the `contributors` list for the runner
- Recorded in the `user` field of each session they create

### Account Association

The **account** (team) is derived from the site. The account must:
- Have agent runners enabled on their plan
- Have sufficient credits available

---

## Agent Runners

### List Agent Runners

```
GET /api/v1/agent_runners
```

**Query Parameters:**

| Parameter       | Type    | Required | Description                         |
| --------------- | ------- | -------- | ----------------------------------- |
| `account_id`    | string  | Yes      | The ID of the account               |
| `site_id`       | string  | Yes      | The ID of the site                  |
| `page`          | integer | No       | Page of results (default: 1)        |
| `per_page`      | integer | No       | Results per page (default/max: 100) |
| `state`         | enum    | No       | Filter by state: `live`, `error`    |
| `title`         | string  | No       | Filter by title                     |
| `branch`        | string  | No       | Filter by source branch             |
| `result_branch` | string  | No       | Filter by result branch             |
| `user_id`       | string  | No       | Filter by creator user ID           |
| `from`          | integer | No       | Unix timestamp - created since      |
| `to`            | integer | No       | Unix timestamp - created before     |

**Response:** `200 OK` - Array of `AgentRunner` objects

---

### Get Agent Runner

```
GET /api/v1/agent_runners/{agent_runner_id}
```

**Path Parameters:**

| Parameter         | Type   | Required | Description                |
| ----------------- | ------ | -------- | -------------------------- |
| `agent_runner_id` | string | Yes      | The ID of the agent runner |

**Response:** `200 OK` - `AgentRunner` object

---

### Create Agent Runner

```
POST /api/v1/agent_runners
```

**Query Parameters:**

| Parameter | Type   | Required | Description        |
| --------- | ------ | -------- | ------------------ |
| `site_id` | string | Yes      | The ID of the site |

**Request Body (JSON):**

| Field                    | Type            | Required | Description                                  |
| ------------------------ | --------------- | -------- | -------------------------------------------- |
| `prompt`                 | string          | Yes      | The task prompt for the agent                |
| `deploy_id`              | string          | No       | Deploy ID to start from (overrides `branch`) |
| `branch`                 | string          | No       | Branch to build (defaults to main branch)    |
| `agent`                  | string          | No       | Agent type identifier                        |
| `model`                  | string          | No       | LLM model to use                             |
| `mode`                   | string          | No       | Session mode: `normal`, `create`, or `ask`   |
| `parent_agent_runner_id` | string          | No       | Parent agent runner ID (for branching)       |
| `dev_server_image`       | string          | No       | Custom dev server image                      |
| `file_keys`              | array\<string\> | No       | S3 keys of uploaded files to attach          |

**Response:**
- `200 OK` - `AgentRunner` object
- `400 Bad Request` - No prompt provided
- `404 Not Found` - Site not found
- `422 Unprocessable Entity` - Deploy not found or zip doesn't exist

---

### Update Agent Runner

```
PATCH /api/v1/agent_runners/{agent_runner_id}
```

**Path Parameters:**

| Parameter         | Type   | Required | Description                |
| ----------------- | ------ | -------- | -------------------------- |
| `agent_runner_id` | string | Yes      | The ID of the agent runner |

**Request Body (JSON):**

| Field                | Type    | Required | Description                                  |
| -------------------- | ------- | -------- | -------------------------------------------- |
| `base_deploy_id`     | string  | No       | Deploy ID to use as base for future sessions |
| `result_diff`        | string  | No       | The result diff content                      |
| `result_diff_binary` | boolean | No       | Whether diff is binary                       |
| `result_diff_s3_key` | string  | No       | S3 key for stored diff                       |
| `sha`                | string  | No       | Start commit SHA                             |

**Response:** `200 OK` - `AgentRunner` object

---

### Stop Agent Runner

```
DELETE /api/v1/agent_runners/{agent_runner_id}
```

Stop the currently running session of an agent runner.

**Response:** `202 Accepted`

---

### Archive Agent Runner

```
POST /api/v1/agent_runners/{agent_runner_id}/archive
```

Archive an agent runner (soft delete).

**Response:** `202 Accepted`, `404 Not Found`, or `422 Unprocessable Entity`

---

### Revert Agent Runner

```
POST /api/v1/agent_runners/{agent_runner_id}/revert
```

Revert an agent runner to a specific session. All sessions after the specified session will be marked as discarded.

**Request Body (JSON):**

| Field        | Type   | Required | Description                        |
| ------------ | ------ | -------- | ---------------------------------- |
| `session_id` | string | Yes      | The ID of the session to revert to |

**Response:**
- `200 OK` - `AgentRunner` object
- `400 Bad Request` - Cannot revert (e.g., first session or committed sessions)
- `404 Not Found` - Session not found

---

### Rebase Agent Runner

```
POST /api/v1/agent_runners/{agent_runner_id}/rebase
```

Rebase an agent runner onto the current production deploy. Only available for non-git sites when the production deploy has changed since the runner was created. Creates a new rebase session that re-applies the existing diff against the updated base.

**Response:**
- `200 OK` - `AgentRunnerSession` object (the newly created rebase session)
- `400 Bad Request` - No diff to rebase, or already on latest production deploy
- `422 Unprocessable Entity` - Site has a git repository (rebase is only for non-git sites)

---

### Get Agent Runner Diff

```
GET /api/v1/agent_runners/{agent_runner_id}/diff
```

**Query Parameters:**

| Parameter      | Type    | Required | Description                          |
| -------------- | ------- | -------- | ------------------------------------ |
| `page`         | integer | No       | Page of files (omit for entire diff) |
| `per_page`     | integer | No       | Files per page (default/max: 100)    |
| `strip_binary` | boolean | No       | Strip binary content from diff       |

**Response:** `200 OK` - Plain text diff content (`text/plain`), or `404 Not Found`

---

### Create Pull Request

```
POST /api/v1/agent_runners/{agent_runner_id}/pull_request
```

Create a pull request using the most recent completed session with a diff.

**Response:**
- `200 OK` - `AgentRunner` object (with `pr_url`, `pr_branch`, `pr_state`, `pr_number` populated)
- `400 Bad Request`, `409 Conflict`, `422 Unprocessable Entity`

---

### Commit to Branch

```
POST /api/v1/agent_runners/{agent_runner_id}/commit
```

Commit agent runner changes directly to a branch (cannot be main branch).

**Request Body (JSON):**

| Field           | Type   | Required | Description                    |
| --------------- | ------ | -------- | ------------------------------ |
| `target_branch` | string | Yes      | The target branch to commit to |

**Response:**
- `200 OK` - `AgentRunner` object (with `merge_commit_sha` populated)
- `400 Bad Request` - Missing target_branch or trying to commit to main
- `409 Conflict`, `422 Unprocessable Entity`

---

### Create File Upload URL

```
POST /api/v1/agent_runners/upload_url
```

Generate a presigned S3 URL for uploading files to attach to agent runner sessions.

**Request Body (JSON):**

| Field          | Type   | Required | Description           |
| -------------- | ------ | -------- | --------------------- |
| `account_id`   | string | Yes      | The ID of the account |
| `filename`     | string | Yes      | Original filename     |
| `content_type` | string | Yes      | MIME type of the file |

**Allowed File Types:**
- Text: `.txt`, `.md`, `.html`, `.json`, `.yaml`, `.yml`, `.xml`, `.csv`
- Images: `.png`, `.jpg`, `.jpeg`, `.gif`, `.svg`, `.webp`
- Code: `.js`, `.ts`, `.css`, `.scss`, `.sass`, `.less`, `.py`, `.java`, `.rb`, `.go`, `.php`, `.sql`
- Documents: `.pdf`

**Response:** `200 OK` with `upload_url` and `file_key`

---

### Create File Delete URL

```
POST /api/v1/agent_runners/delete_url
```

**Request Body (JSON):**

| Field        | Type   | Required | Description               |
| ------------ | ------ | -------- | ------------------------- |
| `account_id` | string | Yes      | The ID of the account     |
| `file_key`   | string | Yes      | The S3 file key to delete |

**Response:** `200 OK` with `delete_url` and `file_key`

---

## Agent Runner Sessions

### List Sessions

```
GET /api/v1/agent_runners/{agent_runner_id}/sessions
```

**Query Parameters:**

| Parameter           | Type    | Required | Description                                 |
| ------------------- | ------- | -------- | ------------------------------------------- |
| `page`              | integer | No       | Page of results (default: 1)                |
| `per_page`          | integer | No       | Results per page (default/max: 100)         |
| `state`             | enum    | No       | Filter by state: `live`, `error`            |
| `from`              | integer | No       | Unix timestamp - created since              |
| `to`                | integer | No       | Unix timestamp - created before             |
| `order_by`          | enum    | No       | Sort order: `asc`, `desc`                   |
| `include_discarded` | boolean | No       | Include discarded sessions (default: false) |

**Response:** `200 OK` - Array of `AgentRunnerSession` objects

---

### Get Session

```
GET /api/v1/agent_runners/{agent_runner_id}/sessions/{agent_runner_session_id}
```

**Response:** `200 OK` - `AgentRunnerSession` object

---

### Create Session

```
POST /api/v1/agent_runners/{agent_runner_id}/sessions
```

Create a new session (follow-up prompt) for an existing agent runner.

**Request Body (JSON):**

| Field              | Type            | Required | Description                         |
| ------------------ | --------------- | -------- | ----------------------------------- |
| `prompt`           | string          | Yes      | The task prompt for this session    |
| `agent`            | string          | No       | Agent type identifier               |
| `model`            | string          | No       | LLM model to use                    |
| `dev_server_image` | string          | No       | Custom dev server image             |
| `file_keys`        | array\<string\> | No       | S3 keys of uploaded files to attach |

**Response:**
- `200 OK` - `AgentRunnerSession` object
- `400 Bad Request` - No prompt provided
- `404 Not Found`
- `422 Unprocessable Entity` - Deploy zip no longer exists

---

### Update Session

```
PATCH /api/v1/agent_runners/{agent_runner_id}/sessions/{agent_runner_session_id}
```

**Request Body (JSON):**

| Field                    | Type    | Required | Description                           |
| ------------------------ | ------- | -------- | ------------------------------------- |
| `title`                  | string  | No       | Session title                         |
| `steps`                  | array   | No       | Array of step objects                 |
| `result`                 | string  | No       | Session result text                   |
| `result_branch`          | string  | No       | Result branch name                    |
| `result_diff`            | string  | No       | Result diff content                   |
| `result_diff_binary`     | boolean | No       | Whether result diff is binary         |
| `result_diff_s3_key`     | string  | No       | S3 key for result diff                |
| `cumulative_diff`        | string  | No       | Cumulative diff content               |
| `cumulative_diff_binary` | boolean | No       | Whether cumulative diff is binary     |
| `cumulative_diff_s3_key` | string  | No       | S3 key for cumulative diff            |
| `duration`               | number  | No       | Session duration in seconds           |
| `result_zip_file_name`   | string  | No       | Result zip filename                   |
| `deploy_id`              | string  | No       | Associated deploy ID                  |
| `state`                  | string  | No       | Session state                         |
| `is_published`           | boolean | No       | Whether session is published          |
| `has_netlify_form`       | boolean | No       | Whether session has Netlify form      |
| `has_netlify_identity`   | boolean | No       | Whether session uses Netlify Identity |
| `diff_produced`          | boolean | No       | Whether diff was produced             |

**Response:** `200 OK` - `AgentRunnerSession` object

---

### Stop Session

```
DELETE /api/v1/agent_runners/{agent_runner_id}/sessions/{agent_runner_session_id}
```

**Response:** `202 Accepted`

---

### Redeploy Session

```
POST /api/v1/agent_runners/{agent_runner_id}/sessions/{agent_runner_session_id}/redeploy
```

Create a redeploy session that skips AI inference and applies the existing diff from the source session. Used to rebuild a preview with updated env vars or settings.

**Preconditions:**
- Source session must be in `DONE` state
- Source session must have a cumulative diff
- Agent runner must not have an active session

**Response:**
- `200 OK` - `AgentRunnerSession` object (the newly created redeploy session)
- `400 Bad Request` - Source session not completed or has no diff
- `403 Forbidden` - Usage limit reached
- `409 Conflict` - Agent runner already has an active session
- `422 Unprocessable Entity` - Session has no changes to redeploy

---

## Session Diffs

### Get Result Diff

```
GET /api/v1/agent_runners/{agent_runner_id}/sessions/{agent_runner_session_id}/diff/result
```

**Response:** `200 OK` - Plain text diff content (`text/plain`), or `404 Not Found`

---

### Get Cumulative Diff

```
GET /api/v1/agent_runners/{agent_runner_id}/sessions/{agent_runner_session_id}/diff/cumulative
```

Get the cumulative diff content (all changes from all sessions up to this one).

**Response:** `200 OK` - Plain text diff content (`text/plain`), or `404 Not Found`

---

### Create Diff Upload URLs

```
POST /api/v1/agent_runners/{agent_runner_id}/sessions/{agent_runner_session_id}/diff/upload_urls
```

Generate presigned S3 URLs for uploading session diffs.

**Response:** `200 OK` with `result` and `cumulative` objects, each containing `upload_url` and `s3_key`.

---

## Data Models

### AgentRunner

```json
{
  "id": "string",
  "site_id": "string",
  "parent_agent_runner_id": "string | null",
  "state": "NEW | RUNNING | ERROR | DONE | CANCELLED | ARCHIVED",
  "created_at": "ISO 8601 timestamp",
  "updated_at": "ISO 8601 timestamp",
  "done_at": "ISO 8601 timestamp | null",
  "title": "string",
  "branch": "string",
  "result_branch": "string | null",
  "pr_url": "string | null",
  "pr_branch": "string | null",
  "pr_state": "OPEN | CLOSED | MERGED | DRAFT | null",
  "pr_number": "integer | null",
  "pr_is_being_created": "boolean",
  "pr_error": "string | null",
  "current_task": "string | null",
  "sha": "string | null",
  "merge_commit_sha": "string | null",
  "merge_commit_error": "string | null",
  "merge_commit_is_being_created": "boolean",
  "base_deploy_id": "string | null",
  "last_session_created_at": "ISO 8601 timestamp | null",
  "has_result_diff": "boolean",
  "user": "AgentRunnerUser | null",
  "contributors": "array<AgentRunnerUser>",
  "active_session_created_at": "ISO 8601 timestamp | null",
  "attached_file_keys": "array<string>",
  "latest_session_deploy_id": "string | null",
  "latest_session_deploy_url": "string | null",
  "latest_session_state": "string | null"
}
```

### AgentRunnerSession

```json
{
  "id": "string",
  "agent_runner_id": "string",
  "dev_server_id": "string | null",
  "state": "NEW | RUNNING | ERROR | DONE | CANCELLED",
  "created_at": "ISO 8601 timestamp",
  "updated_at": "ISO 8601 timestamp",
  "done_at": "ISO 8601 timestamp | null",
  "title": "string",
  "prompt": "string",
  "agent_config": {
    "agent": "string | null",
    "model": "string | null"
  },
  "result": "string | null",
  "duration": "number | null",
  "steps": [
    {
      "title": "string",
      "message": "string"
    }
  ],
  "commit_sha": "string | null",
  "deploy_id": "string | null",
  "deploy_url": "string | null",
  "result_zip_file_name": "string | null",
  "attached_file_keys": "array<string>",
  "is_published": "boolean",
  "is_discarded": "boolean",
  "has_result_diff": "boolean",
  "has_cumulative_diff": "boolean",
  "mode": "normal | redeploy | rebase | create | ask",
  "source_session_id": "string | null",
  "user": "AgentRunnerUser | null"
}
```

### AgentRunnerUser

```json
{
  "id": "string",
  "full_name": "string",
  "email": "string",
  "avatar_url": "string | null"
}
```

---

## Error Responses

All endpoints may return:

| Status                      | Description                                                         |
| --------------------------- | ------------------------------------------------------------------- |
| `400 Bad Request`           | Invalid request parameters                                          |
| `401 Unauthorized`          | Missing or invalid authentication                                   |
| `403 Forbidden`             | Account cannot use agent runners (plan restriction or credit limit) |
| `404 Not Found`             | Resource not found or feature not enabled                           |
| `422 Unprocessable Entity`  | Validation error (e.g., deploy zip doesn't exist)                   |
| `500 Internal Server Error` | Server error                                                        |

Error response body:

```json
{
  "error": "Error message description"
}
```
