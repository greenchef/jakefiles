const util = require('util');

namespace('slack', function () {
  
  desc('Send slack deployment confirmation  | [cluster_name,service_name]');
	task('deployment', [], { async: false }, function(cluster_name, service_name) {
    const message = `${service_name} deployed to ${cluster_name}`
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
              }
            ]
    
          }
        ]
    }
    var cmds = [ util.format("curl -X POST --data-urlencode payload='%s' %s", JSON.stringify(payload).toString(), slackPostUrl) ];
		jake.exec(cmds, { printStdout: true });
  });
  
});