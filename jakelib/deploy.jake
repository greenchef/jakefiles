var util = require('util');
const { PATH_TO_SERVER, PATH_TO_CONSOLE, PATH_TO_CONSUMER, PATH_TO_SHIPPING } = process.env;

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
    consoleapi: {
      cmds: [
        `cd ${PATH_TO_SERVER}`, 
        'eval $(aws ecr get-login --no-include-email --region us-west-2)',
        'docker build -t {{cluster_name}}-api -f Dockerfile-api . --no-cache',
        'docker tag {{cluster_name}}-api:latest 052248958630.dkr.ecr.us-west-2.amazonaws.com/{{cluster_name}}-api:latest',
        'docker push 052248958630.dkr.ecr.us-west-2.amazonaws.com/{{cluster_name}}-api:latest',
        'docker image prune -a -f'
      ]
    },
    'web-api': {
      cmds: [
        `cd ${PATH_TO_SERVER}`, 
        'eval $(aws ecr get-login --no-include-email --region us-west-2)',
        'docker build -t {{cluster_name}}-{{app_name}} -f Dockerfile-api . --no-cache',
        'docker tag {{cluster_name}}-{{app_name}}:latest 052248958630.dkr.ecr.us-west-2.amazonaws.com/{{cluster_name}}-{{app_name}}:latest',
        'docker push 052248958630.dkr.ecr.us-west-2.amazonaws.com/{{cluster_name}}-{{app_name}}:latest',
        'docker image prune -a -f'
      ]
    },
    worker: {
      cmds: [
        `cd ${PATH_TO_SERVER}`, 
        'eval $(aws ecr get-login --no-include-email --region us-west-2)',
        'docker build -t {{cluster_name}}-{{app_name}} -f Dockerfile-worker . --no-cache',
        'docker tag {{cluster_name}}-{{app_name}}:latest 052248958630.dkr.ecr.us-west-2.amazonaws.com/{{cluster_name}}-{{app_name}}:latest',
        'docker push 052248958630.dkr.ecr.us-west-2.amazonaws.com/{{cluster_name}}-{{app_name}}:latest',
        'docker image prune -a -f'
      ]
    },
    console: {
      cmds: [
        `cd ${PATH_TO_CONSOLE}`, 
        'eval $(aws ecr get-login --no-include-email --region us-west-2)',
        './node_modules/.bin/gulp docker:build --gulpfile ./gulpfile.babel.js --build={{cluster_name}}',
        'docker build -t {{cluster_name}}-{{app_name}} . --no-cache',
        'docker tag {{cluster_name}}-{{app_name}}:latest 052248958630.dkr.ecr.us-west-2.amazonaws.com/{{cluster_name}}-{{app_name}}:latest',
        'docker push 052248958630.dkr.ecr.us-west-2.amazonaws.com/{{cluster_name}}-{{app_name}}:latest',
        'docker image prune -a -f'
      ]
    },
    consumer: {
      cmds: [
        `cd ${PATH_TO_CONSUMER}`, 
        'eval $(aws ecr get-login --no-include-email --region us-west-2)',
        './node_modules/.bin/gulp staging-gc-build',
        'docker build -t {{cluster_name}}-{{app_name}} . --no-cache',
        'docker tag {{cluster_name}}-{{app_name}}:latest 052248958630.dkr.ecr.us-west-2.amazonaws.com/{{cluster_name}}-{{app_name}}:latest',
        'docker push 052248958630.dkr.ecr.us-west-2.amazonaws.com/{{cluster_name}}-{{app_name}}:latest',
        'docker image prune -a -f'
      ]
    },
    'shipping-api': {
      cmds: [
        `cd ${PATH_TO_SHIPPING}`,
        'eval $(aws ecr get-login --no-include-email --region us-west-2)',
        'docker build -t {{cluster_name}}-{{app_name}} -f docker/api . --no-cache',
        'docker tag {{cluster_name}}-{{app_name}}:latest 052248958630.dkr.ecr.us-west-2.amazonaws.com/{{cluster_name}}-{{app_name}}:latest',
        'docker push 052248958630.dkr.ecr.us-west-2.amazonaws.com/{{cluster_name}}-{{app_name}}:latest',
        'docker image prune -a -f'
      ]
    },
    'shipping-worker': {
      cmds: [
        `cd ${PATH_TO_SHIPPING}`,
        'eval $(aws ecr get-login --no-include-email --region us-west-2)',
        'docker build -t {{cluster_name}}-{{app_name}} -f docker/worker . --no-cache',
        'docker tag {{cluster_name}}-{{app_name}}:latest 052248958630.dkr.ecr.us-west-2.amazonaws.com/{{cluster_name}}-{{app_name}}:latest',
        'docker push 052248958630.dkr.ecr.us-west-2.amazonaws.com/{{cluster_name}}-{{app_name}}:latest',
        'docker image prune -a -f'
      ]
    }
  }

  desc('Deploy application to ECS. | [cluster_name,app_name]');
	task('app', ['aws:loadCredentials'], { async: false }, function(cluster_name,app_name) {
    let vars = {cluster_name, app_name};
    let cmd = replacer(apps[app_name].cmds.join(' && '), vars);
    jake.exec(cmd, { printStdout: true }, function(){
      jake.Task['ecs:restart'].execute(cluster_name, `${cluster_name}-${app_name}`);
      complete();
    });
    
  });

  desc('Deploy application to ECS. | [cluster_name]');
	task('all', ['aws:loadCredentials'], { async: false }, function(cluster_name,app_name) {
    Object.keys(apps).forEach(k => {
      jake.exec(cmd, { printStdout: true }, function(){
        jake.Task['deploy:app'].execute(cluster_name, k);
        complete();
      });
    })
  });

});