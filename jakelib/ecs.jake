namespace('ecs', function () {
	desc('List services in a cluster. | [cluster_name]');
	task('list', ['aws:loadCredentials'], { async: false }, function(cluster_name) {
		const cmds = [
      `aws ecs list-services --cluster ${cluster_name}`,
    ];
		jake.exec(cmds, { printStdout: true });
  });

  desc('Restart a service. | [cluster_name,service_name]');
	task('restart', ['aws:loadCredentials'], { async: false }, function(cluster_name, service_name) {
		const cmds = [
      `aws ecs update-service --cluster ${cluster_name} --service ${service_name} --force-new-deployment`,
    ];
		jake.exec(cmds, { printStdout: true });
	});
});
