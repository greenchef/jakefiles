
namespace('secrets', function () {

const SECRET_SERVICES = [
  'auth',
  'auth-api',
  'auth-worker',
  'bifrost',
  'consoleapi',
  'core',
  'jsreports',
  'scheduler',
  'shipping',
  'shipping-api',
  'shipping-scheduler',
  'shipping-worker',
  'web-api',
  'worker',
];



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
  
  desc('Save secrets for safety | [secrets_environment] | e.g. [stag-pp]');
  task('save', ['aws:loadCredentials'], { async: true }, function(secret_environment) {
    const secretRetrievals = SECRET_SERVICES.map(service => {
      const secretToRetrieve = `${secret_environment}-${service}`
      const filePath = `${secret_environment}-saved-secrets/${secretToRetrieve}.txt`
      return [
        `echo Saving ${secretToRetrieve} secrets to ${filePath}`,
        `touch ${filePath}`,
        `echo $(aws secretsmanager get-secret-value --secret-id=${secretToRetrieve} || true) > ${filePath}`
      ]
    })
    const extraCmds = secretRetrievals.reduce((acc, commands) => {
      acc = acc.concat(commands);
      return acc;
    }, []);

    const cmds = [`mkdir -p ${secret_environment}-saved-secrets`].concat(extraCmds)
    
    jake.exec(cmds, { printStdout: true });
  });
});