const util = require('util');

const { getBranchOrTag, getUsername } = require('./utils');
const prodSlackPostUrl = process.env.PROD_RELEASE_SLACK_URL;
const stagingSlackPostUrl = process.env.STAGING_RELEASE_SLACK_URL

namespace('slack', function () {

  desc('Send slack deployment confirmation  | [cluster_name,service_name]');
	task('deployment', [], { async: true }, async function(cluster_name, service_name) {
    const branch_name = await getBranchOrTag(service_name);

    const username = getUsername();
    const message = `Branch ${branch_name} for ${service_name} deployed to ${cluster_name} by ${username}.`;
    const slackPostUrl = cluster_name.startsWith('production') ? prodSlackPostUrl : stagingSlackPostUrl;
    let payload = {
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
                short: true,
              },
              {
                title: "Cluster",
                value: `${cluster_name}`,
                short: true,
              },
              {
                title: "Branch",
                value: branch_name,
                short: true,
              },
              {
                title: "Who",
                value: username,
                short: true,
              },
            ],
          },
        ],
    }
    var cmds = [ util.format("curl -X POST --data-urlencode payload='%s' %s", JSON.stringify(payload).toString(), slackPostUrl) ];
		jake.exec(cmds, { printStdout: true });
  });

});
