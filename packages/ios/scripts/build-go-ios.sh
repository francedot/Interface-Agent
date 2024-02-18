#!/bin/sh

REPO_URL="https://github.com/danielpaulus/go-ios"

REPO_NAME=$(basename "$REPO_URL")
BRANCH_NAME="ios-17"

# Create a temporary directory
TEMP_DIR=$(mktemp -d)
pushd "$TEMP_DIR"

rm -r "${REPO_NAME}-${BRANCH_NAME}"

# Temporary ZIP file name
ZIP_FILE="${REPO_NAME}.zip"

# Download the repository as a ZIP file
curl -L "${REPO_URL}/archive/refs/heads/${BRANCH_NAME}.zip" -o "$ZIP_FILE"

# Unzip the downloaded file
unzip "$ZIP_FILE"

# Remove the ZIP file after extraction
rm "$ZIP_FILE"

pushd "${REPO_NAME}-${BRANCH_NAME}"

go build

pwd

popd && popd

mkdir -p ./bin
cp "${TEMP_DIR}/${REPO_NAME}-${BRANCH_NAME}/go-ios" ./bin
