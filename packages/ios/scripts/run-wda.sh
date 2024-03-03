#!/bin/sh

# Default values
WDA_BUNDLE_ID=""
WDA_TEST_RUNNER_BUNDLE_ID=""
DEVICE_UDID=""

# Parse named parameters
for i in "$@"
do
case $i in
    --WDA_BUNDLE_ID=*)
    WDA_BUNDLE_ID="${i#*=}"
    shift # past argument=value
    ;;
    --WDA_TEST_RUNNER_BUNDLE_ID=*)
    WDA_TEST_RUNNER_BUNDLE_ID="${i#*=}"
    shift # past argument=value
    ;;
    --DEVICE_UDID=*)
    DEVICE_UDID="${i#*=}"
    shift # past argument=value
    ;;
    *)
          # unknown option
    ;;
esac
done

echo "WDA_BUNDLE_ID = ${WDA_BUNDLE_ID}"
echo "WDA_TEST_RUNNER_BUNDLE_ID = ${WDA_TEST_RUNNER_BUNDLE_ID}"
echo "DEVICE_UDID = ${DEVICE_UDID}"

sudo pkill -SIGSTOP remoted

BUNDLE_ID="$WDA_BUNDLE_ID.xctrunner"
TEST_RUNNER_BUNDLE_ID="$WDA_TEST_RUNNER_BUNDLE_ID.xctrunner"
XC_TEST_CONFIG="WebDriverAgentRunner.xctest"

pushd "./bin"

# cd $PATH_TO_XCODE_WDA_PROJ
# xcodebuild build-for-testing test-without-building -project WebDriverAgent.xcodeproj -scheme WebDriverAgentRunner -destination "id=${DEVICE_UDID}"

(sudo ./go-ios tunnel start &)
(sudo sleep 5; ./go-ios runwda --bundleid=$BUNDLE_ID --testrunnerbundleid=$TEST_RUNNER_BUNDLE_ID --xctestconfig=$XC_TEST_CONFIG --udid=$DEVICE_UDID &)