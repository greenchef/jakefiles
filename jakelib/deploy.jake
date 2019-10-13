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
  `docker build -t {{stack}}-{{app_name}} . --build-arg CLUSTER={{cluster_name}} --no-cache`,
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

  // FRONT-ENDS
  console: {
    cmds: [
      './node_modules/.bin/gulp buildDocker --env={{cluster_name}}',
      ...normalDeployCommands,
      './node_modules/.bin/gulp build --env=dev', // IMPORTANT: This resets your local build to dev so it isn't pointing wherever you just deployed (aka changing things in PROD accidentally)
    ]
  },
  'console-v2': {
    cmds: [
      'npm run build-{{cluster_name}}',
      ...normalDeployCommands,
    ]
  },

  // ANALYTICS
  'analytics-mosql-logevents': { cmds: getAnalyticsCommands('mosql-logevents') },
  'analytics-mosql-models': { cmds: getAnalyticsCommands('mosql-models') },
  'analytics-mosql-shipping': { cmds: getAnalyticsCommands('mosql-shipping') },

  // MISCELLANEOUS
  'inventory-worker': { cmds: inventoryDeployCommands },
  'jsreports': { cmds: normalDeployCommands },
  'bifrost': { cmds: normalDeployCommands },
  'auth-api': { cmds: authRootCommands },
  'marketing-frontend': { cmds: normalDeployCommands },
  'frontend-proxy': { cmds: normalDeployCommands },
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

  desc('Deploy application to ECS. | [cluster_name]');
  task('all', ['aws:loadCredentials'], { async: false }, function (environment, stack) {
    const cmds = [
      'eval $(aws ecr get-login --no-include-email --region us-west-2)',
    ];

    Object.keys(apps).forEach(appName => {
      if (appName !== 'consoleapi') { // commands for consoleapi and web-api are identical, no need to repeat
        cmds.push(buildCmdString(serviceToPath(appName), cluster_name, appName));
      }
    });

    jake.exec(cmds.join(' && '), { printStdout: true }, function () {
      Object.keys(apps).forEach(appName => {
        jake.Task['ecs:restart'].execute(cluster_name, `${cluster_name}-${appName}`);
        jake.Task['slack:deployment'].execute(cluster_name, appName);
      });
      complete();
    });
  });

  desc('Deploy consumer | [environment, stack]');
  task('consumer', ['aws:loadCredentials'], { async: true }, async function (environment, stack) {
    const clusterMap = {
      'prod-lv': 'releaseProdLV',
      'stag-qe': 'releaseStagQE',
      'stag-uat': 'releaseStagUAT',
    };
    const cluster_name = `${environment}-${stack}`;
    const branch = await getBranchOrTag('consumer');
    const buildArg = clusterMap[cluster_name];
    const dockerfile = ['prod-lv'].includes(cluster_name) ? 'cdn' : 'non-cdn';
    const cmds = [
      `cd ${process.env.PATH_TO_CONSUMER}`,
      'eval $(aws ecr get-login --no-include-email --region us-west-2)',
      `docker build -t ${stack}-consumer . -f ./docker/${dockerfile}.dockerfile --build-arg ENV=${buildArg} --build-arg BRANCH=${branch} --no-cache`,
      `docker tag ${stack}-consumer:latest ${ECR_URL}/${stack}-consumer:latest`,
      `docker push ${ECR_URL}/${stack}-consumer:latest`,
    ];
    jake.exec(cmds.join(' && '), { printStdout: true }, function () {
      jake.Task['ecs:restart'].execute(cluster_name, `${cluster_name}-consumer`);
      jake.Task['slack:deployment'].execute(cluster_name, 'consumer');
      complete();
    });
  })

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

  task('marketing', function (environment, stack) {
    const config = {
      eph: {

      },
      'prod-lv': {
        cdnBucket: 'greechef.com',
        cdnPrefix: 'https://cdn.greenchef.com',
        useCDN: true,
      },
      'stag-uat': {
        cdnBucket: 'pre-prod-consumer.greenchef.com',
        cdnPrefix: 'https://pre-prod-cdn.greenchef.com',
        useCDN: true,
      },
    };
    const readKey = jake.createExec([`aws configure get aws_access_key_id`]);
    readKey.addListener('stdout', function (msg) {
      const key = msg.toString().trim();
      const readSecret = jake.createExec([`aws configure get aws_secret_access_key`]);
      readSecret.addListener('stdout', function (msg) {
        const secret = msg.toString().trim();
        const clusterName = `${environment}-${stack}`;
        const { cdnBucket, cdnPrefix, useCDN } = environment === 'eph' ? config.eph : (config[clusterName] || {});
        const cmds = [
          `cd ${process.env.PATH_TO_MARKETING_FRONTEND}`,
          'eval $(aws ecr get-login --no-include-email --region us-west-2)',
          `docker build -t ${stack}-marketing-frontend . -f Dockerfile --build-arg AWS_ACCESS_KEY_ID=${key} --build-arg AWS_SECRET_ACCESS_KEY=${secret} --build-arg IS_CDN=${useCDN} --build-arg BUCKET=${cdnBucket} --build-arg CDN_PREFIX=${cdnPrefix} --build-arg BUILD_TARGET=${clusterName} --no-cache`,
          `docker tag ${stack}-marketing-frontend:latest ${ECR_URL}/${stack}-marketing-frontend:latest`,
          `docker push ${ECR_URL}/${stack}-marketing-frontend:latest`,
        ];
        jake.exec(cmds.join(' && '), { printStdout: true }, function () {
          jake.Task['ecs:restart'].execute(clusterName, `${clusterName}-marketing-frontend`);
          jake.Task['slack:deployment'].execute(clusterName, 'marketing-frontend');
          complete();
        });

      });
      readSecret.run();
    });
    readKey.run();
  });
});
