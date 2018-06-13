const axios = require('axios');

const github = axios.create({
  baseURL: 'https://api.github.com',
  auth: {
    username: process.env.GITHUB_USERNAME,
    password: process.env.GITHUB_PASSWORD
  }
});

const jira = axios.create({
  baseURL: 'https://jira.greenchef.com/rest/api/2/issue',
  auth: {
    username: process.env.JIRA_USERNAME,
    password: process.env.JIRA_PASSWORD
  }
});


namespace('changelog', function () {

  async function generate(repo, release_tag, prev_release_tag) {
    const r = /(\[.*?\])/;
    const compare_api_endpoint = `/repos/greenchef/${repo}/compare/${prev_release_tag}...${release_tag}`;

    // fetch comparison of releases tags from github
    let comparison = await github.get(compare_api_endpoint)

    // fetch commits between those comparisons
    let commits = await axios.all(comparison.data.commits.map( (c) => { return github.get(`/repos/greenchef/${repo}/commits/${c.sha}`) } ) )
    // build custom commit objects and parse out jira issue name
    let formatted_commits = [];
    commits.forEach((c) => {
      let s = c.data.commit.message;
      let idx = c.data.commit.message.search(r);
      if(idx > -1) {
        let l_idx = s.indexOf(']', idx);
        let jira_id = s.substring(idx+1, l_idx);
        if(jira_id.includes('-')) {
          formatted_commits.push(
            {
              sha: c.data.sha,
              message: c.data.commit.message,
              author: c.data.commit.author.name,
              jira_id: jira_id
            }
          )
        }
      }
    });

    // fetch jira data
    let issues = await axios.all(formatted_commits.map((c) => { return jira.get(`/${c.jira_id}`) }))
    issues.forEach((issue, idx) => {
      formatted_commits[idx]['jira_summary'] = issue.data.fields.summary;
    });

    console.log(formatted_commits);
  }

  desc('Generate a changelog from one release to a previous release | [repo, release_tag, prev_release_tag]');
	task('generate', { async: false }, generate);
});
