
'use strict';


import React, { Component } from 'react';
import {
  AsyncStorage
 } from 'react-native';

import DeviceInfo from 'react-native-device-info';

var SettingsService = (function() {
  var STORAGE_KEY = "@TSLocationManager:settings";

  // react-native-device-info
  var deviceInfo = {
    uuid: DeviceInfo.getUniqueID(),
    model: DeviceInfo.getModel(),
    platform: DeviceInfo.getSystemName(),
    manufacturer: DeviceInfo.getManufacturer(),
    version: DeviceInfo.getSystemVersion()
  };

  var SOUNDS = {
    "LONG_PRESS_ACTIVATE_IOS": 1113,
    "LONG_PRESS_ACTIVATE_ANDROID": 27,
    "LONG_PRESS_CANCEL_IOS": 1075,
    "LONG_PRESS_CANCEL_ANDROID": 94,
    "ADD_GEOFENCE_IOS": 1114,
    "ADD_GEOFENCE_ANDROID": 28,
    "BUTTON_CLICK_IOS": 1104,
    "BUTTON_CLICK_ANDROID": 89,
    "MESSAGE_SENT_IOS": 1303,
    "MESSAGE_SENT_ANDROID": 90,
    "ERROR_IOS": 1006
  };

	var _settings = {
    common: [
      {name: 'url', group: 'http', inputType: 'text', dataType: 'string', defaultValue: 'http://posttestserver.com/post.php?dir=ionic-cordova-background-geolocation'},
      {name: 'autoSync', group: 'http', dataType: 'boolean', inputType: 'select', values: [true, false], defaultValue: true},
      {name: 'autoSyncThreshold', group: 'http', dataType: 'integer', inputType: 'select', values: [0, 5, 10, 25, 50, 100], defaultValue: 0},
      {name: 'batchSync', group: 'http', dataType: 'boolean', inputType: 'select', values: [true, false], defaultValue: false},
      {name: 'maxBatchSize', group: 'http', dataType: 'integer', inputType: 'select', values: [-1, 50, 100, 250, 500], defaultValue: 250},

      {name: 'stopOnTerminate', group: 'application', dataType: 'boolean', inputType: 'select', values: [true, false], defaultValue: true},
      {name: 'debug', group: 'application', dataType: 'boolean', inputType: 'select', values: [true, false], defaultValue: true},
      {name: 'stopAfterElapsedMinutes', group: 'geolocation', dataType: 'number', inputType: 'select', values: [0, 1, 2, 5, 10, 15], defaultValue: 0},
      {name: 'activityRecognitionInterval', group: 'activity recognition', dataType: 'integer', inputType: 'select', values: [0, 1000, 5000, 10000, 30000], defaultValue: 10000},
      {name: 'stopTimeout', group: 'activity recognition', dataType: 'integer', inputType: 'select', values: [0, 1, 5, 10, 15], defaultValue: 1},
      {name: 'startOnBoot', group: 'application', dataType: 'boolean', inputType: 'select', values: [true, false], defaultValue: false},
      {name: 'disableElasticity', group: 'geolocation', dataType: 'boolean', inputType: 'select', values: [true, false], defaultValue: false},
      {name: 'heartbeatInterval', group: 'application', dataType: 'integer', inputType: 'select', values: [30, 60, 120, 240, 600], defaultValue: 60},
      {name: 'maxRecordsToPersist', group: 'persistence', dataType: 'integer', inputType: 'select', values: [-1, 0, 1, 10, 100, 1000], defaultValue: -1},
      {name: 'maxDaysToPersist', group: 'persistence', dataType: 'integer', inputType: 'select', values: [-1, 1, 2, 3, 4, 5, 6, 7], defaultValue: -1}
    ],
    iOS: [
      {name: 'desiredAccuracy', group: 'geolocation', dataType: 'integer', inputType: 'select', values: [-1, 0, 10, 100, 1000], defaultValue: 0 },
      {name: 'distanceFilter', group: 'geolocation', dataType: 'integer', inputType: 'select', values: [0, 10, 20, 50, 100, 500], defaultValue: 20 },
      {name: 'stationaryRadius', group: 'geolocation', dataType: 'integer', inputType: 'select', values: [0, 20, 50, 100, 500], defaultValue: 20 },
      {name: 'activityType', group: 'geolocation', dataType: 'string', inputType: 'select', values: ['Other', 'AutomotiveNavigation', 'Fitness', 'OtherNavigation'], defaultValue: 'Other'},
      {name: 'preventSuspend', group: 'application', dataType: 'boolean', inputType: 'select', values: [true, false], defaultValue: false},
      {name: 'disableStopDetection', group: 'activity recognition', dataType: 'boolean', inputType: 'select', values: [true, false], defaultValue: false},
      {name: 'logLevel', group: 'application', dataType: 'integer', inputType: 'select', values: [0, 1, 2, 3, 4, 5], defaultValue: 5}
    ],
    Android: [
      {name: 'desiredAccuracy', group: 'geolocation', dataType: 'integer', inputType: 'select', values: [0, 10, 100, 1000], defaultValue: 0 },
      {name: 'distanceFilter', group: 'geolocation', dataType: 'integer', inputType: 'select', values: [0, 10, 20, 50, 100, 500], defaultValue: 20 },
      {name: 'locationUpdateInterval', group: 'geolocation', dataType: 'integer', inputType: 'select', values: [0, 1000, 5000, 10000, 30000, 60000], defaultValue: 5000},
      {name: 'fastestLocationUpdateInterval', group: 'geolocation', dataType: 'integer', inputType: 'select', values: [0, 1000, 5000, 10000, 30000, 60000], defaultValue: 1000},
      {name: 'triggerActivities', group: 'activity recognition', dataType: 'string', inputType: 'select', values: ['in_vehicle', 'on_bicycle', 'on_foot', 'running', 'walking'], defaultValue: 'in_vehicle, on_bicycle, running, walking, on_foot'},      
      {name: 'forceReloadOnMotionChange', group: 'application', dataType: 'boolean', inputType: 'select', values: [true, false], defaultValue: false},
      {name: 'forceReloadOnLocationChange', group: 'application', dataType: 'boolean', inputType: 'select', values: [true, false], defaultValue: false},
      {name: 'forceReloadOnGeofence', group: 'application', dataType: 'boolean', inputType: 'select', values: [true, false], defaultValue: false},
      {name: 'forceReloadOnHeartbeat', group: 'application', dataType: 'boolean', inputType: 'select', values: [true, false], defaultValue: false},
      {name: 'foregroundService', group: 'application', dataType: 'boolean', inputType: 'select', values: [true, false], defaultValue: false},
      {name: 'deferTime', group: 'geolocation', dataType: 'integer', inputType: 'select', values: [0, (10*1000), (30*1000), (60*1000), (5*60*1000)], defaultValue: 0}
    ]
  }
  var _platform = undefined;
  var _values = undefined;
  var _items = [];
  var _defaultValues = {};
  
  var bindValues = function(settings, values) {
    for (var n=0,len=settings.length;n<len;n++) {
      settings[n].value = _values[settings[n].name];
    }
    var result = {
      http: settings.filter(function(setting) {
        return setting.group === 'http';
      }),
      'persistence': settings.filter(function(setting) {
        return setting.group === 'persistence';
      }),
      geolocation: settings.filter(function(setting) {
        return setting.group === 'geolocation';
      }),
      application: settings.filter(function(setting) {
        return setting.group === 'application';
      })
    };
    result['activity recognition'] = settings.filter(function(setting) {
      return setting.group === 'activity recognition';
    });
    return result;
  };

  return {
    init: function() {
      _platform = DeviceInfo.getSystemName();
      if (_platform.match(/iPhone/)) {
        _platform = 'iOS'
      };

      _items = [].concat(_settings[_platform]).concat(_settings.common);
      for (var n=0,len=_items.length;n<len;n++) {
        var setting = _items[n];
        _defaultValues[setting.name] = setting.defaultValue;
      }
    },
    getSettings: function(callback) {
      var me = this;
      if (!_settings[_platform]) {
        throw "Unknown platform: " + _platform;
      }
      //var platformSettings = [].concat(_settings[_platform]).concat(_settings.common);
      if (!_values) {
        this.getValues(function(result) {
          _values = result;
          callback.call(me, bindValues(_items, _values));
        });
      } else {
        callback.call(me, bindValues(_items, _values));
      }
    },
    getValues: function(callback) {
      AsyncStorage.getItem(STORAGE_KEY)
      .then((value) => {
        if (value !== null){
          _values = JSON.parse(value);
          //callback.call(this, values);
        } else {
          _values = _defaultValues;
          AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(_defaultValues));
        }
        // Append react-native-device-info
        _values.params = {
          device: deviceInfo
        };

        _values.maxDaysToPersist = 1;
        _values.useSignificantChangesOnly = 0;
        _values.stopDetectionDelay = 0;

        callback.call(this, _values);
      })
      //.catch((error) => console.error("- error: ", error.message))
      .done();
    },
    get: function(key) {
      if (typeof(_values[key]) === 'undefined') {
        return _defaultValues[key];
      } else if (_values[key] === null) {
        return '';
      } else {
        return _values[key];  
      }
    },
    set: function(key, value, callback) {
      callback = callback || function() {};
      var me = this;
      this.getValues(function(mValues) {
        mValues[key] = value;
        _values = mValues;
        me.save(mValues, callback);
      });
    },
    save: function(values, callback) {
      var me = this;
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(values))
      .then(() => {
        callback.call(me, values);
      })
      //.catch((error) => console.error("- error: ", error))
      .done();
    },
    getSoundId: function(key) {
      var id = SOUNDS[key + "_" + deviceInfo.platform.toUpperCase()];
      if (!id) {
        console.warn('Failed to find sound ID for ', key);
        id = 0;
      }
      return id;
    },
    /**
    * Auto-build a scheule based upon current time.
    *                ______________..._______________                      ___...
    * ______________|                                |____________________|
    * |<-- delay -->|<---------- duration ---------->|<---- interval ---->|<-- duration -->
    *
    * @param {Integer} count How many schedules to generate?
    * @param {Integer} delay How many minutes in future to start generating schedules
    * @param {Integer} duration How long is each trigger event
    * @param {Integer} interval How long between trigger events
    */
    generateSchedule: function(count, delay, duration, interval) {
      // Start 2min from now
      var now = new Date();
      var start = new Date(now.getTime() + delay*60000);

      console.log('---------- generateSchedule: ', now, start);

      var rs = [];
      for (var n=0,len=count;n<len;n++) {
        var end = new Date(start.getTime() + duration*60000);
        var schedule = '1-7 ' + start.getHours()+':'+start.getMinutes() + '-' + end.getHours()+':'+end.getMinutes();
        start = new Date(end.getTime() + interval*60000);
        rs.push(schedule);
      }
      return rs;
    }
  };
})();

module.exports = SettingsService;
