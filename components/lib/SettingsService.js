'use strict';

import React, { Component } from 'react';
import {
  AsyncStorage,
  Alert
} from 'react-native';

import EventEmitter from 'EventEmitter';
import Toast from 'react-native-root-toast';

const STORAGE_KEY = "@TSLocationManager:";

const GEOFENCE_RADIUS_OPTIONS = {
  "100":"100",
  "150":"150",
  "200":"200",
  "300":"300",
  "500":"500",
  "1000":"1000"
};

const GEOFENCE_LOITERING_DELAY_OPTIONS = {
  "0":"0",
  "10000":"10000",
  "30000":"30000",
  "60000":"60000"
};

const SETTINGS = [
  {name: 'email', group: 'application', dataType: 'string', inputType: 'text', defaultValue: ''},
  {name: 'radius', group: 'geofence', dataType: 'integer', inputType: 'select', defaultValue: 200, values: [100, 150, 200, 500, 1000]},
  {name: 'notifyOnEntry', group: 'geofence', dataType: 'boolean', inputType: 'toggle', defaultValue: true},
  {name: 'notifyOnExit', group: 'geofence', dataType: 'boolean', inputType: 'toggle', defaultValue: false},
  {name: 'notifyOnDwell', group: 'geofence', dataType: 'boolean', inputType: 'toggle', defaultValue: false},
  {name: 'loiteringDelay', group: 'geofence', dataType: 'integer', inputType: 'select', defaultValue: 0, values: [0, (1*1000), (5*1000), (10*1000), (30*1000), (60*1000), (5*60*1000)]},
  {name: 'hideMarkers', group: 'map', dataType: 'boolean', inputType: 'toggle', defaultValue: false},
  {name: 'hidePolyline', group: 'map', dataType: 'boolean', inputType: 'toggle', defaultValue: false},
  {name: 'showGeofenceHits', group: 'map', dataType: 'boolean', inputType: 'toggle', defaultValue: false},
  {name: 'followsUserLocation', group: 'map', dataType: 'boolean', inputType: 'toggle', defaultValue: true},
];

let eventEmitter = new EventEmitter();

let instance = null;

class SettingsService {
  static getInstance() {
    if (instance === null) {
      instance = new SettingsService();
    }
    return instance;
  }

  constructor(props) {
    this.state = null;
    this.changeBuffer = null;
    this._loadState();
  }

  getState(callback) {
    if (this.state) {
      callback(this.state);
    } else {
      this._loadState(callback);
    }
  }

  getSettings(group) {
    if (group !== undefined) {
      let settings = [];
      return SETTINGS.filter((setting) => { return setting.group === group; });
    } else {
      return SETTINGS;
    }
  }

  on(event, callback) {
    eventEmitter.addListener(event, callback);
  }

  removeListeners() {
    eventEmitter.removeAllListeners();
  }

  onChange(setting, value) {
    if (typeof(setting) === 'string') {
      let name = setting;
      setting = SETTINGS.find((item) => {
        return item.name === name
      });
      if (!setting) {
        console.warn('SettingsService#onChange failed to find setting: ', name);
        return;
      }
    }
    switch(setting.dataType) {
      case 'integer':
        value = parseInt(value, 10);
        break;
    }
    // Buffer field-changes by 500ms
    if (this.changeBuffer) {
      this.changeBuffer = clearTimeout(this.changeBuffer);
    }
    this.changeBuffer = setTimeout(() => {
      this.set(setting.name, value);
    }, 500);
  }

  set(name, value) {
    if (this.state[name] === value) {
      // No change.  Ignore
      return;
    }
    this.state[name] = value;
    eventEmitter.emit('change', {
      name: name,
      value: value,
      state: this.state
    });
    this._saveState();
  }

  /**
  * Show a confirmation dialog
  * @param {String} title
  * @param {String} message
  * @param {Function} callback
  */
  confirm(title, message, callback) {
    // Works on both iOS and Android
    Alert.alert(title, message, [
      {text: 'Cancel', onPress: () => {}},
      {text: 'OK', onPress: callback},
    ], { cancelable: false });
  }

  /**
  * Show a toast message
  * @param {String} message
  * @param {Mixed} param
  * @param {String} duration LONG|SHORT
  */
  toast(message, param, duration) {
    duration = duration || 'SHORT';
    // Add a Toast on screen.
    let toast = Toast.show(message, {
      duration: Toast.durations[duration.toUpperCase()],
      position: Toast.positions.BOTTOM,
      shadow: true,
      animation: true,
      hideOnPress: true,
      delay: 0
    });
  }

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
  generateSchedule(count, delay, duration, interval) {
    // Start 2min from now
    var now = new Date();
    var start = new Date(now.getTime() + delay*60000);

    var rs = [];
    for (var n=0,len=count;n<len;n++) {
      var end = new Date(start.getTime() + duration*60000);
      var schedule = '1-7 ' + start.getHours()+':'+start.getMinutes() + '-' + end.getHours()+':'+end.getMinutes();
      start = new Date(end.getTime() + interval*60000);
      rs.push(schedule);
    }
    return rs;
  }

  getRadiusOptions() {
    return GEOFENCE_RADIUS_OPTIONS;
  }

  getLoiteringDelayOptions() {
    return GEOFENCE_LOITERING_DELAY_OPTIONS;
  }

  _getDefaultState() {
    let state = {};
    SETTINGS.forEach((setting) => {
      state[setting.name] = setting.defaultValue;
    });
    return state;
  }

  _loadState(callback) {
    AsyncStorage.getItem(STORAGE_KEY + ":settings", (err, value) => {
      if (value) {
        this.state = JSON.parse(value);
      } else {
        this.state = this._getDefaultState();
        this._saveState();
      }

      if (typeof(callback) === 'function') {
        callback(this.state);
      }
    });
  }

  _saveState() {
    AsyncStorage.setItem(STORAGE_KEY + ":settings", JSON.stringify(this.state, null));
  }
}

module.exports = SettingsService;
