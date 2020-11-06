
import React from 'react'
import {Component} from 'react';

import isEqual from 'lodash.isequal'

import {
  Platform,
  StyleSheet,
  TouchableHighlight,
  View,
  Alert,
  AppState
} from 'react-native';

import AsyncStorage from '@react-native-community/async-storage';

import ActionButton from 'react-native-action-button';

// Import native-base UI components
import {
  Container,
  Button, Icon,
  Text,
  Header, Footer, Title,
  Content,
  Left, Body, Right,
  Switch,
  Spinner
} from '@codler/native-base';

////
// Import BackgroundGeolocation plugin
// Note: normally you will not specify a relative url ../ here.  I do this in the sample app
// because the plugin can be installed from 2 sources:
//
// 1.  npm:  react-native-background-geolocation
// 2.  private github repo (customers only):  react-native-background-geolocation-android
//
// This simply allows one to change the import in a single file.
import BackgroundGeolocation, {
  State,
  Location,
  LocationError,
  Geofence,
  HttpEvent,
  MotionActivityEvent,
  ProviderChangeEvent,
  MotionChangeEvent,
  GeofenceEvent,
  GeofencesChangeEvent,
  HeartbeatEvent,
  ConnectivityChangeEvent,
  DeviceSettings,
  DeviceSettingsRequest,
  Notification,
  Authorization,
  TransistorAuthorizationToken
} from '../react-native-background-geolocation';

import BackgroundFetch from "react-native-background-fetch";

import Moment from 'moment';

// react-native-maps
import MapView, {Marker, Polyline, Circle} from 'react-native-maps';

const LATITUDE_DELTA = 0.00922;
const LONGITUDE_DELTA = 0.00421;

import Util from '../lib/Util';
import {registerTransistorAuthorizationListener} from '../lib/Authorization';
import ENV from '../ENV';

import {COLORS, SOUNDS} from './lib/config';
import SettingsView from './SettingsView';
import SettingsService from './lib/SettingsService';

const STATIONARY_REGION_FILL_COLOR = "rgba(200,0,0,0.2)"
const STATIONARY_REGION_STROKE_COLOR = "rgba(200,0,0,0.2)"
const GEOFENCE_STROKE_COLOR = "rgba(17,183,0,0.5)"
const GEOFENCE_FILL_COLOR   ="rgba(17,183,0,0.2)"
const GEOFENCE_STROKE_COLOR_ACTIVATED = "rgba(127,127,127,0.5)";
const GEOFENCE_FILL_COLOR_ACTIVATED = "rgba(127,127,127, 0.2)";
const POLYLINE_STROKE_COLOR = "rgba(32,64,255,0.6)";

// FAB button / map-menu position is tricky per platform / device.
let ACTION_BUTTON_OFFSET_Y  = 70;
if (Platform.OS == 'android') {
  ACTION_BUTTON_OFFSET_Y = 65;
} /*else if (DeviceInfo.getModel() === 'iPhone X') {
  ACTION_BUTTON_OFFSET_Y = 95;
}
*/

type IProps = {
  navigation: any;
}
type IState = {
  appState: any,
  username?: string;
  enabled?: boolean;
  isMoving?: boolean;
  isMainMenuOpen?: boolean;
  isSyncing?: boolean;
  isEmailingLog?: boolean;
  isDestroyingLocations?: boolean;
  isPressingOnMap?: boolean;
  isResettingOdometer?: boolean;
  mapScrollEnabled?: boolean,
  showsUserLocation?: boolean,
  followsUserLocation?: boolean,
  tracksViewChanges?: boolean,
  motionActivity: MotionActivityEvent;
  odometer?: string;
  centerCoordinate?: any;
  stationaryLocation?: any;
  stationaryRadius?: number;
  markers?: any;
  stopZones?: any;
  geofences?: any;
  geofencesHit?: any;
  geofencesHitEvents?: any;
  coordinates?: any,
  // Application settings
  settings?: any,
  // BackgroundGeolocation state
  bgGeo: State
}

export default class HomeView extends Component<IProps, IState> {
  private lastMotionChangeLocation?:Location;
  private settingsService:SettingsService;

  private testModeClicks:number;
  private testModeTimer?:any;

  constructor(props:any) {
    super(props);

    this.state = {
      appState: AppState.currentState,
      enabled: false,
      isMoving: false,
      motionActivity: {activity: 'unknown', confidence: 100},
      odometer: '0.0',
      username: props.navigation.state.params.username,
      // ActionButton state
      isMainMenuOpen: true,
      isSyncing: false,
      isEmailingLog: false,
      isDestroyingLocations: false,
      tracksViewChanges: true,
      // Map state
      centerCoordinate: {
        latitude: 0,
        longitude: 0
      },
      isPressingOnMap: false,
      mapScrollEnabled: false,
      showsUserLocation: false,
      followsUserLocation: false,
      isResettingOdometer: false,
      stationaryLocation: {timestamp: '',latitude:0,longitude:0},
      stationaryRadius: 0,
      markers: [],
      stopZones: [],
      geofences: [],
      geofencesHit: [],
      geofencesHitEvents: [],
      coordinates: [],
      // Application settings
      settings: {},
      // BackgroundGeolocation state
      bgGeo: {didLaunchInBackground: false, enabled: false, schedulerEnabled: false, trackingMode: 1, odometer: 0},
    };

    this.settingsService = SettingsService.getInstance();
    this.settingsService.setUsername(this.state.username);

    this.testModeClicks = 0;
    this.testModeTimer = 0;
  }

  componentDidMount() {
    // Configure BackgroundGeolocation
    this.configureBackgroundGeolocation();

    // [Optional] Configure BackgroundFetch
    this.configureBackgroundFetch();

    AppState.addEventListener('change', this._handleAppStateChange);

    // Fetch current app settings state.
    this.settingsService.getApplicationState((state:any) => {
      this.setState({
        settings: state
      });
    });

    // Nothing to see here -- just demo app boilerplace authorization handling with Demo server.
    registerTransistorAuthorizationListener(this.props.navigation);
  }

  componentWillUnmount() {
    AppState.removeEventListener('change', this._handleAppStateChange);
    // It's a good idea to #removeListeners when your component is unmounted, especially when hot-relaoding
    // Otherwise, you'll accumulate event-listeners.
    BackgroundGeolocation.removeListeners();
  }

  UNSAFE_componentWillReceiveProps(nextProps: any) {
    if (!isEqual(this.props, nextProps)) {
      this.setState(() => ({
        tracksViewChanges: true,
      }))
    }
  }
  componentDidUpdate() {
    if (this.state.tracksViewChanges) {
      this.setState(() => ({
        tracksViewChanges: false,
      }))
    }
  }

  _handleAppStateChange(state:any) {
    console.log('[handleAppStateChange] ', state);
  }

  async configureBackgroundGeolocation() {
    let orgname = await AsyncStorage.getItem('orgname');
    let username = await AsyncStorage.getItem('username');

    // Sanity check orgname / username.
    if (orgname == null || username == null) return this.onClickHome();

    // Step 1:  Listen to events:
    BackgroundGeolocation.onLocation(this.onLocation.bind(this), this.onLocationError.bind(this));
    BackgroundGeolocation.onMotionChange(this.onMotionChange.bind(this));
    BackgroundGeolocation.onHeartbeat(this.onHeartbeat.bind(this));
    BackgroundGeolocation.onHttp(this.onHttp.bind(this));
    BackgroundGeolocation.onGeofence(this.onGeofence.bind(this));
    BackgroundGeolocation.onSchedule(this.onSchedule.bind(this));
    BackgroundGeolocation.onActivityChange(this.onActivityChange.bind(this));
    BackgroundGeolocation.onProviderChange(this.onProviderChange.bind(this));
    BackgroundGeolocation.onGeofencesChange(this.onGeofencesChange.bind(this));
    BackgroundGeolocation.onPowerSaveChange(this.onPowerSaveChange.bind(this));
    BackgroundGeolocation.onConnectivityChange(this.onConnectivityChange.bind(this));
    BackgroundGeolocation.onEnabledChange(this.onEnabledChange.bind(this));
    BackgroundGeolocation.onNotificationAction(this.onNotificationAction.bind(this));

    // Step 2:  #ready:
    // If you want to override any config options provided by the Settings screen, this is the place to do it, eg:
    // config.stopTimeout = 5;
    //

    // Special token to automatically authenticate with Demo server.
    let token = await BackgroundGeolocation.findOrCreateTransistorAuthorizationToken(
      orgname,
      username,
      ENV.TRACKER_HOST
    );

    BackgroundGeolocation.ready({
      transistorAuthorizationToken: token,
      reset: false,
      desiredAccuracy: BackgroundGeolocation.DESIRED_ACCURACY_NAVIGATION,
      distanceFilter: 10,
      locationAuthorizationRequest: 'Always',
      backgroundPermissionRationale: {
        title: "Allow {applicationName} to access this device's location even when closed or not in use.",
        message: "This app collects location data to enable recording your trips to work and calculate distance-travelled.",
        positiveAction: 'Change to "{backgroundPermissionOptionLabel}"',
        negativeAction: 'Cancel'
      },
      stopTimeout: 5,
      debug: true,
      logLevel: BackgroundGeolocation.LOG_LEVEL_VERBOSE,
      autoSync: true,
      stopOnTerminate: false,
      startOnBoot: true,
      enableHeadless: true,
      maxDaysToPersist: 14
    }, (state:State) => {
      console.log('- state: ', state);
      if (state.schedule && state.schedule.length > 0) {
        BackgroundGeolocation.startSchedule();
      }
      this.setState({
        enabled: state.enabled,
        isMoving: state.isMoving,
        followsUserLocation: state.enabled,
        showsUserLocation: state.enabled,
        bgGeo: state
      });
    }, (error:string) => {
      console.warn('BackgroundGeolocation error: ', error)
    });
  }

  configureBackgroundFetch() {
    // [Optional] Configure BackgroundFetch.
    BackgroundFetch.configure({
      minimumFetchInterval: 15, // <-- minutes (15 is minimum allowed)
      stopOnTerminate: false, // <-- Android-only,
      startOnBoot: true, // <-- Android-only
      enableHeadless: true,
      requiresCharging: false,
      requiredNetworkType: BackgroundFetch.NETWORK_TYPE_NONE,
      requiresDeviceIdle: false,
      requiresBatteryNotLow: false,
      requiresStorageNotLow: false
    }, async (taskId) => {
      console.log('[BackgroundFetch event]:', taskId);
      // One could optionally request a location here with #getCurrentPosition
      //
      //let location = await BackgroundGeolocation.getCurrentPosition({persist: true, samples:1, extras: {'context': 'background-fetch-position'}});
      //console.log('- BackgroundFetch current position: ', location);
      BackgroundFetch.finish(taskId);
    }, (error) => {
      console.log('[js] RNBackgroundFetch failed to start')
    });
  }

  /**
  * @event location
  */
  onLocation(location:Location) {
    console.log('[location] - ', location);

    if (!location.sample) {
      this.addMarker(location);
      this.setState({
        odometer: (location.odometer/1000).toFixed(1)
      });
    }
    this.setCenter(location);
  }

  /**
  * @event location error
  */
  onLocationError(errorCode:LocationError) {
    console.log('[location] ERROR - ', errorCode);
  }

  /**
  * @event motionchange
  */
  onMotionChange(event:MotionChangeEvent) {
    console.log('[motionchange] - ', event.isMoving, event.location);
    let location = event.location;

    let state:any = {
      isMoving: event.isMoving
    };
    if (event.isMoving) {
      if (this.lastMotionChangeLocation) {
        state.stopZones = [...this.state.stopZones, {
          coordinate: {
            latitude: this.lastMotionChangeLocation.coords.latitude,
            longitude: this.lastMotionChangeLocation.coords.longitude
          },
          key: this.lastMotionChangeLocation.timestamp
        }];
      }
      state.stationaryRadius = 0,
      state.stationaryLocation = {
        timestamp: '',
        latitude: 0,
        longitude: 0
      };
    } else {
      let geofenceProximityRadius = this.state.bgGeo.geofenceProximityRadius || 1000;
      state.stationaryRadius = (this.state.bgGeo.trackingMode == 1) ? 200 : (geofenceProximityRadius/2);
      state.stationaryLocation = {
        timestamp: location.timestamp,
        latitude: location.coords.latitude,
        longitude: location.coords.longitude
      };
    }
    this.setState(state);
    this.lastMotionChangeLocation = location;
  }
  /**
  * @event activitychange
  */
  onActivityChange(event:MotionActivityEvent) {
    console.log('[activitychange] - ', event);
    this.setState({
      motionActivity: event
    });
  }
  /**
  * @event heartbeat
  */
  onHeartbeat(params:HeartbeatEvent) {
    console.log("[heartbeat] - ", params.location);
  }

  /**
  * @event providerchange
  */
  onProviderChange(event:ProviderChangeEvent) {
    console.log('[providerchange] - ', event);
    // [iOS 14+] Request temporaryFullAccuracy if not authorized.
    if (this.state.enabled && (event.accuracyAuthorization == BackgroundGeolocation.ACCURACY_AUTHORIZATION_REDUCED)) {
      BackgroundGeolocation.requestTemporaryFullAccuracy("DemoPurpose").then((accuracyAuthorization) => {
        console.log('[requestTemporaryFullAccuracy]: ', accuracyAuthorization);
      }).catch((error) => {
        console.log('[requestTemporaryFullAccuracy] ERROR: ', error);
      });
    }
  }

  /**
  * @event http
  */
  onHttp(response:HttpEvent) {
    console.log('[http] - ', JSON.stringify(response));
  }
  /**
  * @event geofenceschange
  */
  onGeofencesChange(event:GeofencesChangeEvent) {
    var on  = event.on;
    var off = event.off;
    var geofences  = this.state.geofences || [];

    // Filter out all "off" geofences.
    geofences = geofences.filter(function(geofence:Geofence) {
      return off.indexOf(geofence.identifier) < 0;
    });

    console.log('[geofenceschange] - ', event);
    // Add new "on" geofences.
    on.forEach((geofence:Geofence) => {
      var marker = geofences.find(function(m:Geofence) { return m.identifier === geofence.identifier;});
      if (marker) { return; }
      geofences.push(this.createGeofenceMarker(geofence));
    });

    this.setState({
      geofences: geofences
    });
  }
  /**
  * @event geofence
  */
  onGeofence(event:GeofenceEvent) {
    console.log('[geofence] - ', event);
    let location:Location = event.location;
    let geofences = this.state.geofences || [];
    var marker = geofences.find((m:any) => {
      return m.identifier === event.identifier;
    });
    if (!marker) { return; }

    marker.fillColor = GEOFENCE_STROKE_COLOR_ACTIVATED;
    marker.strokeColor = GEOFENCE_STROKE_COLOR_ACTIVATED;

    let coords = location.coords;

    let geofencesHit = this.state.geofencesHit || [];
    let hit = geofencesHit.find((hit:any) => {
      return hit.identifier === event.identifier;
    });

    if (!hit) {
      hit = {
        identifier: event.identifier,
        radius: marker.radius,
        center: {
          latitude: marker.center.latitude,
          longitude: marker.center.longitude
        },
        events: []
      };
      this.setState({
        geofencesHit: [...this.state.geofencesHit, hit]
      });
    }
    // Get bearing of location relative to geofence center.
    let bearing = this.getBearing(marker.center, location.coords);
    let edgeCoordinate = this.computeOffsetCoordinate(marker.center, marker.radius, bearing);
    let record = {
      coordinates: [
        edgeCoordinate,
        {latitude: coords.latitude, longitude: coords.longitude},
      ],
      action: event.action,
      key: event.identifier + ":" + event.action + ":" + location.timestamp
    };
    this.setState({
      geofencesHitEvents: [...this.state.geofencesHitEvents, record]
    });
  }
  /**
  * @event schedule
  */
  onSchedule(state:State) {
    console.log("[schedule] - ", state.enabled, state);
    this.setState({
      enabled: state.enabled
    });
  }
  /**
  * @event powersavechange
  */
  onPowerSaveChange(isPowerSaveMode:boolean) {
    console.log('[powersavechange] - ', isPowerSaveMode);
  }
  /**
  * @event connectivitychange
  */
  onConnectivityChange(event:ConnectivityChangeEvent) {
    console.log('[connectivitychange] - ', event);
    this.settingsService.toast('[connectivitychange] - ' + event.connected);
  }
  /**
  * @event enabledchange
  */
  onEnabledChange(enabled:boolean) {
    console.log('[enabledchange] - ', enabled);
    this.settingsService.toast('[enabledchange] - ' + enabled);
  }
  /**
  * @event notificationaction
  */
  onNotificationAction(buttonId:string) {
    console.log('[notificationaction] - ', buttonId);
    switch(buttonId) {
      case 'notificationActionFoo':
        break;
      case 'notificationActionBar':
        break;
    }
  }
  /**
  * Toggle button handler to #start / #stop the plugin
  */
  async onToggleEnabled() {
    this.settingsService.playSound('BUTTON_CLICK');

    let enabled = !this.state.enabled;

    this.setState({
      enabled: enabled,
      isMoving: false,
      showsUserLocation: false,
      followsUserLocation: false
    });

    if (enabled) {
      let state = await BackgroundGeolocation.getState();
      let startMethod = (state.trackingMode) ? 'start' : 'startGeofences';

      let onSuccess = (state: State) => {
        this.setState({
          showsUserLocation: enabled,
          followsUserLocation: enabled
        });
      };

      if (state.trackingMode) {
        BackgroundGeolocation.start(onSuccess);
      } else {
        BackgroundGeolocation.startGeofences(onSuccess);
      }
    } else {
      await BackgroundGeolocation.stop();

      // Clear markers, polyline, geofences, stationary-region
      this.clearMarkers();
      this.setState({
        stationaryRadius: 0,
        stationaryLocation: {
          timestamp: '',
          latitude: 0,
          longitude: 0
        }
      });
    }
  }

  /**
  * get current position button handler
  */
  onClickGetCurrentPosition() {
    this.settingsService.playSound('BUTTON_CLICK');

    // When getCurrentPosition button is pressed, enable followsUserLocation
    // PanDrag will disable it.
    this.setState({
      followsUserLocation: true
    });

    BackgroundGeolocation.getCurrentPosition({
      persist: true,
      samples: 1,
      timeout: 30,
      extras: {
        getCurrentPosition: true
      }
    }).then((location:Location) => {
      console.log('[getCurrentPosition] success: ', location);
    }).catch((error:LocationError) => {
      console.warn('[getCurrentPosition] error: ', error);
    });
  }

  /**
  * [>] / [||] button executes #changePace
  */
  onClickChangePace() {
    console.log('- onClickChangePace');
    let isMoving = !this.state.isMoving;
    this.setState({isMoving: isMoving});
    BackgroundGeolocation.changePace(isMoving);
  }

  onClickHome() {
    this.settingsService.playSound('BUTTON_CLICK');
    Util.navigateHome(this.props.navigation);
  }

  /**
  * FAB button show/hide handler
  */
  async onClickMainMenu(){
    let soundId = (this.state.isMainMenuOpen) ? 'CLOSE' : 'OPEN';

    this.setState({
      isMainMenuOpen: !this.state.isMainMenuOpen
    });
    this.settingsService.playSound(soundId);
  }

  getMainMenuIcon() {
    return <Icon name="ios-add" />
  }
  /**
  * FAB Button command handler
  */
  onSelectMainMenu(command:string) {
    switch(command) {
      case 'settings':
        this.settingsService.playSound('OPEN');
        this.props.navigation.navigate('Settings');
        break;
      case 'resetOdometer':
        this.settingsService.playSound('BUTTON_CLICK');
        this.resetOdometer();
        break;
      case 'emailLog':
        this.settingsService.playSound('BUTTON_CLICK');
        this.emailLog();
        break;
      case 'sync':
        this.settingsService.playSound('BUTTON_CLICK');
        this.sync();
        break;
      case 'destroyLocations':
        this.settingsService.playSound('BUTTON_CLICK');
        this.destroyLocations();
        break;
      case 'requestPermission':
      this.settingsService.playSound('BUTTON_CLICK');
        this.requestPermission();
        break;
    }
  }

  resetOdometer() {
    this.setState({isResettingOdometer: true, odometer: '0.0'});
    BackgroundGeolocation.setOdometer(0).then(location => {
      this.setState({isResettingOdometer: false});
      this.settingsService.toast('Reset odometer success');
    }).catch(error => {
      this.setState({isResettingOdometer: false});
      this.settingsService.toast('Reset odometer failure: ' + error);
    });
  }

  async emailLog() {
    // First fetch the email from settingsService.
    let Logger = BackgroundGeolocation.logger;

    this.settingsService.getEmail((email:string) => {
      if (!email) { return; }  // <-- [Cancel] returns null
      // Confirm email
      this.settingsService.yesNo('Email log', 'Use email address: ' + email + '?', () => {
        // Here we go...
        this.setState({isEmailingLog: true});

        Logger.emailLog(email).then((succes) => {
          console.log('[emailLog] success');
          this.setState({isEmailingLog: false});
        }).catch((error) => {
          this.setState({isEmailingLog: false});
          this.settingsService.toast("Email log failure: " + error);
        });
      }, () => {
        // User said [NO]:  The want to change their email.  Clear it and recursively restart the process.
        this.settingsService.set('email', null);
        this.emailLog();
      });
    });
  }

  async sync() {
    let count = await BackgroundGeolocation.getCount();
    if (!count) {
      this.settingsService.toast('Locations database is empty');
      return;
    }
    this.settingsService.confirm('Confirm Sync', 'Sync ' + count + ' records?', () => {
      this.setState({isSyncing: true});
      BackgroundGeolocation.sync((rs) => {
        this.settingsService.toast('Sync success (' + count + ' records)');
        this.settingsService.playSound('MESSAGE_SENT');
        this.setState({isSyncing: false});
      }, (error:string) => {
        this.settingsService.toast('Sync error: ' + error);
        this.setState({isSyncing: false});
      });
    });
  }

  async destroyLocations() {
    let count = await BackgroundGeolocation.getCount();
    if (!count) {
      this.settingsService.toast('Locations database is empty');
      return;
    }
    this.settingsService.confirm('Confirm Delete', 'Destroy ' + count + ' records?', () => {
      this.setState({isDestroyingLocations: true});
      BackgroundGeolocation.destroyLocations(() => {
        this.setState({isDestroyingLocations: false});
        this.settingsService.toast('Destroyed ' + count + ' records');
      }, (error:string) => {
        this.setState({isDestroyingLocations: false});
        this.settingsService.toast('Destroy locations error: ' + error, 'LONG');
      });
    });
  }

  async requestPermission() {
    let providerState = await BackgroundGeolocation.getProviderState();
    Alert.alert("Request Location Permission", `Current authorization status: ${providerState.status}`, [
      {text: 'When in Use', onPress: () => {this._doRequestPermission('WhenInUse')}},
      {text: 'Always', onPress: () => {this._doRequestPermission('Always')}},
    ], { cancelable: false });
  }

  async _doRequestPermission(request) {
    await BackgroundGeolocation.setConfig({locationAuthorizationRequest: request});
    let status = await BackgroundGeolocation.requestPermission();
    console.log(`[requestPermission] status: ${status}`);

    setTimeout(() => {
      Alert.alert("Request Permission Result", `Authorization status: ${status}`, [
        {text: 'Ok', onPress: () => {}},
      ], { cancelable: false });
    }, 10);
  }

  /**
  * Top-right map menu button-handler
  * [show/hide marker] [show/hide polyline] [show/hide geofence hits]
  */
  onClickMapMenu(command:string) {
    this.settingsService.playSound('BUTTON_CLICK');

    let enabled = !this.state.settings[command];
    this.settingsService.set(command, enabled);

    let settings = Object.assign({}, this.state.settings);
    settings[command] = enabled;

    this.setState({
      settings: settings
    });

    let message = ((enabled) ? 'Hide' : 'Show');
    switch (command) {
      case 'hideMarkers':
        message += ' map markers';
        break;
      case 'hidePolyline':
        message += ' polyline';
        break;
      case 'hideGeofenceHits':
        message += ' geofence transitions';
        break;
    }
    this.settingsService.toast(message, 'SHORT');
  }

  // @private My private test mode.
  // DO NOT USE.
  onClickTestMode() {
    this.testModeClicks++;
    this.settingsService.playSound('TEST_MODE_CLICK');
    if (this.testModeClicks == 10) {
      this.settingsService.playSound('TEST_MODE_SUCCESS');
      SettingsService.getInstance().applyTestConfig();
    }

    if (this.testModeTimer) {
      clearTimeout(this.testModeTimer);
    }
    this.testModeTimer = setTimeout(() => {
      this.testModeClicks = 0;
    }, 2000);
  }
  render() {
    return (
      <Container style={styles.container}>

        <Header style={styles.header}>
          <Left>
            <Button transparent onPress={this.onClickHome.bind(this)}>
              <Icon active name="chevron-back-outline" style={{color: '#000'}}/>
            </Button>
          </Left>
          <Body>
            <Title style={styles.title}>BG Geo</Title>
          </Body>
          <Right>
            <Switch onValueChange={() => this.onToggleEnabled()} value={this.state.enabled} />
          </Right>
        </Header>

        <MapView
          ref="map"
          style={styles.map}
          showsUserLocation={this.state.showsUserLocation}
          followsUserLocation={false}
          onLongPress={this.onLongPress.bind(this)}
          onPanDrag={this.onMapPanDrag.bind(this)}
          scrollEnabled={this.state.mapScrollEnabled}
          showsMyLocationButton={false}
          showsPointsOfInterest={false}
          showsScale={false}
          showsTraffic={false}
          toolbarEnabled={false}>
          <Circle
            key={this.state.stationaryLocation.timestamp}
            radius={this.state.stationaryRadius||200}
            fillColor={STATIONARY_REGION_FILL_COLOR}
            strokeColor={STATIONARY_REGION_STROKE_COLOR}
            strokeWidth={1}
            center={{latitude: this.state.stationaryLocation.latitude, longitude: this.state.stationaryLocation.longitude}}
          />
          <Polyline
            tracksViewChanges={this.state.tracksViewChanges}
            key="polyline"
            coordinates={(!this.state.settings.hidePolyline) ? this.state.coordinates : []}
            geodesic={true}
            strokeColor='rgba(0,179,253, 0.6)'
            strokeWidth={6}
            zIndex={0}
          />
          {this.renderMarkers()}
          {this.renderStopZoneMarkers()}
          {this.renderActiveGeofences()}
          {this.renderGeofencesHit()}
          {this.renderGeofencesHitEvents()}
        </MapView>

        <Footer style={styles.footer}>
          <Left style={{flex:0.3}}>
            <Button info onPress={this.onClickGetCurrentPosition.bind(this)}>
              <Icon active name="md-navigate" style={styles.icon} />
            </Button>
          </Left>
          <Body style={styles.footerBody}>
            <TouchableHighlight onPress={this.onClickTestMode.bind(this)} underlayColor="transparent">
              <Text style={styles.status}>{this.state.motionActivity.activity}:{this.state.motionActivity.confidence}% &middot; {this.state.odometer}km</Text>
            </TouchableHighlight>

          </Body>
          <Right style={{flex: 0.3}}>
            <Button danger={this.state.isMoving}
              success={!this.state.isMoving}
              disabled={!this.state.enabled}
              onPress={this.onClickChangePace.bind(this)}>
              <Icon active name={(this.state.isMoving) ? 'pause' : 'play'} style={styles.icon}/>
            </Button>
          </Right>
        </Footer>

        <ActionButton
          position="right"
          hideShadow={false}
          autoInactive={false}
          active={this.state.isMainMenuOpen}
          backgroundTappable={true}
          onPress={this.onClickMainMenu.bind(this)}
          verticalOrientation="up"
          buttonColor="rgba(254,221,30,1)"
          buttonTextStyle={{color: "#000"}}
          spacing={15}
          offsetX={10}
          offsetY={ACTION_BUTTON_OFFSET_Y}>

          <ActionButton.Item size={40} buttonColor={COLORS.gold} onPress={() => this.onSelectMainMenu('destroyLocations')}>
            {!this.state.isDestroyingLocations ? (<Icon name="ios-trash" style={styles.actionButtonIcon} />) : (<Spinner color="#000" size="small" />)}
          </ActionButton.Item>
          <ActionButton.Item size={40} buttonColor={COLORS.gold} onPress={() => this.onSelectMainMenu('sync')}>
            {!this.state.isSyncing ? (<Icon name="ios-cloud-upload" style={styles.actionButtonIcon} />) : (<Spinner color="#000" size="small" />)}
          </ActionButton.Item>
          <ActionButton.Item size={40} buttonColor={COLORS.gold} onPress={() => this.onSelectMainMenu('emailLog')}>
            {!this.state.isEmailingLog ? (<Icon name="ios-mail" style={styles.actionButtonIcon} />) : (<Spinner color="#000" size="small" />)}
          </ActionButton.Item>
          <ActionButton.Item size={40} buttonColor={COLORS.gold} onPress={() => this.onSelectMainMenu('resetOdometer')}>
            {!this.state.isResettingOdometer ? (<Icon name="ios-speedometer" style={styles.actionButtonIcon} />) : (<Spinner color="#000" size="small" />)}
          </ActionButton.Item>
          <ActionButton.Item size={40} buttonColor={COLORS.gold} onPress={() => this.onSelectMainMenu('requestPermission')}>
            <Icon name="lock-open" style={styles.actionButtonIcon} />
          </ActionButton.Item>
          <ActionButton.Item size={40} buttonColor={COLORS.gold} onPress={() => this.onSelectMainMenu('settings')}>
            <Icon name="ios-cog" style={styles.actionButtonIcon} />
          </ActionButton.Item>
        </ActionButton>

      </Container>
    );
  }
  onPressGeofence() {

  }
  getMotionActivityIcon() {
    let activity = (this.state.motionActivity != null) ? this.state.motionActivity.activity : undefined;
    switch (activity) {
      case 'unknown':
        return 'ios-help-circle';
      case 'still':
        return 'ios-body';
      case 'on_foot':
        return 'ios-walk';
      case 'walking':
        return 'ios-walk';
      case 'running':
        return 'ios-walk';
      case 'in_vehicle':
        return 'ios-car';
      case 'on_bicycle':
        return 'ios-bicycle';
      default:
        return 'ios-help-cirlce';
    }
  }

  renderMarkers() {
    if (this.state.settings.hideMarkers) { return; }
    let rs:any = [];
    this.state.markers.map((marker:any) => {
      rs.push((
        <Marker
          key={marker.key}
          tracksViewChanges={this.state.tracksViewChanges}
          coordinate={marker.coordinate}
          anchor={{x:0, y:0.1}}
          title={marker.title}>
          <View style={[styles.markerIcon]}></View>
        </Marker>
      ));
    });
    return rs;
  }

  renderStopZoneMarkers() {
    return this.state.stopZones.map((stopZone:any) => (
      <Marker
        key={stopZone.key}
        tracksViewChanges={this.state.tracksViewChanges}
        coordinate={stopZone.coordinate}
        anchor={{x:0, y:0}}>
        <View style={[styles.stopZoneMarker]}></View>
      </Marker>
    ));
  }

  renderActiveGeofences() {
    return this.state.geofences.map((geofence:any) => (
      <Circle
        tracksViewChanges={this.state.tracksViewChanges}
        key={geofence.identifier}
        radius={geofence.radius}
        center={geofence.center}
        strokeWidth={1}
        strokeColor={geofence.strokeColor}
        fillColor={geofence.fillColor}
        onPress={this.onPressGeofence}
      />
    ));
  }

  renderGeofencesHit() {
    if (this.state.settings.hideGeofenceHits) { return; }
    let rs = [];
    return this.state.geofencesHit.map((hit:any) => {
      return (
        <Circle
          tracksViewChanges={this.state.tracksViewChanges}
          key={"hit:" + hit.identifier}
          radius={hit.radius+1}
          center={hit.center}
          strokeWidth={1}
          strokeColor={COLORS.black}>
        </Circle>
      );
    });
  }

  renderGeofencesHitEvents() {
    if (this.state.settings.hideGeofenceHits) { return; }
    return this.state.geofencesHitEvents.map((event:any) => {
      let isEnter = (event.action === 'ENTER');
      let color = undefined;
      switch(event.action) {
        case 'ENTER':
          color = COLORS.green;
          break;
        case 'EXIT':
          color = COLORS.red;
          break;
        case 'DWELL':
          color = COLORS.gold;
          break;
      }
      let markerStyle = {
        backgroundColor: color
      };
      return (
        <View key={event.key}>
          <Polyline
            tracksViewChanges={this.state.tracksViewChanges}
            key="polyline"
            coordinates={event.coordinates}
            geodesic={true}
            strokeColor={COLORS.black}
            strokeWidth={1}
            zIndex={1}
            lineCap="square" />
          <Marker
            tracksViewChanges={this.state.tracksViewChanges}
            key="edge_marker"
            coordinate={event.coordinates[0]}
            anchor={{x:0, y:0.1}}>
            <View style={[styles.geofenceHitMarker, markerStyle]}></View>
          </Marker>
          <Marker
            tracksViewChanges={this.state.tracksViewChanges}
            key="location_marker"
            coordinate={event.coordinates[1]}
            anchor={{x:0, y:0.1}}>
            <View style={styles.markerIcon}></View>
          </Marker>
        </View>
      );
    });
  }

  /**
  * Map methods
  */
  setCenter(location:Location) {
    if (!this.refs.map) { return; }
    if (!this.state.followsUserLocation) { return; }

    this.refs.map.animateToRegion({
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      latitudeDelta: LATITUDE_DELTA,
      longitudeDelta: LONGITUDE_DELTA
    });
  }

  addMarker(location:Location) {
    let marker = {
      key: location.uuid,
      title: location.timestamp,
      heading: location.coords.heading,
      coordinate: {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude
      }
    };

    this.setState({
      markers: [...this.state.markers, marker],
      coordinates: [...this.state.coordinates, {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude
      }]
    });
  }

  createGeofenceMarker(geofence:Geofence) {
    return {
      radius: geofence.radius,
      center: {
        latitude: geofence.latitude,
        longitude: geofence.longitude
      },
      identifier: geofence.identifier,
      strokeColor:GEOFENCE_STROKE_COLOR,
      fillColor: GEOFENCE_FILL_COLOR
    }
  }

  onMapPanDrag() {
    this.setState({
      followsUserLocation: false,
      mapScrollEnabled: true
    });
  }

  onLongPress(params:any) {
    var coordinate = params.nativeEvent.coordinate;
    this.settingsService.playSound('LONG_PRESS_ACTIVATE');
    this.props.navigation.navigate('Geofence', {
      coordinate: coordinate
    });
  }

  clearMarkers() {
    this.setState({
      coordinates: [],
      markers: [],
      stopZones: [],
      geofences: [],
      geofencesHit: [],
      geofencesHitEvents: []
    });
  }

  /**
  * Map geometry methods for calculating Geofence hit-markers
  * TODO move to Utility class
  */
  toRad(n) {
    return n * (Math.PI / 180);
  }
  toDeg(n) {
    return n * (180 / Math.PI);
  }

  getBearing(start:any, end:any){
    let startLat = this.toRad(start.latitude);
    let startLong = this.toRad(start.longitude);
    let endLat = this.toRad(end.latitude);
    let endLong = this.toRad(end.longitude);

    let dLong = endLong - startLong;

    let dPhi = Math.log(Math.tan(endLat/2.0+Math.PI/4.0)/Math.tan(startLat/2.0+Math.PI/4.0));
    if (Math.abs(dLong) > Math.PI){
      if (dLong > 0.0)
         dLong = -(2.0 * Math.PI - dLong);
      else
         dLong = (2.0 * Math.PI + dLong);
    }
    return (this.toDeg(Math.atan2(dLong, dPhi)) + 360.0) % 360.0;
  }

  computeOffsetCoordinate(coordinate:any, distance:number, heading:number) {
    distance = distance / (6371*1000);
    heading = this.toRad(heading);

    var lat1 = this.toRad(coordinate.latitude), lon1 = this.toRad(coordinate.longitude);
    var lat2 = Math.asin(Math.sin(lat1) * Math.cos(distance) +
                        Math.cos(lat1) * Math.sin(distance) * Math.cos(heading));

    var lon2 = lon1 + Math.atan2(Math.sin(heading) * Math.sin(distance) *
                                Math.cos(lat1),
                                Math.cos(distance) - Math.sin(lat1) *
                                Math.sin(lat2));

    if (isNaN(lat2) || isNaN(lon2)) return null;

    return {
      latitude: this.toDeg(lat2),
      longitude: this.toDeg(lon2)
    };
  }
}

var styles = StyleSheet.create({
  container: {
    backgroundColor: '#272727'
  },
  header: {
    backgroundColor: '#fedd1e'
  },
  title: {
    color: '#000'
  },
  footer: {
    backgroundColor: '#fedd1e',
    paddingLeft: 5,
    paddingRight: 5
  },
  footerBody: {
    justifyContent: 'center',
    width: 200,
    flex: 1
  },
  icon: {
    color: '#fff'
  },
  map: {
    flex: 1
  },
  actionButtonIcon: {
    fontSize: 24
  },
  status: {
    fontSize: 12
  },
  stopZoneMarker: {
    borderWidth:1,
    borderColor: 'red',
    backgroundColor: COLORS.red,
    opacity: 0.2,
    borderRadius: 15,
    zIndex: 0,
    width: 30,
    height: 30
  },
  geofenceHitMarker: {
    borderWidth: 1,
    borderColor:'black',
    borderRadius: 6,
    zIndex: 10,
    width: 12,
    height:12
  },
  markerIcon: {
    borderWidth:1,
    borderColor:'#000000',
    backgroundColor: COLORS.polyline_color,
    //backgroundColor: 'rgba(0,179,253, 0.6)',
    width: 10,
    height: 10,
    borderRadius: 5
  },
  // Map Menu on top-right.  What a pain to style this thing...
  mapMenu: {
    position:'absolute',
    right: 5,
    top: ACTION_BUTTON_OFFSET_Y,
    flexDirection: 'row'
  },
  mapMenuButton: {
    marginLeft: 10
  },
  mapMenuIcon: {
    color: '#000'
  },
  mapMenuButtonIcon: {
    marginRight: 0
  },
  motionActivityIcon: {
    fontSize: 24
  }
});
