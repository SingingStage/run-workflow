const core = require('@actions/core');
const { Octokit } = require('@octokit/rest');

async function run() {
  try {
    const token = core.getInput('token', { required: true });
    const repository = core.getInput('repository', { required: true });
    const workflow = core.getInput('workflow', { required: true });
    const ref = core.getInput('ref', { required: true });
    const inputs = core.getInput('inputs');

    const [owner, repo] = repository.split('/');

    const octokit = new Octokit({ auth: token });

    // Prepare the dispatch payload
    const payload = {
      ref,
      inputs: inputs ? JSON.parse(inputs) : {}
    };

    core.info(`Triggering workflow ${workflow} in repository ${repository} on ref ${ref}`);
    await octokit.actions.createWorkflowDispatch({
      owner,
      repo,
      workflow_id: workflow,
      ref,
      inputs: payload.inputs,
    });

    core.info(`Successfully triggered workflow ${workflow} in repository ${repository}`);
  } catch (error) {
    core.setFailed(error.message);
  }
}

run();
