
CURRENT_DIR=$(pwd)
SCRIPT_DIR=$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )

#${SCRIPT_DIR}/cleanup.sh

BUILD_SCRIPTS="${SCRIPT_DIR}"
echo $BUILD_SCRIPTS

for file in ${BUILD_SCRIPTS}/*-build-deploy.sh; do echo "Processing $file"
     # take action on each file. $f store current file name
     bash $file
 done

