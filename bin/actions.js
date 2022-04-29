'use strict';

const fs = require("fs");
const path = require('path');

const {CLIError, UnknownCommandError} = require('./lib');

const COMMAND_LINK = 'link';
const COMMAND_REINSTALL = 'reinstall';

const MENU = {};

function registerCommand(name, description, handler) {
  MENU[name] = {
    description: description,
    handler: handler
  };
}

/// ACTION: link
///
registerCommand(COMMAND_LINK, 'Symlink TSLocationManager.xcframework, tslocationmanager.aar', function() {
  link();
});

/// ACTION: reinstall
///
registerCommand(COMMAND_REINSTALL, 'Re-install the currently installed background-geolocation plugin', function() {
  reinstall();
});

/// Symlink the [iOS] TSLocationManager.xcframework [Android] tslocationmanager.aar
///
function link() {
  const fs     = require('fs');
  const path   = require('path');
  const rimraf = require("rimraf");

  const SRC_ROOT            = path.join('/Users/chris/workspace/react/background-geolocation');
  const MODULE_NAME         = "react-native-background-geolocation";
  const SRC_MODULE          = path.join(SRC_ROOT, MODULE_NAME + "-android");
  const NODE_MODULES        = path.join('.', 'node_modules');
  const PUBLIC_MODULE_PATH  = path.join(NODE_MODULES, MODULE_NAME);
  const PRIVATE_MODULE_PATH = PUBLIC_MODULE_PATH + '-android';

  const ANDROID_LIBS_DIR    = "android/libs";
  const IOS_LIBS_DIR        = "ios/RNBackgroundGeolocation/TSLocationManager.xcframework";

  var modulePath = null;

  // Determine which plugin is installed:  public or private version.
  if (fs.existsSync(PUBLIC_MODULE_PATH)) {
    modulePath = PUBLIC_MODULE_PATH;
  } else if (fs.existsSync(PRIVATE_MODULE_PATH)) {
    modulePath = PRIVATE_MODULE_PATH;
  } else {
    console.error('ERROR: Failed to find ', MODULE_NAME);
    return -1;
  }
  console.log('- modulePath:', modulePath);

  var androidLibsPath = path.join(modulePath, ANDROID_LIBS_DIR);
  var iosLibsPath = path.join(modulePath, IOS_LIBS_DIR);

  // Destroy / unlink existing libs.
  [androidLibsPath, iosLibsPath].forEach(function(libs) {
    if (fs.existsSync(libs)) {
      var stats = fs.lstatSync(libs);
      console.log('[dir]', libs);
      console.log('- symlink?', stats.isSymbolicLink(), ', dir?', stats.isDirectory());
      if (stats.isSymbolicLink()) {
        fs.unlinkSync(libs);
      } else if (stats.isDirectory()) {
        rimraf.sync(libs);
      }
    }
  });

  // Symlink tslocationmanager.aar -> src project.
  var src = path.join(SRC_MODULE, ANDROID_LIBS_DIR);
  var dest = path.join(modulePath, ANDROID_LIBS_DIR);
  fs.symlinkSync(src, dest);

  // Symlink TSLocationManager.xcframework -> src project.
  src = path.join(SRC_MODULE, IOS_LIBS_DIR);
  dest = path.join(modulePath, IOS_LIBS_DIR);
  fs.symlinkSync(src, dest);
}

/// Re-install the currently installed plugin
///
function reinstall() {
  console.log('- No implementation');
}

module.exports = {
  actions: MENU
};
