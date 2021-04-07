const AWS = require('aws-sdk');
const fs = require('fs');

const { cyan, green, magenta, red } = require('chalk');
const { question } = require('readline-sync');

const { RAGNAROK_ARN } = process.env;

const SQS = new AWS.SQS({
  apiVersion: '2012-11-05',
  endpoint: 'https://sqs.us-west-2.amazonaws.com',
  region: 'us-west-2',
});

namespace('eph', () => {
  desc('Create an ephemeral environment | [stackname] | `stackname` must be alphanumeric and between 1 and 9 characters long')
  task('create', ['aws:loadCredentials'], { async: true }, async stackName => {
    const shouldSeed = !process.argv[3] || process.argv[3] !== '--noSeed';
    if (shouldSeed) {
      console.log(cyan(`Ephemeral creation of ${stackName} with seedData`))
    } else {
      console.log(cyan(`Ephemeral creation of ${stackName} with NO seedData`))
    }
    stackName = stackName.toLowerCase();
    if (stackName.length < 1 || stackName.length > 6 || stackName.replace(/\w/g, '').length > 0) {
      console.log(red('`stackname` must be alphanumeric and between 1 and 6 characters long!'));
      return;
    }

    const servicesRequested = {
      'app-greenchef': true,
      'auth': true,
      'bifrost': true,
      'console': true,
      'console-v2': true,
      'core': true,
      'frontend-proxy': true,
      'jsreports': true,
      'marketing-frontend': true,
      'shipping': true,
      'warehouse': true,
      'tools': true,
    }
    console.log(magenta(`Creating new ephemeral environment for ${stackName}.`));
    const serviceList = Object.entries(servicesRequested).reduce((acc, [key, val]) => {
      if (val) acc.push(key);
      return acc;
    }, []);

    const timesToLive = {
      hour: '1 hour',
      '3_hour': '3 hours',
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

    console.log();
    console.log(green(`Okay, creating "${stackName}" stack, which will exist for ${timesToLive[response]} after creation completes.`))
    console.log(magenta('Watch slack for a notification when your stack is ready to deploy to.'));
    console.log()

    const payload = {
      QueueUrl: 'https://sqs.us-west-2.amazonaws.com/052248958630/terraform-ephemeral-agent',
      MessageBody: JSON.stringify({
        workspace_dir: 'eph/ephemeral/ecs',
        terraform_version: '0.13.4',
        terraform_vars: {
            stack_name: stackName,
            ephemeral_tag: response,
            git_reference: 'eph-save',
            requested_service_names: Object.entries(servicesRequested).reduce((arr, [service, requested]) => {
              return requested ? [...arr, service] : arr;
            }, []),
        }
      }),
    }
    try {
      await SQS.sendMessage(payload).promise();
      if (shouldSeed) {
        jake.exec(`ssh ec2-user@peon /home/ec2-user/seed-data-execution-directory/executor-tools/executor.sh ${stackName}`, { printStdout: true });
      }
    } catch (e) {
      console.log('Failed to send SQS message to create the stack. Error:', e)
    }
  })
  
  task('destroy', ['aws:loadCredentials'], { async: true }, async stackName => {
    const response = question(`Are you sure you want to destroy the environment eph-${stackName}? y/n `);
    if (response.toLowerCase() === 'y') {
      console.log(cyan(`\nDestroying eph-${stackName}.\n`))
      await jake.exec(`aws lambda invoke --function-name ${RAGNAROK_ARN} --cli-binary-format raw-in-base64-out --invocation-type RequestResponse --payload '{ "stack": "${stackName}" }' response.json`, { printStdout: true });
      const { body, statusCode } = JSON.parse(fs.readFileSync('response.json'));
      const color = statusCode === 200 ? green : red;
     console.log(color(`\n${body}\n`));
    }
  });

  task('seed', ['aws:loadCredentials'], { async: true }, async stackName => {
    const response = question(`Are you sure you want to seed the environment eph-${stackName}? y/n: `);
    if (response.toLowerCase() === 'y') {
      console.log(cyan(`Seeding eph-${stackName}`));
      jake.exec(`ssh ec2-user@peon /home/ec2-user/seed-data-execution-directory/executor-tools/executor.sh ${stackName}`, { printStdout: true });
    }
  })
})
