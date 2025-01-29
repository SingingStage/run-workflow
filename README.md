# GitHub Action: Dispatch Workflow

## Overview
This GitHub Action triggers a workflow dispatch event in a target repository. It is useful for automating CI/CD pipelines, cross-repository communication, or triggering workflows remotely.

## Features
- Dispatches a workflow in another repository.
- Supports custom inputs and secrets.
- Polls the dispatched workflow's status and sets the action's status code accordingly.
- Easily configurable via YAML.

## Usage
To use this action, include it in your workflow YAML file:

```yaml
name: Dispatch Workflow

on:
  push:
    branches:
      - main

jobs:
  trigger-workflow:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger remote workflow
        uses: universal-actions/dispatch-workflow-action@v1
        with:
          repo: "target-org/target-repo"
          workflow: "triggered-workflow.yml"
          token: "${{ secrets.GITHUB_TOKEN }}"
          inputs: '{"param1": "value1", "param2": "value2"}'
```

## Inputs
| Input       | Description                                  | Required |
|------------|--------------------------------|----------|
| `repo`     | The target repository in `owner/repo` format. | ✅ |
| `workflow` | The workflow file name to dispatch. | ✅ |
| `token`    | GitHub token with repo access. | ✅ |
| `inputs`   | JSON object with workflow inputs. | ❌ |

## Behavior
This action includes a polling mechanism that monitors the status of the dispatched
