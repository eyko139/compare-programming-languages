#!/bin/bash

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )/"

SERVICE_FOLDER_NAME="rust-rocket"
SERVICE_FOLDER="${SCRIPT_DIR}/../${SERVICE_FOLDER_NAME}"
SERVICE_DOCKER_BUILD_CONTEXT="${SERVICE_FOLDER}/"
SERVICE_DOCKER_FILE="${SERVICE_FOLDER}/docker/Dockerfile"

# leading . is necessary to export GENERATED_IMAGE
. ${SCRIPT_DIR}/generic-docker-build.sh \
  --docker-context-folder ${SERVICE_DOCKER_BUILD_CONTEXT} \
  --dockerfile ${SERVICE_DOCKER_FILE} \
  --dockerImageName ${SERVICE_FOLDER_NAME} \
  --reportName ${SERVICE_FOLDER_NAME}

. ${SCRIPT_DIR}/generic-k8s-manifests-build.sh \
  --serviceFolder "${SERVICE_FOLDER}" \
  --dockerImageName "${GENERATED_IMAGE}" \
  --reportName ${SERVICE_FOLDER_NAME}
