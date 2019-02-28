const { serviceToPath } = require('./utils');

namespace('rollback', function () {
  function replacer(value, variables) {
    if(!value || value == '') return value;
    const var_pattern = /(#[A-Za-z0-9_]+#)|({{[A-Za-z0-9_]+}})/g;
    value.match(var_pattern).forEach(function(matched_var) {
      var idx, value_for_replace;
      idx = value.indexOf(matched_var);
      if (idx > -1) {
        value_for_replace = variables[matched_var.replace(/#|{{|}}/g, "")];
        if (value_for_replace != null) {
          value = value.replace(new RegExp(matched_var, "g"), value_for_replace);
        }
      }
    });
    return value;
  }

  const rollbackSetupCmds = [
    'MANIFEST=$(aws ecr batch-get-image --repository-name {{repo_name}} --image-ids imageTag=previous --query "images[].imageManifest" --output text)',
    'aws ecr put-image --repository-name {{repo_name}} --image-tag latest --image-manifest "$MANIFEST"',
    'aws ecr batch-delete-image --repository-name {{repo_name}} --image-ids imageTag=previous'
  ];

  desc('Rollback application in ECS. | [cluster_name,app_name]');
  task('app', ['aws:loadCredentials'], { async: false }, function(cluster_name, app_name) {
    const path = serviceToPath(app_name);
    if (!path) {
      console.error(`Unknown app/service: ${app_name}.`);
      return;
    }

    const cmds = [
      'eval $(aws ecr get-login --no-include-email --region us-west-2)',
      ...rollbackSetupCmds
    ];

    jake.exec(replacer(cmds.join(' && '), { repo_name: cluster_name + '-' + app_name }), { printStdout: true }, function(){
      jake.Task['ecs:restart'].execute(cluster_name, `${cluster_name}-${app_name}`);
      jake.Task['slack:deployment'].execute(cluster_name, app_name);
      complete();
    });
  });

  desc('Rollback all core services (consoleapi, web-api, worker, scheduler) to ECS. | [cluster_name]');
  task('core', ['aws:loadCredentials'], { async: false }, function(cluster_name) {
    const services = [
      'consoleapi',
      'web-api',
      'worker',
      'scheduler',
    ];

    const cmdsTemplate = [
      'eval $(aws ecr get-login --no-include-email --region us-west-2)',
      ...rollbackSetupCmds
    ];

    const cmds = replacer(cmdsTemplate.join(' && '), { repo_name: cluster_name + '-core-root' })

    jake.exec(cmds, { printStdout: true }, function(){
      services.forEach(service => {
        jake.Task['ecs:restart'].execute(cluster_name, `${cluster_name}-${service}`);
        jake.Task['slack:deployment'].execute(cluster_name, service);
      });
      complete();
    });
  });

  desc('Rollback all shipping services (shipping-api, shipping-worker, shipping-scheduler) to ECS. | [cluster_name]');
  task('shipping', ['aws:loadCredentials'], { async: false }, function(cluster_name) {
   
    const services = [
      'shipping-api',
      'shipping-worker',
      'shipping-scheduler',
    ];

    const cmdsTemplate = [
      'eval $(aws ecr get-login --no-include-email --region us-west-2)',
      ...rollbackSetupCmds
    ];

    const cmds = replacer(cmdsTemplate.join(' && '), { repo_name: cluster_name + '-shipping-root' })

    jake.exec(cmds, { printStdout: true }, function(){
      services.forEach(service => {
        jake.Task['ecs:restart'].execute(cluster_name, `${cluster_name}-${service}`);
        jake.Task['slack:deployment'].execute(cluster_name, service);
      });
      complete();
    });
  });
});
