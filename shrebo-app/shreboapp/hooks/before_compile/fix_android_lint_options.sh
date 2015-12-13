#!/bin/bash

if [[ ! "$CORDOVA_PLATFORMS" == "android" ]]; then
  # only needed on android builds
  exit 0
fi

echo "Disabling lint errors in build.gradle"

#find platforms/android -name build.gradle | xargs sed -i ':a;N;$!ba;s/android {\(.*\)}/android {\1 lintOptions {\n checkReleaseBuilds false\nabortOnError false\n  } \n}/g'
cat << EOF > /tmp/gradle.ext
	android {
		lintOptions {
			checkReleaseBuilds false
		}
	}
EOF
 
for gradle in `find platforms/android -name build.gradle`; do
	cat /tmp/gradle.ext >> $gradle
done