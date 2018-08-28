const { serviceToPath } = require('./utils')

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
        'docker build -t {{cluster_name}}-api -f Dockerfile-api . --no-cache',
        'docker tag {{cluster_name}}-api:latest 052248958630.dkr.ecr.us-west-2.amazonaws.com/{{cluster_name}}-api:latest',
        'docker push 052248958630.dkr.ecr.us-west-2.amazonaws.com/{{cluster_name}}-api:latest',
      ]
    },
    'web-api': {
      cmds: [
        'docker build -t {{cluster_name}}-api -f Dockerfile-api . --no-cache',
        'docker tag {{cluster_name}}-api:latest 052248958630.dkr.ecr.us-west-2.amazonaws.com/{{cluster_name}}-api:latest',
        'docker push 052248958630.dkr.ecr.us-west-2.amazonaws.com/{{cluster_name}}-api:latest',
      ]
    },
    worker: {
      cmds: [
        'docker build -t {{cluster_name}}-{{app_name}} -f Dockerfile-worker . --no-cache',
        'docker tag {{cluster_name}}-{{app_name}}:latest 052248958630.dkr.ecr.us-west-2.amazonaws.com/{{cluster_name}}-{{app_name}}:latest',
        'docker push 052248958630.dkr.ecr.us-west-2.amazonaws.com/{{cluster_name}}-{{app_name}}:latest',
      ]
    },
    console: {
      cmds: [
        './node_modules/.bin/gulp docker:build --gulpfile ./gulpfile.babel.js --build={{cluster_name}}',
        'docker build -t {{cluster_name}}-{{app_name}} . --no-cache',
        'docker tag {{cluster_name}}-{{app_name}}:latest 052248958630.dkr.ecr.us-west-2.amazonaws.com/{{cluster_name}}-{{app_name}}:latest',
        'docker push 052248958630.dkr.ecr.us-west-2.amazonaws.com/{{cluster_name}}-{{app_name}}:latest',
      ]
    },
    consumer: {
      cmds: [
        './node_modules/.bin/gulp {{cluster_name}}-build',
        'docker build -t {{cluster_name}}-{{app_name}} . --no-cache',
        'docker tag {{cluster_name}}-{{app_name}}:latest 052248958630.dkr.ecr.us-west-2.amazonaws.com/{{cluster_name}}-{{app_name}}:latest',
        'docker push 052248958630.dkr.ecr.us-west-2.amazonaws.com/{{cluster_name}}-{{app_name}}:latest',
      ]
    },
    'shipping-api': {
      cmds: [
        'docker build -t {{cluster_name}}-{{app_name}} -f docker/api . --no-cache',
        'docker tag {{cluster_name}}-{{app_name}}:latest 052248958630.dkr.ecr.us-west-2.amazonaws.com/{{cluster_name}}-{{app_name}}:latest',
        'docker push 052248958630.dkr.ecr.us-west-2.amazonaws.com/{{cluster_name}}-{{app_name}}:latest',
      ]
    },
    'shipping-worker': {
      cmds: [
        'docker build -t {{cluster_name}}-{{app_name}} -f docker/worker . --no-cache',
        'docker tag {{cluster_name}}-{{app_name}}:latest 052248958630.dkr.ecr.us-west-2.amazonaws.com/{{cluster_name}}-{{app_name}}:latest',
        'docker push 052248958630.dkr.ecr.us-west-2.amazonaws.com/{{cluster_name}}-{{app_name}}:latest',
      ]
    },
    'inventory-worker': {
      cmds: [
        'docker build -t {{cluster_name}}-{{app_name}} -f docker/worker . --no-cache',
        'docker tag {{cluster_name}}-{{app_name}}:latest 052248958630.dkr.ecr.us-west-2.amazonaws.com/{{cluster_name}}-{{app_name}}:latest',
        'docker push 052248958630.dkr.ecr.us-west-2.amazonaws.com/{{cluster_name}}-{{app_name}}:latest',
      ]
    },
    'analytics-mosql-logevents': {
      cmds: [
        'docker build -t mosql-logevents -f docker/mosql-logevents/Dockerfile . --no-cache',
        'docker tag mosql-logevents:latest 052248958630.dkr.ecr.us-west-2.amazonaws.com/{{cluster_name}}-{{app_name}}:latest',
        'docker push 052248958630.dkr.ecr.us-west-2.amazonaws.com/{{cluster_name}}-{{app_name}}:latest',
      ]
    },
    'analytics-mosql-models': {
      cmds: [
        'docker build -t mosql-models -f docker/mosql-models/Dockerfile . --no-cache',
        'docker tag mosql-models:latest 052248958630.dkr.ecr.us-west-2.amazonaws.com/{{cluster_name}}-{{app_name}}:latest',
        'docker push 052248958630.dkr.ecr.us-west-2.amazonaws.com/{{cluster_name}}-{{app_name}}:latest',
      ]
    }
  }

  desc('Deploy application to ECS. | [cluster_name,app_name]');
	task('app', ['aws:loadCredentials'], { async: false }, function(cluster_name, app_name) {
    const path = serviceToPath(app_name);
    if (!path) {
      console.error(`Unknown app/service: ${app_name}.`);
      return;
    }

    const cmds = [
      `cd ${path}`,
      'eval $(aws ecr get-login --no-include-email --region us-west-2)',
      ...apps[app_name].cmds,
    ];
    const vars = {cluster_name, app_name};
    const cmd = replacer(cmds.join(' && '), vars);
    jake.exec(cmd, { printStdout: true }, function(){
      jake.Task['ecs:restart'].execute(cluster_name, `${cluster_name}-${app_name}`);
      jake.Task['slack:deployment'].execute(cluster_name, app_name);
      complete();
    });
  });

  desc('Deploy application to ECS. | [cluster_name]');
	task('all', ['aws:loadCredentials'], { async: false }, function(cluster_name) {
    Object.keys(apps).forEach(k => {
      jake.exec(cmd, { printStdout: true }, function(){
        jake.Task['deploy:app'].execute(cluster_name, k);
        jake.Task['slack:deployment'].execute(cluster_name, k);
        complete();
      });
    })
  });
});
