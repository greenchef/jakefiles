WORK_DIR=/home/ec2-user/script-execution-directory

CLUSTER=$1
SERVICE=$2
PROJECT=$3
BRANCH=$4
SCRIPT_NAME=$5
SCRIPT_ARGS=$6 # optional

PROJECT_DIR="${WORK_DIR}/${PROJECT}"

if [[ $PROJECT == "greenchef" ]]; then
    PROJECT_DIR="${WORK_DIR}/greenchef/services/server-greenchef/"
fi

function echo_args() {
    echo cluster: ${CLUSTER}
    echo service: ${SERVICE}
    echo project: ${PROJECT}
    echo branch: ${BRANCH}
    echo script: ${SCRIPT_NAME}
    echo args: ${SCRIPT_ARGS}
}

function pull_and_checkout() {
    echo "Pulling latest for ${PROJECT}"
    cd "${PROJECT_DIR}" || exit
    git pull
    if [ -z "$1" ]; then
      echo "no optional branch, moving on"
    else
      echo "checking out $1" && git checkout "$1"
    fi
}

function retrieve_secrets() {
    echo "Retrieving secrets for ${PROJECT}"
    cd "${PROJECT_DIR}" || exit
    node ./build/secret-retrieval.js "${CLUSTER}" "${SERVICE}"
}

function run_build() {
    echo "building ${PROJECT}"
    cd "${PROJECT_DIR}" || exit
    npm run build
}

function run_script() {
    echo "running script ${SCRIPT_NAME} with ${SCRIPT_ARGS} in ${PROJECT_DIR}"
    cd "${PROJECT_DIR}" || exit
    node "./build/scripts/${SCRIPT_NAME}" "$SCRIPT_ARGS"
}

function clean_up() {
    echo "Cleaning up"
    pull_and_checkout master
}

# pull specific project, checkout specified branch
pull_and_checkout "${BRANCH}"

# npm run build
run_build

# copy secrets of specified branch
retrieve_secrets

# run script from build dir with args
run_script

# echo_args

echo "done running script"
