# Minimal reproduced project

## Installation

Create local .env file like the following with your xcode organization 
'''
ARTIFACTS_ROOT=./artifacts
WDA_PATH=./wda
XCODE_ORG_ID=YOUR_ORGANIZATION
'''

This implemenation uses a pre-built WDA.

## Running

'npm run test  -- --sim='iPhone 16:18.0' --suite='debug''
Run the command will start the test which open the preference app and verify if the navigationbar title is displayed in the iOS simulator.




