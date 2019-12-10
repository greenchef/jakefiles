const { getUsername } = require('./utils');

const YMIR_ARN = 'arn:aws:lambda:us-west-2:052248958630:function:deployer-ymir';
const CLUSTERS = ['one','two','uat','qe','lv'];
const REPOS = ['app-greenchef','auth-platform','bifrost','console-frontend','console-web','frontend-proxy','greenchef','reports','marketing-frontend','shipping_platform'];

namespace('pipeline', function () {
	desc('Deploy via pipeline. | [\'env\',\'cluster\',\'repo\',\'branch\']');
	task('deploy', ['aws:loadCredentials'], { async: true }, function(environment, cluster, repo, toBranch) {
    if (cluster === 'lv' && environment !== 'prod' || cluster !== 'lv' && environment === 'prod') throw new Error('"prod" must be paired with "lv"');
    if (!CLUSTERS.includes(cluster)) throw new Error('unsupported cluster');
    if (!REPOS.includes(repo)) throw new Error('unsupported repo');
    const username = getUsername();
		const cmds = [
      `aws lambda invoke --function-name ${YMIR_ARN} --invocation-type Event --payload '{"requester":"${username}","repo_name":"${repo}","origin_branch":"${toBranch}","destination_branch":"${cluster}"}' response.json`
    ];
    console.log('If the execution was successful, you will get a 202 response code below:');
    jake.exec(cmds, { printStdout: true });
	});
});