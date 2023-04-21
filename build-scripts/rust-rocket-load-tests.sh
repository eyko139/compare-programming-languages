#!/bin/bash
#set -e
#set -x
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )/"
MICROSERVICE_NAME="rust-rocket"
MICROSERVICE_VERSION="$(cat "${SCRIPT_DIR}/../${MICROSERVICE_NAME}/.version")"
echo VERSION: $MICROSERVICE_VERSION

"${SCRIPT_DIR}/generic-load-tests.sh" --serviceName ${MICROSERVICE_NAME} --serviceVersion ${MICROSERVICE_VERSION}

