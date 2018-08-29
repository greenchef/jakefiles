var util = require('util');

namespace('copy_ecr', function () {
	desc('Copy images from one cluster to another | [from_cluster, to_cluster]');
	task('all', ['aws:loadCredentials'], { async: true }, function(from_cluster, to_cluster) {
    const apps = ['api', 'console', 'consumer', 'inventory-worker', 'jsreports', 'shipping-api', 'shipping-worker', 'worker'];
		var config = jake.Task["aws:loadCredentials"].value
    var cmds = ['eval $(aws ecr get-login --no-include-email --region us-west-2)'];

    apps.forEach(app_name => {
      cmds.push(`docker pull 052248958630.dkr.ecr.us-west-2.amazonaws.com/${from_cluster}-${app_name}:latest`);
      cmds.push(`docker tag 052248958630.dkr.ecr.us-west-2.amazonaws.com/${from_cluster}-${app_name}:latest 052248958630.dkr.ecr.us-west-2.amazonaws.com/${to_cluster}-${app_name}:latest`);
      cmds.push(`docker push 052248958630.dkr.ecr.us-west-2.amazonaws.com/${to_cluster}-${app_name}:latest`)
    });

    cmds.push('docker image prune -a -f');
		
		jake.exec(cmds, { printStdout: true }, function(){
      apps.forEach(app_name => {
        jake.Task['ecs:restart'].execute(to_cluster, `${to_cluster}-${app_name}`);
        jake.Task['slack:deployment'].execute(to_cluster, app_name);
      });

			complete();
		});
	});
});