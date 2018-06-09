var util = require('util');

namespace('s3', function () {
	// desc('Create an S3 bucket.');
	// task('create', ['aws:loadCredentials'], { async: true }, function(bucket_name) {
	// 	var config = jake.Task["aws:loadCredentials"].value
	// 	var cmds = [ util.format('aws s3 mb %s --profile %s', bucket_name, config.profile) ];
	// 	jake.exec(cmds, { printStdout: true });
	// });

	
	// desc('Upload a file to an S3 bucket.');
	// task('upload', ['aws:loadCredentials'], { async: true }, function(file,bucket_name) {
	// 	var config = jake.Task["aws:loadCredentials"].value
	// 	var cmds = [ util.format('aws s3 cp %s s3://%s --profile %s', file, bucket_name, config.profile) ];
	// 	jake.exec(cmds, { printStdout: true });
	// });
	

	desc('List objects within a bucket. | [bucket_name]');
	task('list', ['aws:loadCredentials'], { async: true }, function(bucket_name) {
		var config = jake.Task["aws:loadCredentials"].value
		var cmds = [ util.format('aws s3 ls s3://%s', bucket_name) ];
		
		jake.exec(cmds, { printStdout: true });
	});
});