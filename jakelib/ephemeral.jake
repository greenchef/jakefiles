const AWS = require('aws-sdk');

const { cyan, green, magenta, red } = require('chalk');
const { question } = require('readline-sync');


const SQS = new AWS.SQS({
  apiVersion: '2012-11-05',
  endpoint: 'https://sqs.us-west-2.amazonaws.com',
  region: 'us-west-2',
});

namespace('eph', () => {
  desc('Create an ephemeral environment | [stackname] | `stackname` must be alphanumeric and between 1 and 9 characters long')
  task('create', ['aws:loadCredentials'], { async: true }, async stackName => {
    if (stackName.length < 1 || stackName.length > 9 || stackName.replace(/\w/g, '').length > 0) {
      red('`stackname` must be alphanumeric and between 1 and 9 characters long!')
      return;
    }

    const servicesRequested = {
      // 'console': false,
      // 'console-v2': false,
      // 'consumer': false,
      'core': false,
      'jsreports': false,
      'shipping': false,
    }
    console.log(magenta(`Creating new ephemeral environment for ${stackName}.`));
    console.log(cyan(`Please enter 'y' for each service you want to deploy code to`));
    console.log(cyan('otherwise just press return and the service will use a production image.'));
    console.log(red('NOTE: Front-end apps must always be deployed by you, as they cannot use a prod image due to how they are built.'));
    Object.keys(servicesRequested).forEach(service => {
      const serviceName = cyan(service);
      const response = question(`Do you want ${serviceName}? (y/N)`);
      servicesRequested[service] = ['y', 'Y'].includes(response);
    })
    const serviceList = Object.entries(servicesRequested).reduce((acc, [key, val]) => {
      if (val) acc.push(green(`${key} +`));
      return acc;
    }, []);
    console.log(`Okay, you will deploy these services: ${serviceList.join(',\n')}`);

    const timesToLive = {
      hour: '1 hour',
      b_day: 'business day til 18:30',
      day: '1 day',
      b_week: 'business week M-F',
      week: '7 days',
    };

    const optionStrings = Object.entries(timesToLive).map(([key, val]) => `'${key}' - ${val}`)
    console.log(cyan('Please enter how long you want the environment to exist for.'))
    console.log(magenta('(Remember, you can always make a new environment later, so be frugal!)'))
    console.log(cyan(`Options:\n${optionStrings.join(',\n')}`));
    const response = question('Selection: ');
    if (!Object.keys(timesToLive).includes(response)) {
      console.log(red('You did not correctly enter a time to live.'));
      return;
    }
    console.log(`Okay, creating ${stackName} stack, which will exist for ${timesToLive[response]}.`)
    const payload = {
      QueueUrl: 'https://sqs.us-west-2.amazonaws.com/052248958630/terraform-ephemeral-agent',
      MessageBody: JSON.stringify({
        workspace_dir: 'eph/ephemeral/ecs',
        terraform_vars: {
            stack_name: stackName,
            ephemeral_tag: response,
            git_reference: 'destroyer',
            requested_service_names: Object.entries(servicesRequested).reduce((arr, [service, requested]) => {
              return requested ? [...arr, service] : arr;
            }, []),
        }
      }),
    }
    try {
      const res = await SQS.sendMessage(payload).promise();
      console.log(res);
    } catch (e) {
      console.log(e)
    }

  })
})
