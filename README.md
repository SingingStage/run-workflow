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
    runs-on: ubuntu-latest# GitHub Action: Dispatch Workflow

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
          repository: "target-org/target-repo"
          workflow: "triggered-workflow.yml"
          token: "${{ secrets.GITHUB_TOKEN }}"
          inputs: '{"param1": "value1", "param2": "value2"}'
```

## Inputs

| Input        | Description                                                     | Required | Default |
|-------------|-----------------------------------------------------------------|----------|---------|
| `token`     | GitHub token with repository permissions.                      | ✅        |         |
| `repository`| The repository in the format "owner/repo".                     | ✅        |         |
| `workflow`  | The workflow file name to dispatch (e.g., "my-workflow.yml"). | ✅        |         |
| `ref`       | The branch or tag to run the workflow on.                      | ✅        |         |
| `inputs`    | Optional JSON string of inputs to pass to the workflow.        | ❌        |         |
| `expected`  | The expected conclusion of the dispatched workflow (success or failure). | ❌ | `success` |
| `startTime` | The number of seconds to wait before starting the polling.     | ❌        | `12`    |
| `interval`  | Polling interval in seconds.                                   | ❌        | `2`     |
| `timeout`   | Timeout for polling in seconds. Default is 60 seconds (1 minute). | ❌    | `60`    |

## Behavior

This action includes a polling mechanism that monitors the status of the dispatched workflow. The action's exit code is determined based on the final status of the triggered workflow:

- If the dispatched workflow **succeeds**, the action completes successfully.
- If the dispatched workflow **fails**, the action exits with a failure status.
- If the workflow **times out**, the action also fails.

## Example Use Cases

- Triggering deployment workflows from another repo.
- Syncing jobs across repositories.
- Automating CI/CD tasks based on conditions.
- Ensuring a workflow completes successfully before proceeding.

## License

This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.


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
