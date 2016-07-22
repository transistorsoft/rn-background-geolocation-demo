'use strict';

import React, { Component } from 'react';
import {
  StyleSheet,
  Text,
  View,
  SwitchAndroid,
  AppState
 } from 'react-native';

import EventEmitter from 'EventEmitter';

var Mapbox = require('react-native-mapbox-gl');
var mapRef = 'mapRef';

import Config from '../../components/config';
import Icon from 'react-native-vector-icons/Ionicons';
import SettingsService from '../../components/SettingsService';
import commonStyles from '../../components/styles';
import BottomToolbar from '../../components/BottomToolbar';

SettingsService.init('Android');

var Home = React.createClass({
  mixins: [Mapbox.Mixin],
  locationIcon: require("image!green_circle"),
  currentLocation: undefined,
  locationManager: undefined,
  eventEmitter: new EventEmitter(),

  getInitialState: function() {
    return {
      currentState: AppState.currentState,
      enabled: false,
      // mapbox
      center: {
        latitude: 40.7223,
        longitude: -73.9878
      },
      showsUserLocation: true,
      zoomLevel: 10,
      annotations: []      
    };
  },
  
  componentDidMount: function() {
    var me = this;

    AppState.addEventListener('change', this._handleAppStateChange);

    
    SettingsService.getValues(function(values) {
      me.configureBackgroundGeolocation(values);
    });

    this.setState({
      enabled: false
    });
  },
  componentWillUnmount: function() {
    AppState.removeEventListener('change', this._handleAppStateChange);
  },
  configureBackgroundGeolocation: function(config) {
    var me = this;
    this.locationManager = this.props.locationManager;  // @see Index.android.js 

    // 1. Set up listeners on BackgroundGeolocation events
    //
    // location event
    this.locationManager.on("location", function(location) {
      console.log('- location: ', JSON.stringify(location));
      
      if (!location.sample) {
        me.addMarker(location);
      }
      me.setCenter(location);
    });
    // http event
    this.locationManager.on("http", function(response) {
      console.log('- http ' + response.status);
      console.log(response.responseText);
    });
    // geofence event
    this.locationManager.on("geofence", function(geofence) {
      console.log('- onGeofence: ', JSON.stringify(geofence));
      me.locationManager.removeGeofence(geofence.identifier, function() {
        console.log('- Remove geofence success');
      });
    });
    // heartbeat event
    this.locationManager.on("heartbeat", function(params) {
      console.log("- heartbeat: ", params.location);
    });

    // error event
    this.locationManager.on("error", function(error) {
      console.log('- ERROR: ', JSON.stringify(error));
    });
    // motionchange event
    this.locationManager.on("motionchange", function(event) {
      console.log("- motionchange", JSON.stringify(event));      
    });
    // schedule event
    this.locationManager.on("schedule", function(state) {
      console.log("- schedule", state.enabled, state);
      me.setState({
        enabled: state.enabled
      });
    });
    
    // getGeofences
    this.locationManager.getGeofences(function(rs) {
      console.log('- getGeofences: ', JSON.stringify(rs));
    }, function(error) {
      console.log("- getGeofences ERROR", error);
    });

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
    // config.schedule = SettingsService.generateSchedule(24, 1, 30, 30);
    //config.url = 'http://192.168.11.100:8080/locations';

    // Set the license key
    config.license = "1a5558143dedd16e0887f78e303b0fd28250b2b3e61b60b8c421a1bd8be98774";

    this.locationManager.configure(config, function(state) {
      console.log('- configure success.  Current state: ', state);
      
      // Broadcast to child components.
      this.eventEmitter.emit('enabled', state.enabled);

      // Start the scheduler if configured with one.
      if (state.schedulerEnabled) {
        me.locationManager.startSchedule(function() {
          console.info('- Scheduler started');
        });
      }

      // Update UI
      me.setState({
        enabled: state.enabled
      });
    }.bind(this));
  },
  /**
  * MapBox is evil.  It keeps the location running in background when showsUserLocation is enabled
  * BE SURE TO SHUT THAT OFF IN BACKGROUND OR GPS IS ON FOREVER.  Bye bye battery.
  */
  _handleAppStateChange: function(currentAppState) {
    var showsUserLocation = (currentAppState === 'background') ? false : true;
    this.setState({
      currentAppState: currentAppState,
      showsUserLocation: showsUserLocation
    });
  },
  _createMarker: function(location) {
    return {
        title: location.timestamp,
        id: location.uuid,
        icon: this.locationIcon,
        anchor: [0.5, 0.5],
        coordinates: {
          lat: location.coords.latitude,
          lng: location.coords.longitude
        }
      };
  },
  initializePolyline: function() {
    this.polyline = {
      type: "polyline",
      coordinates: [],
      title: "Route",
      strokeColor: '#2677FF',
      strokeWidth: 5,
      strokeAlpha: 0.5,
      id: "route"
    };
    this.addAnnotations(mapRef, [this.polyline]);
  },

  onClickMenu: function() {
    this.locationManager.playSound(Config.sounds.BUTTON_CLICK_ANDROID);
    this.props.drawer.open();
  },

  onClickEnable: function() {    
    var me = this;
    var enabled = !this.state.enabled;

    if (enabled) {
      this.locationManager.start(function() {
      }.bind(this));
    } else {
      this.locationManager.resetOdometer();
      this.locationManager.removeGeofences();
      this.locationManager.stop();
      this.locationManager.stopWatchPosition();
      this.removeAllAnnotations(mapRef);

      if (this.polyline) {
        this.polyline = null;
      }
    }

    this.setState({
      enabled: enabled
    });
    this.eventEmitter.emit('enabled', enabled);
  },
  onRegionChange: function() {
    console.log('onRegionChange');
  },
  setCenter: function(location) {
    this.setState({
      center: {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude
      },
      zoomLevel: 16
    });
  },  
  onUserLocationChange: function(location) {
    console.log('[MapBox] #onUserLocationChange: ', location);
  },
  onLongPress: function() {
    console.log('[MapBox] #onLongPress');
  },
  onOpenAnnotation: function(annotation) {
    console.log('[MapBox] #onOpenAnnotation');
  },
  addMarker :function(location) {
    this.addAnnotations(mapRef, [this.createMarker(location)]);
    if (this.polyline) {
      this.polyline.coordinates.push([location.coords.latitude, location.coords.longitude]);
      this.addAnnotations(mapRef, this.polyline);
    }
  },
  createMarker: function(location) {
    return {
        id: location.timestamp,
        type: 'point',
        title: location.timestamp,
        coordinates: [location.coords.latitude, location.coords.longitude]
      };
  },
  render: function() {
    return (
      <View style={commonStyles.container}>
        <View style={commonStyles.topToolbar}>
          <Icon.Button name="ios-options" onPress={this.onClickMenu} backgroundColor="transparent" size={30} color="#000" style={styles.btnMenu} underlayColor={"transparent"} />
          <Text style={commonStyles.toolbarTitle}>Background Geolocation</Text>
          <SwitchAndroid onValueChange={this.onClickEnable} value={this.state.enabled} />
        </View>
        <View ref="workspace" style={styles.workspace}>
          <Mapbox
            annotations={this.state.annotations}
            accessToken={'pk.eyJ1IjoiY2hyaXN0b2NyYWN5IiwiYSI6ImVmM2Y2MDA1NzIyMjg1NTdhZGFlYmZiY2QyODVjNzI2In0.htaacx3ZhE5uAWN86-YNAQ'}
            centerCoordinate={this.state.center}
            debugActive={false}
            direction={10}
            ref={mapRef}
            rotateEnabled={true}
            scrollEnabled={true}
            style={styles.mapBox}
            showsUserLocation={this.state.showsUserLocation}
            styleURL={this.mapStyles.emerald}
            userTrackingMode={this.userTrackingMode.none}
            zoomEnabled={true}
            zoomLevel={this.state.zoomLevel}
            compassIsHidden={true}
            onUserLocationChange={this.onUserLocationChange}
            onLongPress={this.onLongPress}
            onOpenAnnotation={this.onOpenAnnotation}
          />
        </View>
        <BottomToolbar locationManager={this.props.locationManager} eventEmitter={this.eventEmitter} enabled={this.state.enabled} />
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
  }
});

module.exports = Home;
