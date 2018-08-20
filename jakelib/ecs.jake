var util = require('util');

namespace('ecs', function () {


	desc('List services in a cluster. | [cluster_name]');
	task('list', ['aws:loadCredentials'], { async: false }, function(cluster_name) {
		var config = jake.Task["aws:loadCredentials"].value
		var cmds = [ util.format('aws ecs list-services --cluster', cluster_name) ];
		jake.exec(cmds, { printStdout: true });
  });
  
  desc('Restart a service. | [cluster_name,service_name]');
	task('restart', ['aws:loadCredentials'], { async: false }, function(cluster_name, service_name) {
		console.log(cluster_name);
		console.log(service_name);
		var config = jake.Task["aws:loadCredentials"].value
		var cmds = [ util.format('aws ecs update-service --cluster %s --service %s --force-new-deployment', cluster_name, service_name) ];
		jake.exec(cmds, { printStdout: true });
	});
});