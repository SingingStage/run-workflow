async function checkLogsForParameters(logsUrl, inputs, octokit, interval) {
  try {
    const logsResponse = await octokit.request(`GET ${logsUrl}`);
    const logsContent = logsResponse.data;

    // Ensure logsContent is a string
    const logsString = typeof logsContent === 'string' ? logsContent : JSON.stringify(logsContent);

    // Check if logs contain the specified inputs
    for (const [key, value] of Object.entries(inputs)) {
      if (!logsString.includes(`${key}: ${value}`)) {
        core.warning(`Input ${key}: ${value} not found in logs.`);
        return false;
      }
    }
    return true;
  } catch (error) {
    if (error.status === 404) {
      core.warning('Logs are not yet available. Retrying...');
      await new Promise((resolve) => setTimeout(resolve, interval)); // Wait for the specified interval
      return false;
    } else {
      core.error(`Critical error fetching logs: ${error.message}`);
      core.setFailed(`Error fetching logs: ${error.message}`);
      throw error;
    }
  }
}

async function run() {
  try {
    // Fetch inputs
    const token = core.getInput('token', { required: true });
    const repository = core.getInput('repository', { required: true });
    const workflow = core.getInput('workflow', { required: true });
    const ref = core.getInput('ref', { required: true });
    const inputs = core.getInput('inputs');
    const startTime = new Date(core.getInput('startTime') || new Date().toISOString());
    const interval = parseInt(core.getInput('interval') || 5000, 10); // Default: 5 seconds
    const timeout = parseInt(core.getInput('timeout') || 300000, 10); // Default: 5 minutes

    const [owner, repo] = repository.split('/');
    const octokit = new Octokit({ auth: token });

    // Trigger workflow
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

    // Delay polling until `startTime`
    const now = new Date();
    if (now < startTime) {
      const delay = startTime - now;
      core.info(`Waiting ${delay / 1000} seconds until start time...`);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }

    // Poll for logs
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
        return run.head_branch === ref && new Date(run.created_at) >= startTime;
      });

      if (relevantRun) {
        const { status, conclusion, logs_url } = relevantRun;
        core.info(`Workflow run status: ${status}, conclusion: ${conclusion}`);

        if (status === 'completed') {
          if (conclusion === 'success') {
            core.info('Workflow completed successfully.');
            return;
          } else {
            core.setFailed(`Workflow completed with conclusion: ${conclusion}`);
            return;
          }
        }

        // Check logs for inputs
        if (logs_url) {
          const logsReady = await checkLogsForParameters(logs_url, payload.inputs, octokit, interval);
          if (logsReady) {
            core.info('Logs contain the expected parameters.');
          }
        }
      }

      // Wait for the specified interval before polling again
      await new Promise((resolve) => setTimeout(resolve, interval));
    }

    core.setFailed('Timeout exceeded while waiting for the workflow to complete.');
  } catch (error) {
    core.error(error.stack || error.message);
    core.setFailed(error.message);
  }
}

run();
