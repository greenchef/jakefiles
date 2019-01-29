const { serviceToPath } = require('./utils');

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
  }

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
    scheduler: {
      cmds: [
        'docker build -t {{cluster_name}}-{{app_name}} -f Dockerfile-scheduler . --no-cache',
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
    'console-v2': {
      cmds: [
        'npm run build-staging-uat3',
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
    'shipping-scheduler': {
      cmds: [
        'docker build -t {{cluster_name}}-{{app_name}} -f docker/scheduler . --no-cache',
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
    },
    'jsreports': {
      cmds: [
        'eval $(aws ecr get-login --no-include-email --region us-west-2)',
        'docker build -t {{cluster_name}}-{{app_name}} -f Dockerfile . --no-cache',
        'docker tag {{cluster_name}}-{{app_name}}:latest 052248958630.dkr.ecr.us-west-2.amazonaws.com/{{cluster_name}}-{{app_name}}:latest',
        'docker push 052248958630.dkr.ecr.us-west-2.amazonaws.com/{{cluster_name}}-{{app_name}}:latest',
        'docker image prune -a -f'
      ]
    }
  };

  desc('Deploy application to ECS. | [cluster_name,app_name]');
  task('app', ['aws:loadCredentials'], { async: false }, function(cluster_name, app_name) {
    const path = serviceToPath(app_name);
    if (!path) {
      console.error(`Unknown app/service: ${app_name}.`);
      return;
    }

    const cmds = [
      'eval $(aws ecr get-login --no-include-email --region us-west-2)',
      buildCmdString(path, cluster_name, app_name),
    ];

    jake.exec(cmds.join(' && '), { printStdout: true }, function(){
      jake.Task['ecs:restart'].execute(cluster_name, `${cluster_name}-${app_name}`);
      jake.Task['slack:deployment'].execute(cluster_name, app_name);
      complete();
    });
  });

  const buildCmdString = (path, cluster_name, app_name) => {
    const vars = { cluster_name, app_name };
    const cmds = [
      `cd ${path}`,
      ...apps[app_name].cmds,
    ];
    return replacer(cmds.join(' && '), vars);
  };

  desc('Deploy application to ECS. | [cluster_name]');
  // if any of the repos are not present in the target environment, this will fail on that step
  task('all', ['aws:loadCredentials'], { async: false }, function(cluster_name) {
    const cmds = [
      'eval $(aws ecr get-login --no-include-email --region us-west-2)',
    ];

    Object.keys(apps).forEach(k => {
      if(k !== 'consoleapi') { // commands for consoleapi and web-api are identical, no need to repeat
        cmds.push(buildCmdString(serviceToPath(k), cluster_name, k));
      }
    });

    jake.exec(cmds.join(' && '), { printStdout: true }, function(){
      Object.keys(apps).forEach(k => {
        jake.Task['ecs:restart'].execute(cluster_name, `${cluster_name}-${k}`);
        jake.Task['slack:deployment'].execute(cluster_name, k);
      });
      complete();
    });
  });

  desc('Deploy all core services (consoleapi, web-api, worker, scheduler) to ECS. | [cluster_name]');
  task('core', ['aws:loadCredentials'], { async: false }, function(cluster_name) {
    const keys = [
      'consoleapi',
      'web-api',
      'worker',
      'scheduler',
    ];

    if(cluster_name.includes('staging')){
      // scheduler is not deployed to most staging environments
      // can be released separately if needed
      keys.pop();
    }

    const cmds = [
      'eval $(aws ecr get-login --no-include-email --region us-west-2)',
    ];

    const path = serviceToPath(keys[0]); // all have the same path

    keys.forEach(k => {
      if(k !== 'consoleapi') { // commands for consoleapi and web-api are identical, no need to repeat
        cmds.push(buildCmdString(path, cluster_name, k));
      }
    });

    jake.exec(cmds.join(' && '), { printStdout: true }, function(){
      keys.forEach(k => {
        jake.Task['ecs:restart'].execute(cluster_name, `${cluster_name}-${k}`);
        jake.Task['slack:deployment'].execute(cluster_name, k);
      });
      complete();
    });
  });

  desc('Deploy all shipping services (shipping-api, shipping-worker, shipping-scheduler) to ECS. | [cluster_name]');
  task('shipping', ['aws:loadCredentials'], { async: false }, function(cluster_name) {
    const keys = [
      'shipping-api',
      'shipping-worker',
      'shipping-scheduler',
    ];

    const cmds = [
      'eval $(aws ecr get-login --no-include-email --region us-west-2)',
    ];

    const path = serviceToPath(keys[0]); // all have the same path

    keys.forEach(k => {
      cmds.push(buildCmdString(path, cluster_name, k));
    });

    jake.exec(cmds.join(' && '), { printStdout: true }, function(){
      keys.forEach(k => {
        jake.Task['ecs:restart'].execute(cluster_name, `${cluster_name}-${k}`);
        jake.Task['slack:deployment'].execute(cluster_name, k);
      });
      complete();
    });
  });
});
