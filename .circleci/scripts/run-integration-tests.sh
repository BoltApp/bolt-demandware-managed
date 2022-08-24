#!/usr/bin/env bash

curl -u ${CIRCLE_TOKEN}: -X POST --header "Content-Type: application/json" -d '{
  "parameters": {
    "run_sfra_integration_tests": true,
    "run_base_tests": false,
    "remote_wdio_config_type": "localChrome"
  }
}' https://circleci.com/api/v2/project/gh/BoltApp/integration-tests/pipeline

