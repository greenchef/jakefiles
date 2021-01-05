const { cyan, green, magenta, red } = require('chalk');

const { question } = require('readline-sync');

const CLUSTERS = {
    prod: {
        lv : { protected: true },
    },
    stag: {
        pp: { protected: true },
        one: { protected: false },
        two: { protected: false },
        qe: { protected: false },
        uat: { protected: false },
    },
    eph: { protected: false },
}

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
    desc('Script runner | [\'env\',\'cluster\',\'repo\',\'branch\',\'script name\',\'args\'] | `scriptname` is name of script in scripts/ dir')
    task('run', { async: true }, async (environment, cluster, repo, branch, scriptName, scriptArgs) => {
        if (environment !== 'eph') {
            let protekted
            try {
                protekted = CLUSTERS[environment][cluster].protected;
            } catch (e) {
                throw new Error(`environment and cluster MISMATCH "${cluster}" is not a valid "${environment}" cluster`)
            }

            const IS_RELEASE_BRANCH = branch.startsWith('release/') || branch.startsWith('hotfix/') || branch.startsWith('script/');

            if (protekted && !IS_RELEASE_BRANCH) throw new Error(`PROTECTED cluster "${environment}-${cluster}" must target a release or hotfix tag`);
        }

        if (!Object.keys(REPOS).includes(repo)) throw new Error('UNSUPPORTED repo');

        scriptName = scriptName.endsWith('.js') ? scriptName : `${scriptName}.js`
        scriptArgs = scriptArgs || ''
        const envClust = `${environment}-${cluster}`
        const response = question(`Are you sure you want to run script ${scriptName} in environment ${envClust}? y/n: `);
        if (response.toLowerCase() === 'y') {
            console.log(cyan(`Running script ${scriptName} in environment ${envClust}`));
            jake.exec(`ssh ec2-user@peon /home/ec2-user/script-execution-directory/executor-tools/executor.sh ${envClust} ${REPOS[repo].service} ${repo} ${branch} ${scriptName} ${scriptArgs}`, { printStdout: true });
        }
    })
})
