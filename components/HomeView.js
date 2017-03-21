'use strict';

import React, { Component } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Switch,
  AppState
 } from 'react-native';

import EventEmitter from 'EventEmitter';

import Icon from 'react-native-vector-icons/Ionicons';
import MapView from 'react-native-maps';
import Modal from 'react-native-modalbox';
import ActionButton from 'react-native-action-button';

import Config from './config';
import commonStyles from './styles';
import BottomToolbarView from './BottomToolbarView';
import SettingsService from './SettingsService';
import GeofenceView from './GeofenceView';
import SettingsView from './SettingsView';

var MAP_MARKER_IMAGE = require('../images/location_marker.png');

const LATITUDE_DELTA = 0.00922;
const LONGITUDE_DELTA = 0.00421;

const STATIONARY_REGION_FILL_COLOR = "rgba(200,0,0,0.2)"
const STATIONARY_REGION_STROKE_COLOR = "rgba(200,0,0,0.2)"
const GEOFENCE_STROKE_COLOR = "rgba(17,183,0,0.5)"
const GEOFENCE_FILL_COLOR   ="rgba(17,183,0,0.2)"
const GEOFENCE_STROKE_COLOR_ACTIVATED = "rgba(64,64,64,0.5)";
const GEOFENCE_FILL_COLOR_ACTIVATED = "rgba(64,64,64,0.2)";
const POLYLINE_STROKE_COLOR = "rgba(32,64,255,0.6)";

SettingsService.init();

class HomeView extends React.Component {
  //locationIcon: require("image!green_circle"),
  eventEmitter = new EventEmitter();

  constructor(props) {
    super(props);

    this.state = {
      currentState: AppState.currentState,
      enabled: false,
      title: 'Background Geolocation',
      // mapbox
      initialCenterCoordinate: {
        latitude: 40.7223,
        longitude: -73.9878
      },
      centerCoordinate: {
        latitude: 0,
        longitude: 0
      },
      stationaryLocation: {timestamp: '',latitude:0,longitude:0},
      stationaryRadius: 0,
      showsUserLocation: true,

      markers: [],
      geofences: [],
      coordinates: []
    };
  }

  componentDidMount() {
    AppState.addEventListener('change', this._handleAppStateChange);

    this.setState({
      enabled: false
    });

    var me = this;
    SettingsService.getState(function(state) {
      me.configureBackgroundGeolocation(state);
    });
  }
  
  componentWillUnmount() {
    AppState.removeEventListener('change', this._handleAppStateChange);
    var bgGeo = global.BackgroundGeolocation;

    // Unregister BackgroundGeolocation event-listeners!
    bgGeo.un("location", this.onLocation);
    bgGeo.un("http", this.onHttp);
    bgGeo.un("geofence", this.onGeofence);
    bgGeo.un("heartbeat", this.onHeartbeat);
    bgGeo.un("error", this.onError);
    bgGeo.un("motionchange", this.onMotionChange);
    bgGeo.un("schedule", this.onSchedule);
    bgGeo.un("geofenceschange", this.onGeofencesChange.bind(this));
  }

  onClickMainMenu(command) {
    switch(command) {
      case 'settings':
        this.settingsView.open();
        break;
      case 'resetOdometer':
        break;
      case 'sync':
        break;
      case 'destroyLocations':
        break;
    }
  }
  onClickSettings() {
    //this.refs.settingsView.open();
    debugger;
  }
  onClickResetOdometer() {

  }
  onClickEmailLog() {

  }
  onClickSync() {

  }
  onClickDestroyLocations() {

  }
  configureBackgroundGeolocation(config) {

    var me = this;
    var bgGeo = global.BackgroundGeolocation;
    ////
    // 1. Set up listeners on BackgroundGeolocation events
    //
    // location event
    bgGeo.on("location", this.onLocation.bind(this));
    // http event
    bgGeo.on("http", this.onHttp.bind(this));
    // geofence event
    bgGeo.on("geofence", this.onGeofence.bind(this));
    // heartbeat event
    bgGeo.on("heartbeat", this.onHeartbeat.bind(this));
    // error event
    bgGeo.on("error", this.onError.bind(this));
    // motionchange event
    bgGeo.on("motionchange", this.onMotionChange.bind(this));
    // schedule event
    bgGeo.on("schedule", this.onSchedule.bind(this));
    // geofenceschange
    bgGeo.on("geofenceschange", this.onGeofencesChange.bind(this));

    ////
    // 2. Configure it.
    //
    // OPTIONAL:  Optionally generate a test schedule here.
    //  1: how many schedules?
    //  2: delay (minutes) from now to start generating schedules
    //  3: schedule duration (minutes); how long to stay ON.
    //  4: OFF time between (minutes) generated schedule events.
    //
    //  eg:
    //  schedule: [
    //    '1-6 9:00-17:00',
    //    '7 10:00-18:00'
    //  ]
    // UNCOMMENT TO AUTO-GENERATE A SERIES OF SCHEDULE EVENTS BASED UPON CURRENT TIME:
    //config.schedule = SettingsService.generateSchedule(24, 1, 1, 1);
    //
    //config.url = 'http://192.168.11.100:8080/locations';

    bgGeo.configure(config, function(state) {
      console.log('- configure success.  Current state: ', state);

      // Broadcast to child components.
      this.eventEmitter.emit('enabled', state.enabled);

      // Start the scheduler if configured with one.
      if (state.schedule.length) {
        bgGeo.startSchedule(function() {
          console.info('- Scheduler started');
        });
      }

      // Update UI
      this.setState({
        enabled: state.enabled
      });
    }.bind(this));
  }

  onError(error) {
    console.log('- ERROR: ', JSON.stringify(error));
  }

  onMotionChange(event) {
    var location = event.location;
    console.log("- motionchange", JSON.stringify(event));
    if (event.isMoving) {
      this.setState({
        stationaryRadius: 0,
        stationaryLocation: {
          timestamp: '',
          latitude: 0,
          longitude: 0
        }
      });
    } else {
      this.setState({
        stationaryRadius: 200,
        stationaryLocation: {
          timestamp: event.location.timestamp,
          latitude: event.location.coords.latitude,
          longitude: event.location.coords.longitude
        }
      })
    }
  }
  onLocation(location) {
    console.log('- location: ', JSON.stringify(location));
    if (!location.sample) {
      this.addMarker(location);
    }
    // Seems to fix PolyLine rendering issue by wrapping call to setCenter in a timeout
    setTimeout(function() {
      this.setCenter(location);
    }.bind(this))
  }

  onGeofencesChange(event) {
    var on  = event.on;
    var off = event.off;
    var geofences  = this.state.geofences;

    // Filter out all "off" geofences.
    geofences = geofences.filter(function(geofence) {
      return off.indexOf(geofence.identifier) < 0;
    });

    // Add new "on" geofences.
    on.forEach(function(geofence) {
      var marker = geofences.find(function(m) { return m.identifier === geofence.identifier;});
      if (marker) { return; }
      geofences.push(this.createGeofenceMarker(geofence));
    }.bind(this));

    this.setState({
      geofences: geofences
    });
  }

  onPressGeofence(event) {
    console.log('NOT IMPLEMENTED');
  }

  onHeartbeat(params) {
    console.log("- heartbeat: ", params.location);
  }

  onHttp(response) {
    console.log('- http ' + response.status);
    console.log(response.responseText);
  }

  onGeofence(geofence) {
    var marker = this.state.geofences.find(function(m) {
      return m.identifier === geofence.identifier;
    });
    if (!marker) { return; }

    marker.fillColor = GEOFENCE_STROKE_COLOR_ACTIVATED;
    marker.strokeColor = GEOFENCE_STROKE_COLOR_ACTIVATED;
    this.setState({geofences: this.state.geofences});
  }

  onSchedule(state) {
    console.log("- schedule", state.enabled, state);
    this.setState({
      enabled: state.enabled
    });
  }

  _handleAppStateChange(currentAppState) {
    var showsUserLocation = (currentAppState === 'background') ? false : true;

    this.setState({
      currentAppState: currentAppState,
      showsUserLocation: showsUserLocation
    });
  }

  onClickMenu() {
    global.BackgroundGeolocation.playSound(Config.sounds.BUTTON_CLICK_ANDROID);
    this.refs.settingsModal.open();

    //this.props.drawer.open();
  }

  onClickEnable() {
    var me = this;
    var enabled = !this.state.enabled;
    var bgGeo = global.BackgroundGeolocation;

    if (enabled) {
      bgGeo.start(function(state) {
        console.log('- Start success: ', state);
      }.bind(this));
    } else {
      bgGeo.stop(function() {
        console.log('- stopped');
      });

      // Clear markers, polyline, geofences, stationary-region
      this.setState({
        coordinates: [],
        markers: [],
        geofences: [],
        stationaryRadius: 0,
        stationaryLocation: {
          timestamp: '',
          latitude: 0,
          longitude: 0
        }
      });
    }

    this.setState({
      enabled: enabled
    });

    // Transmit to other components
    eventEmitter.emit('enabled', enabled);
  }

  onRegionChange(coordinate) {

  }

  setCenter(location) {
    if (!this.refs.map) { return; }
    this.refs.map.animateToCoordinate({
      latitude: location.coords.latitude, 
      longitude: location.coords.longitude
    });
  }

  onLongPress(params) {
    var coordinate = params.nativeEvent.coordinate;
    global.BackgroundGeolocation.playSound(SettingsService.getSoundId('LONG_PRESS_ACTIVATE'));
    this.refs.geofenceModal.open(coordinate);
  }

  onSubmitGeofence(params) {
    var bgGeo = global.BackgroundGeolocation;
    bgGeo.playSound(SettingsService.getSoundId('ADD_GEOFENCE'));
    bgGeo.addGeofence(params, function(identifier) {
      this.setState({
        geofences: [ ...this.state.geofences, this.createGeofenceMarker(params)]
      });
    }.bind(this), function(error) {
      console.warn('- addGeofence error: ', error);
    }.bind(this))
  }

  addMarker(location) {
    this.setState({
      markers: [...this.state.markers, this.createMarker(location)],
      coordinates: [...this.state.coordinates, {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude
      }]
    });
  }

  createMarker(location) {
    return {
      key: location.uuid,
      title: location.timestamp,
      coordinate: {
        latitude: location.coords.latitude, 
        longitude: location.coords.longitude
      }
    };
  }

  createGeofenceMarker(geofence) {
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

  render() {
    return (
      <View ref="workspace" style={styles.container}>
        <MapView
          ref="map"
          style={styles.map}
          showsUserLocation={true}
          onLongPress={this.onLongPress}
          onRegionChange={this.onRegionChange}
          initialRegion={{
            latitude: 37.78825,
            longitude: -122.4324,
            latitudeDelta: LATITUDE_DELTA,
            longitudeDelta: LONGITUDE_DELTA
          }}>

          <MapView.Circle
            key={this.state.stationaryLocation.timestamp}
            radius={this.state.stationaryRadius}
            fillColor={STATIONARY_REGION_FILL_COLOR}
            strokeColor={STATIONARY_REGION_STROKE_COLOR}
            strokeWidth={3}
            center={{latitude: this.state.stationaryLocation.latitude, longitude: this.state.stationaryLocation.longitude}}
          />
          <MapView.Marker
            key="Center"
            coordinate={this.state.centerCoordinate}
            title="Center"
          />
          {this.state.markers.map(marker => (
            <MapView.Marker
              key={marker.key}
              coordinate={marker.coordinate}
              title={marker.title}
              image={MAP_MARKER_IMAGE}
            />
          ))}
          {this.state.geofences.map(geofence => (
            <MapView.Circle
              key={geofence.identifier}
              radius={geofence.radius}
              center={geofence.center}
              strokeWidth={3}
              strokeColor={geofence.strokeColor}
              fillColor={geofence.fillColor}
              onPress={this.onPressGeofence}
            />
          ))}
          <MapView.Polyline
            coordinates={this.state.coordinates}
            geodesic={true}
            strokeColor={Config.colors.polyline_color}
            strokeWidth={6}
          />
        </MapView>
        <View style={[commonStyles.topToolbar, styles.topToolbar]}>
          <Text style={{width:50}}>&nbsp;</Text>
          <Text style={commonStyles.toolbarTitle}>{this.state.title}</Text>
          <Switch onValueChange={this.onClickEnable} value={this.state.enabled} />
        </View>

        <ActionButton 
          position="left"
          size={50}
          verticalOrientation="down"
          buttonColor="rgba(254,221,30,1)"
          buttonTextStyle={{color: "#000"}}
          hideShadow={true}
          autoInactive={false}
          spacing={10}
          offsetX={10}
          offsetY={20}>
          <ActionButton.Item buttonColor={Config.colors.gold} title="New Task" onPress={() => this.onClickMainMenu('settings')}>
            <Icon name="ios-cog" style={styles.actionButtonIcon} />
          </ActionButton.Item>

          <ActionButton.Item buttonColor={Config.colors.gold} title="New Task" onPress={() => this.onClickMainMenu('resetOdometer')}>
            <Icon name="ios-speedometer" style={styles.actionButtonIcon} />
          </ActionButton.Item>

          <ActionButton.Item buttonColor={Config.colors.gold} title="Notifications" onPress={() => this.onClickMainMenu('emailLog')}>
            <Icon name="ios-mail" style={styles.actionButtonIcon} />
          </ActionButton.Item>
          <ActionButton.Item buttonColor={Config.colors.gold} title="All Tasks" onPress={() => this.onClickMainMenu('sync')}>
            <Icon name="ios-cloud-upload" style={styles.actionButtonIcon} />
          </ActionButton.Item>
          <ActionButton.Item buttonColor={Config.colors.gold} title="All Tasks" onPress={() => this.onClickMainMenu('destroyLocations')}>
            <Icon name="ios-trash" style={styles.actionButtonIcon} />
          </ActionButton.Item>
        </ActionButton>
        <BottomToolbarView eventEmitter={this.eventEmitter} enabled={this.state.enabled} />
        <GeofenceView ref={(view) => {this.geofenceView = view; }} onSubmit={this.onSubmitGeofence}/>
        <SettingsView ref={(view) => {this.settingsView = view; }} />
      </View>
    );
  }
};

var styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 46
  },
  map: {
    flex: 1
  },
  topToolbar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0
  },
  actionButtonIcon: {
    color: '#000',
    fontSize: 24,
    //fontWeight: 'bold'
  }
});

module.exports = HomeView;
