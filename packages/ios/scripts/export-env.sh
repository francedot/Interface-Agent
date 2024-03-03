#!/bin/bash
export WDA_BUNDLE_ID=$(node -e "require('dotenv').config({ path: '/custom/path/to/.env' }); console.log(process.env.WDA_BUNDLE_ID)")
export WDA_TEST_RUNNER_BUNDLE_ID=$(node -e "require('dotenv').config({ path: '/custom/path/to/.env' }); console.log(process.env.WDA_TEST_RUNNER_BUNDLE_ID)")
export DEVICE_UDID=$(node -e "require('dotenv').config({ path: '/custom/path/to/.env' }); console.log(process.env.DEVICE_UDID)")