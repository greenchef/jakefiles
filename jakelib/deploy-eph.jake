const { serviceToPath } = require('./utils');

const ECR_URL = '052248958630.dkr.ecr.us-west-2.amazonaws.com';

const { AWS_DEFAULT_REGION, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY } = process.env;

const core_services = ['web-api', 'console-api', 'worker'];
const shipping_services = ['shipping-api', 'shipping-worker'];
const auth_services = ['auth-api', 'auth-worker'];

const constructBuildArgs = argObj => Object.entries(argObj).reduce((acc, [key, val]) => `${acc} --build-arg ${key}=${val}`, '');

const getPushCommands = ({ app_name, stack_name }) => {
  if (core_services.includes(app_name)) return [
    `docker tag ${stack_name}-${app_name}:latest ${ECR_URL}/eph-core-root:${stack_name}`,
    `echo Pushing to ${ECR_URL}/eph-core-root:${stack_name}`,
    `docker push ${ECR_URL}/eph-core-root:${stack_name}`,
  ]
  if (shipping_services.includes(app_name)) return [
    `docker tag ${stack_name}-${app_name}:latest ${ECR_URL}/eph-shipping-root:${stack_name}`,
    `echo Pushing to ${ECR_URL}/eph-shipping-root:${stack_name}`,
    `docker push ${ECR_URL}/eph-shipping-root:${stack_name}`,
  ]
  if (auth_services.includes(app_name)) return [
    `docker tag ${stack_name}-${app_name}:latest ${ECR_URL}/eph-auth-root:${stack_name}`,
    `echo Pushing to ${ECR_URL}/eph-auth-root:${stack_name}`,
    `docker push ${ECR_URL}/eph-auth-root:${stack_name}`,
  ]
  return [
    `docker tag ${stack_name}-${app_name}:latest ${ECR_URL}/eph-${app_name}:${stack_name}`,
    `echo Pushing to ${ECR_URL}/eph-${app_name}:${stack_name}`,
    `docker push ${ECR_URL}/eph-${app_name}:${stack_name}`,
  ]
}

const getDeployCommands = ({ app_name, stack_name }) => {
  const cdPath = serviceToPath(app_name);
  const buildArgs = constructBuildArgs({
    ENVIRONMENT: 'eph',
    STACK_NAME: stack_name,
    AWS_DEFAULT_REGION,
    AWS_ACCESS_KEY_ID,
    AWS_SECRET_ACCESS_KEY,
  });

  const cmds = [
    `cd ${cdPath}`,
    'eval $(aws ecr get-login --no-include-email --region us-west-2)',
    `echo Build started on ${(new Date()).toLocaleTimeString()}`,
    `docker build -t ${stack_name}-${app_name} . ${buildArgs}`,
    ...(getPushCommands({ app_name, stack_name })),
    `echo Restarting service eph-${stack_name}-${app_name}`,
  ];

  if (core_services.includes(app_name)) {
    cmds.push(
      `aws ecs update-service --cluster eph-ephemeral --service eph-${stack_name}-core-web-api --force-new-deployment`,
      `aws ecs update-service --cluster eph-ephemeral --service eph-${stack_name}-core-console-api --force-new-deployment`,
      `aws ecs update-service --cluster eph-ephemeral --service eph-${stack_name}-core-worker --force-new-deployment`,
    )
  } else if (shipping_services.includes(app_name)) {
    cmds.push(
      `aws ecs update-service --cluster eph-ephemeral --service eph-${stack_name}-shipping-api --force-new-deployment`,
      `aws ecs update-service --cluster eph-ephemeral --service eph-${stack_name}-shipping-worker --force-new-deployment`,
    )
  } else if (auth_services.includes(app_name)) {
    cmds.push(
      `aws ecs update-service --cluster eph-ephemeral --service eph-${stack_name}-auth-api --force-new-deployment`,
      `aws ecs update-service --cluster eph-ephemeral --service eph-${stack_name}-auth-worker --force-new-deployment`,
    )
  } else cmds.push(`aws ecs update-service --cluster eph-ephemeral --service eph-${stack_name}-${app_name} --force-new-deployment`);

  return cmds.join('&&');
}


namespace('deploy-eph', () => {
  desc('Deploy application | [stack_name,app_name]');
  task('app', ['aws:loadCredentials'], { async: true }, (stack_name, app_name) => {
    const cmdString = getDeployCommands({ app_name, stack_name });
    jake.exec(cmdString, { printStdout: true }, () => {
      console.log("app_name", app_name)
      jake.Task['slack:deployment'].execute(`eph-${stack_name}`, app_name);
      complete();
    });
  });
});