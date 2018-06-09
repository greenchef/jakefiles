var util = require('util');

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
        'cd ~/Greenchef/greenchef/services/server-greenchef', 
        'docker build -t greenchef/api:{{stage_name}} -f Dockerfile-api-upgrade . --no-cache',
        'docker push greenchef/api:{{stage_name}}'
      ]
    },
    worker: {
      cmds: [
        'cd ~/Greenchef/greenchef/services/server-greenchef', 
        'docker build -t greenchef/worker:{{stage_name}} -f Dockerfile-worker-upgrade . --no-cache',
        'docker push greenchef/worker:{{stage_name}}'
      ]
    },
    console: {
      cmds: [
        'cd ~/Greenchef/console-web',
        'ls',
        './node_modules/.bin/gulp docker:build --gulpfile ./gulpfile.babel.js --build=staging',
        'docker build -t greenchef/console:{{stage_name}} . --no-cache',
        'docker push greenchef/console:{{stage_name}}'
      ]
    }
  }


  desc('Deploy application to ECS. | [stage_name,app_name]');
	task('app', ['aws:loadCredentials'], { async: false }, function(stage_name,app_name) {
    let vars = {stage_name, app_name};
    let cmd = replacer(apps[app_name].cmds.join(' && '), vars);
    jake.exec(cmd, { printStdout: true }, function(){
      jake.Task['ecs:restart'].execute(stage_name, `${app_name}-${stage_name}`);
      complete();
    });
    
  });

});