/**
* This SettingsService is just a simple singleton for managing the complex Settings screen
* as well as a general application-wide utility service.
*
* There's nothing particularly interesting here with-respect-to the Background Geolocation
* plugin.
*/
'use strict';

import React from 'react'
import {Component} from 'react';

import {
  Alert
} from 'react-native';

import AsyncStorage from '@react-native-community/async-storage';

import Toast from 'react-native-root-toast';
import prompt from 'react-native-prompt-android';
import DeviceInfo from 'react-native-device-info';
import BackgroundGeolocation, {
  State,
  Location,
  Geofence,
  HttpEvent,
  MotionActivityEvent,
  ProviderChangeEvent,
  MotionChangeEvent,
  GeofenceEvent,
  GeofencesChangeEvent,
  HeartbeatEvent,
  ConnectivityChangeEvent
} from "../../react-native-background-geolocation";

const STORAGE_KEY:string = "@transistorsoft:";
const TRACKER_HOST:string = 'http://tracker.transistorsoft.com/locations/';

const GEOFENCE_RADIUS_OPTIONS:any = {
  "100":100,
  "150":150,
  "200":200,
  "300":300,
  "500":500,
  "1000":1000
};

const GEOFENCE_LOITERING_DELAY_OPTIONS:any = {
  "0":0,
  "10000":10000,
  "30000":30000,
  "60000":60000
};

const APP_SETTINGS:any = [
  {name: 'email', group: 'application', dataType: 'string', inputType: 'text', defaultValue: ''},
  {name: 'radius', group: 'geofence', dataType: 'integer', inputType: 'select', defaultValue: 200, values: [100, 150, 200, 500, 1000]},
  {name: 'notifyOnEntry', group: 'geofence', dataType: 'boolean', inputType: 'toggle', defaultValue: true},
  {name: 'notifyOnExit', group: 'geofence', dataType: 'boolean', inputType: 'toggle', defaultValue: false},
  {name: 'notifyOnDwell', group: 'geofence', dataType: 'boolean', inputType: 'toggle', defaultValue: false},
  {name: 'loiteringDelay', group: 'geofence', dataType: 'integer', inputType: 'select', defaultValue: 0, values: [0, (1*1000), (5*1000), (10*1000), (30*1000), (60*1000), (5*60*1000)]},
  {name: 'hideMarkers', group: 'map', dataType: 'boolean', inputType: 'toggle', defaultValue: false},
  {name: 'hidePolyline', group: 'map', dataType: 'boolean', inputType: 'toggle', defaultValue: false},
  {name: 'hideGeofenceHits', group: 'map', dataType: 'boolean', inputType: 'toggle', defaultValue: false},
  {name: 'followsUserLocation', group: 'map', dataType: 'boolean', inputType: 'toggle', defaultValue: true},
];

const PLUGIN_SETTINGS:any = {
  common: [
    // Geolocation
    {name: 'desiredAccuracy', group: 'geolocation', dataType: 'integer', inputType: 'select', values: [-2, -1, 0, 10, 100, 1000], defaultValue: 0 },
    {name: 'distanceFilter', group: 'geolocation', dataType: 'integer', inputType: 'select', values: [0, 10, 20, 50, 100, 500], defaultValue: 20 },
    {name: 'disableElasticity', group: 'geolocation', dataType: 'boolean', inputType: 'toggle', values: [true, false], defaultValue: false},
    {name: 'elasticityMultiplier', group: 'geolocation', dataType: 'integer', inputType: 'select', values: [0, 1, 2, 3, 5, 10], defaultValue: 1},
    {name: 'geofenceProximityRadius', group: 'geolocation', dataType: 'integer', inputType: 'select', values: [1000, 1500, 2000, 5000, 10000, 100000], defaultValue: 1000 },
    {name: 'stopAfterElapsedMinutes', group: 'geolocation', dataType: 'integer', inputType: 'select', values: [-1, 0, 1, 2, 5, 10, 15], defaultValue: 0},
    {name: 'desiredOdometerAccuracy', group: 'geolocation', dataType: 'integer', inputType: 'select', values: [10, 20, 50, 100, 500], defaultValue: 100},
    {name: 'useSignificantChangesOnly', group: 'geolocation', dataType: 'boolean', inputType: 'toggle', values: [true, false], defaultValue: false},
    // Activity Recognition
    {name: 'stopTimeout', group: 'activity recognition', dataType: 'integer', inputType: 'select', values: [0, 1, 5, 10, 15], defaultValue: 1},
    {name: 'disableMotionActivityUpdates', group: 'activity recognition', dataType: 'boolean', inputType: 'toggle', values: [true, false], defaultValue: false},
    {name: 'disableStopDetection', group: 'activity recognition', dataType: 'boolean', inputType: 'toggle', values: [true, false], defaultValue: false},

    // HTTP & Persistence
    {name: 'url', group: 'http', inputType: 'text', dataType: 'string', defaultValue: 'http://your.server.com/endpoint'},
    {name: 'autoSync', group: 'http', dataType: 'boolean', inputType: 'toggle', values: [true, false], defaultValue: true},
    {name: 'autoSyncThreshold', group: 'http', dataType: 'integer', inputType: 'select', values: [0, 5, 10, 25, 50, 100], defaultValue: 0},
    {name: 'batchSync', group: 'http', dataType: 'boolean', inputType: 'toggle', values: [true, false], defaultValue: false},
    {name: 'maxBatchSize', group: 'http', dataType: 'integer', inputType: 'select', values: [-1, 50, 100, 250, 500], defaultValue: 250},
    {name: 'maxRecordsToPersist', group: 'http', dataType: 'integer', inputType: 'select', values: [-1, 0, 1, 10, 100, 1000], defaultValue: -1},
    {name: 'maxDaysToPersist', group: 'http', dataType: 'integer', inputType: 'select', values: [-1, 1, 2, 3, 5, 7, 14], defaultValue: 2},
    {name: 'persistMode', group: 'http', dataType: 'integer', inputType: 'select', values: [2, 1, -1, 0], defaultValue: 2},
    // Application
    {name: 'stopOnTerminate', group: 'application', dataType: 'boolean', inputType: 'toggle', values: [true, false], defaultValue: true},
    {name: 'startOnBoot', group: 'application', dataType: 'boolean', inputType: 'toggle', values: [true, false], defaultValue: false},
    {name: 'heartbeatInterval', group: 'application', dataType: 'integer', inputType: 'select', values: [-1, 60, (2*60), (5*60), (15*60)], defaultValue: 60},
    // Logging & Debug
    {name: 'debug', group: 'debug', dataType: 'boolean', inputType: 'toggle', values: [true, false], defaultValue: true},
    {name: 'logLevel', group: 'debug', dataType: 'string', inputType: 'select', values: ['OFF', 'ERROR', 'WARN', 'INFO', 'DEBUG', 'VERBOSE'], defaultValue: 'VERBOSE'},
    {name: 'logMaxDays', group: 'debug', dataType: 'integer', inputType: 'select', values: [1, 2, 3, 4, 5, 6, 7], defaultValue: 3}
  ],
  ios: [
    // Geolocation
    {name: 'stationaryRadius', group: 'geolocation', dataType: 'integer', inputType: 'select', values: [0, 25, 50, 100, 500, 1000, 5000], defaultValue: 25 },
    {name: 'activityType', group: 'geolocation', dataType: 'string', inputType: 'select', values: ['Other', 'AutomotiveNavigation', 'Fitness', 'OtherNavigation'], defaultValue: 'Other'},
    // Application
    {name: 'preventSuspend', group: 'application', dataType: 'boolean', inputType: 'toggle', values: [true, false], defaultValue: false},
    // Activity Recognition
    {name: 'stopDetectionDelay', group: 'activity recognition', dataType: 'integer', inputType: 'select', values: [0, 1, 5, 10, 15], defaultValue: 0}
  ],
  android: [
    // Geolocation
    {name: 'locationUpdateInterval', group: 'geolocation', dataType: 'integer', inputType: 'select', values: [0, 1000, 5000, 10000, 30000, 60000], defaultValue: 5000},
    {name: 'fastestLocationUpdateInterval', group: 'geolocation', dataType: 'integer', inputType: 'select', values: [0, 1000, 5000, 10000, 30000, 60000], defaultValue: 1000},
    {name: 'deferTime', group: 'geolocation', dataType: 'integer', inputType: 'select', values: [0, (10*1000), (30*1000), (60*1000), (5*60*1000)], defaultValue: 0},
    {name: 'geofenceModeHighAccuracy', group: 'geolocation', dataType: 'boolean', inputType: 'toggle', value: [true, false], defaultValue: false},
    // Activity Recognition
    //{name: 'triggerActivities', group: 'activity recognition', dataType: 'string', inputType: 'select', values: ['in_vehicle', 'on_bicycle', 'on_foot', 'running', 'walking'], defaultValue: 'in_vehicle, on_bicycle, running, walking, on_foot'},
    // Application
    {name: 'enableHeadless', group: 'application', dataType: 'boolean', inputType: 'toggle', values: [true, false], defaultValue: true},
    {name: 'foregroundService', group: 'application', dataType: 'boolean', inputType: 'toggle', values: [true, false], defaultValue: false},
    {name: 'forceReloadOnMotionChange', group: 'application', dataType: 'boolean', inputType: 'toggle', values: [true, false], defaultValue: false},
    {name: 'forceReloadOnLocationChange', group: 'application', dataType: 'boolean', inputType: 'toggle', values: [true, false], defaultValue: false},
    {name: 'forceReloadOnGeofence', group: 'application', dataType: 'boolean', inputType: 'toggle', values: [true, false], defaultValue: false},
    {name: 'forceReloadOnHeartbeat', group: 'application', dataType: 'boolean', inputType: 'toggle', values: [true, false], defaultValue: false},
    {name: 'notificationPriority', group: 'application', dataType: 'string', inputType: 'select', values: ['DEFAULT', 'HIGH', 'LOW', 'MAX', 'MIN'], defaultValue: 'DEFAULT'}
  ]
};

//A collection of soundId for use with BackgroundGeolocation#playSound
const SOUND_MAP:any = {
  "ios": {
    "LONG_PRESS_ACTIVATE": 1113,
    "LONG_PRESS_CANCEL": 1075,
    "ADD_GEOFENCE": 1114,
    "BUTTON_CLICK": 1104,
    "MESSAGE_SENT": 1303,
    "ERROR": 1006,
    "OPEN": 1502,
    "CLOSE": 1503,
    "FLOURISH": 1509
  },
  "android": {
    "LONG_PRESS_ACTIVATE": "DOT_START",
    "LONG_PRESS_CANCEL": "DOT_STOP",
    "ADD_GEOFENCE": "DOT_SUCCESS",
    "BUTTON_CLICK": "BUTTON_CLICK",
    "MESSAGE_SENT": "WHOO_SEND_SHARE",
    "ERROR": "ERROR",
    "OPEN": "OPEN",
    "CLOSE": "CLOSE",
    "FLOURISH": "MOTIONCHANGE_TRUE"
  }
};

// Auto-incrementing id For creating test geofences.
let geofenceNextId = 0;

let instance:any = null;

export default class SettingsService {
  static getInstance() {
    if (instance === null) {
      instance = new SettingsService({});
    }
    return instance;
  }

  private applicationState:any = null;
  private pluginState:State;
  private changeBuffer:any = undefined;
  private uuid:any = null;
  private username:any = null;
  private platform:string;
  private settings:any;

  constructor(props:any) {
    this._loadApplicationState();
    this.pluginState = {enabled: false, trackingMode: 1, odometer: 0, schedulerEnabled: false};

    this.getUUID((uuid:any) => {
      this.uuid = uuid;
    });

    let platform = DeviceInfo.getSystemName();
    if (platform.match(/iPhone/)) {
      platform = 'ios'
    };
    this.platform = platform.toLowerCase();

    let items = [].concat(PLUGIN_SETTINGS.common).concat(PLUGIN_SETTINGS[this.platform]);

    this.settings = {
      items: items,
      map: {}
    };
    // Create a Map of Settings for speedy lookup.
    items.forEach((item:any) => {
      this.settings.map[item.name] = item;
    });
  }

  setUsername(username:any) {
    this.username = username;
  }

  getUUID(callback:Function) {
    if (this.uuid) {
      callback(this.uuid);
      return;
    }
    AsyncStorage.getItem(STORAGE_KEY+"uuid", (err, uuid) => {
      if (uuid) {
        this.uuid = uuid;
      }
      callback(uuid);
    });
  }

  setUUID(uuid:any) {
    this.uuid = uuid;
    AsyncStorage.setItem(STORAGE_KEY+"uuid", uuid);
  }

  getEmail(callback:Function) {
    if (this.applicationState.email) {
      callback(this.applicationState.email);
      return;
    }
    prompt('Email address', 'Please enter your email address', [{
      text: 'Cancel',
      style: 'cancel',
      onPress: () => {
        console.log('Cancel Pressed');
        callback(null);
      }
    },{
      text: 'OK',
      onPress: (email) => {
        this.set('email', email);
        callback(email);
      }
    }],{
      type: 'plain-text'
    });
  }

  /**
  * Returns application-specific state
  * {hideMarkers, hidePolyline, hideGeofences, email}
  */
  getApplicationState(callback:Function) {
    if (this.applicationState) {
      callback(this.applicationState);
    } else {
      this._loadApplicationState(callback);
    }
  }

  getApplicationSettings(group:any) {
    if (group !== undefined) {
      let settings = [];
      return APP_SETTINGS.filter((setting:any) => { return setting.group === group; });
    } else {
      return APP_SETTINGS;
    }
  }

  getPlatform() {
    return this.platform;
  }

  /**
  * Returns a list of BackgroundGeolocation settings by group
  * @param {String} group
  * @return {Array}
  */
  getPluginSettings(group:string) {
    if (group === undefined) {
      return this.settings.items;
    } else {
      let settings:Array<any> = [];
      this.settings.items.forEach((setting:any) => {
        if (setting.group === group && !setting.ignore) {
          settings.push(setting);
        }
      });
      return settings;
    }
  }

  /**
  * Returns the current plugin state.  If this is the first boot of the app, returns a default state of
  * {
    debug: true,
    logLevel: BackgroundGeolocation.LOG_LEVEL_VERBOSE,
    foregroundService: true,
    autoSync: true,
    stopOnTerminate: false,
    url: TRACKER_HOST + this.username,
    startOnBoot: true,
    heartbeatInterval: 60,
    params : {
      device: {
        uuid: DeviceInfo.getUniqueID(),
        model: DeviceInfo.getModel(),
        platform: DeviceInfo.getSystemName(),
        manufacturer: DeviceInfo.getManufacturer(),
        version: DeviceInfo.getSystemVersion(),
        framework: 'ReactNative'
      }
    }
    First-boot is detected by querying AsyncStorage for Device "uuid".  When uuid is detected, the current plugin state
    is returned, as configured by the Settings screen.
  }
  * @return {Object}
  */
  getPluginState(callback:Function) {
    BackgroundGeolocation.getState((state:State) => {
      this.pluginState = state;
      callback(state);
    });
  }

  /**
  * Determines if plugin is in location or geofences-only mode
  * @return {Boolean}
  */
  isLocationTrackingMode() {
    return (this.pluginState.trackingMode === 1);
  }

  /**
  * Application settings change handler method used in SettingsView.  This method buffers change-events by 500ms.
  * When the buffer timer expires, the change will be persisted in AsyncStorage.
  * NOTE:  This is only for "application" settings -- not BackgroundGeolocation settings.
  * @param {Object} setting
  * @param {Mixed} value
  */
  onChange(setting:any, value:any) {
    if (typeof(setting) === 'string') {
      let name = setting;
      setting = APP_SETTINGS.find((item:any) => {
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

  /**
  * Sets and persists a single Application setting
  * @param {String} name
  * @param {Mixed} value
  */
  set(name:string, value:any) {
    if (this.applicationState[name] === value) {
      // No change.  Ignore
      return;
    }
    this.applicationState[name] = value;
    this._saveState();
  }

  /**
  * Helper method to show a confirmation dialog
  * @param {String} title
  * @param {String} message
  * @param {Function} callback
  */
  confirm(title:string, message:string, callback:any) {
    // Works on both iOS and Android
    Alert.alert(title, message, [
      {text: 'Cancel', onPress: () => {}},
      {text: 'OK', onPress: callback},
    ], { cancelable: false });
  }

  /**
  * Helper method to show a [YES] [NO] dialog
  * @param {String} title
  * @param {String} message
  * @param {Function} yesFn Called when user clicks [YES] button
  * @param {Function} noFn Called when user clicks [NO] button
  */
  yesNo(title:string, message:string, yesFn:any, noFn:Function) {
    Alert.alert(title, message, [
      {text: 'No', onPress: noFn},
      {text: 'Yes', onPress: yesFn},
    ], { cancelable: false });
  }
  /**
  * Show a toast message
  * @param {String} message
  * @param {String} duration LONG|SHORT
  */
  toast(message:string, duration?:string) {
    duration = duration || 'LONG';
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
  generateSchedule(count:number, delay:number, duration:number, interval:number) {
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

  /**
  * Returns lists of available values for geofence radius select box in Views
  * @return {Array}
  */
  getRadiusOptions() {
    return GEOFENCE_RADIUS_OPTIONS;
  }

  /**
  * Returns list of available values for loiteringDelay select box in Views
  * @return {Array}
  */
  getLoiteringDelayOptions() {
    return GEOFENCE_LOITERING_DELAY_OPTIONS;
  }

  /**
  * Returns an array of test-geofences suitable for sending to BackgroundGeolocation#addGeofences
  * @param {String} route name
  * @param {Function} callback
  * @return {Array}
  */
  getTestGeofences(route:string, config:any) {
    var data = this.getCityDriveData();
    var geofences:Geofence[] = [];
    for (var n=0, len=data.length;n<len;n++) {
      geofences.push({
        identifier: 'city_drive_' + (++geofenceNextId),
        extras: {
          "geofence_extra_foo": "extra geofence data"
        },
        latitude: data[n].lat,
        longitude: data[n].lng,
        radius: config.radius,
        notifyOnEntry: config.notifyOnEntry,
        notifyOnExit: config.notifyOnExit,
        notifyOnDwell: config.notifyOnDwell,
        loiteringDelay: config.loiteringDelay
      });
    }
    return geofences;
  }

  /**
  * My private test config.
  * DO NOT USE
  * @private
  */
  async applyTestConfig() {
    let geofences = [{
      "identifier": "[RN] Home",
      "radius": 200,
      "latitude": 45.5192534,
      "longitude": -73.6169719,
      "notifyOnEntry": true,
      "notifyOnExit": true,
      "notifyOnDwell": true,
      "loiteringDelay": 10000,
      "extras": {
        "radius": 200,
        "center": {
          "latitude": 45.5192534,
          "longitude": -73.6169719
        }
      }
    }, {
      "identifier": "[RN] Jfk",
      "radius": 200,
      "latitude": 45.52193435702239,
      "longitude": -73.61602026242679,
      "notifyOnEntry": true,
      "notifyOnExit": true,
      "notifyOnDwell": true,
      "loiteringDelay": 10000,
      "extras": {
        "radius": 200,
        "center": {
          "latitude": 45.52193435702239,
          "longitude": -73.61602026242679
        }
      }
    }, {
      "identifier": "[RN] Laj",
      "radius": 200,
      "latitude": 45.52011166353691,
      "longitude": -73.61188565687189,
      "notifyOnEntry": true,
      "notifyOnExit": true,
      "notifyOnDwell": true,
      "loiteringDelay": 10000,
      "extras": {
        "radius": 200,
        "center": {
          "latitude": 45.52011166353691,
          "longitude": -73.61188565687189
        }
      }
    }, {
      "identifier": "[RN] Bernard",
      "radius": 200,
      "latitude": 45.51890341224348,
      "longitude": -73.60920346871359,
      "notifyOnEntry": true,
      "notifyOnExit": true,
      "notifyOnDwell": true,
      "loiteringDelay": 10000,
      "extras": {
        "radius": 200,
        "center": {
          "latitude": 45.51890341224348,
          "longitude": -73.60920346871359
        }
      }
    }, {
      "identifier": "[RN] Park",
      "radius": 200,
      "latitude": 45.51793055832324,
      "longitude": -73.60288022069346,
      "notifyOnEntry": true,
      "notifyOnExit": true,
      "notifyOnDwell": true,
      "loiteringDelay": 10000,
      "extras": {
        "radius": 200,
        "center": {
          "latitude": 45.51793055832324,
          "longitude": -73.60288022069346
        }
      }
    }, {
      "identifier": "[RN] Dollard",
      "radius": 200,
      "latitude": 45.51722612373795,
      "longitude": -73.61367125021673,
      "notifyOnEntry": true,
      "notifyOnExit": true,
      "notifyOnDwell": true,
      "loiteringDelay": 10000,
      "extras": {
        "radius": 200,
        "center": {
          "latitude": 45.51722612373795,
          "longitude": -73.61367125021673
        }
      }
    }];

    await BackgroundGeolocation.removeGeofences();
    await BackgroundGeolocation.addGeofences(geofences);
    await BackgroundGeolocation.resetOdometer();

    await BackgroundGeolocation.setConfig({
      debug: true,
      logLevel: BackgroundGeolocation.LOG_LEVEL_VERBOSE,
      desiredAccuracy: BackgroundGeolocation.DESIRED_ACCURACY_HIGH,
      distanceFilter: 50,
      disableElasticity: false,
      locationUpdateInterval: 1000,
      fastestLocationUpdateInterval: -1,
      stopTimeout: 1,
      schedule: [
        //'2-6 09:00-17:00'
      ],
      scheduleUseAlarmManager: true,
      url: 'http://tracker.transistorsoft.com/locations/' + this.username,
      params: BackgroundGeolocation.transistorTrackerParams(DeviceInfo),
      maxDaysToPersist: 14,
      geofenceModeHighAccuracy: true,
      stopOnTerminate: false,
      startOnBoot: true,
      enableHeadless: true,
      heartbeatInterval: -1
    });
    await BackgroundGeolocation.stopSchedule();
  }

  /**
  * Helper method to play a UI sound via BackgroundGeolocation#playSound
  * @param {String/Number} name/soundId
  */
  playSound(name:any) {
    var soundId = 0;

    if (typeof(name) === 'string') {
      soundId = SOUND_MAP[this.platform][name];
    } else if (typeof(name) === 'number') {
      soundId = name;
    }
    if (!soundId) {
      alert('Invalid sound id provided to BGService#playSound' + name);
      return;
    }
    BackgroundGeolocation.playSound(soundId);
  }

  /**
  * Returns an array of locations for iOS Simulator City Drive Route
  * @return {Array}
  */
  getCityDriveData() {
    return [{"lat":37.33527476,"lng":-122.03254703},{"lat":37.33500926,"lng":-122.03272188},{"lat":37.33467638,"lng":-122.03432425},{"lat":37.33453849,"lng":-122.03695223},{"lat":37.33447068,"lng":-122.04007348},{"lat":37.33446146,"lng":-122.04380955},{"lat":37.33426985,"lng":-122.04751058},{"lat":37.33352458,"lng":-122.05100549},{"lat":37.33275353,"lng":-122.05462472},{"lat":37.33228724,"lng":-122.05833354},{"lat":37.33307736,"lng":-122.06203541},{"lat":37.33422447,"lng":-122.06562781},{"lat":37.33435661,"lng":-122.06939204},{"lat":37.33369775,"lng":-122.07309474},{"lat":37.33368006,"lng":-122.07665613},{"lat":37.33492184,"lng":-122.07997503},{"lat":37.3370055,"lng":-122.0827595},{"lat":37.33879885,"lng":-122.08577472},{"lat":37.34046597,"lng":-122.08886286},{"lat":37.34208941,"lng":-122.09195687},{"lat":37.34415677,"lng":-122.09439031},{"lat":37.34576798,"lng":-122.09727888},{"lat":37.34719244,"lng":-122.1006624},{"lat":37.34894824,"lng":-122.1036539},{"lat":37.35145376,"lng":-122.10569934},{"lat":37.35357644,"lng":-122.10818206},{"lat":37.35478615,"lng":-122.11144128},{"lat":37.35583234,"lng":-122.11484701},{"lat":37.35772158,"lng":-122.11764607},{"lat":37.36040727,"lng":-122.11952001},{"lat":37.36303768,"lng":-122.12160442},{"lat":37.36457081,"lng":-122.12476867},{"lat":37.36489536,"lng":-122.12851823},{"lat":37.36543834,"lng":-122.13217241},{"lat":37.3664761,"lng":-122.13564763},{"lat":37.36776176,"lng":-122.13898061},{"lat":37.36994839,"lng":-122.1416339},{"lat":37.37240005,"lng":-122.14386038},{"lat":37.37481249,"lng":-122.14611939},{"lat":37.37709618,"lng":-122.14869624},{"lat":37.37961188,"lng":-122.15082139},{"lat":37.3826398,"lng":-122.15178036},{"lat":37.38560981,"lng":-122.15272559},{"lat":37.38774539,"lng":-122.15510789},{"lat":37.38869141,"lng":-122.15849049},{"lat":37.38931302,"lng":-122.16207476},{"lat":37.39081987,"lng":-122.1652427},{"lat":37.39210109,"lng":-122.16863067},{"lat":37.39242056,"lng":-122.17227965},{"lat":37.39361482,"lng":-122.17556879},{"lat":37.39578711,"lng":-122.17805511},{"lat":37.39821434,"lng":-122.18044236},{"lat":37.40071157,"lng":-122.18290622},{"lat":37.40313012,"lng":-122.18535374},{"lat":37.40549529,"lng":-122.18774837},{"lat":37.40759705,"lng":-122.19035128},{"lat":37.40890928,"lng":-122.19364872},{"lat":37.41002813,"lng":-122.19717013},{"lat":37.4111682,"lng":-122.20078524},{"lat":37.41233794,"lng":-122.20442475},{"lat":37.41363889,"lng":-122.20791833},{"lat":37.41583072,"lng":-122.2106204},{"lat":37.41782917,"lng":-122.21338064},{"lat":37.41872658,"lng":-122.21683566},{"lat":37.41935866,"lng":-122.22058933},{"lat":37.4209964,"lng":-122.22388736},{"lat":37.42303224,"lng":-122.22680837},{"lat":37.42510651,"lng":-122.22979057},{"lat":37.42738525,"lng":-122.23260102},{"lat":37.42942843,"lng":-122.23549663},{"lat":37.4313864,"lng":-122.23829728},{"lat":37.43354365,"lng":-122.24095367},{"lat":37.4357105,"lng":-122.24350931},{"lat":37.4378918,"lng":-122.24613695},{"lat":37.44000262,"lng":-122.24876996},{"lat":37.44207177,"lng":-122.25146784},{"lat":37.44364246,"lng":-122.25458952},{"lat":37.44423451,"lng":-122.25815644},{"lat":37.44401797,"lng":-122.26182293},{"lat":37.44381697,"lng":-122.26544651},{"lat":37.4444387,"lng":-122.26900388},{"lat":37.44598499,"lng":-122.27225807},{"lat":37.44805758,"lng":-122.27523289},{"lat":37.45014137,"lng":-122.27827786},{"lat":37.45213903,"lng":-122.28131706},{"lat":37.45408782,"lng":-122.28428358},{"lat":37.45607437,"lng":-122.28728422},{"lat":37.45855399,"lng":-122.28964389},{"lat":37.46150337,"lng":-122.29066665},{"lat":37.46449927,"lng":-122.29080537},{"lat":37.46741706,"lng":-122.29164222},{"lat":37.47004943,"lng":-122.29347317},{"lat":37.4724045,"lng":-122.29584441},{"lat":37.47484795,"lng":-122.29807718},{"lat":37.47775391,"lng":-122.29919189},{"lat":37.48081016,"lng":-122.29901151},{"lat":37.48386847,"lng":-122.29850608},{"lat":37.4868127,"lng":-122.2981216},{"lat":37.48974125,"lng":-122.29883038},{"lat":37.49226793,"lng":-122.30073474},{"lat":37.49413538,"lng":-122.3036213},{"lat":37.4951695,"lng":-122.30711999},{"lat":37.49605031,"lng":-122.31058583},{"lat":37.49739544,"lng":-122.3138981},{"lat":37.49913263,"lng":-122.31702405},{"lat":37.50040366,"lng":-122.32036315},{"lat":37.50083658,"lng":-122.32388539},{"lat":37.50117039,"lng":-122.32749548},{"lat":37.50237035,"lng":-122.33083005},{"lat":37.50420426,"lng":-122.33381577},{"lat":37.50606869,"lng":-122.33688933},{"lat":37.50799594,"lng":-122.34003061},{"lat":37.50988405,"lng":-122.34301482},{"lat":37.51203087,"lng":-122.34564414},{"lat":37.51425798,"lng":-122.34819157},{"lat":37.51644813,"lng":-122.35068376},{"lat":37.51869146,"lng":-122.35307638},{"lat":37.52133683,"lng":-122.35490229},{"lat":37.52404792,"lng":-122.35651279},{"lat":37.52656144,"lng":-122.35869996},{"lat":37.52949012,"lng":-122.36013184},{"lat":37.53245962,"lng":-122.36139139},{"lat":37.53535502,"lng":-122.36269562},{"lat":37.53806531,"lng":-122.36427066},{"lat":37.54071957,"lng":-122.36586045},{"lat":37.54319399,"lng":-122.36775116},{"lat":37.54551481,"lng":-122.37012089},{"lat":37.54781925,"lng":-122.37250714},{"lat":37.55009393,"lng":-122.37486312},{"lat":37.55254949,"lng":-122.37717024},{"lat":37.55541199,"lng":-122.37918458},{"lat":37.55818716,"lng":-122.38106338},{"lat":37.56068828,"lng":-122.38341593},{"lat":37.56314841,"lng":-122.38588298},{"lat":37.56541169,"lng":-122.38835698},{"lat":37.56674169,"lng":-122.39169239},{"lat":37.5685417,"lng":-122.39470024},{"lat":37.57095669,"lng":-122.39698791},{"lat":37.57337626,"lng":-122.39928572},{"lat":37.57613294,"lng":-122.40094584},{"lat":37.57901078,"lng":-122.4022173},{"lat":37.58156135,"lng":-122.40405955},{"lat":37.58410689,"lng":-122.40616551},{"lat":37.58628103,"lng":-122.40888284},{"lat":37.58845823,"lng":-122.41162422},{"lat":37.59089234,"lng":-122.41402865},{"lat":37.5933155,"lng":-122.41641054},{"lat":37.59572459,"lng":-122.41875689},{"lat":37.59795493,"lng":-122.42134262},{"lat":37.60011457,"lng":-122.42399767},{"lat":37.60240224,"lng":-122.4265399},{"lat":37.60520008,"lng":-122.42789551},{"lat":37.60813618,"lng":-122.42777573},{"lat":37.61097345,"lng":-122.42659053},{"lat":37.61359414,"lng":-122.42477627},{"lat":37.61652164,"lng":-122.42409633},{"lat":37.61941491,"lng":-122.42515597},{"lat":37.62223282,"lng":-122.42696981},{"lat":37.62499411,"lng":-122.42876044},{"lat":37.62751237,"lng":-122.43105867},{"lat":37.62961128,"lng":-122.43380726},{"lat":37.63173002,"lng":-122.43652912},{"lat":37.63434333,"lng":-122.43855737},{"lat":37.63721702,"lng":-122.43994642},{"lat":37.63973671,"lng":-122.44194609},{"lat":37.64209642,"lng":-122.44410611},{"lat":37.6439212,"lng":-122.44706014},{"lat":37.64593185,"lng":-122.44975467},{"lat":37.64856629,"lng":-122.45139107},{"lat":37.65116761,"lng":-122.45299486},{"lat":37.65334007,"lng":-122.45534515},{"lat":37.65538199,"lng":-122.45796869},{"lat":37.65749297,"lng":-122.4606685},{"lat":37.6595944,"lng":-122.46334517},{"lat":37.66213336,"lng":-122.46529514},{"lat":37.66513186,"lng":-122.46553863},{"lat":37.6681835,"lng":-122.46560385},{"lat":37.67115958,"lng":-122.46650842},{"lat":37.6737871,"lng":-122.46830709},{"lat":37.67626076,"lng":-122.47032856},{"lat":37.67888283,"lng":-122.47161778},{"lat":37.681853,"lng":-122.47152482},{"lat":37.6847816,"lng":-122.47134126},{"lat":37.6876731,"lng":-122.47090381},{"lat":37.69061264,"lng":-122.47027005},{"lat":37.69348641,"lng":-122.47026259},{"lat":37.69632218,"lng":-122.47076182},{"lat":37.69914914,"lng":-122.47129566},{"lat":37.70201202,"lng":-122.47133229},{"lat":37.70486296,"lng":-122.47116624},{"lat":37.70741441,"lng":-122.4695213},{"lat":37.70957963,"lng":-122.46701645},{"lat":37.71043642,"lng":-122.46355472},{"lat":37.71046027,"lng":-122.45988294},{"lat":37.71069928,"lng":-122.45637822},{"lat":37.71224348,"lng":-122.45340591},{"lat":37.71448702,"lng":-122.45078271},{"lat":37.71693873,"lng":-122.44871305},{"lat":37.71990228,"lng":-122.44822204},{"lat":37.72291888,"lng":-122.44775048},{"lat":37.72576768,"lng":-122.44632572},{"lat":37.72805372,"lng":-122.44386563},{"lat":37.72953195,"lng":-122.44070582},{"lat":37.7307498,"lng":-122.43723772},{"lat":37.73174796,"lng":-122.43356938},{"lat":37.73216621,"lng":-122.42992443},{"lat":37.73150681,"lng":-122.42617839},{"lat":37.73152823,"lng":-122.42250586},{"lat":37.73190474,"lng":-122.4188029},{"lat":37.73208047,"lng":-122.4151556},{"lat":37.73335846,"lng":-122.41185347},{"lat":37.73467442,"lng":-122.40896246},{"lat":37.7367644,"lng":-122.40753804},{"lat":37.73918836,"lng":-122.40786326},{"lat":37.74134411,"lng":-122.40745439},{"lat":37.7433128,"lng":-122.40606023},{"lat":37.7454038,"lng":-122.40480714},{"lat":37.74791032,"lng":-122.40401446},{"lat":37.75036492,"lng":-122.40324249},{"lat":37.7530224,"lng":-122.40280453},{"lat":37.75548823,"lng":-122.40305884},{"lat":37.75750915,"lng":-122.40390315},{"lat":37.75912761,"lng":-122.40587398},{"lat":37.76147723,"lng":-122.40613148}];
  }

  /**
  * Returns the default application-settings {}
  * @return {Object}
  */
  _getDefaultState() {
    let state:any = {};
    APP_SETTINGS.forEach((setting:any) => {
      state[setting.name] = setting.defaultValue;
    });
    return state;
  }

  /**
  * Load the application-settings from AsyncStorage
  * @param {Function} callback
  */
  _loadApplicationState(callback?:Function) {
    AsyncStorage.getItem(STORAGE_KEY + ":settings", (err, value) => {
      if (value) {
        this.applicationState = JSON.parse(value);
      } else {
        this.applicationState = this._getDefaultState();
        this._saveState();
      }

      if (callback) {
        callback(this.applicationState);
      }
    });
  }

  /**
  * Persist the application settings to AsyncStorage
  */
  _saveState() {
    AsyncStorage.setItem(STORAGE_KEY + ":settings", JSON.stringify(this.applicationState, null));
  }
}
