import * as core from '@actions/core';
import { context, getOctokit } from '@actions/github';
import { WebClient } from '@slack/web-api';
import {
  makeWorkflow,
  makeContext,
  makeButton,
  makeJobReport,
  getDuration,
} from './slack-helpers';

async function main() {
  const gtoken = core.getInput('github_token', { required: true });
  const stoken = core.getInput('slack_token', { required: true });
  const channel = core.getInput('slack_channel', { required: true });
  const doReportJob = core.getInput('report_jobs', { required: false });
  const deploymentUrl = core.getInput('deployment_url', { required: false });
  core.setSecret(stoken);
  core.setSecret(gtoken);
  const octokit = getOctokit(gtoken);
  const { owner, repo } = context.repo;
  const {
    eventName, actor, workflow, runNumber, runId,
  } = context;
  const branch = context.ref.substr(context.ref.lastIndexOf('/') + 1);
  const jobsList = await octokit.rest.actions.listJobsForWorkflowRun({
    owner, repo, run_id: context.runId,
  });
  const jobs = jobsList.data.jobs.filter((job) => (job.status === 'completed'));
  const jobCount = jobsList.data.total_count - 1;
  const jobSuccessCount = jobs.filter((job) => job.conclusion === 'success').length;
  const status = (jobCount === jobSuccessCount) ? 'SUCCESS' : 'FAILURE';
  const dates = jobs.map((a) => new Date(a.started_at));
  const startDate = new Date(Math.max.apply(null, dates));
  const duration = getDuration(startDate, new Date());
  const web = new WebClient(stoken);
  const actorAvatar = context.payload.sender.avatar_url;
  const workflowText = makeWorkflow(
    eventName, actor, branch, repo, owner, workflow, runNumber, runId, duration, status,
  );
  const jobContext = makeContext(jobSuccessCount, jobCount);
  const blocks = [workflowText, jobContext];
  if (doReportJob) { blocks.push(makeJobReport(jobs)); }
  if (deploymentUrl && (status === 'SUCCESS')) {
    blocks.push({ type: 'divider' });
    blocks.push(makeButton(deploymentUrl));
  }
  const text = 'Nouveau workflow run sur Github Actions';
  await web.chat.postMessage({
    icon_url: actorAvatar, channel, blocks, text,
  });
}

main().catch((err) => core.setFailed(err.message));
