#!/bin/bash
set -e

SEMVER=$1

git checkout dev
git pull
npm version $SEMVER -m 'Release %s'
git push origin dev
git checkout release
git merge dev
git push --follow-tags origin release
git checkout dev
