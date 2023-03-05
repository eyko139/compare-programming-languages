#!/bin/bash
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )/"
MICROSERVICE_NAME="js-express"

"${SCRIPT_DIR}/generic-load-tests.sh" --serviceName ${MICROSERVICE_NAME}
