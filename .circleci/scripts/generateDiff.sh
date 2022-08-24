#!/bin/bash

# get the list of merchants
merchants=".circleci/scripts/merchants.txt"

if ! test -f "$merchants"; then
  echo "Cannot find the merchants file."
  exit 1
fi

# creating the temp directory for running the diff 
mkdir temp
cd temp

# download gh
echo "downloading gh"
curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg | sudo gpg --dearmor -o /usr/share/keyrings/githubcli-archive-keyring.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" | sudo tee /etc/apt/sources.list.d/github-cli.list > /dev/null
sudo apt update
sudo apt install gh

# login to gh, creating token.txt because gh auth login only accepts a file
echo $GITHUBTOKEN > token.txt
gh auth login --with-token < token.txt
rm token.txt

oldReleaseVersion=$(gh release list -L 1 | awk '{print $2}') 
newReleaseVersion=$1

echo "generating diff between version ${oldReleaseVersion} and ${newReleaseVersion}"
echo "downloading releases from github..."
gh release download $oldReleaseVersion --repo BoltApp/bolt-demandware

while IFS= read -r MERCHANT_NAME || [[ -n "$MERCHANT_NAME" ]]; do
    # get the release name 
    oldReleaseName="${oldReleaseVersion}-${MERCHANT_NAME}"
    newReleaseName="${newReleaseVersion}-${MERCHANT_NAME}"

    # the new release is stored in ../../artifacts to be uploaded
    newReleaseLocation="../../artifacts/${newReleaseName}"

    if [[ -f "${oldReleaseName}.zip" && -f "${newReleaseLocation}.zip" ]]; then 
        # create the directories for unzipping releases 
        mkdir "$oldReleaseName"
        mkdir "$newReleaseName"

        # unzip the release files 
        unzip -q "${oldReleaseName}.zip" -d "$oldReleaseName"
        unzip -q "${newReleaseLocation}.zip" -d "$newReleaseName"

        # run zhe diff 
        outputFileName="${newReleaseName}-diff.txt"
        echo "generating diff for merchant ${MERCHANT_NAME}: ${oldReleaseName} vs ${newReleaseName}"
        echo "saving result in ${outputFileName}"
        diff -r $oldReleaseName $newReleaseName > "../../artifacts/${outputFileName}"

        rm -rf "$oldReleaseName"
        rm -rf "$newReleaseName"
    else 
        echo "incorrect release version! please check if the input release version matches github"
    fi 
        
done < "../${merchants}"

cd ..
rm -rf temp 
