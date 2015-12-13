#!/bin/bash

if [[ ! "$CORDOVA_PLATFORMS" == "android" ]]; then
  # only needed on android builds
  exit 0
fi

GRADLE_EXTRAS="./platforms/android/build-extras.gradle"
FIX_URL="https://github.com/katzer/cordova-plugin-local-notifications/issues/460" 

echo "Applying fix for issue $FIX_URL"

JAR="platforms/android/libs/android-support-v4.jar"
if [ -f "$JAR" ]; then 
	echo "Removing $JAR"
	rm $JAR
fi

echo "creating $GRADLE_EXTRAS"
cat << EOF > $GRADLE_EXTRAS
dependencies {
    compile 'com.android.support:support-v4:21.0.0'
}
configurations {
    all*.exclude group: 'com.android.support', module: 'support-v4'
}
EOF

