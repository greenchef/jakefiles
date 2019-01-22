## Jake Files

### Prerequisites
1. aws-cli installed and configured
2. docker installed, docker hub account, logged into docker
3. Correct node installed (`cat .nvmrc`, then use `nvm` to install/use that version)

### Quick Start
1. npm i -g jake 
1. Clone repo
1. cd to jakefiles
1. cp the `example.env` to `.env` and add appropriate values. Note: Paths must be absolute and
may not use `~`. Example: `/Users/USERNAME/PATHTOREPO`
1. npm i
1. jake -T

### What am I
This is a collection of tasks executed with the Jake task runner. See http://jakejs.com/

### Contribute
Feel free to make additions to this repo.  
If you are changing the namespace structure or an existing task please submit a PR.

### How to Deploy to Staging or Production
Make sure your .env file is up to date 
(Example: `PATH_TO_CONSOLE=/Users/bgreene/GreenChef/console-web/`)

1. Navigate to the folder you want to deploy. (Example: `greenchef/services/server-greenchef`)
2. Check out the branch you want to deploy. (Example: `release/2018-12-04`)
3. View the `apps` constant in the `deploy.jake` file in `jakelib` to find the correct name of the docker image you want to push to
(Example: `greenchef/services/server-greenchef` can be deployed to `consoleapi`, `web-api`, `worker`, or `scheduler`)
4. In a separate terminal tab, open the jakefiles repo, and run the deployment command (Example Below)

#### Example Deployment Command
Deploy the "console" app to the "staging-uat" ECS cluster.
(Staging and Production cluster names can be found on AWS in ECS Clusters)
```bash
jake deploy:app['staging-uat','console']
```

#### Deploying All API Services Together
Instead of deploying `consoleapi`, `web-api`, `worker`, and `scheduler` individually, you can instead use the following
with the desired cluster name:
```bash
jake deploy:apiall['staging-uat']
```
`scheduler` will be excluded automatically from deployments to clusters with 'staging' in their names. However, if
`scheduler` is needed in a staging environment, it can be released individually using the `deploy:app` syntax in the
previous example.

### ZSH Users Special Syntax
According to the [official documentation](http://jakejs.com/docs), ZSH users may need to do one of two things to run `jake` commands:
- Escape brackets or wrap them in single quotes and omit inner quotes: `jake 'deploy:app[staging-uat,console]'`

-- OR --

- Permanently deactivate file-globbing for the `jake` command by adding this line to your `.zshrc` file: `alias jake="noglob jake"`
