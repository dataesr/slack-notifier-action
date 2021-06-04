export function makeWorkflow(
  eventName, actor, branch, repo, owner, workflow, runNumber, runId, duration, status,
) {
  const repoUrl = `https://github.com/${owner}/${repo}`;
  const text1 = `*${actor}*'s \`${eventName}\` sur la branche \`${branch}\` `
    + `de <${repoUrl}|${owner}/${repo}>`;
  const text2 = `_<${repoUrl}/actions/runs/${runId},|${workflow} (#${runNumber})>_`
    + ` terminé en \`${duration}\` avec le status *${status}*`;
  return { type: 'section', text: { type: 'mrkdwn', text: `${text1}\n${text2}` } };
}

export function makeContext(jobSuccessCount, jobCount) {
  const emoji = (jobCount === jobSuccessCount) ? ':white_check_mark:' : ':x:';
  const isPlural = (plural) => ((plural) ? 's' : '');
  const plural = (jobSuccessCount > 1);
  return {
    type: 'context',
    elements: [
      {
        type: 'mrkdwn',
        text: `${emoji} ${jobSuccessCount}/${jobCount} job${isPlural(plural)} terminé${isPlural(plural)} avec succès`,
      },
    ],
  };
}

export function makeButton(deplUrl) {
  const url = (deplUrl.startsWith('http://') || deplUrl.startsWith('https://'))
    ? deplUrl
    : `https://${deplUrl}`;
  return {
    type: 'actions',
    elements: [
      {
        type: 'button',
        style: 'primary',
        text: {
          type: 'plain_text',
          text: "Aller sur l'application",
          emoji: true,
        },
        value: 'go-to-app',
        url,
        action_id: 'go-to-app',
      },
    ],
  };
}

export function getDuration(start, end) {
  const duration = end - start;
  let delta = duration / 1000;
  const days = Math.floor(delta / 86400);
  delta -= days * 86400;
  const hours = Math.floor(delta / 3600) % 24;
  delta -= hours * 3600;
  const minutes = Math.floor(delta / 60) % 60;
  delta -= minutes * 60;
  const seconds = Math.floor(delta % 60);
  const format = (value, text, hideOnZero) => ((value <= 0 && hideOnZero) ? '' : `${value + text} `);
  return format(days, 'd', true)
    + format(hours, 'h', true)
    + format(minutes, 'm', true)
    + format(seconds, 's', false).trim();
}

export function makeJobReport(jobs) {
  const elements = jobs.map((job) => {
    const emoji = (job.conclusion === 'success') ? ':white_check_mark:' : ':x:';
    const start = new Date(job.started_at);
    const end = new Date(job.completed_at);
    return {
      type: 'mrkdwn',
      text: `${emoji} ${job.name} (${getDuration(start, end)})`,
    };
  });
  return { type: 'context', elements };
}
