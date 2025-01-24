const core = require('@actions/core');
const { Octokit } = require('@octokit/rest');
async function run() {
  try {
    // Log initial debug information
    core.info('Starting the workflow dispatcher...');
    core.info('Fetching inputs...');

    const token = core.getInput('token', { required: true });
    const repository = core.getInput('repository', { required: true });
    const workflow = core.getInput('workflow', { required: true });
    const ref = core.getInput('ref', { required: true });
    const inputs = core.getInput('inputs');

    // New parameters
    const startTime = new Date();
    const interval = 5000; // Polling interval in milliseconds
    const timeout = 300000; // Timeout in milliseconds (5 minutes)

    core.info(`Inputs received: 
      token: ${token ? '**** (masked)' : 'NOT PROVIDED'},
      repository: ${repository},
      workflow: ${workflow},
      ref: ${ref},
      inputs: ${inputs || 'None'}
    `);

    const [owner, repo] = repository.split('/');

    core.info(`Repository split into owner: ${owner}, repo: ${repo}`);

    // Initialize Octokit with fetch
    const octokit = new Octokit({
      auth: token,
      request: { fetch },
    });

    core.info('Octokit initialized with custom fetch implementation.');

    // Prepare payload
    const payload = {
      ref,
      inputs: inputs ? JSON.parse(inputs) : {},
    };

    core.info(
      `Triggering workflow ${workflow} in repository ${repository} on ref ${ref} with inputs: ${JSON.stringify(
        payload.inputs
      )}`
    );

    // Trigger workflow dispatch
    await octokit.actions.createWorkflowDispatch({
      owner,
      repo,
      workflow_id: workflow,
      ref,
      inputs: payload.inputs,
    });

    core.info(
      `Successfully triggered workflow ${workflow} in repository ${repository}`
    );

    // Poll for workflow completion
    const endTime = new Date(startTime.getTime() + timeout);
    while (new Date() < endTime) {
      core.info('Checking workflow status...');

      const runs = await octokit.actions.listWorkflowRuns({
        owner,
        repo,
        workflow_id: workflow,
        event: 'workflow_dispatch',
      });

      const relevantRun = runs.data.workflow_runs.find((run) => {
        const logContainsParameters = run.logs_url && checkLogsForParameters(run.logs_url, payload.inputs, octokit);
        return run.head_branch === ref && new Date(run.created_at) >= startTime && logContainsParameters;
      });

      if (relevantRun) {
        const status = relevantRun.status;
        const conclusion = relevantRun.conclusion;

        core.info(`Workflow run status: ${status}, conclusion: ${conclusion}`);

        if (status === 'completed') {
          if (conclusion === 'success') {
            core.info('Workflow completed successfully.');
            return;
          } else if (conclusion) {
            throw new Error(`Workflow completed with conclusion: ${conclusion}`);
          }
        }
      }

      await new Promise((resolve) => setTimeout(resolve, interval));
    }

    throw new Error('Timeout exceeded while waiting for the workflow to complete.');
  } catch (error) {
    // Log the error stack for better debugging
    core.error('An error occurred while running the workflow dispatcher.');
    core.error(error.stack || error.message);
    core.setFailed(error.message);
  }
}

async function checkLogsForParameters(logsUrl, inputs, octokit) {
  try {
    const logsResponse = await octokit.request(`GET ${logsUrl}`);
    const logsContent = logsResponse.data;

    // Ensure logsContent is a string
    const logsString = typeof logsContent === 'string' ? logsContent : JSON.stringify(logsContent);

    // Check if logs contain the specified inputs
    for (const [key, value] of Object.entries(inputs)) {
      if (!logsString.includes(`${key}: ${value}`)) {
        return false;
      }
    }
    return true;
  } catch (error) {
    core.error(`Error fetching or parsing logs: ${error.message}`);
    return false;
  }
}


run();
