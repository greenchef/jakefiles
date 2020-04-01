const simpleGit = require('simple-git/promise')

const {
  GITHUB_USERNAME,
  PATH_TO_ANALYTICS,
  PATH_TO_AUTH_PLATFORM,
  PATH_TO_BIFROST,
  PATH_TO_CONSOLE,
  PATH_TO_CONSOLE_V2,
  PATH_TO_CONSUMER,
  PATH_TO_FRONTEND_PROXY,
  PATH_TO_INVENTORY,
  PATH_TO_JSREPORTS,
  PATH_TO_MARKETING_FRONTEND,
  PATH_TO_SERVER,
  PATH_TO_SHIPPING,
} = process.env;

const serviceToPath = (service_name) => {
  switch(service_name) {
    case 'analytics-mosql-models':
    case 'analytics-mosql-shipping':
    case 'analytics-mosql-logevents':
      return PATH_TO_ANALYTICS
    case 'auth-api':
      return PATH_TO_AUTH_PLATFORM
    case 'bifrost':
      return PATH_TO_BIFROST
    case 'console':
    case 'console-web':
      return PATH_TO_CONSOLE
    case 'console-v2':
      return PATH_TO_CONSOLE_V2
    case 'app-greenchef':
    case 'app_greenchef':
    case 'consumer':
      return PATH_TO_CONSUMER
    case 'frontend-proxy':
      return PATH_TO_FRONTEND_PROXY
    case 'jsreports':
      return PATH_TO_JSREPORTS
    case 'inventory-worker':
      return PATH_TO_INVENTORY
    case 'marketing-frontend':
      return PATH_TO_MARKETING_FRONTEND
    case 'console-api':
    case 'web-api':
    case 'worker':
    case 'scheduler':
      return PATH_TO_SERVER
    case 'shipping-api':
    case 'shipping-worker':
    case 'shipping-scheduler':
      return PATH_TO_SHIPPING
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

const replacer = (value, variables) => {
  if(!value) return value;

  const var_pattern = /(#[A-Za-z0-9_]+#)|({{[A-Za-z0-9_]+}})/g;
  value.match(var_pattern).forEach(matched_var => {
    const idx = value.indexOf(matched_var);
    if (idx > -1) {
      const value_for_replace = variables[matched_var.replace(/#|{{|}}/g, "")];
      if (value_for_replace != null) {
        value = value.replace(new RegExp(matched_var, "g"), value_for_replace);
      }
    }
  });
  return value;
}

exports.getBranchOrTag = getBranchOrTag;
exports.getUsername = getUsername;
exports.replacer = replacer;
exports.serviceToPath = serviceToPath;
