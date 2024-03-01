#!/bin/sh

sudo pkill -SIGSTOP remoted

BUNDLE_ID="<WDA_BUNDLE_ID>.xctrunner"
TEST_RUNNER_BUNDLE_ID="<WDA_TEST_RUNNER_BUNDLE_ID>.xctrunner"
XC_TEST_CONFIG="WebDriverAgentRunner.xctest"
DEVICE_UDID="<DEVICE_UDID>"
PATH_TO_XCODE_WDA_PROJ="<DEVICE_UDID>"

pushd "./bin"

cd $PATH_TO_XCODE_WDA_PROJ
xcodebuild build-for-testing test-without-building -project WebDriverAgent.xcodeproj -scheme WebDriverAgentRunner -destination "id=${DEVICE_UDID}"

# (sudo ./go-ios tunnel start &)
# (sudo sleep 5; ./go-ios runwda --bundleid=$BUNDLE_ID --testrunnerbundleid=$TEST_RUNNER_BUNDLE_ID --xctestconfig=$XC_TEST_CONFIG --udid=$DEVICE_UDID &)