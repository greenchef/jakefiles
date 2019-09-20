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
      core: false,
      shipping: false,
      jsreports: false,
    }
    console.log(magenta(`Creating new ephemeral environment for ${stackName}.`));
    console.log(cyan(`Please type 'Y' or 'y' for each service you want to deploy code to`));
    console.log(red('otherwise just press return.'));
    Object.keys(servicesRequested).forEach(service => {
      const serviceName = cyan(service);
      const response = question(`Do you want ${serviceName}?`);
      servicesRequested[service] = ['y', 'Y'].includes(response);
    })
    const serviceList = Object.entries(servicesRequested).reduce((acc, [key, val]) => {
      if (val) acc.push(green(`${key} +`));
      return acc;
    }, []);
    console.log(`Okay, you will deploy these services: ${serviceList.join(',\n')}`);

    const timesToLive = {
      hour: '1 hour',
      day: '1 day',
      week: '7 days',
      b_day: 'business day til 18:30',
      b_week: 'business week M-F',
    };

    const optionStrings = Object.entries(timesToLive).map(([key, val]) => `'${key}' - ${val}`)
    console.log(cyan('Please enter how long you want the environment to exist for.'))
    console.log(magenta('(Remember, you can always make a new environment later, so be frugal)'))
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