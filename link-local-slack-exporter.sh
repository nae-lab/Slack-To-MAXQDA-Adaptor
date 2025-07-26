#!/bin/bash

# Script to link local slack-exporter library
# Run this script after cloning the slack-maxqda-adapter repository

SLACK_EXPORTER_PATH="/Users/yuchi/workspace/nae-lab/git/slack-exporter"
CURRENT_DIR=$(pwd)

if [ -d "$SLACK_EXPORTER_PATH" ]; then
  echo "Building slack-exporter..."
  cd "$SLACK_EXPORTER_PATH"
  
  # Build the library
  if ! pnpm install; then
    echo "Error: Failed to install dependencies for slack-exporter"
    exit 1
  fi
  
  if ! pnpm run build; then
    echo "Error: Failed to build slack-exporter"
    exit 1
  fi
  
  echo "Linking slack-exporter globally..."
  if ! pnpm link --global; then
    echo "Error: Failed to link slack-exporter globally"
    exit 1
  fi
  
  # Return to the original directory
  cd "$CURRENT_DIR"
  
  echo "Linking slack-exporter to current project..."
  if ! pnpm link --global slack-exporter; then
    echo "Error: Failed to link slack-exporter to current project"
    exit 1
  fi
  
  echo "Successfully linked slack-exporter!"
else
  echo "Error: slack-exporter not found at $SLACK_EXPORTER_PATH"
  echo "Please clone https://github.com/nae-lab/slack-exporter to the correct path first"
  exit 1
fi