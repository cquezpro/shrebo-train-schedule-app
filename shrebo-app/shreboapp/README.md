shrebo-app
==========

shrebo smartphone app


Technology
----------

Phonegap 3.0
Boostrap 
jQueryMobile

Source code
-----------

The source code is in the shreboapp/www/js directory
To understand the structure and dynamics:

* Structure: https://github.com/miraculixx/shrebo-app/wiki/App-Design-Doc
* Dynamic: https://github.com/miraculixx/shrebo-app/wiki/App-Design-Doc#how-views-are-procssed

How to develop
--------------

Checkout this repository and the branch that has been assigned to you:

```
git git@github.com:miraculixx/shrebo-app.git 
cd shrebo-app
git checkout your-branch-here
```

Once you have completed and *tested* your work, do:

```
git add .
git commit -m "describe your work in a short sentence"
git push origin your-branch-here
```

Note you should commit changes for each issue. Then create a pull request on github. See here:
https://help.github.com/articles/creating-a-pull-request

Phonegap Simulator
------------------

We use the Ripple Emulator as the simulator. This simplifies the develop/debug cycle a great deal because
the emulator picks up changes to files automatically. Of course you are free to use whatever development
environment you prefer.

Download/installation instructions: http://ripple.incubator.apache.org/

1. Install Android SDK from http://developer.android.com/sdk/index.html
2. Install Phonegap
3. Install Ripple Emulator

```
npm install -g phonegap
npm install -g ripple-emulator
```

You may have to install Android and its pre-requisites Java and Ant first. See [here](http://docs.phonegap.com/en/3.0.0/guide_platforms_android_index.md.html#Android%20Platform%20Guide)

Then test if you can run the following commands
```
javac
ant
phonegap
ripple
```

If any of these commands fail, you probalby have yet to properly install Android SDK and its pre-requisites. If you have done that, then make sure you add the following to PATH (seperate by semicolon):
```
<path>\node_modules\.bin;
<path>\apache-ant-1.9.4\bin;
<path>\adt-bundle-windows-x86_64-20140321\sdk\platform-tools;
<path>\adt-bundle-windows-x86_64-20140321\sdk\tools;
C:\Program Files\Java\jdk1.6.0_25\bin
```

You may also have to set JAVA_HOME:

```
C:\Program Files\Java\jdk1.6.0_25
```

Use:

```
cd shreboapp
ripple emulate
# OR if you want to run in android simulator or device
phonegap local run android
``` 

Then open Google Chrome at http://localhost:4400/?enableripple=cordova-3.0.0-WVGA&phonegap=1
