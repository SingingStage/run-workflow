const core = require('@actions/core');
const { Octokit } = require('@octokit/rest');
const fetch = require('node-fetch'); // Add this line

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
      request: { fetch }, // Pass fetch implementation here
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
  } catch (error) {
    // Log the error stack for better debugging
    core.error('An error occurred while running the workflow dispatcher.');
    core.error(error.stack || error.message);
    core.setFailed(error.message);
  }
}

run();
