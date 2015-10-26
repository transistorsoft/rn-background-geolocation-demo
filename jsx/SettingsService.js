
'use strict';

var React = require('react-native');

var {
  AsyncStorage,
} = React;


var SettingsService = (function() {
  var STORAGE_KEY = "@TSLocationManager:settings";

	var settings = {
    common: [
      {name: 'url', group: 'http', inputType: 'text', dataType: 'string', values: [], defaultValue: 'http://posttestserver.com/post.php?dir=ionic-cordova-background-geolocation'},
      {name: 'method', group: 'http', inputType: 'select', dataType: 'string', values: ['POST', 'PUT'], defaultValue: 'POST'},
      {name: 'autoSync', group: 'http', dataType: 'boolean', inputType: 'select', values: ['true', 'false'], defaultValue: 'true'},
      {name: 'batchSync', group: 'http', dataType: 'boolean', inputType: 'select', values: ['true', 'false'], defaultValue: 'false'},
      {name: 'stopOnTerminate', group: 'application', dataType: 'boolean', inputType: 'select', values: ['true', 'false'], defaultValue: 'true'},
      {name: 'debug', group: 'application', dataType: 'boolean', inputType: 'select', values: ['true', 'false'], defaultValue: 'true'},
      {name: 'stopAfterElapsedMinutes', group: 'geolocation', dataType: 'number', inputType: 'select', values: [0, 1, 2, 5, 10, 15], defaultValue: 0},
      {name: 'stopTimeout', group: 'activity recognition', dataType: 'integer', inputType: 'select', values: [0, 1, 5, 10, 15], defaultValue: 5},
      {name: 'activityRecognitionInterval', group: 'activity recognition', dataType: 'integer', inputType: 'select', values: [0, 1000, 10000, 30000, 60000], defaultValue: 10000},
    ],
    iOS: [
      {name: 'desiredAccuracy', group: 'geolocation', dataType: 'integer', inputType: 'select', values: [-1, 0, 10, 100, 1000], defaultValue: 0 },
      {name: 'distanceFilter', group: 'geolocation', dataType: 'integer', inputType: 'select', values: [0, 10, 20, 50, 100, 500], defaultValue: 20 },
      {name: 'stationaryRadius', group: 'geolocation', dataType: 'integer', inputType: 'select', values: [0, 20, 50, 100, 500], defaultValue: 20 },
      {name: 'activityType', group: 'geolocation', dataType: 'string', inputType: 'select', values: ['Other', 'AutomotiveNavigation', 'Fitness', 'OtherNavigation'], defaultValue: 'Other'},
      {name: 'disableElasticity', group: 'geolocation', dataType: 'boolean', inputType: 'select', values: ['true', 'false'], defaultValue: 'false'},
      {name: 'stopDetectionDelay', group: 'activity recognition', dataType: 'integer', inputType: 'select', values: [0, 1, 2, 5], defaultValue: 0}
    ],
    Android: [
      {name: 'desiredAccuracy', group: 'geolocation', dataType: 'integer', inputType: 'select', values: [0, 10, 100, 1000], defaultValue: 0 },
      {name: 'distanceFilter', group: 'geolocation', dataType: 'integer', inputType: 'select', values: [0, 10, 20, 50, 100, 500], defaultValue: 20 },
      {name: 'locationUpdateInterval', group: 'geolocation', dataType: 'integer', inputType: 'select', values: [0, 1000, 5000, 10000, 30000, 60000], defaultValue: 5000},
      {name: 'fastestLocationUpdateInterval', group: 'geolocation', dataType: 'integer', inputType: 'select', values: [0, 1000, 5000, 10000, 30000, 60000], defaultValue: 1000},
      {name: 'triggerActivities', group: 'geolocation', dataType: 'string', inputType: 'select', values: ['in_vehicle', 'on_bicycle', 'on_foot', 'running', 'walking'], defaultValue: 'in_vehicle, on_bicycle, running, walking, on_foot'},
      {name: 'forceReloadOnMotionChange', group: 'application', dataType: 'boolean', inputType: 'select', values: ['true', 'false'], defaultValue: 'false'},
      {name: 'forceReloadOnLocationChange', group: 'application', dataType: 'boolean', inputType: 'select', values: ['true', 'false'], defaultValue: 'false'},
      {name: 'forceReloadOnGeofence', group: 'application', dataType: 'boolean', inputType: 'select', values: ['true', 'false'], defaultValue: 'false'},
      {name: 'startOnBoot', group: 'application', dataType: 'boolean', inputType: 'select', values: ['true', 'false'], defaultValue: 'false'}
    ]
  }

  var values = undefined;
  var items = [].concat(settings.iOS).concat(settings.common);

  var defaultValues = {};
  for (var n=0,len=items.length;n<len;n++) {
    var setting = items[n];
    defaultValues[setting.name] = setting.defaultValue;
  }

  var bindValues = function(settings, values) {

    for (var n=0,len=settings.length;n<len;n++) {
      settings[n].value = values[settings[n].name];
    }
    var result = {
      http: settings.filter(function(setting) {
        return setting.group === 'http';
      }),
      geolocation: settings.filter(function(setting) {
        return setting.group === 'geolocation';
      }),
      application: settings.filter(function(setting) {
        return setting.group === 'application';
      })
    };
    // Ugly, but whatever...
    result["activity recognition"] = settings.filter(function(setting) {
      return setting.group === 'activity recognition';
    });
    return result;
  };

  return {
    getSettings: function(platform, callback) {
      var me = this;
      if (!settings[platform]) {
        throw "Unknown platform: " + platform;
      }
      var platformSettings = [].concat(settings[platform]).concat(settings.common);
      if (!values) {
        this.getValues(function(result) {
          values = result;
          callback.call(me, bindValues(platformSettings, values));
        });
      } else {
        callback.call(me, bindValues(platformSettings, values));
      }
    },
    getValues: function(callback) {
      AsyncStorage.getItem(STORAGE_KEY)
      .then((value) => {
        if (value !== null){
          values = JSON.parse(value);
          // apply defaults
          var setting;
          for (var n=0,len=items.length;n<len;n++) {
            setting = items[n];
            if (!values[setting.name]) {
              values[setting.name] = setting.defaultValue;
            }
          }
          //callback.call(this, values);
        } else {
          values = defaultValues;
          AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(defaultValues));
        }
        callback.call(this, values);
      })
      //.catch((error) => console.error("- error: ", error.message))
      .done();
    },
    get: function(key) {
      return values[key];
    },
    set: function(key, value, callback) {
      var me = this;
      this.getValues(function(_values) {
        _values[key] = value;
        values = _values;
        me.save(_values, callback);
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
    }
  };
})();

module.exports = SettingsService;
