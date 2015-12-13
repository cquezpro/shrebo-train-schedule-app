'''
Created on Feb 4, 2014

@author: patrick
'''
import os
import re
import sys
import time
import glob 

from fabric.context_managers import settings, prefix, lcd
from fabric.contrib import django
from fabric.contrib.project import rsync_project
from fabric.decorators import task, roles
from fabric.operations import local, prompt, sudo, run, put
from fabric.state import env
from fabric.tasks import execute

env.use_ssh_config = True

app = 'cleverpendeln'

env.shell = '/bin/bash -l -c'

env.roledefs = {
    'server' : ['pypi-server'],   
}

env.deploy_config = {
    # these are dev builds for the test server (settings.js: conf_staging)
    # note that @deploydevice task does not use a deploy_config but
    # sets all parameters directly.
    'test' : {
        'build' : False,
        'src' : './www',
        'clean' : False,
        'dest': '/data/shrebo/webapp/test/%s' % app, 
        'server': 'testserver',
        # certificate
        'signid' : {
            'staff'  : 'one2seven GmbH',
            'customer' : 'one2seven GmbH',
        },
        # provision profile     
        # will be downloaded using nomad-cli ios profile download
        'provisionfile' : {
            'staff' : '/tmp/cleverpendeln staff DEV prov.mobileprovision',
            'customer' : '/tmp/cleverpendeln customer DEV prov.mobileprovision',
        },
    },        
    'devtest' : {
        'build' : False,
        'src' : './www',
        'clean' : False,
        'dest': '/data/shrebo/webapp/devtest/%s' % app, 
        'server' : 'testserver',
        # certificate
        'signid' : {
            'staff'  : 'one2seven GmbH',
            'customer' : 'one2seven GmbH',
        },
        # provision profile     
        # will be downloaded using nomad-cli ios profile download
        'provisionfile' : {
            'staff' : '/tmp/cleverpendeln staff DEV prov.mobileprovision',
            'customer' : '/tmp/cleverpendeln customer DEV prov.mobileprovision',
        },
    },
    # these are release builds for the staging server (settings.js: conf_staging)
    'apk-staging' : {
        'build' : True,
        'src' : './www',
        'clean' : False,
        'dest': './tmp/apk/%s' % app,
        'apk_dest' : '/tmp/apk/release/%s' % app,
        'keystore' : '/home/patrick/Documents/one2seven/bbookers.keystore',
        'keypass' : '/home/patrick/Documents/one2seven/bbookers.pass',
        'keyalias' : '/home/patrick/Documents/one2seven/bbookers.keyalias',
        'server': 'stagingserver'
    },
    'ipa-staging' : {
        'build' : True,
        'src' : './www',
        'clean' : False,
        'dest': './tmp/ipa/%s' % app,
        'wsdir' : os.path.dirname(__file__),
        # certificate
        'signid' : {
            'staff'  : 'one2seven GmbH',
            'customer' : 'one2seven GmbH',
        },
        # provision profile     
        # will be downloaded using nomad-cli ios profile download
        'provisionfile' : {
            'staff' : '/tmp/cleverpendeln staff ADHOC prov',
            'customer' : '/tmp/cleverpendeln customer ADHOC prov',
        },
        'server': 'stagingserver'
    },
    'apk-prod' : {
        'build' : True,
        'src' : './www',
        'clean' : False,
        'dest': './tmp/apk/%s' % app,
        'apk_dest' : '/tmp/apk/release/%s' % app,
        'keystore' : '/home/patrick/Documents/one2seven/bbookers.keystore',
        'keypass' : '/home/patrick/Documents/one2seven/bbookers.pass',
        'keyalias' : '/home/patrick/Documents/one2seven/bbookers.keyalias',
        'server': 'deployserver'
    },
    'ipa-adhoc' : {
        'build' : True,
        'src' : './www',
        'clean' : False,
        'dest': './tmp/ipa/%s' % app,
        'wsdir' : os.path.dirname(__file__),
        # certificate
        'signid' : {
            'staff'  : 'one2seven GmbH',
             # dev account, "iPhone Distribution: one2seven GmbH (8B2B4G4HR4)"
            'customer' : '10965DBBD3FAC95E442A40AAAA326EA3D7BBC130',
        },
        # provision profile     
        # will be downloaded using nomad-cli ios profile download
        'provisionfile' : {
            'staff' : '/tmp/cleverpendeln staff ADHOC prov.mobileprovision',
            'customer' : '/tmp/cleverpendeln customer ADHOC prov.mobileprovision',
        },
        'iconnectid' : {
            'staff' : '',
            'customer' : '1000627809',
        },
        'server': 'deployserver'
    },
    'ipa-store' : {
        'build' : True,
        'src' : './www',
        'clean' : False,
        'dest': './tmp/ipa/%s' % app,
        'wsdir' : os.path.dirname(__file__),
        # certificate
        'signid' : {
            'staff'  : 'one2seven GmbH',
            # dev account, "iPhone Distribution: one2seven GmbH (8B2B4G4HR4)"
            'customer' : '10965DBBD3FAC95E442A40AAAA326EA3D7BBC130',
        },
        # provision profile     
        # will be downloaded using nomad-cli ios profile download
        'provisionfile' : {
            'staff' : '/tmp/cleverpendeln staff STORE prov.mobileprovision',
            'customer' : '/tmp/cleverpendeln customer STORE prov.mobileprovision',
        },
        'iconnectid' : {
            'staff' : '',
            'customer' : '1000627809',
        },
        'server': 'deployserver'
    },
    'ipa-inhouse' : {
        'build' : True,
        'src' : './www',
        'clean' : False,
        'dest': './tmp/ipa/%s' % app,
        'wsdir' : os.path.dirname(__file__),
        # certificate
        'signid' : {
            # to find this, do $ security find-identity -p codesigning
            # staff: Enterprise Account "iPhone Distribution: one2seven GmbH"
            'staff'  : '982EF3BBB09C2F8B2E23380913050F363514851B',
        },
        # provision profile     
        # will be downloaded using nomad-cli ios profile download
        'provisionfile' : {
            'staff' : '/tmp/cleverpendeln staff INHOUSE prov.mobileprovision',
        },
        'server': 'deployserver'
    },
    
    'dist' : {
        'build' : True,
        'clean' : True,
        'src' : './build/www',
        'dest': '/data/shrebo/webapp/%s' % app, 
        'server': 'deployserver',
    },
}

env.os_by_platform = {
   'darwin' : 'ios',
   'linux2' : 'android',
   'linux'  : 'android'                      
}

def wlocal(*args, **kwargs):
    local(*args, **kwargs)
    time.sleep(1)
    
def do_build(variants=None, build=None, target=None, 
             runner=None, osid=None, server=None):
    """
    run a local or distribution build (build=False). the local build
    runs in the www directory, i.e. does in-place replacement
    of various config settings. with build=True, the build runs
    a distribution build (grunt-dist) which places the build "binary"
    in the build/www directory. Runner is an optional callable that
    receives the current variant and deploy_config applied. 
    
    :param variants: a comma seperated list of targets
    :param build: if True runs grunt dist-<target>
    :param target: the target, defaults to devtest
    :param runner: a callable for further processing of the build.
    :param server: replace the config's server 
    """
    osid = osid or env.os_by_platform.get(sys.platform)
    target = target or "devtest"
    variants = variants.split(',') if variants else ["customer", "staff"]
    deploy_config = env.deploy_config[target]
    deploy_config.update({
        'server' : server or deploy_config['server'] 
    }) 
    for variant in variants:
        # set variant
        local('grunt set-%s --force' % variant)
        # we have to copy all resources to ensure they are built in
        local('grunt copy:resources_%s' % osid)
        # set webabpp
        local('grunt set-webapp')
        # set server environment
        local('grunt set-{server}'.format(**deploy_config))
        # build
        if build or deploy_config.get('build'):
            local('grunt dist-%s --force' % variant)
        if runner:
            runner(variant, deploy_config)
    return variants, deploy_config
        
@task(alias="deployweb")
@roles('server')
def deploystatic(target=None, variants=None, build=None, server=None):
    """
    deploy static files, target=devtest|test|dist
    
    defaults to devtest. If you think files were not synced,
    try another target...
    """
    deployments = []
    server = '%sserver' % server if server else None
    def do_deploy(variant, deploy_config):
        # distribution
        local_dir = deploy_config['src']
        remote_dir = "%s/%s" % (deploy_config['dest'], variant)
        if deploy_config.get('clean'):
            run('rm -rf %s' % remote_dir)
        run('mkdir -p %s' % remote_dir)    
        rsync_project(local_dir=local_dir, remote_dir=remote_dir)
        #run('chown -R pypi:www-data %s' % remote_dir)
        deployments.append("Deployed from %s to %s." % (local_dir, remote_dir))
    variants, deploy_config = do_build(variants=variants, 
                                       build=build, 
                                       target=target,
                                       server=server,
                                       runner=do_deploy)
    print "\n".join(deployments)
    
@task
def releaseapk(variants=None, level=None, install=None, deploy=None, sign=False):
    """
    build APK for android release
    
    :param variants: variant[,variant]
    :param level:  build level, staging or prod
    :param install: y or blank
    :param deploy: deploy to testfairy y or blank
    :param sign: sign with certificate y or blank 
    """
    built_apks = []
    installed_apks = []
    level = level or 'staging'
    target = 'apk-%s' % level
    if install or deploy:
        assert (not install and deploy) or (install and not deploy), "cannot install and deploy"
    def do_release(variant, deploy_config):
        # see http://developer.android.com/tools/publishing/app-signing.html
        # and http://stackoverflow.com/questions/20402818/build-android-release-apk-on-phonegap-3-x-cli
        # compile in release mode
        # first phonegap build the app
        # this prepares the build for cordova release build  
        from sh import python
        opts = '-r %s -fi -b' % app
        buildid = python('./trackbuild.py', opts.split(' ')).replace('\n', '')
        # mark git
        local('git tag releaseapk-%s' % buildid)
        # clean before rebuilding 
        local('grunt clean init-android')
        set_cordova_config_version(version=cordovaversion)
        # then, cordova build for release
        ret = local('cordova prepare android', capture=True)
        local('rm -rf ./platforms/android/assets/www/variants')
        local('rm -rf ./platforms/android/assets/www/res/screen/ios')
        local('rm -rf ./platforms/android/assets/www/res/icon/ios')
        ret = local('cordova compile android --release', capture=True)
        with lcd('platforms/android/cordova'):
            try:
                build_apk = ret.stdout.split('\n')[-1].replace('Using apk: ', '')
            except:
                print ret.stdout, ret.stderr
                exit()
            # all went fine it seems, build path information
            # -- build_apk is the apk full path extracted from the cordova build
            # -- apk_name is the actual apk file (basename)
            # -- dest_apk is the destination apk filename, which includes the variant
            print "Using apk: %s" % build_apk
            apk_name = os.path.basename(build_apk)
            apk_dir = deploy_config['apk_dest']
            if 'CordovaApp' in apk_name:
                dest_apk = '%s/%s' % (apk_dir, apk_name.replace('CordovaApp', '%s-%s-apk-%s' % (app, variant, buildid)))
            else:
                dest_apk = '%s/%s' % (apk_dir, apk_name.replace('%s' % app, '%s-%s-apk-%s' % (app, variant, buildid)))
            if (install or sign):
                # http://developer.android.com/tools/publishing/app-signing.html
                dest_apk = dest_apk.replace('unsigned', 'unaligned')
                final_apk = dest_apk.replace('unsigned', 'signed')
                # sign the apk
                # --get keystore/password
                keystore = deploy_config['keystore']
                keypass =  open(deploy_config['keypass']).read()
                # -- sign    
                sign_cmd = 'jarsigner -verbose -sigalg SHA1withRSA ' \
                      '-digestalg SHA1 -keystore %s -keypass %s ' \
                      '-storepass %s %s %s' % (keystore, keypass, keypass, build_apk, app)
                local(sign_cmd.replace('\n', ' '))
                # verify signature
                local('jarsigner -verify -verbose -certs %s' % build_apk)
            else:
                final_apk = dest_apk 
            # copy the file to the target dest_apk
            local('mkdir -p %s' % apk_dir)
            local('cp %s %s' % (build_apk, dest_apk))
            # zipalign (doesnt work)
            #local('zipalign -v 4 %s %s' % (dest_apk, final_apk))
            built_apks.append(final_apk)
            # install?
            if install:
                local('adb uninstall ch.cleverpendeln.%s' % (variant))
                local('adb install %s' % dest_apk)
                installed_apks.append(dest_apk)
        # deploy? note: needs to happen from project directory 
        if deploy:
            execute('deployapk', apkfile=dest_apk)
    # build for release
    variants, deploy_config = do_build(variants=variants, target=target, runner=do_release)
    print "Created these APKs\n%s" % "\n".join(built_apks)
    if len(installed_apks):        
        print "installed these APKs\n%s" % "\n".join(installed_apks)
        
 
@task
def releaseipa(variants=None, level=None, install=None, deploy=None, clean=True):
    """
    build IPA file for ios release 
    
    :param variants: variant[,variant]
    :param level:  build level, staging or prod
    :param install: y or blank
    :param deploy: deploy to testfairy y or blank
    :param clean: run grunt clean init-ios to reinstall cordova project + plugins (recommended, set to N for faster debugging of xcode steps)
    """
    built_ipas = []
    installed_ipas = []
    level = level or 'staging'
    target = 'ipa-%s' % level
    def do_release(variant, deploy_config):
        import keyring
        # see http://stackoverflow.com/questions/19628957/how-to-make-release-build-for-ios-using-phonegap-command-line-tools
        # http://maruhgar.blogspot.ch/2014/05/automating-cordova-ios-build.html
        # http://devgirl.org/2013/11/12/three-hooks-your-cordovaphonegap-project-needs/
        from sh import python
        opts = '-r %s -fi -b' % app
        # only set major.minor for iconnect,
        # use the major.minor.patch for CFBundleVersion
        buildid = python('./trackbuild.py', opts.split(' ')).replace('\n', '')
        if level in ['store', 'inhouse']:
            # for app store we only use major.minor for the iconnect version
            # and the full string major.minor.patch.build for the CFBundleVersion 
            # rationale: much nicer display and less hassle with iconnect
            iosbundleversion = buildid.replace('%s-' % app, '')
            cordovaversion = '.'.join(iosbundleversion.split('.')[0:2])
            local('git tag releaseipa-%s-iconnect-%s' % (buildid, cordovaversion))
            set_cordova_config_version(version=cordovaversion, iosbundleversion=iosbundleversion)
        else:
            cordovaversion = buildid.replace('%s-' % app, '')
            local('git tag releaseipa-%s' % buildid)
            set_cordova_config_version(version=cordovaversion, iosbundleversion=cordovaversion)
        appdevuser = os.environ.get('IOS_APPDEVUSER_%s_%s' % (app, variant))
        execute('check_iosappdev_credentials', variant)
        xcrun_config = deploy_config.copy()
        xcrun_config.update({
            'app' : app,
            'buildid' : buildid,
            'variant' : variant,
            'appdevuser' : appdevuser,
            'appdevpw' : keyring.get_password("developer.apple.com", appdevuser),
        })
        signid = xcrun_config['signid']
        if isinstance(signid, dict):
            signid = signid[variant]
        ipafile="{wsdir}/platforms/ios/build/{app}-{variant}-ios-{buildid}.ipa".format(**xcrun_config)
        xcrun_config.update({
          'ipafile' : ipafile,
          'signid' : signid,
        })
        # clean before rebuilding -- this will force a new build by xcode, including new UUID
        # as required by testfairy
        # for some weird reason the following moves the project one level deeper in platforms/ios
        #with lcd('platforms/ios'):
        #    local('xcodebuild -xcconfig cordova/build.xcconfig -configuration Release clean')
        if not clean in "N,n,False,false,no".split(','):
            local('grunt clean init-ios')
        # switch to distribution sign 
        local("sed -i .bak 's/Developer/Distribution/' platforms/ios/cordova/build.xcconfig")
        ios_get_provprofiles(xcrun_config, variant, 'distribution', level)
        ios_get_certificates(xcrun_config, 'distribution')
        # build with cordova first (creates the app file)
        local('cordova prepare ios')
        local('rm -rf ./platforms/ios/www/variants')
        local('rm -rf ./platforms/ios/www/res')
        local('cordova compile ios --release --device')
        # build the ipa file
        # -- the actual name of the .app file is only known at this point... 
        xcrun_config.update({
          'appfile' : '"%s"' % os.path.abspath(glob.glob('./platforms/ios/build/device/*.app'.format(**xcrun_config))[0]),
        }) 
        if level not in ['store', 'inhouse']:
            xcent_files = glob.glob(('./platforms/ios/build/*.build/'
                                                     'Release-iphoneos/*.build/*.app.xcent'))
            if len(xcent_files) > 0:
                xcrun_config.update({
                  'xcentfile-release' : '%s' % os.path.abspath(xcent_files[0]),
                })
                with settings(warn_only=True):
                    # Xcode sometimes gets confused about entitlements when it chooses the production profile
                    # to generate the entitlements, whereas ad hoc provision profiles must not contain beta-reports
                    # since we embed the right provision profile in the next step, we simply fix the entitlements
                    # http://stackoverflow.com/questions/27364411/no-beta-reports-active-attribute-for-ad-hoc-prov-profiles-best-strategy-to-man
                    local('/usr/libexec/PlistBuddy -c "Delete :beta-reports-active"'
                          ' "{xcentfile-release}"'.format(**xcrun_config))
        # sign with the certificate of *our* choice and embed the provision profile of our choosing
        # (xcode thinks it knows the right defaults, which it does as long as there is only one of each...)
        results = local(('xcrun -sdk iphoneos PackageApplication -v {appfile}'
               " -o {ipafile} "
               ' --embed "{provisionfile}" --sign "{signid}"').format(**xcrun_config), capture=True)
        print results.stdout
        print results.stderr
        check_error = 'resource envelope is obsolete' 
        if check_error in results.stdout:
            print "**** Check the above error in codesign: ", check_error
            print "**** To resolve, YOU HAVE TO RUN THE FOLLOWING COMMAND WITH SUDO"
            print "see http://stackoverflow.com/questions/26008449/xcodebuild-codesign-vvvv-saysresource-envelope-is-obsolete"
            sed_cmd = '"--verify", "-vvvv"\(.*\)/"--verify", "--no-strict", "--verify"\1/'
            fix_cmd = ("sudo xcrun --sdk iphoneos --find PackageApplication | "
                   " xargs sed -i bak 's/%s'"  % sed_cmd)
            print fix_cmd
            exit()
        # reporting
        xcrun_config.update({
          'ipauuid' : get_ipabuildid(ipafile)
        })  
        built_ipas.append("{ipafile} {ipauuid}".format(**xcrun_config))
        # go back to developer sign    
        local("sed -i bak2 's/Distribution/Developer/' platforms/ios/cordova/build.xcconfig")
        # deploy? note: needs to happen from project directory 
        if deploy:
            opts=dict(ipafile="{ipafile}".format(**xcrun_config),
                      testfairy=True if level=='adhoc' else False,
                      iconnect=True if level=='store' else False)
            execute('deployipa', **opts)
    # build for release
    variants, deploy_config = do_build(variants=variants, target=target, runner=do_release)
    print "Created these IPAs\n%s" % '\n'.join(built_ipas) 
    with open('.buildlog', "a") as flog:
        flog.write('\n'.join(built_ipas) )
    if len(installed_ipas):        
        print "installed these IPAs\n%s" % "\n".join(installed_ipas)
    
    
@task
def ipa2iconnect(ipafile=None, level=None, variant=None, deploy_config=None):
    """
    distribute ipa to iconnect
    """
    import keyring
    if not deploy_config:
        assert ipafile, "need to provide a valid ipa file"
        assert level, "need to give a valid verison"
        level = level or 'staging'
        target = 'ipa-%s' % level
        deploy_config = env.deploy_config[target]
    assert variant, "give variant"
    appdevuser = os.environ.get('IOS_APPDEVUSER_%s_%s' % (app, variant))
    execute('check_iosappdev_credentials', variant)
    xcrun_config = deploy_config.copy()
    xcrun_config.update(dict(
       appdevuser=appdevuser,
       appdevpw=keyring.get_password("developer.apple.com", appdevuser),
       iconnectid=xcrun_config['iconnectid'][variant],
       ipafile=ipafile,
    ))
    local(('ipa distribute:itunesconnect --account {appdevuser} --password {appdevpw} '
           ' --verbose --upload --errors --warnings --apple-id {iconnectid} --file {ipafile}').format(**xcrun_config))
    
@task(alias='deploydev')
def deploydevice(variant=None, osid=None, server=None, emulator=False, clean=False, target=None):
    """
    deploy to device
    
    this will phonegap build and run on the device. it calls set-testserver
    and uninstalls the app from the device before running the phonegap build.
   
    variant defaults to the contents of www/variant (1 line max)
    os defaults to the platform the build runs on
    
    on ios, specify target=* to get a list of emulator devices
    """
    osid = osid or env.os_by_platform.get(sys.platform)
    server = server or "testserver"
    assert osid, "Don't know what to build for -- add %s to env.os_by_platform" % sys.platform
    current_variant = open('www/variant').read().replace('\n', '')
    variant = variant or current_variant
    # prepare app variant for device deployment
    if variant and not variant == current_variant:
        # only change if we don't have the current variant yet
        # this is to safeguard any modified variant files that may
        # not have been saved yet. will be saved automatically on
        # switching (see grunt/aliases and grunt/copy)
        local('grunt set-%s' % variant)
    if osid == "ios" and target == "*":
        # http://stackoverflow.com/a/22329264/890242
        local('./platforms/ios/cordova/lib/list-emulator-images')
        target = raw_input('Which one? ')
        emulator = True
    local('grunt set-%s' % server)
    local('grunt set-cordova')
    local('grunt copy:resources_%s' % osid)
    if osid == 'android':
        if clean:
            local('grunt clean init-android')
        # prepare device for installation
        local('adb uninstall ch.cleverpendeln.%s' % (variant))
    elif osid == 'ios':
        import keyring
        # setup ios environment to get profiles
        execute('check_iosappdev_credentials', variant)
        appdevuser = os.environ.get('IOS_APPDEVUSER_%s_%s' % app, variant)
        xcrun_config = env.deploy_config.copy()['devtest']
        xcrun_config.update({
            'app' : app,
            'variant' : variant,
            'appdevuser' : appdevuser,
            'appdevpw' : keyring.get_password("developer.apple.com", appdevuser),
        })
        ios_get_provprofiles(xcrun_config, variant)
        # fix for phonegap 4.1.x where the ios prepare gets mixed up
        opts=dict(app=app, variant=variant)
        if clean or \
           os.path.exists('platforms/ios/{app}-customer/{app}-staff'.format(**opts)) or \
           os.path.exists('platforms/ios/{app}-staff/{app}-customer'.format(**opts)):
            local('grunt clean init-ios')
            # http://stackoverflow.com/a/7046188/890242
            plist = 'platforms/ios/{app}-{variant}/{app}-{variant}-Info.plist'.format(**opts)
            # https://github.com/phonegap-build/StatusBarPlugin
            local('/usr/libexec/PlistBuddy -c "Add :UIStatusBarHidden bool true" %s' % plist)
            local('/usr/libexec/PlistBuddy -c "Add :UIViewControllerBasedStatusBarAppearance bool false" %s' % plist)
    # build and install
    opts = ["--emulator" if emulator else "", 
            "--target %s" % target if target else ""]
    # make sure hooks run
    local('phonegap compile %s' % (osid))
    local('phonegap build %s' % (osid))    
    local('phonegap run %s %s' % (osid, " ".join(opts)))
    # go back to webapp mode
    local('grunt set-webapp')
    
        
@task
def deployapk(apkfile=None,dropbox=False,testfairy=True,level=None):
    """deploy apk to testfairy or dropbox file"""
    assert apkfile, 'specify apkfile=/path/to/release.apk'
    from sh import python
    level = level or 'staging'
    target = 'apk-%s' % level
    if dropbox:
        opts = './trackbuild.py', '-r %s -iD' % app
        deploy_dir = python(opts.split(' '))
        deploy_dir = deploy_dir.split('\n')[0]
        deploy_dir = '/home/patrick/Dropbox/%s/04_Review_Test/01_Release/%s' % (app, deploy_dir)
        local('mkdir -p %s' % deploy_dir)
        local('cp %s %s/' % (apkfile, deploy_dir)) 
        local('cp ./distfiles/* %s/' % deploy_dir)
    if testfairy:
        keystore = env.deploy_config[target]['keystore']
        keypass = env.deploy_config[target]['keypass']
        alias = env.deploy_config[target]['keyalias']
        local('./util/testfairy_upload.sh %s %s %s %s' % (apkfile, keystore, keypass, alias))
 
    
@task
def deployipa(ipafile=None,dropbox=False,testfairy=True,iconnect=False,variant=None):
    """deploy ipa to testfairy or dropbox file"""
    assert ipafile, 'specify ipafile=/path/to/release.ipa'
    from sh import python
    if dropbox:
        opts = './trackbuild.py', '-r %s -iD' % app
        deploy_dir = python(opts.split(' '))
        deploy_dir = deploy_dir.split('\n')[0]
        deploy_dir = '/home/patrick/Dropbox/%s/04_Review_Test/01_Release/%s' % (app, deploy_dir)
        local('mkdir -p %s' % deploy_dir)
        local('cp %s %s/' % (apkfile, deploy_dir)) 
        local('cp ./distfiles/* %s/' % deploy_dir)
    if testfairy:
        local('./util/testfairy_upload_ios.sh %s' % ipafile)
    if iconnect:
        execute('ipa2iconnect', level='store', variant=variant)


def set_cordova_config_version(config_file=None, version=None, iosbundleversion=None):
    """
    set the app version in phonegap's config.xml:
    
    <widget ... version='<version>'>
    ...
    </widget>
    """ 
    assert version, "Need a valid version string, received %s" % version
    # fix up the version string in config.xml
    config_file = config_file or 'www/config.xml'
    from xml.etree import ElementTree as et
    et.register_namespace('','http://www.w3.org/ns/widgets')
    et.register_namespace('gap', 'http://phonegap.com/ns/1.0')
    tree = et.parse(config_file)
    tree.getroot().attrib['version'] = version
    if iosbundleversion:
        tree.getroot().attrib['ios-CFBundleVersion'] = iosbundleversion
    tree.write(config_file,
               xml_declaration = True,
               encoding = 'utf-8',
               method = 'xml')

@task 
def buildid(appfile=None):
    """ get the build of an ipa or apk file
    """
    assert appfile, "please specify appfile=/path/to/ipa"
    os = env.os_by_platform.get(sys.platform)
    if os == 'ios':
        print get_ipabuildid(appfile)
    if os == 'android':
        raise NotImplementedError("Android is not implemented yet")

def unzip_ipapayload(appfile, path=None):
    from uuid import uuid4
    import re
    tmppath = path or '/tmp/%s' % uuid4()
    def get_app_name(path, appfile):
        for file in os.listdir('%s/Payload' % path):
            if file.endswith('.app'):
                appname = file.replace('.app', '')
                return '"%s"' % appname
        assert False, "could not find app %s in %s/Payload" % (appfile, path)
    assert appfile, "please specify appfile=/path/to/ipa"
    path = os.path.dirname(appfile)
    ipafile = os.path.basename(appfile)
    appfile = ipafile.replace('.ipa', '.app')
    with lcd(path): 
        local('mkdir -p %s' % tmppath)
        local('cp %s %s/%s' % (ipafile, tmppath, appfile))
        local('unzip -d %s -o %s/%s >/dev/null' % (tmppath, tmppath, appfile))
    return tmppath, get_app_name(tmppath, appfile)
    
def get_ipabuildid(appfile):
    """retrieve buildid from ipa file

    @see https://developer.apple.com/library/ios/qa/qa1765/_index.html
    """
    path, appname = unzip_ipapayload(appfile)
    with lcd('%s/Payload' % path):
        ret = local('xcrun dwarfdump --uuid %s.app/%s' % (appname, appname), capture=True)
    local('rm -rf %s' % path)
    return ret

@task
def appsettings(appfile):
    """
    show the actual app settings included in an ipa or apk file
    """
    if '.ipa' in appfile:
        path, appname = unzip_ipapayload(appfile)
        with lcd(path):
            local('find . -name settings.js | xargs -I{} cat "{}" ')

@task 
def ipa2device(appfile):
    if '.ipa' in appfile:
        path, appname = unzip_ipapayload(appfile)
        with lcd(path):
            local('find . -name *app -type f | xargs -I{} ios-deploy --bundle "{}" ')


@task
def check_testfairy_plugin():
    with settings(warn_only=True):
        local('cordova plugin remove com.testfairy.cordova')
    local('cordova plugin add ~/Project/cordova-testfairy-plugin/')
    local('cordova run ios --emulator')
    
    
@task
def check_iosappdev_credentials(variant):
    """
    Check and set up ios developer credentials for nomad-cli download
    of profiles etc.
    """
    import keyring
    envvar = 'IOS_APPDEVUSER_%s_%s' % (app, variant)
    keyringkey = 'developer.apple.com' 
    appdevuser = os.environ.get(envvar)
    while not appdevuser:
        print "Make sure to export %s (developer.apple.com userid) in your .bashrc" % envvar
        print "Enter it now"
        appdevuser = raw_input()
        os.environ[envvar, appdevuser]
    while not keyring.get_password(keyringkey, appdevuser):
        print "There is no password in the keyring for %s" % appdevuser
        print "Enter it now to store in the keyring"
        pw = raw_input()
        keyring.set_password(keyringkey, appdevuser, pw)
        del pw
    with settings(warn_only=True):
        local('ios logout')
    local('echo "%s\n%s" | ios login' % (appdevuser, keyring.get_password(keyringkey, appdevuser)))
    print "Credentials for user %s are set up ok." % appdevuser


@task
def ipawho(ipafile=None, variant=None):
    """
    show the users in the ipa's file provisioning profile
    
    gets the device list from your ios dev account, then
    parses the IPA file's provisioning profile to show
    all the user names / emails that can install the ipa.
    
    Usage:
        ipawho:/path/to/ipa
    
    alias ipawho = "find . -name *ipa | xargs -I/ fab ipawho:/"
    """
    import csv
    from StringIO import StringIO
    execute('check_iosappdev_credentials', variant)
    appdevuser = os.environ.get('IOS_APPDEVUSER_%s_%s' % (app, variant))
    with settings(warn_only=True):
        list = local('ios devices:list --format csv', capture=True)
    csvlist = StringIO(list)
    devlist = {}
    for device in csv.DictReader(csvlist) if list !='No devices found' else []:
        devid = device.get('Device Identifier').strip()
        user = device.get('Device Name')
        devlist[devid] = user
    ipainfo = local('ipa info %s' % ipafile, capture=True)
    parsing = False
    for line in ipainfo.split('\n'):
        if 'ProvisionedDevices' in line:
            parsing = True
        if 'TeamIdentifier' in line:
            parsing = False
        if parsing:
            uuid = line.replace('ProvisionedDevices', '').split('|')[2].strip()
            print uuid, devlist[uuid]

def devices_in_list(devicelist):
    assert devicelist, "Give the name of the device list"
    devicelist = os.path.expanduser(devicelist)
    with open(devicelist) as f:
        for i, line in enumerate(f.readlines()):
            if i == 0 and 'Device ID' in line or line.strip() == '':
                # ignore first line
                continue
            deviceid, user = '', ''
            try:
                if('\t') in line:
                    # tab
                    deviceid, user = line.split('\t')
                else:
                    # csv
                    deviceid, user = line.split(',')
            except Exception as e:
                print e
                assert deviceid and user, "Need to have a deviceid and user split by tab, found <%s %s> in %s" % (deviceid, user, devicelist)
            else:
                deviceid = deviceid.strip()
                user = user.strip()
                yield deviceid, user

def devices_in_profile_fn(profilename=None, onlyactive=True):
    assert profilename, "Need a profile name"
    profilename, _ = os.path.splitext(os.path.basename(profilename))
    result = local('ios profiles:manage:devices:list --format csv --type distribution "%s"' % profilename, capture=True)
    devices = {}
    for i, row in enumerate(result.split('\n')):
        # ignore the first row
        if i == 0:
            continue
        user, deviceid, active = row.split(',')
        if active == 'Y' or not onlyactive:
            devices[deviceid] = ((user, active))
    return devices

def ios_certificates_fn(kind=None):
    kind = kind or 'development'
    result = local('ios certificates:list --format csv %s' % kind, capture=True)
    certs = []
    for i, row in enumerate(result.split('\n')):
        # ignore first row
        if i == 0:
            continue
        name,kind,expire,status = row.split(',')
        certs.append((name, kind, expire, status))
    return certs
    
@task(alias="iosdevices")
def devices_in_profile(profilename=None, variant=None, level=None):
    """
    list devices in profile
    """
    target = 'ipa-%s' % level
    if level and variant and not profilename:
        profilename = env.deploy_config[target]['provisionfile'][variant]
        print "Profile: ", profilename
    for deviceid, (user, active) in devices_in_profile_fn(profilename).iteritems():
        print deviceid, user, active
    
@task 
def iosdiff(devicelist=None, profilename=None):
    """
    diff of devices in profile v.s. list
    """
    devices_known = devices_in_profile(profilename)
    for deviceid, user in devices_in_list(devicelist):
        is_known = deviceid in devices_known
        print "known" if is_known else "unknown", user      
        
@task
def iosadd(devices=None, exclude=None, level=None, 
           variant=None, profile=None, dumpall=False, 
           logfile=None, forceadd=False, listonly=True):
    """
    add devices from testfairy export to prov profile
    
    will list all devices added and write track to logfile. using the logfile
    you can keep track of when a device has been added
    
    to exclude certain users from being added, specify a filter using exclude (same
    format as as devices list). Filter is by UUID and email address
    """
    import datetime
    devicelist = devices
    excludelist = exclude or "iosdevices.exl"
    profilename = profile
    execute('check_iosappdev_credentials', variant)
    to_add = devices_in_list(devicelist)
    if not forceadd and excludelist:
        to_exclude = devices_in_list(excludelist)
        uuids, users = zip(*to_exclude)
        to_add = [(deviceid, user) for deviceid, user in to_add if not (deviceid in uuids or user in users)]
    level = level or 'staging'
    target = 'ipa-%s' % level
    if level and variant and not profilename:
        profilename = env.deploy_config[target]['provisionfile'][variant]
        print "Profile: ", profilename
    devices_known = devices_in_profile_fn(profilename)
    devices_added = []
    logfile = 'iosdevices.txt'
    groupfile = 'iosgroups.txt'
    addedfile = 'iosadded.txt'
    for deviceid, user in to_add:
        #local('ios devices:add "%s"=%s' % (user, deviceid))      
        if not deviceid in devices_known:
            if not listonly:
                local('ios devices:add "%s"=%s' % (user, deviceid))
                local('ios profiles:manage:devices:add "%s" "%s"=%s' % (profilename, user, deviceid))
            devices_added.append((user, deviceid))
        elif forceadd:
            devices_added.append((user, deviceid))
    if not os.path.exists(logfile):
        with open(logfile, 'w') as f:
            f.write('date_added,deviceid,user,profile')
    if not os.path.exists(groupfile):
        with open(groupfile, 'w') as f:
            f.write('Email,Groups')
    print "added", devices_added
    with open(logfile, 'a') as f, open(groupfile, 'a') as fg, open(addedfile, 'a') as fa:
        # output all previously known devices
        if dumpall:
            for deviceid, (user, _) in devices_known.iteritems():
                date_added = datetime.date(1990,1,1)
                f.write('%s,%s,%s\n' % (date_added, deviceid, user))
                print deviceid, user, "*previously added"
        today = datetime.date.today()        
        group = 'iphone-%s-%s' % (today, datetime.datetime.now().time())
        # f => logfile
        # fg => create a group file for import on testfairy
        for user, deviceid in devices_added:
            f.write('%s,%s,%s,%s\n' % (today, deviceid, user, profilename))
            fg.write(('%s,%s\n' % (user, group)).replace(':', ''))
            fa.write('%s\t%s\n' % (deviceid, user))
            print deviceid, user
    if listonly:
        print "[WARN] NONE of the devices were actually added. See iosadded.txt for list for manual adding."
    print "see %s for list of devices added, sorted by date" % logfile
    
@task
def androidsdk():
    local('find platforms/android  -name Android*xml | xargs grep uses-sdk')
    
    
def ios_get_provprofiles(xcrun_config, variant, provkind=None, level=None):
    provkind = provkind or 'development'
    level = level or 'DEV'
    # get current provisioning profile using nomad's cli
    xcrun_config['provisionfile'] = xcrun_config.get('provisionfile')[variant].replace(' ', '_')
    xcrun_config['provisionkind'] = provkind
    profile_path = os.path.dirname(xcrun_config.get('provisionfile'))
    with lcd(profile_path):
        local('rm -f {provisionfile}*'.format(**xcrun_config))
        local('ios profiles:download:all --type {provisionkind} -u {appdevuser} -p {appdevpw}'.format(**xcrun_config))
    # remove all provisioning profiles that don't match this level
    # this is to avoid the case where the .app file created by cordova compile ios
    # contains another set of entitlements than the .ipa bundle created below
    # this is due xcode taking the first provision profile it finds that matches
    # the app qualifier. If that happens to be a STORE type, it will include
    # the beta reports entitlement, which is not allowed in an ADHOC app
    with lcd(os.path.expanduser('~/Library/MobileDevice/Provisioning Profiles')):
        import uuid
        local('cp {provisionfile} .'.format(**xcrun_config))
        local('tar -czf ~/Library/MobileDevice/saved.mobileprovision-%s.tgz *' % uuid.uuid4().hex)
        local('grep --text -L %s *mobileprovision | xargs rm ' % level.upper())

def ios_get_certificates(xcrun_config, certkind=None):
    # not operational
    for name, kind, expire, status in ios_certificates_fn(kind=certkind):
        xcrun_config['certificate'] = name
        local('ios certificates:download --type {provisionkind} "{certificate}" -u {appdevuser} -p {appdevpw}'.format(**xcrun_config))
