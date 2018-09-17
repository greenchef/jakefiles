## Jake Files

### Prerequisites
1. aws-cli installed and configured
2. docker installed, docker hub account, logged into docker
3. Correct node installed (`cat .nvmrc`, then use `nvm` to install/use that version)

### Quick Start
1. npm i -g jake 
2. Clone repo
3. cd to jakefiles
4. cp the `example.env` to `.env` and add appropriate values
4. npm ci
5. jake -T

### What am I
This is a collection of tasks executed with the Jake task runner. See http://jakejs.com/

### Contribute
Feel free to make additions to this repo.  
If you are changing the namespace structure or an existing task please submit a PR.

### Example Deploy Command
Deploy the "console" app to the "staging-uat" ECS cluster.
```bash
jake deploy:app['staging-uat','console']
```

### To Deploy Shipping to Staging UAT
1. create a staging branch
2. merge in branch `GCT-314-get-shipping-working` (this branch is not in prod)
3. Deploy shipping to staging UAT
```bash
jake deploy:app['staging-uat','shipping-api']
```

#### ZSH Users Special Syntax
According to the [official documentation](http://jakejs.com/docs), ZSH users may need to do one of two things to run `jake` commands:
- Escape brackets or wrap them in single quotes and omit inner quotes: `jake 'deploy:app[staging-uat,console]'`

-- OR --

- Permanently deactivate file-globbing for the `jake` command by adding this line to your `.zshrc` file: `alias jake="noglob jake"`
