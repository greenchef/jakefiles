const simpleGit = require('simple-git/promise')

const {
  GITHUB_USERNAME,
  PATH_TO_ANALYTICS,
  PATH_TO_BIFROST,
  PATH_TO_CONSOLE,
  PATH_TO_CONSOLE_V2,
  PATH_TO_CONSUMER,
  PATH_TO_INVENTORY,
  PATH_TO_JSREPORTS,
  PATH_TO_SERVER,
  PATH_TO_SHIPPING,
} = process.env;

const serviceToPath = (service_name) => {
  switch(service_name) {
    case 'analytics-mosql-models':
    case 'analytics-mosql-shipping':
    case 'analytics-mosql-logevents':
      return PATH_TO_ANALYTICS
    case 'bifrost':
      return PATH_TO_BIFROST
    case 'console':
      return PATH_TO_CONSOLE
    case 'console-v2':
      return PATH_TO_CONSOLE_V2
    case 'consumer':
      return PATH_TO_CONSUMER
    case 'jsreports':
      return PATH_TO_JSREPORTS
    case 'inventory-worker':
      return PATH_TO_INVENTORY
    case 'consoleapi':
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

exports.getBranchOrTag = getBranchOrTag;
exports.getUsername = getUsername;
exports.serviceToPath = serviceToPath;
