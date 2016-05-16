#!/bin/sh

rm -rf node_modules/react-native-background-geolocation/RNBackgroundGeolocation/TSLocationManager.framework
ln -s ~/workspace/cordova/background-geolocation/cordova-background-geolocation/src/ios/TSLocationManager.framework node_modules/react-native-background-geolocation/RNBackgroundGeolocation/TSLocationManager.framework


