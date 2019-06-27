const { getBranchOrTag, serviceToPath } = require('./utils');

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

  const buildCmdString = (path, cluster_name, app_name) => {
    const vars = { cluster_name, app_name };
    const cmds = [
      `cd ${path}`,
      ...apps[app_name].cmds,
    ];
    return replacer(cmds.join(' && '), vars);
  };

  const apps = {
    consoleapi: {
      cmds: [
        'docker build -t {{cluster_name}}-core-root -f ./Dockerfile . --no-cache',
        'docker tag {{cluster_name}}-core-root:latest 052248958630.dkr.ecr.us-west-2.amazonaws.com/{{cluster_name}}-core-root:latest',
        'docker push 052248958630.dkr.ecr.us-west-2.amazonaws.com/{{cluster_name}}-core-root:latest',
      ]
    },
    'web-api': {
      cmds: [
        'docker build -t {{cluster_name}}-core-root -f ./Dockerfile . --no-cache',
        'docker tag {{cluster_name}}-core-root:latest 052248958630.dkr.ecr.us-west-2.amazonaws.com/{{cluster_name}}-core-root:latest',
        'docker push 052248958630.dkr.ecr.us-west-2.amazonaws.com/{{cluster_name}}-core-root:latest',
      ]
    },
    worker: {
      cmds: [
        'docker build -t {{cluster_name}}-core-root -f ./Dockerfile . --no-cache',
        'docker tag {{cluster_name}}-core-root:latest 052248958630.dkr.ecr.us-west-2.amazonaws.com/{{cluster_name}}-core-root:latest',
        'docker push 052248958630.dkr.ecr.us-west-2.amazonaws.com/{{cluster_name}}-core-root:latest',
      ]
    },
    scheduler: {
      cmds: [
        'docker build -t {{cluster_name}}-core-root -f ./Dockerfile . --no-cache',
        'docker tag {{cluster_name}}-core-root:latest 052248958630.dkr.ecr.us-west-2.amazonaws.com/{{cluster_name}}-core-root:latest',
        'docker push 052248958630.dkr.ecr.us-west-2.amazonaws.com/{{cluster_name}}-core-root:latest',
      ]
    },
    'shipping-api': {
      cmds: [
        'docker build -t {{cluster_name}}-shipping-root -f ./Dockerfile . --no-cache',
        'docker tag {{cluster_name}}-shipping-root:latest 052248958630.dkr.ecr.us-west-2.amazonaws.com/{{cluster_name}}-shipping-root:latest',
        'docker push 052248958630.dkr.ecr.us-west-2.amazonaws.com/{{cluster_name}}-shipping-root:latest',
      ]
    },
    'shipping-worker': {
      cmds: [
        'docker build -t {{cluster_name}}-shipping-root -f ./Dockerfile . --no-cache',
        'docker tag {{cluster_name}}-shipping-root:latest 052248958630.dkr.ecr.us-west-2.amazonaws.com/{{cluster_name}}-shipping-root:latest',
        'docker push 052248958630.dkr.ecr.us-west-2.amazonaws.com/{{cluster_name}}-shipping-root:latest',
      ]
    },
    'shipping-scheduler': {
      cmds: [
        'docker build -t {{cluster_name}}-shipping-root -f ./Dockerfile . --no-cache',
        'docker tag {{cluster_name}}-shipping-root:latest 052248958630.dkr.ecr.us-west-2.amazonaws.com/{{cluster_name}}-shipping-root:latest',
        'docker push 052248958630.dkr.ecr.us-west-2.amazonaws.com/{{cluster_name}}-shipping-root:latest',
      ]
    },
    console: {
      cmds: [
        './node_modules/.bin/gulp buildDocker --env={{cluster_name}}',
        'docker build -t {{cluster_name}}-{{app_name}} . --no-cache',
        'docker tag {{cluster_name}}-{{app_name}}:latest 052248958630.dkr.ecr.us-west-2.amazonaws.com/{{cluster_name}}-{{app_name}}:latest',
        './node_modules/.bin/gulp build --env=dev',
        'docker push 052248958630.dkr.ecr.us-west-2.amazonaws.com/{{cluster_name}}-{{app_name}}:latest'
      ]
    },
    'console-v2': {
      cmds: [
        'npm run build-{{cluster_name}}',
        'docker build -t {{cluster_name}}-{{app_name}} . --no-cache',
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
        'docker build -t greenchef/mosql-base -f ./docker/mosql-base/Dockerfile . --no-cache',
        'docker build -t mosql-logevents -f docker/mosql-logevents/Dockerfile . --no-cache',
        'docker tag mosql-logevents:latest 052248958630.dkr.ecr.us-west-2.amazonaws.com/{{cluster_name}}-{{app_name}}:latest',
        'docker push 052248958630.dkr.ecr.us-west-2.amazonaws.com/{{cluster_name}}-{{app_name}}:latest',
      ]
    },
    'analytics-mosql-models': {
      cmds: [
        'docker build -t greenchef/mosql-base -f ./docker/mosql-base/Dockerfile . --no-cache',
        'docker build -t mosql-models -f docker/mosql-models/Dockerfile . --no-cache',
        'docker tag mosql-models:latest 052248958630.dkr.ecr.us-west-2.amazonaws.com/{{cluster_name}}-{{app_name}}:latest',
        'docker push 052248958630.dkr.ecr.us-west-2.amazonaws.com/{{cluster_name}}-{{app_name}}:latest',
      ]
    },
    'analytics-mosql-shipping': {
      cmds: [
        'docker build -t greenchef/mosql-base -f ./docker/mosql-base/Dockerfile . --no-cache',
        'docker build -t mosql-shipping -f docker/mosql-shipping/Dockerfile . --no-cache',
        'docker tag mosql-shipping:latest 052248958630.dkr.ecr.us-west-2.amazonaws.com/{{cluster_name}}-{{app_name}}:latest',
        'docker push 052248958630.dkr.ecr.us-west-2.amazonaws.com/{{cluster_name}}-{{app_name}}:latest',
      ]
    },
    'jsreports': {
      cmds: [
        'docker build -t {{cluster_name}}-{{app_name}} -f Dockerfile . --no-cache',
        'docker tag {{cluster_name}}-{{app_name}}:latest 052248958630.dkr.ecr.us-west-2.amazonaws.com/{{cluster_name}}-{{app_name}}:latest',
        'docker push 052248958630.dkr.ecr.us-west-2.amazonaws.com/{{cluster_name}}-{{app_name}}:latest',
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

  desc('Deploy consumer | [cluster_name]');
  task('consumer', ['aws:loadCredentials'], { async: true }, async function(cluster_name) {
    const clusterMap = {
      'production-lv': 'releaseProd',
      'staging-core': 'releaseStagingCore',
      'staging-grow': 'releaseStagingGrow',
      'staging-pp': 'releasePreProd',
      'staging-uat': 'releaseStagingUat',
      'staging-uat3': 'releaseStagingUat3',
    };
    const branch = await getBranchOrTag('consumer');
    const buildArg = clusterMap[cluster_name];
    const dockerfile = ['production-lv', 'staging-pp'].includes(cluster_name) ? 'cdn' : 'non-cdn';
    const cmds = [
      `cd ${process.env.PATH_TO_CONSUMER}`,
      'eval $(aws ecr get-login --no-include-email --region us-west-2)',
      `docker build -t ${cluster_name}-consumer . -f ./docker/${dockerfile}.dockerfile --build-arg ENV=${buildArg} --build-arg BRANCH=${branch} --no-cache`,
      `docker tag ${cluster_name}-consumer:latest 052248958630.dkr.ecr.us-west-2.amazonaws.com/${cluster_name}-consumer:latest`,
      `docker push 052248958630.dkr.ecr.us-west-2.amazonaws.com/${cluster_name}-consumer:latest`,
    ];
    jake.exec(cmds.join(' && '), { printStdout: true }, function(){
      jake.Task['ecs:restart'].execute(cluster_name, `${cluster_name}-consumer`);
      jake.Task['slack:deployment'].execute(cluster_name, 'consumer');
      complete();
    });
  })

  desc('Deploy all core services (consoleapi, web-api, worker, scheduler) to ECS. | [cluster_name]');
  task('core', ['aws:loadCredentials'], { async: false }, function(cluster_name) {
    const services = [
      'consoleapi',
      'web-api',
      'worker',
      'scheduler',
    ];

    const cmdsTemplate = [
      'eval $(aws ecr get-login --no-include-email --region us-west-2)',
      `cd ${process.env.PATH_TO_SERVER}`,
      'docker build -t {{cluster_name}}-core-root -f ./Dockerfile . --no-cache',
      'docker tag {{cluster_name}}-core-root:latest 052248958630.dkr.ecr.us-west-2.amazonaws.com/{{cluster_name}}-core-root:latest',
      'docker push 052248958630.dkr.ecr.us-west-2.amazonaws.com/{{cluster_name}}-core-root:latest',
    ];

    const cmds = replacer(cmdsTemplate.join(' && '), { cluster_name })

    jake.exec(cmds, { printStdout: true }, function(){
      services.forEach(service => {
        jake.Task['ecs:restart'].execute(cluster_name, `${cluster_name}-${service}`);
        jake.Task['slack:deployment'].execute(cluster_name, service);
      });
      complete();
    });
  });

  desc('Deploy all shipping services (shipping-api, shipping-worker, shipping-scheduler) to ECS. | [cluster_name]');
  task('shipping', ['aws:loadCredentials'], { async: false }, function(cluster_name) {

    const services = [
      'shipping-api',
      'shipping-worker',
      'shipping-scheduler',
    ];

    const cmdsTemplate = [
      'eval $(aws ecr get-login --no-include-email --region us-west-2)',
      `cd ${process.env.PATH_TO_SHIPPING}`,
      'docker build -t {{cluster_name}}-shipping-root -f ./Dockerfile . --no-cache',
      'docker tag {{cluster_name}}-shipping-root:latest 052248958630.dkr.ecr.us-west-2.amazonaws.com/{{cluster_name}}-shipping-root:latest',
      'docker push 052248958630.dkr.ecr.us-west-2.amazonaws.com/{{cluster_name}}-shipping-root:latest',
    ];

    const cmds = replacer(cmdsTemplate.join(' && '), { cluster_name })

    jake.exec(cmds, { printStdout: true }, function(){
      services.forEach(service => {
        jake.Task['ecs:restart'].execute(cluster_name, `${cluster_name}-${service}`);
        jake.Task['slack:deployment'].execute(cluster_name, service);
      });
      complete();
    });
  });
});
