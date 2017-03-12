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

//import Mapbox, { MapView } from 'react-native-mapbox-gl';
//Mapbox.setAccessToken('pk.eyJ1IjoiY2hyaXN0b2NyYWN5IiwiYSI6ImVmM2Y2MDA1NzIyMjg1NTdhZGFlYmZiY2QyODVjNzI2In0.htaacx3ZhE5uAWN86-YNAQ');

import MapView from 'react-native-maps';

import Config from './config';
import Icon from 'react-native-vector-icons/Ionicons';
import commonStyles from './styles';
import BottomToolbarView from './BottomToolbarView';
import SettingsService from './SettingsService';
import GeofenceView from './GeofenceView';
import Modal from 'react-native-modalbox';

var MAP_MARKER_IMAGE = require('../images/green-dot.png');

const LATITUDE_DELTA = 0.00922;
const LONGITUDE_DELTA = 0.00421;

const GEOFENCE_STROKE_COLOR = "rgba(0,200,0,0.5)"
const GEOFENCE_FILL_COLOR   ="rgba(0,170,0,0.5)"
const GEOFENCE_STROKE_COLOR_ACTIVATED = "rgba(127,127,127,0.5)";
const GEOFENCE_FILL_COLOR_ACTIVATED = "rgba(127,127,127,0.5)";
const POLYLINE_STROKE_COLOR = "#2677FF";

SettingsService.init();

var HomeView = React.createClass({
  //locationIcon: require("image!green_circle"),
  eventEmitter: new EventEmitter(),

  getInitialState: function() {
    return {
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
  },
  componentDidMount: function() {
    AppState.addEventListener('change', this._handleAppStateChange);

    this.setState({
      enabled: false
    });

    var me = this;
    SettingsService.getState(function(state) {
      me.configureBackgroundGeolocation(state);
    });
  },
  componentWillUnmount: function() {
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
    bgGeo.un("geofenceschange", this.onGeofencesChange);

  },

  configureBackgroundGeolocation: function(config) {

    var me = this;
    var bgGeo = global.BackgroundGeolocation;
    ////
    // 1. Set up listeners on BackgroundGeolocation events
    //
    // location event
    bgGeo.on("location", this.onLocation);
    // http event
    bgGeo.on("http", this.onHttp);
    // geofence event
    bgGeo.on("geofence", this.onGeofence);
    // heartbeat event
    bgGeo.on("heartbeat", this.onHeartbeat);
    // error event
    bgGeo.on("error", this.onError);
    // motionchange event
    bgGeo.on("motionchange", this.onMotionChange);
    // schedule event
    bgGeo.on("schedule", this.onSchedule);
    // geofenceschange
    bgGeo.on("geofenceschange", this.onGeofencesChange);

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
  },
  onError: function(error) {
    console.log('- ERROR: ', JSON.stringify(error));
  },
  onMotionChange: function(event) {
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
  },
  onLocation: function(location) {
    console.log('- location: ', JSON.stringify(location));
    if (!location.sample) {
      this.addMarker(location);
    }
    // Seems to fix PolyLine rendering issue by wrapping call to setCenter in a timeout
    setTimeout(function() {
      this.setCenter(location);
    }.bind(this))
  },
  onGeofencesChange: function(event) {
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
  },

  onPressGeofence: function(event) {
    console.log('NOT IMPLEMENTED');
  },

  onHeartbeat: function(params) {
    console.log("- heartbeat: ", params.location);
  },

  onHttp: function(response) {
    console.log('- http ' + response.status);
    console.log(response.responseText);
  },

  onGeofence: function(geofence) {
    var marker = this.state.geofences.find(function(m) {
      return m.identifier === geofence.identifier;
    });
    if (!marker) { return; }

    marker.fillColor = GEOFENCE_STROKE_COLOR_ACTIVATED;
    marker.strokeColor = GEOFENCE_STROKE_COLOR_ACTIVATED;
    this.setState({geofences: this.state.geofences});
  },

  onSchedule: function(state) {
    console.log("- schedule", state.enabled, state);
    this.setState({
      enabled: state.enabled
    });
  },

  _handleAppStateChange: function(currentAppState) {
    var showsUserLocation = (currentAppState === 'background') ? false : true;

    this.setState({
      currentAppState: currentAppState,
      showsUserLocation: showsUserLocation
    });
  },

  onClickMenu: function() {
    global.BackgroundGeolocation.playSound(Config.sounds.BUTTON_CLICK_ANDROID);
    this.props.drawer.open();
  },

  onClickEnable: function() {
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
    this.eventEmitter.emit('enabled', enabled);
  },

  onRegionChange: function(coordinate) {

  },

  setCenter: function(location) {
    if (!this.refs.map) { return; }
    this.refs.map.animateToCoordinate({
      latitude: location.coords.latitude, 
      longitude: location.coords.longitude
    });
  },

  onLongPress: function(params) {
    var coordinate = params.nativeEvent.coordinate;
    global.BackgroundGeolocation.playSound(SettingsService.getSoundId('LONG_PRESS_ACTIVATE'));
    this.refs.geofenceModal.open(coordinate);
  },

  onSubmitGeofence: function(params) {
    var bgGeo = global.BackgroundGeolocation;
    bgGeo.playSound(SettingsService.getSoundId('ADD_GEOFENCE'));
    bgGeo.addGeofence(params, function(identifier) {
      this.setState({
        geofences: [ ...this.state.geofences, this.createGeofenceMarker(params)]
      });
    }.bind(this), function(error) {
      console.warn('- addGeofence error: ', error);
    }.bind(this))
  },

  addMarker :function(location) {
    this.setState({
      markers: [...this.state.markers, this.createMarker(location)],
      coordinates: [...this.state.coordinates, {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude
      }]
    });
  },

  createMarker: function(location) {
    return {
      key: location.uuid,
      title: location.timestamp,
      coordinate: {
        latitude: location.coords.latitude, 
        longitude: location.coords.longitude
      }
    };
  },

  createGeofenceMarker: function(geofence) {
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
  },

  render: function() {
    return (
      <View style={commonStyles.container}>
        <View style={commonStyles.topToolbar}>
          <Icon.Button name="ios-options" onPress={this.onClickMenu} backgroundColor="transparent" size={30} color="#000" style={styles.btnMenu} underlayColor={"transparent"} />
          <Text style={commonStyles.toolbarTitle}>{this.state.title}</Text>
          <Switch onValueChange={this.onClickEnable} value={this.state.enabled} />
        </View>
        <View ref="workspace" style={styles.workspace}>
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
              fillColor="rgba(200,0,0,0.5)"
              strokeColor="rgba(170,0,0,0.5)"
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
              strokeColor={POLYLINE_STROKE_COLOR}
              strokeWidth={5}
            />
          </MapView>

        </View>
        <BottomToolbarView eventEmitter={this.eventEmitter} enabled={this.state.enabled} />
        <GeofenceView ref={"geofenceModal"} onSubmit={this.onSubmitGeofence}/>
      </View>
    );
  }
});

var styles = StyleSheet.create({
  workspace: {
    flex: 1
  },
  mapBox: {
    flex: 1
  },
  map: {
    flex: 1
  }
});

module.exports = HomeView;
