#!/bin/sh

sudo pkill -SIGSTOP remoted

BUNDLE_ID="com.navaiguide.WebDriverAgentRunner.xctrunner"
TEST_RUNNER_BUNDLE_ID="com.navaiguide.WebDriverAgentRunner.xctrunner"
XC_TEST_CONFIG="WebDriverAgentRunner.xctest"
DEVICE_UDID="00008030-00120DA4110A802E"

pushd "./bin"

(sudo ./go-ios tunnel start &)
(sudo sleep 10; ./go-ios runwda --bundleid=$BUNDLE_ID --testrunnerbundleid=$TEST_RUNNER_BUNDLE_ID --xctestconfig=$XC_TEST_CONFIG --udid=$DEVICE_UDID &)