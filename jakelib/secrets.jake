const { cyan, green, red } = require('chalk');

const { question } = require('readline-sync');
const { CLUSTERS_BY_ENV } = require('./utils')

const { GITHUB_USERNAME, MIMIR_CREATOR_ARN, MIMIR_ROTATOR_ARN } = process.env;

namespace('secrets', function () {
	desc('Copy images from one cluster to another | [from_secret, to_secret]');
	task('copy', ['aws:loadCredentials'], function(from_secret, to_secret) {
		console.log(from_secret)
		const exRead = jake.createExec([`aws secretsmanager get-secret-value --secret-id ${from_secret}`]);
		exRead.addListener('stdout', function (msg) {
			var msg = msg.toString();
			console.log(JSON.parse(msg).SecretString)
			const exWrite = jake.createExec([`aws secretsmanager put-secret-value --secret-id ${to_secret} --secret-string ${JSON.stringify(JSON.parse(msg).SecretString)}`]);
			exWrite.addListener('stdout', function (msg) {
				var msg = msg.toString();
				console.log((msg))
			});
			exWrite.run();
		});
		exRead.run();
	});

	desc('Creates new  | [environment, stack name]');
	task('core-create', ['aws:loadCredentials'], function(env, stack) {
		const isValidStack = CLUSTERS_BY_ENV[env] && CLUSTERS_BY_ENV[env].includes(stack);
		if (!isValidStack) throw new Error(red(`Not a supported cluster. Supported clusters: \n${cyan(JSON.stringify(CLUSTERS_BY_ENV))}`));
		const response = question(cyan(`Are you sure you want to create new core credentials in ${env}-${stack}? Y/n:\n`));
		if (response.toLowerCase() !== 'y') {
      console.log(green('OK, exiting.'));
      return;
		}
		const payload = `{"env":"${env}","stack":"${stack}","requester":"${GITHUB_USERNAME}"}`;
		const cmds = [
      `aws lambda invoke --function-name ${MIMIR_CREATOR_ARN} --cli-binary-format raw-in-base64-out --invocation-type Event --payload '${payload}' response.json`
    ];
    console.log(green('If the execution was successful, you will get a 202 response code below:'));
    jake.exec(cmds, { printStdout: true });
	});

	task('core-rotate', ['aws:loadCredentials'], function(env, stack) {
		const isValidStack = CLUSTERS_BY_ENV[env] && CLUSTERS_BY_ENV[env].includes(stack);
		if (!isValidStack) throw new Error(red(`Not a supported cluster. Supported clusters: \n${cyan(JSON.stringify(CLUSTERS_BY_ENV))}`));
		const responseA = question(cyan(`Have you restarted the Core services in ${env}-${stack} ECS after running create? Y/n:\n`));
		if (responseA.toLowerCase() !== 'y') {
			console.log(red(`You MUST restart the Core services in ${env}-${stack} ECS before proceeding!`))
      console.log(green('OK, exiting.'));
      return;
		}
		const responseB = question(cyan(`Are you sure you want to rotate new core credentials in ${env}-${stack}? Y/n: `));
		if (responseB.toLowerCase() !== 'y') {
      console.log(green('OK, exiting.'));
      return;
		}
		const payload = `{"env":"${env}","stack":"${stack}","requester":"${GITHUB_USERNAME}"}`;
		const cmds = [
      `aws lambda invoke --function-name ${MIMIR_ROTATOR_ARN} --cli-binary-format raw-in-base64-out --invocation-type Event --payload '${payload}' response.json`
    ];
    console.log(green('If the execution was successful, you will get a 202 response code below:'));
    jake.exec(cmds, { printStdout: true });
	});
});
