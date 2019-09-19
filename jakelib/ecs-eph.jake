const EPH_CLUSTER = 'eph-ephemeral'

namespace('ecs-eph', function () {
  desc('Restart a service. | [stack_name,app_name]');
	task('restart', ['aws:loadCredentials'], { async: false }, function(stack_name, app_name) {
		const cmds = [
      `aws ecs update-service --cluster ${EPH_CLUSTER} --service eph-${stack_name}-${app_name} --force-new-deployment`,
    ];
		jake.exec(cmds, { printStdout: true });
	});
});
