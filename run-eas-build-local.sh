#!/bin/bash
# Run EAS Android build locally with correct SDK path
# Usage: ./run-eas-build-local.sh [extra args for eas build]
# Set ANDROID_HOME if not already set (edit path for your machine)
export ANDROID_HOME="${ANDROID_HOME:-/home/bikash/Android}"
export PATH="$ANDROID_HOME/platform-tools:$ANDROID_HOME/cmdline-tools/latest/bin:$PATH"

eas build --local --platform android "${@}"
