var util = require('util');
const { PATH_TO_SERVER, PATH_TO_CONSOLE, PATH_TO_SHIPPING, SHELL_IS_FISH } = process.env;

namespace('deploy', function () {

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
  };

  const apps = {
    api: {
      cmds: [
        `cd ${PATH_TO_SERVER}`, 
        'docker build -t greenchef/api:{{cluster_name}} -f Dockerfile-api-upgrade . --no-cache',
        'docker push greenchef/api:{{cluster_name}}'
      ]
    },
    worker: {
      cmds: [
        `cd ${PATH_TO_SERVER}`, 
        'docker build -t greenchef/worker:{{cluster_name}} -f Dockerfile-worker-upgrade . --no-cache',
        'docker push greenchef/worker:{{cluster_name}}'
      ]
    },
    console: {
      cmds: [
        `cd ${PATH_TO_CONSOLE}`,
        'ls',
        './node_modules/.bin/gulp docker:build --gulpfile ./gulpfile.babel.js --build=staging',
        'docker build -t greenchef/console:{{cluster_name}} . --no-cache',
        'docker push greenchef/console:{{cluster_name}}'
      ]
    },
    'shipping-api': {
      cmds: [
        `cd ${PATH_TO_SHIPPING}`,
        'docker build -t greenchef/shipping:{{cluster_name}} -f docker/api .',
        'docker push greenchef/shipping:{{cluster_name}}'
      ]
    }
  }

  desc('Deploy application to ECS. | [cluster_name,app_name]');
	task('app', ['aws:loadCredentials'], { async: false }, function(cluster_name,app_name) {
    let vars = {cluster_name, app_name};
    let cmd = replacer(apps[app_name].cmds.join(' && '), vars);
    jake.exec(cmd, { printStdout: true }, function(){
      jake.Task['ecs:restart'].execute(cluster_name, `${app_name}-${cluster_name}`);
      complete();
    });
    
  });

});