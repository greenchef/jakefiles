const gitBranch = require('git-branch')

const {
  GITHUB_USERNAME,
  PATH_TO_CONSOLE,
  PATH_TO_CONSUMER,
  PATH_TO_INVENTORY,
  PATH_TO_SERVER,
  PATH_TO_SHIPPING,
} = process.env;

const serviceToPath = (service_name) => {
  switch(service_name) {
    case 'consoleapi':
    case 'web-api':
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
    default:
      return null;
  }
}

const getBranchName = (service_name) => {
  const path = serviceToPath(service_name);
  if (!path) return 'unknown'

  return gitBranch.sync(path);
}

const getUsername = () => GITHUB_USERNAME;

exports.getBranchName = getBranchName;
exports.getUsername = getUsername;
exports.serviceToPath = serviceToPath;
