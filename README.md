# Workflow Dispatch Trigger Action

Trigger a `workflow_dispatch` event on another workflow in the same or a different repository and return the triggered workflow's run ID.

This GitHub Action is useful when you need to programmatically trigger another workflow with specific inputs, while authenticating via a GitHub App for secure and scalable automation.

## Features

- Supports both the **workflow ID** or **workflow file name**.
- Authenticates using a **GitHub App** (via `actions/create-github-app-token`).
- Waits for the triggered workflow to register.
- Outputs the **workflow run ID** for further actions.

## Inputs

| Name | Description | Required | Default |
|:-----|:------------|:--------:|:-------:|
| `owner` | Owner of the repository (defaults to current repository owner) | No | Current owner |
| `repo` | Name of the repository (defaults to current repository) | No | Current repository |
| `workflow_id` | ID or file name of the workflow to trigger | **Yes** | - |
| `ref` | The git reference (branch, tag, or SHA) to run the workflow on | No | `${{ github.ref }}` |
| `app_id` | GitHub App ID used to generate a token | **Yes** | - |
| `private_key` | GitHub App private key used to generate a token | **Yes** | - |
| `workflow_inputs` | JSON string of inputs to pass to the triggered workflow | No | `{}` |

## Outputs

| Name | Description |
|:-----|:------------|
| `run_id` | ID of the triggered workflow run |

## Example Usage

Here’s how you can use this action inside a workflow to trigger another workflow:

```yaml
name: Trigger Another Workflow

on:
  workflow_dispatch:

jobs:
  trigger:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger downstream workflow
        uses: vtb-wanderers63/gha-workflow-dispatch@v1
        with:
          owner: your-org
          repo: target-repo
          workflow_id: main.yml # Or the workflow numeric ID
          ref: main
          app_id: ${{ secrets.GH_APP_ID }}
          private_key: ${{ secrets.GH_APP_PRIVATE_KEY }}
          workflow_inputs: |
            {
              "example_input_key": "example_value"
            }

      - name: Echo run ID
        run: echo "Triggered workflow run ID: ${{ steps.trigger.outputs.run_id }}"
```

> **Note:**  
> Replace `your-org/your-action-repo@v1` with the actual path to your action.  
> Make sure the GitHub App used has permission to access the repository and trigger workflows.

## How it Works

1. **Generates a GitHub App Token** using your GitHub App credentials.
2. **Dispatches the workflow** using the GitHub API.
3. **Waits** ~30 seconds for the workflow run to register.
4. **Retrieves the latest workflow run** matching the criteria.
5. **Outputs the workflow run ID** for downstream jobs.

## Requirements

- Node.js 20 is used (via `actions/setup-node@v3`).
- Your GitHub App must have the necessary repository permissions:
  - `Actions: read and write`
  - `Metadata: read-only`

## Branding

This Action will show in the GitHub Marketplace with:

- **Icon:** ▶️ (play)
- **Color:** Blue

