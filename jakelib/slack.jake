const gitBranch = require('git-branch')
const util = require('util')

const { PATH_TO_SERVER, PATH_TO_CONSOLE, PATH_TO_CONSUMER, PATH_TO_SHIPPING, PATH_TO_INVENTORY } = process.env;

const serviceToPath = (service_name) => {
  switch(service_name) {
    case 'consoleapi':
    case 'web-api':
      return PATH_TO_SERVER
    case 'console':
      return PATH_TO_CONSOLE
    case 'consumer':
      return PATH_TO_CONSUMER
    case 'shipping-api':
    case 'shipping-worker':
      return PATH_TO_SHIPPING
    case 'inventory-worker':
      return PATH_TO_INVENTORY
    default:
      return null;
  }
}

const getBranchName = (service_name) => {
  const path = serviceToPath(service_name);
  if (!path) return 'unknown'

  return gitBranch.sync(path);
}

namespace('slack', function () {

  desc('Send slack deployment confirmation  | [cluster_name,service_name]');
	task('deployment', [], { async: false }, function(cluster_name, service_name) {
    const branch_name = getBranchName(service_name);

    const message = `Branch ${branch_name} for ${service_name} deployed to ${cluster_name}.`
    const slackPostUrl = 'https://hooks.slack.com/services/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';
    let payload = {
      channel: "#releases",
      username: "Deployment Notice",
      icon_emoji: ":rocket:",
      attachments:[
          {
            fallback: message,
            text: message,
            color: "good",
            fields: [
              {
                title: "Service",
                value: `${service_name}`,
                short: true
              },
              {
                title: "Cluster",
                value: `${cluster_name}`,
                short: true
              },
              {
                title: "Branch",
                value: branch_name,
                short: true
              }
            ]

          }
        ]
    }
    var cmds = [ util.format("curl -X POST --data-urlencode payload='%s' %s", JSON.stringify(payload).toString(), slackPostUrl) ];
		jake.exec(cmds, { printStdout: true });
  });

});
