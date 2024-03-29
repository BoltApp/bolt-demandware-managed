#!/usr/bin/env bash
GIT_TAG=$1

go install github.com/tcnksm/ghr@latest
ghr -t "${GITHUBTOKEN}" -u "${CIRCLE_PROJECT_USERNAME}" -r "${CIRCLE_PROJECT_REPONAME}" -n "Version $GIT_TAG" -body "This release is version $GIT_TAG" -debug "$GIT_TAG" "../artifacts/$GIT_TAG.zip"