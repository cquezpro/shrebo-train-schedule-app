#!/bin/bash

if [[ ! "$MACHTYPE" == "x86_64-apple-darwin13" ]]; then
  # only needed on ios builds
  exit 0
fi

HOOK_XCCONFIG_PATH=platforms/ios/cordova

if [ ! -f $HOOK_XCCONFIG_PATH/build.xcconfig ]; then
  echo "[ERROR] hook before_build/ios_resourcerules.sh cannot execute, ./build/xcconfig not found in $PWD"
  exit 1
fi

echo '// (CB-7872) Solution for XCode 6.1 signing errors related to resource envelope format deprecation' >> $HOOK_XCCONFIG_PATH/build.xcconfig
echo '// added by hooks/ios_resourcerules.sh' >> $HOOK_XCCONFIG_PATH/build.xcconfig
echo 'CODE_SIGN_RESOURCE_RULES_PATH=$(SDKROOT)/ResourceRules.plist' >> $HOOK_XCCONFIG_PATH/build.xcconfig
echo '[INFO] CODE_SIGN_RESOURCE_RULES_PATH added to Cordova iOS build configuration. (hooks/ios_resourcerules.sh)'

# this is just a fine example of why not all languages are fit for every task. compare the
# above two simple lines of code with the below mess of javascript (which, btw, doesn't work).
# // http://stackoverflow.com/a/26563642/890242
# var fs = require("fs");
# console.log(require('module')._resolveFilename('fs'));
# fs.appendFileSync('build.xcconfig', '\nCODE_SIGN_RESOURCE_RULES_PATH = $(SDKROOT)/ResourceRules.plist', function (err) {
#  if (err) throw err;
#  console.log('CODE_SIGN_RESOURCE_RULES_PATH added to Cordova iOS build configuration.');
# }); 
