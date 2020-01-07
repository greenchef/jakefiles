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


### Old way: Deploy to Staging or Production from a Local Branch
Make sure your .env file is up to date
(Example: `PATH_TO_CONSOLE=/Users/bgreene/GreenChef/console-web/`)

1. Navigate to the folder you want to deploy. (Example: `greenchef/services/server-greenchef`)
2. Check out the branch you want to deploy. (Example: `release/2018-12-04`)
3. View the `apps` constant in the `deploy.jake` file in `jakelib` to find the correct name of the docker image you want to push to
(Example: `greenchef/services/server-greenchef` can be deployed to `console-api`, `web-api`, `worker`, or `scheduler`)
4. In a separate terminal tab, open the jakefiles repo, and run the deployment command (Example Below)

#### Example Deployment Command
Deploy the "console" app to the "stag-uat" ECS cluster.
(Staging and Production cluster names can be found on AWS in ECS Clusters)
```bash
jake deploy:app['stag','uat','console']
```

### Deploying Groups of Services with One Command

#### Core
Instead of deploying `console-api`, `web-api`, `worker`, and `scheduler` individually, you can instead use the following
with the desired cluster name:
```bash
jake deploy:core['stag','uat']
```
When using this command, note that `scheduler` will be excluded automatically from deployments to clusters with
'stag' in their names. However, if `scheduler` is needed in a staging environment, it can be released individually
using the `deploy:app` syntax in the previous example.

#### Shipping
To deploy all shipping services, you can use the following with the desired cluster name:
```bash
jake deploy:shipping['stag','uat']
```

### ZSH Users Special Syntax
According to the [official documentation](http://jakejs.com/docs), ZSH users may need to do one of two things to run `jake` commands:
- Escape brackets or wrap them in single quotes and omit inner quotes: `jake 'deploy:app[stag,uat,console]'`

-- OR --

- Permanently deactivate file-globbing for the `jake` command by adding this line to your `.zshrc` file: `alias jake="noglob jake"`
