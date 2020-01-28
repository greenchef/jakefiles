## Jake Files
This is a collection of tasks executed with the Jake task runner. See http://jakejs.com/

### Prerequisites
1. aws-cli installed and configured
2. docker installed
3. Correct node installed (`cat .nvmrc`, then use `nvm` to install/use that version)

### Quick Start
1. npm i -g jake
2. Clone repo
3. cd to jakefiles
4. npm i
5. cp the `example.env` to `.env` and add appropriate values. Note: Paths must be absolute and
may not use `~`. Example: `/Users/USERNAME/PATHTOREPO`
6. jake -T

### Deploy to Staging or Production using GitHub and the Deployment Pipeline
See [this Confluence document](https://greenchef.atlassian.net/wiki/spaces/GCE/pages/167051304/Deployments+with+Jake+and+Codepipeline)
for more details about the pipeline.

1. Make sure the branch you want to deploy is fully up to date on GitHub. This method deploys directly from GitHub.
2. In a terminal window, navigate to the jakefiles repo and run a deployment command in the following format:
    ```bash
    Template: 
    jake pipeline:deploy['ENVIRONMENT','CLUSTER','REPO','BRANCH']
    
    Example:
    jake pipeline:deploy['stag','one','app-greenchef','my-branch']
    ```
   - ENVIRONMENT is either stag (staging) or prod (production)
   - CLUSTER names can be found on AWS in ECS Clusters
   - REPO is the name of the repo in GitHub
   - BRANCH is the name of the branch to be deployed
3. Monitor the progress of your deployment in AWS or via #gc-releases in Slack.

### Deploy latest release branches to Staging environment using Deployment Pipeline
    ```bash
    Template: 
    jake pipeline:refresh['CLUSTER']
    
    Example:
    jake pipeline:refresh['one']
    ```

### ZSH Users Special Syntax
According to the [official documentation](http://jakejs.com/docs), ZSH users may need to do one of two things to run `jake` commands:
- Escape brackets or wrap them in single quotes and omit inner quotes: `jake 'pipeline:deploy['stag','one','console','my-branch']'`

-- OR --

- Permanently deactivate file-globbing for the `jake` command by adding this line to your `.zshrc` file: `alias jake="noglob jake"`
