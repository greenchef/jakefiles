const { getBranchOrTag, serviceToPath } = require('./utils');

const ECR_URL = '052248958630.dkr.ecr.us-west-2.amazonaws.com';

const replacer = (value, variables) => {
  if (!value) return value;

  const var_pattern = /(#[A-Za-z0-9_]+#)|({{[A-Za-z0-9_]+}})/g;
  (value.match(var_pattern) || []).forEach(matched_var => {
    const idx = value.indexOf(matched_var);
    if (idx > -1) {
      const value_for_replace = variables[matched_var.replace(/#|{{|}}/g, "")];
      if (value_for_replace != null) {
        value = value.replace(new RegExp(matched_var, "g"), value_for_replace);
      }
    }
  });
  return value;
}

const buildCmdString = (path, environment, stack, app_name) => {
  const cmds = [
    `cd ${path}`,
    ...apps[app_name].cmds,
  ];
  const cluster_name = `${environment}-${stack}`;
  return replacer(cmds.join(' && '), { cluster_name, environment, stack, app_name });
};

const authRootCommands = [
  'docker build -t {{stack}}-auth-root -f ./Dockerfile . --no-cache',
  `docker tag {{stack}}-auth-root:latest ${ECR_URL}/{{stack}}-auth-root:latest`,
  `docker push ${ECR_URL}/{{stack}}-auth-root:latest`,
]

const coreRootCommands = [
  'docker build -t {{stack}}-core-root -f ./Dockerfile . --no-cache',
  `docker tag {{stack}}-core-root:latest ${ECR_URL}/{{stack}}-core-root:latest`,
  `docker push ${ECR_URL}/{{stack}}-core-root:latest`,
]

const inventoryDeployCommands = [
  'docker build -t {{environment}}-{{stack}}-{{app_name}} -f ./docker/worker . --no-cache',
  `docker tag {{environment}}-{{stack}}-{{app_name}}:latest ${ECR_URL}/{{environment}}-{{stack}}-{{app_name}}:latest`,
  `docker push ${ECR_URL}/{{environment}}-{{stack}}-{{app_name}}:latest`,
]

const normalDeployCommands = [
  `docker build -t {{stack}}-{{app_name}} . --build-arg CLUSTER={{cluster_name}} --build-arg ENVIRONMENT={{environment}} --build-arg STACK_NAME={{stack}} --no-cache`,
  `docker tag {{stack}}-{{app_name}}:latest ${ECR_URL}/{{stack}}-{{app_name}}:latest`,
  `docker push ${ECR_URL}/{{stack}}-{{app_name}}:latest`,
]

const shippingRootCommands = [
  'docker build -t {{stack}}-shipping-root -f ./Dockerfile . --no-cache',
  `docker tag {{stack}}-shipping-root:latest ${ECR_URL}/{{stack}}-shipping-root:latest`,
  `docker push ${ECR_URL}/{{stack}}-shipping-root:latest`,
]

const getAnalyticsCommands = (subName) => {
  return [
    'docker build -t greenchef/mosql-base -f ./docker/mosql-base/Dockerfile . --no-cache',
    `docker build -t ${subName} -f docker/${subName}/Dockerfile . --no-cache`,
    `docker tag ${subName}:latest ${ECR_URL}/{{cluster_name}}-{{app_name}}:latest`,
    `docker push ${ECR_URL}/{{cluster_name}}-{{app_name}}:latest`,
  ]
}

const apps = {
  // CORE API
  'consoleapi': { cmds: coreRootCommands },
  scheduler: { cmds: coreRootCommands },
  'web-api': { cmds: coreRootCommands },
  worker: { cmds: coreRootCommands },

  // SHIPPING
  'shipping-api': { cmds: shippingRootCommands },
  'shipping-scheduler': { cmds: shippingRootCommands },
  'shipping-worker': { cmds: shippingRootCommands },

  // ANALYTICS
  'analytics-mosql-logevents': { cmds: getAnalyticsCommands('mosql-logevents') },
  'analytics-mosql-models': { cmds: getAnalyticsCommands('mosql-models') },
  'analytics-mosql-shipping': { cmds: getAnalyticsCommands('mosql-shipping') },

  // MISCELLANEOUS
  'app-greenchef': { cmds: normalDeployCommands },
  'auth-api': { cmds: authRootCommands },
  'bifrost': { cmds: normalDeployCommands },
  'console-v2': { cmds: normalDeployCommands },
  'console': { cmds: normalDeployCommands },
  'frontend-proxy': { cmds: normalDeployCommands },
  'inventory-worker': { cmds: inventoryDeployCommands },
  'jsreports': { cmds: normalDeployCommands },
  'marketing-frontend': { cmds: normalDeployCommands },
};

namespace('deploy', function () {
  desc('Deploy application to ECS. | [environment, stack, app_name]');
  task('app', ['aws:loadCredentials'], { async: false }, function (environment, stack, app_name) {
    const path = serviceToPath(app_name);
    if (!path) {
      console.error(`Unknown app/service: ${app_name}.`);
      return;
    }

    const cmds = [
      'eval $(aws ecr get-login --no-include-email --region us-west-2)',
      buildCmdString(path, environment, stack, app_name),
    ];

    jake.exec(cmds.join(' && '), { printStdout: true }, function () {
      const cluster_name = `${environment}-${stack}`;
      jake.Task['ecs:restart'].execute(cluster_name, `${cluster_name}-${app_name}`);
      jake.Task['slack:deployment'].execute(cluster_name, app_name);
      complete();
    });
  });


  desc('Deploy all core services (consoleapi, web-api, worker, scheduler) to ECS. | [environment, stack]');
  task('core', ['aws:loadCredentials'], { async: false }, function (environment, stack) {
    const services = [
      'consoleapi',
      'scheduler',
      'web-api',
      'worker',
    ];

    const cmdsTemplate = [
      'eval $(aws ecr get-login --no-include-email --region us-west-2)',
      `cd ${process.env.PATH_TO_SERVER}`,
      ...coreRootCommands,
    ];

    const cmds = replacer(cmdsTemplate.join(' && '), { environment, stack })

    jake.exec(cmds, { printStdout: true }, function () {
      services.forEach(service => {
        const cluster_name = `${environment}-${stack}`;
        jake.Task['ecs:restart'].execute(cluster_name, `${cluster_name}-${service}`);
        jake.Task['slack:deployment'].execute(cluster_name, service);
      });
      complete();
    });
  });

  desc('Deploy all shipping services (shipping-api, shipping-worker, shipping-scheduler) to ECS. | [environment, stack]');
  task('shipping', ['aws:loadCredentials'], { async: false }, function (environment, stack) {
    const services = [
      'shipping-api',
      'shipping-scheduler',
      'shipping-worker',
    ];

    const cmdsTemplate = [
      'eval $(aws ecr get-login --no-include-email --region us-west-2)',
      `cd ${process.env.PATH_TO_SHIPPING}`,
      ...shippingRootCommands,
    ];

    const cmds = replacer(cmdsTemplate.join(' && '), { environment, stack })

    jake.exec(cmds, { printStdout: true }, function () {
      services.forEach(service => {
        const cluster_name = `${environment}-${stack}`;
        jake.Task['ecs:restart'].execute(cluster_name, `${cluster_name}-${service}`);
        jake.Task['slack:deployment'].execute(cluster_name, service);
      });
      complete();
    });
  });
  
});
