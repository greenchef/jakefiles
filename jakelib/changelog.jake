const axios = require('axios');
const q = require('q');

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
    try{ 
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

      // build jira calls
      let jira_calls = formatted_commits.map((c) => { return jira.get(`/${c.jira_id}`) })
      // fetch jira data
      let issues = await q.allSettled(jira_calls)
      issues.forEach((issue, idx) => {
        if(issue.state == 'fulfilled')
          formatted_commits[idx]['jira_summary'] = issue.value.data.fields.summary || '';
        else
          formatted_commits[idx]['jira_summary'] = '';
      });

      const d = new Date().toISOString().toString().substring(0,10);
      let outputStr = `### ${d} \n`;
      formatted_commits.forEach((commit) => {
        outputStr += "##### "+(commit.jira_summary.length > 1 ? (commit.jira_summary+"\n - "+commit.message+"\n - ") : (commit.message+"\n - ")) + commit.author+"\n - ```"+commit.sha+"```\n\n";
      })

      console.log(outputStr);
  } catch(err){
    console.log(err);
  }
  }

  desc('Generate a changelog from one release to a previous release | [repo, release_tag, prev_release_tag]');
  task('generate', { async: false }, generate);



  async function brief(path,commit) {

    var ex = jake.createExec([`cd  ${path} && git log --grep="GCT-" ${commit}..HEAD --pretty=format:"##### %s %n - %h %n - %an"`]);
    
    ex.addListener('stdout', function (msg) {
      msg = msg.toString();
     
      console.log(msg)

      complete();
    });
    ex.run();
 
  }

  desc('Generate a markdown changelog from one release to HEAD of master | [path_to_repo, commit]');
	task('brief', { async: false }, brief);
  


  async function ratelimit() {
    // fetch comparison of releases tags from github
    let ratedata = await github.get('/rate_limit')
    
    console.log(ratedata.data);
  }

  desc('Check the GitHub rate limit');
	task('ratelimit', { async: false }, ratelimit);
});
