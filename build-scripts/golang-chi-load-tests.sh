#!/bin/bash
#set -e
#set -x
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )/"
MICROSERVICE_NAME="golang-chi"

"${SCRIPT_DIR}/generic-load-tests.sh" --serviceName ${MICROSERVICE_NAME}
