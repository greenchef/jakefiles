const dotenv = require('dotenv');
const dotenvParseVariables = require('dotenv-parse-variables');
let env = dotenv.config({})
if (env.error) throw env.error;
env = dotenvParseVariables(env.parsed);
desc('Jakefile default.');
task('default', { async: true }, function() {
	//READ README.md
});