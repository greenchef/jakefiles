const { getBranchOrTag, serviceToPath } = require('./utils');

const ECR_URL = '052248958630.dkr.ecr.us-west-2.amazonaws.com';

const replacer = (value, variables) => {
  if(!value) return value;

  const var_pattern = /(#[A-Za-z0-9_]+#)|({{[A-Za-z0-9_]+}})/g;
  value.match(var_pattern).forEach(matched_var => {
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

const buildCmdString = (path, stack_name, app_name) => {
  const cmds = [
    `cd ${path}`,
    ...apps[app_name].cmds,
  ];
  return replacer(cmds.join(' && '), { stack_name, app_name });
};

const getDeployCommands = (app_name, args = '') => ([
  'eval $(aws ecr get-login --no-include-email --region us-west-2)',
  `docker build -t {{stack_name}}-${app_name} . ${args} --no-cache`,
  `docker tag {{stack_name}}-${app_name}:latest ${ECR_URL}/eph-${app_name}:{{stack_name}}`,
  `docker push ${ECR_URL}/eph-${app_name}:{{stack_name}}`,
])
const coreRootCommands = getDeployCommands('core-root', '-f ./Dockerfile')
const shippingRootCommands = getDeployCommands('shipping-root', '-f ./Dockerfile')

const apps = {
  // CORE API
  'core-console-api': { cmds: coreRootCommands },
  'core-scheduler': { cmds: coreRootCommands },
  'core-web-api': { cmds: coreRootCommands },
  'core-worker': { cmds: coreRootCommands },

  // SHIPPING
  'shipping-api': { cmds: shippingRootCommands },
  'shipping-scheduler': { cmds: shippingRootCommands },
  'shipping-worker': { cmds: shippingRootCommands },

  'console': {
    cmds: [
      './node_modules/.bin/gulp buildDocker --env=eph',
      ...getDeployCommands('console'),
      './node_modules/.bin/gulp build --env=dev',
    ]
  },

  'jsreports': { cmds: getDeployCommands('jsreports') },

  'bifrost': { cmds: getDeployCommands('bifrost') }
};

namespace('deploy-eph', function () {
  desc('Deploy application | [stack_name,app_name]');
  task('app', ['aws:loadCredentials'], { async: false }, function(stack_name, app_name) {
    const path = serviceToPath(app_name);
    if (!path) {
      console.error(`Unknown app/service: ${app_name}.`);
      return;
    }

    const cmds = [
      buildCmdString(path, stack_name, app_name),
    ];

    jake.exec(cmds.join(' && '), { printStdout: true }, function(){
      jake.Task['ecs-eph:restart'].execute(stack_name, app_name);
      // jake.Task['slack:deployment'].execute(cluster_name, app_name);
      complete();
    });
  });

  desc('Deploy consumer | [stack_name]');
  task('consumer', ['aws:loadCredentials'], { async: true }, async function(stack_name) {
    const app_name = 'consumer'
    const branch = await getBranchOrTag(app_name);

    const cmdsTemplate = [
      `cd ${process.env.PATH_TO_CONSUMER}`,
      ...getDeployCommands(app_name, `-f ./docker/non-cdn.dockerfile --build-arg ENV=releaseEphemeral --build-arg STACK_NAME_ARG=${stack_name} --build-arg BRANCH=${branch}`),
    ];
    const cmds = replacer(cmdsTemplate.join(' && '), { stack_name })

    jake.exec(cmds, { printStdout: true }, function(){
      jake.Task['ecs-eph:restart'].execute(stack_name, app_name);
      // jake.Task['slack:deployment'].execute(cluster_name, 'consumer');
      complete();
    });
  })

  desc('Deploy console-v2 | [stack_name]');
  task('console-v2', ['aws:loadCredentials'], { async: false }, async function(stack_name) {
    const app_name = 'console-v2'

    const cmdsTemplate = [
      `cd ${process.env.PATH_TO_CONSOLE_V2}`,
      `STACK_NAME=${stack_name} npm run build-eph`,
      ...getDeployCommands('console-v2'),
    ];
    const cmds = replacer(cmdsTemplate.join(' && '), { stack_name })

    jake.exec(cmds, { printStdout: true }, function(){
      jake.Task['ecs-eph:restart'].execute(stack_name, app_name);
      // jake.Task['slack:deployment'].execute(cluster_name, 'consumer');
      complete();
    });
  })

  desc('Deploy all core services (console-api, web-api, worker, scheduler) | [stack_name]');
  task('core', ['aws:loadCredentials'], { async: false }, function(stack_name) {
    const appNames = [
      'core-console-api',
      'core-scheduler',
      'core-web-api',
      'core-worker',
    ];

    const cmdsTemplate = [
      `cd ${process.env.PATH_TO_SERVER}`,
      ...coreRootCommands,
    ];
    const cmds = replacer(cmdsTemplate.join(' && '), { stack_name })

    jake.exec(cmds, { printStdout: true }, function(){
      appNames.forEach(app_name => {
        jake.Task['ecs-eph:restart'].execute(stack_name, app_name);
        // jake.Task['slack:deployment'].execute(cluster_name, service);
      });
      complete();
    });
  });

  desc('Deploy all shipping services (shipping-api, shipping-worker, shipping-scheduler) | [stack_name]');
  task('shipping', ['aws:loadCredentials'], { async: false }, function(stack_name) {
    const appNames = [
      'shipping-api',
      'shipping-scheduler',
      'shipping-worker',
    ];

    const cmdsTemplate = [
      `cd ${process.env.PATH_TO_SHIPPING}`,
      ...shippingRootCommands,
    ];

    const cmds = replacer(cmdsTemplate.join(' && '), { stack_name })

    jake.exec(cmds, { printStdout: true }, function(){
      appNames.forEach(app_name => {
        jake.Task['ecs-eph:restart'].execute(stack_name, app_name);
        // jake.Task['slack:deployment'].execute(cluster_name, service);
      });
      complete();
    });
  });
});
