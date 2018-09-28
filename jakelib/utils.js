const simpleGit = require('simple-git/promise')

const {
  GITHUB_USERNAME,
  PATH_TO_ANALYTICS,
  PATH_TO_CONSOLE,
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
      return PATH_TO_SERVER
    case 'console':
      return PATH_TO_CONSOLE
    case 'consumer':
      return PATH_TO_CONSUMER
    case 'shipping-api':
    case 'shipping-worker':
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

exports.getBranchOrTag = getBranchOrTag;
exports.getUsername = getUsername;
exports.serviceToPath = serviceToPath;
