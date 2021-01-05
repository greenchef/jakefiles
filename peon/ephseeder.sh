#!/bin/bash

WORK_DIR=/home/ec2-user/seed-data-execution-directory
echo "Optional Branch:"
echo "$1"
ENVIRONMENT=$1

function pull-and-checkout {
  echo "Pulling latest for $1"
  cd $WORK_DIR/$1
  git pull
  if [ -z "$2" ];
    then echo "no optional branch, moving on" ;
    else echo "checking out $2" && git checkout $2 ;
  fi
}

pull-and-checkout aegishjalmur $ENVIRONMENT
pull-and-checkout auth-platform $ENVIRONMENT
pull-and-checkout greenchef $ENVIRONMENT
pull-and-checkout shipping-platform $ENVIRONMENT

function execute-seed {
  echo "Executing seed in aegishjalmur"
  cd $WORK_DIR/aegishjalmur
  npm run seed $ENVIRONMENT
}

function clean-up {
  echo "Cleaning up"
  pull-and-checkout aegishjalmur master
  pull-and-checkout auth-platform master
  pull-and-checkout greenchef master
  pull-and-checkout shipping-platform master
}

execute-seed

echo "done seeding"
