const { getUsername } = require('./utils');

const YMIR_ARN = 'arn:aws:lambda:us-west-2:052248958630:function:deployer-ymir';
const REFRESHER_ARN = 'arn:aws:lambda:us-west-2:052248958630:function:pre-prod-deployer';

const CLUSTERS = {
  prod: {
    lv : { protected: true },
  },
  stag: {
    pp: { protected: true },
    one: { protected: false },
    two: { protected: false },
    qe: { protected: false },
    uat: { protected: false },
  },
  eph: { protected: false },
}

const REPOS = [
  'app-greenchef',
  'auth-platform',
  'bifrost',
  'console-frontend',
  'console-web',
  'frontend-proxy',
  'greenchef',
  'reports',
  'marketing-frontend',
  'shipping-platform',
];

namespace('pipeline', function () {
	desc('Deploy via pipeline. | [\'env\',\'cluster\',\'repo\',\'branch\']');
	task('deploy', ['aws:loadCredentials'], { async: true }, function(environment, cluster, repo, toBranch) {

    if (environment !== 'eph') {
      try {
        let a = CLUSTERS[environment][cluster].protected;
      } catch (e) {
        throw new Error(`environment and cluster MISMATCH "${cluster}" is not a valid "${environment}" cluster`)
      }
  
      const IS_PROTECTED_TARGET = CLUSTERS[environment][cluster].protected;
      const IS_RELEASE_BRANCH = toBranch.includes('release/') || toBranch.includes('hotfix/');
  
      if (IS_PROTECTED_TARGET && !IS_RELEASE_BRANCH) throw new Error(`PROTECTED cluster "${environment}-${cluster}" must target a release or hotfix tag`);
    }

    if (!REPOS.includes(repo)) throw new Error('UNSUPPORTED repo');

    const username = getUsername();

		const cmds = [
      `aws lambda invoke --function-name ${YMIR_ARN} --cli-binary-format raw-in-base64-out --invocation-type Event --payload '{"requester":"${username}","repo_name":"${repo}","origin_branch":"${toBranch}","destination_branch":"${cluster}", "optional_env":"${environment}"}' response.json`
    ];
    console.log('If the execution was successful, you will get a 202 response code below:');
    jake.exec(cmds, { printStdout: true });
  });
  
  desc('Refresh via pipeline. | [\'cluster\',optional:\'ephemeral stack\']');
	task('refresh', ['aws:loadCredentials'], { async: true }, function(cluster, ephStack) {
    const allowed_clusters = Object.keys(CLUSTERS.stag)
    allowed_clusters.push('eph');

    if (!allowed_clusters.includes(cluster)) throw new Error(`Not a supported cluster. Supported clusters: ${allowed_clusters.toString()}`)
    const additionalPayload = ephStack ? `, "ephStack": "${ephStack}"` : '';
		const cmds = [
      `aws lambda invoke --function-name ${REFRESHER_ARN} --cli-binary-format raw-in-base64-out --invocation-type Event --payload '{"optionalEnv":"${cluster}"${additionalPayload}}' response.json`
    ];
    console.log('If the execution was successful, you will get a 202 response code below:');
    jake.exec(cmds, { printStdout: true });
	});
});