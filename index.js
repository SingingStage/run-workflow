const core = require('@actions/core');
const { Octokit } = require('@octokit/rest');

async function checkLogsForParameters(logsUrl, inputs, interval, token) {
  try {
    const logsResponse = await fetch(logsUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/vnd.github.v3+json',
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!logsResponse.ok) {
      if (logsResponse.status === 404) {
        core.warning('Logs are not yet available. Retrying...');
        await new Promise((resolve) => setTimeout(resolve, interval * 1000));
        return false;
      } else {
        throw new Error(`Failed to fetch logs: ${logsResponse.statusText}`);
      }
    }

    const logsContent = await logsResponse.text();

    for (const [key, value] of Object.entries(inputs)) {
      if (!logsContent.includes(`${key}: ${value}`)) {
        core.warning(`Input ${key}: ${value} not found in logs.`);
        return false;
      }
    }
    return true;
  } catch (error) {
    core.error(`Critical error fetching logs: ${error.message}`);
    core.setFailed(`Error fetching logs: ${error.message}`);
    throw error;
  }
}

async function run() {
  try {
    const token = core.getInput('token', { required: true });
    const repository = core.getInput('repository', { required: true });
    const workflow = core.getInput('workflow', { required: true });
    const ref = core.getInput('ref', { required: true });
    const inputs = core.getInput('inputs');
    const expected = core.getInput('expected', { required: false });
    const startTime = parseInt(core.getInput('startTime'), 10);
    const interval = parseInt(core.getInput('interval'), 10);
    const timeout = parseInt(core.getInput('timeout'), 10);

    const [owner, repo] = repository.split('/');
    const octokit = new Octokit({ auth: token });

    core.info('Triggering workflow...');
    const payload = {
      ref,
      inputs: inputs ? JSON.parse(inputs) : {},
    };

    await octokit.actions.createWorkflowDispatch({
      owner,
      repo,
      workflow_id: workflow,
      ref,
      inputs: payload.inputs,
    });

    core.info(`Successfully triggered workflow ${workflow}`);

    if (startTime > 0) {
      core.info(`Waiting ${startTime} seconds before starting polling...`);
      await new Promise((resolve) => setTimeout(resolve, startTime * 1000));
    }

    const endTime = Date.now() + timeout * 1000;
    while (Date.now() < endTime) {
      core.info('Checking workflow status...');
      const runs = await octokit.actions.listWorkflowRuns({
        owner,
        repo,
        workflow_id: workflow,
        event: 'workflow_dispatch',
      });

      const relevantRun = runs.data.workflow_runs.find((run) => {
        return run.head_branch === ref && Date.parse(run.created_at) >= Date.now() - timeout * 1000;
      });

      if (relevantRun) {
        const { status, conclusion, logs_url } = relevantRun;
        core.info(`Workflow run status: ${status}, conclusion: ${conclusion}`);

        if (status === 'completed') {
          if (conclusion === expected) {
            core.info(`Workflow completed as expected: ${expected}.`);
            return;
          } else {
            core.setFailed(`Workflow completed with unexpected conclusion: ${conclusion} (expected: ${expected})`);
            return;
          }
        }

        if (logs_url) {
          const logsReady = await checkLogsForParameters(logs_url, payload.inputs, interval, token);
          if (logsReady) {
            core.info('Logs contain the expected parameters.');
          }
        }
      }

      await new Promise((resolve) => setTimeout(resolve, interval * 1000));
    }

    core.setFailed('Timeout exceeded while waiting for the workflow to complete.');
  } catch (error) {
    core.error(error.stack || error.message);
    core.setFailed(error.message);
  }
}

run();
