
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
});