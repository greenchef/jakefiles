namespace('ecr', function () {
	desc('Copy images from one cluster to another |from_stack, to_stack, restart_environment');
	task('copyAll', ['aws:loadCredentials'], { async: true }, function(from_stack, to_stack, restart_environment) {
    const repos = ['core-root', 'console', 'consumer', 'jsreports', 'shipping-root', 'bifrost', 'auth-root'];
    const cmds = ['eval $(aws ecr get-login --no-include-email --region us-west-2)'];

    repos.forEach(app_name => {
      cmds.push(`docker pull 052248958630.dkr.ecr.us-west-2.amazonaws.com/${from_stack}-${app_name}:latest`);
      cmds.push(`docker tag 052248958630.dkr.ecr.us-west-2.amazonaws.com/${from_stack}-${app_name}:latest 052248958630.dkr.ecr.us-west-2.amazonaws.com/${to_stack}-${app_name}:latest`);
      cmds.push(`docker push 052248958630.dkr.ecr.us-west-2.amazonaws.com/${to_stack}-${app_name}:latest`)
    });

    cmds.push('docker image prune -a -f');

		jake.exec(cmds, { printStdout: true }, function(){
      console.log("NOW RESTARTING !!!!")
      const cluster_name = `${restart_environment}-${to_stack}`;
      const apps = ['consoleapi', 'web-api', 'worker', 'shipping-api', 'shipping-worker', 'bifrost', 'auth-api', 'console', 'consumer', 'jsreports']
      apps.forEach(app_name => {
        jake.Task['ecs:restart'].execute(cluster_name, `${cluster_name}-${app_name}`);
        jake.Task['slack:deployment'].execute(cluster_name, app_name);
      });

			complete();
		});
	});

  // task('copyApps', ['aws:loadCredentials'], { async: true }, function(from_cluster, to_cluster, apps) {
	// const config = jake.Task["aws:loadCredentials"].value
  // const cmds = ['eval $(aws ecr get-login --no-include-email --region us-west-2)'];

  //   apps.forEach(app_name => {
  //     cmds.push(`docker pull 052248958630.dkr.ecr.us-west-2.amazonaws.com/${from_cluster}-${app_name}:latest`);
  //     cmds.push(`docker tag 052248958630.dkr.ecr.us-west-2.amazonaws.com/${from_cluster}-${app_name}:latest 052248958630.dkr.ecr.us-west-2.amazonaws.com/${to_cluster}-${app_name}:latest`);
  //     cmds.push(`docker push 052248958630.dkr.ecr.us-west-2.amazonaws.com/${to_cluster}-${app_name}:latest`)
  //   });

  //   cmds.push('docker image prune -a -f');

	// 	jake.exec(cmds, { printStdout: true }, function(){
  //     apps.forEach(app_name => {
  //       jake.Task['ecs:restart'].execute(to_cluster, `${to_cluster}-${app_name}`);
  //       jake.Task['slack:deployment'].execute(to_cluster, app_name);
  //     });

	// 		complete();
	// 	});
	// });
});
