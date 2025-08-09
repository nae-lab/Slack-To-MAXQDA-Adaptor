#!/bin/bash
# Remove the corrupted file
rm -f package-lock.json

# Get the original file from git
git show 5f05f65:package-lock.json > package-lock.json

# Update the version from 2.2.3 to 2.3.0
sed -i 's/"slack-maxqda-adapter": "\^2\.2\.3"/"slack-maxqda-adapter": "^2.3.0"/g' package-lock.json
sed -i 's/slack-maxqda-adapter-2\.2\.3\.tgz/slack-maxqda-adapter-2.3.0.tgz/g' package-lock.json

echo "Restored and updated package-lock.json"
wc -l package-lock.json