const { cyan } = require('chalk');

const { question } = require('readline-sync');

const { CLUSTERS_PROTECTION_STATUS } = require('./utils');

const REPOS = {
    'auth-platform' : {
        service: 'auth-api'
    },
    greenchef: {
        service: 'core-console-api'
    },
    'shipping-platform': {
        service: 'shipping-api'
    },
};

namespace('scripts', () => {
    desc('Script runner | [\'env\',\'cluster\',\'repo\',\'branch\',\'script name\',\'args\'] | `scriptname` is path to script under the `scripts/` dir. `args` are optional script args')
    task('run', { async: true }, async (environment, cluster, repo, branch, scriptName, scriptArgs) => {
        if (environment !== 'eph') {
            let protekted = false
            try {
                protekted = CLUSTERS_PROTECTION_STATUS[environment][cluster].protected;
            } catch (e) {
                throw new Error(`environment and cluster MISMATCH "${cluster}" is not a valid "${environment}" cluster`)
            }

            const IS_RELEASE_BRANCH = branch.startsWith('release/') || branch.startsWith('hotfix/') || branch.startsWith('script/');

            if (protekted && !IS_RELEASE_BRANCH) throw new Error(`PROTECTED cluster "${environment}-${cluster}" must target a release or hotfix tag`);
        }

        if (!Object.keys(REPOS).includes(repo)) throw new Error('UNSUPPORTED repo');

        scriptName = scriptName.endsWith('.js') ? scriptName : `${scriptName}.js`
        scriptArgs = scriptArgs || '' // need this, otherwise empty scriptArgs is getting sent as `undefined`
        const envClust = `${environment}-${cluster}`
        const response = question(`Are you sure you want to run script ${scriptName} in environment ${envClust}? y/n: `);
        if (response.toLowerCase() === 'y') {
            console.log(cyan(`Running script ${scriptName} in environment ${envClust}`));
            jake.exec(`ssh ec2-user@peon /home/ec2-user/script-execution-directory/executor-tools/executor.sh ${envClust} ${REPOS[repo].service} ${repo} ${branch} ${scriptName} ${scriptArgs}`, { printStdout: true });
        }
    })
})
