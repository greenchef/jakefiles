const simpleGit = require('simple-git/promise')

const {
  GITHUB_USERNAME,
  PATH_TO_ANALYTICS,
  PATH_TO_CONSOLE,
  PATH_TO_CONSOLE_V2,
  PATH_TO_CONSUMER,
  PATH_TO_INVENTORY,
  PATH_TO_SERVER,
  PATH_TO_SHIPPING,
  PATH_TO_JSREPORTS
} = process.env;

const serviceToPath = (service_name) => {
  switch(service_name) {
    case 'consoleapi':
    case 'web-api':
    case 'worker':
    case 'scheduler':
      return PATH_TO_SERVER
    case 'console':
      return PATH_TO_CONSOLE
    case 'console-v2':
      return PATH_TO_CONSOLE_V2
    case 'consumer':
      return PATH_TO_CONSUMER
    case 'shipping-api':
    case 'shipping-worker':
    case 'shipping-scheduler':
      return PATH_TO_SHIPPING
    case 'inventory-worker':
      return PATH_TO_INVENTORY
    case 'analytics-mosql-models':
    case 'analytics-mosql-logevents':
      return PATH_TO_ANALYTICS
    case 'jsreports':
      return PATH_TO_JSREPORTS
    default:
      throw new Error(`Unable to find path for service name: ${service_name}`);
  }
}

const getBranchOrTag = async (service_name) => {
  const path = serviceToPath(service_name);

  // This will also return the tag if a tag is checked out instead of a branch
  const branchData = await simpleGit(path).branchLocal();
  return branchData.current;
}

const getUsername = () => GITHUB_USERNAME;

function replacer(value, variables) {
  if(!value || value == '') return value;
  const var_pattern = /(#[A-Za-z0-9_]+#)|({{[A-Za-z0-9_]+}})/g;
  value.match(var_pattern).forEach(function(matched_var) {
    var idx, value_for_replace;
    idx = value.indexOf(matched_var);
    if (idx > -1) {
      value_for_replace = variables[matched_var.replace(/#|{{|}}/g, "")];
      if (value_for_replace != null) {
        value = value.replace(new RegExp(matched_var, "g"), value_for_replace);
      }
    }
  });
  return value;
}

exports.getBranchOrTag = getBranchOrTag;
exports.getUsername = getUsername;
exports.serviceToPath = serviceToPath;
exports.replacer = replacer;
