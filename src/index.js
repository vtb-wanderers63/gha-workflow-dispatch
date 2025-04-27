import { Octokit } from 'octokit';
import * as core from '@actions/core';
import * as github from '@actions/github';

async function run() {
  try {
    // Get GITHUB_TOKEN from environment variables
    const token = process.env.GITHUB_TOKEN;
    if (!token) {
      core.setFailed('GITHUB_TOKEN is not set');
      return;
    }

    // Get repository name and owner from the inputs or context
    const owner = process.env.OWNER || github.context.repo.owner;
    const repo = process.env.REPO || github.context.repo.repo;
    const workflow_id = process.env.WORKFLOW_ID;
    const ref = process.env.REF || github.context.ref; // branch, tag, or SHA

    const workflow_inputs = process.env.WORKFLOW_INPUTS; // Optional, JSON string of inputs
    const inputs = workflow_inputs ? JSON.parse(workflow_inputs) : {};

    // Create Octokit instance
    const octokit = new Octokit({ auth: token });

    // Dispatch the workflow
    core.info(`Triggering workflow_dispatch for ${workflow_id} on ref ${ref}`);
    const response = await octokit.rest.actions.createWorkflowDispatch({
      owner,
      repo,
      workflow_id,
      ref,
      inputs: inputs,
    });

    if (response.status !== 204) {
      throw new Error(`Failed to trigger workflow. Status: ${response.status}`);
    }
    core.info(`Workflow dispatched successfully. Status: ${response.status}`);

    // Sleep to give GitHub some time to register the workflow run
    await new Promise((resolve) => setTimeout(resolve, 30000));

    // Get the latest workflow runs for that workflow
    const runs_response = await octokit.rest.actions.listWorkflowRuns({
      owner,
      repo,
      workflow_id,
      per_page: 5, // Increased to have a better chance of finding the run
    });

    if (runs_response.status !== 200) {
      throw new Error(`Failed to get workflow runs. Status: ${runs_response.status}`);
    }

    const workflow_triggered_time = Date.now();

    const runs = runs_response.data.workflow_runs;

    const run = runs.find(
      (run) =>
        run.workflow_id === parseInt(workflow_id) &&
        run.head_branch === ref &&
        isWorkflowCreatedWithinTimeWindow(workflow_triggered_time, run.created_at)
    );

    if (!run) {
      core.setFailed('No workflow run found after dispatch.');
      return;
    }

    const run_id = run.id;
    core.info(`Workflow run triggered successfully. Run ID: ${run_id}`);

    // Set output variable
    core.setOutput('run_id', run_id.toString());
  } catch (error) {
    core.setFailed(error.message);
  }
}

const isWorkflowCreatedWithinTimeWindow = (
  workflowTriggeredTime,
  workflowCreatedTime,
  timeWindowMs = 45000
) => {
  const triggeredTime = new Date(workflowTriggeredTime);
  const createdTime = new Date(workflowCreatedTime);
  const timeDifference = Math.abs(createdTime - triggeredTime);

  return timeDifference <= timeWindowMs;
};

run();
