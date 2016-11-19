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

import Mapbox, { MapView } from 'react-native-mapbox-gl';
Mapbox.setAccessToken('pk.eyJ1IjoiY2hyaXN0b2NyYWN5IiwiYSI6ImVmM2Y2MDA1NzIyMjg1NTdhZGFlYmZiY2QyODVjNzI2In0.htaacx3ZhE5uAWN86-YNAQ');

import Config from './config';
import Icon from 'react-native-vector-icons/Ionicons';
import commonStyles from './styles';
import BottomToolbarView from './BottomToolbarView';
import SettingsService from './SettingsService';
import GeofenceView from './GeofenceView';
import Modal from 'react-native-modalbox';

SettingsService.init();

var HomeView = React.createClass({
  locationIcon: require("image!green_circle"),
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
      showsUserLocation: true,
      initialZoomLevel: 15,
      annotations: [],
      coordinates: []
    };
  },

  componentDidMount: function() {
    AppState.addEventListener('change', this._handleAppStateChange);

    this.setState({
      enabled: false
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
  onMapLoaded: function() {
    var me = this;
    SettingsService.getValues(function(values) {
      me.configureBackgroundGeolocation(values);
    });
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
    config.schedule = null;
    //
    //config.url = 'http://192.168.11.100:8080/locations';

    // Set the license key
    config.license = "1a5558143dedd16e0887f78e303b0fd28250b2b3e61b60b8c421a1bd8be98774";

    bgGeo.configure(config, function(state) {
      console.log('- configure success.  Current state: ', state);

      // Broadcast to child components.
      this.eventEmitter.emit('enabled', state.enabled);

      // Start the scheduler if configured with one.
      if (state.schedule) {
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
  },
  onLocation: function(location) {
    console.log('- location: ', JSON.stringify(location));
    if (!location.sample) {
      this.addMarker(location);
    }
    this.setCenter(location);
  },
  onGeofencesChange: function(event) {
    console.log('- geofenceshcange: ', event);
    var on = event.on;
    var off = event.off;
    var rs = this.state.annotations.filter(function(annotation) {
      return (annotation.title === 'geofence') ? off.indexOf(annotation.id) <= 0 : true;
    });
    on.forEach(function(geofence) {
      rs.push(this.createGeofenceMarker(geofence));
    }.bind(this));
    this.setState({
      annotations: [...rs]
    });
  },
  onHeartbeat: function(params) {
    console.log("- heartbeat: ", params.location);
  },
  onHttp: function(response) {
    console.log('- http ' + response.status);
    console.log(response.responseText);
  },
  onGeofence: function(geofence) {
    console.log('- onGeofence: ', JSON.stringify(geofence));
  },
  onSchedule: function(state) {
    console.log("- schedule", state.enabled, state);
    this.setState({
      enabled: state.enabled
    });
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
      bgGeo.resetOdometer();
      bgGeo.stop(function() {
        console.log('- stopped');
      });

      //this.removeAllAnnotations(mapRef);
      this.setState({
        coordinates: [],
        annotations: []
      });
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
    if (!this._map) { return;}

    if (location.event === 'motionchange') {
      this._map.setCenterCoordinateZoomLevel(location.coords.latitude, location.coords.longitude, 15);
    } else {
      this._map.setCenterCoordinate(location.coords.latitude, location.coords.longitude);
    }
  },
  onUserLocationChange: function(location) {
    console.log('[MapBox] #onUserLocationChange: ', location);
  },
  onLongPress: function(params) {
    global.BackgroundGeolocation.playSound(SettingsService.getSoundId('LONG_PRESS_ACTIVATE'));
    this.refs.geofenceModal.open(params);
  },
  onOpenAnnotation: function(annotation) {
    console.log('[MapBox] #onOpenAnnotation', annotation);
    if (annotation.title === 'geofence') {
      this.refs.geofenceModal.load(annotation);
    }
  },
  addMarker :function(location) {
    // Remove the route polyline.  We have to regenerate it from scratch each time.
    // Wish we could just update it with new coords
    this.state.annotations = this.state.annotations.filter(function(annotation) {
      return (annotation.type === 'polyline' && annotation.id === 'route') ? false : true;
    });

    this.setState({
      annotations: [ ...this.state.annotations, this.createMarker(location)]
    });
    this.setState({
      annotations: [ ...this.state.annotations, this.createPolyline(location) ]
    });
  },
  createMarker: function(location) {
    return {
        id: location.timestamp,
        type: 'point',
        title: location.timestamp,
        coordinates: [location.coords.latitude, location.coords.longitude]
      };
  },
  createPolyline: function(location) {
    this.setState({
      coordinates: [...this.state.coordinates, [location.coords.latitude, location.coords.longitude]]
    });

    return {
      type: "polyline",
      coordinates: this.state.coordinates,
      title: "Route",
      strokeColor: '#2677FF',
      strokeWidth: 5,
      strokeAlpha: 0.5,
      id: "route"
    };
  },
  createGeofenceMarker: function(params) {
    // Too bad MapBox doesn't support a simple Circle...ugh.
    var lat = params.latitude;
    var lng = params.longitude;
    var radius = params.radius;
    var degreesBetweenPoints = 8;
    var numberOfPoints = Math.floor(360/degreesBetweenPoints);
    var distRadians = radius/6371000;
    var centerLatRadians = lat * Math.PI / 180
    var centerLngRadians = lng * Math.PI / 180;
    var polygons = [];

    var degrees, degreesRadians, pointLatRadians, pointLngRadians, pointLat, pointLng;
    for (var i=0;i<numberOfPoints;i++) {
      degrees = i * degreesBetweenPoints;
      degreesRadians = degrees * Math.PI / 180;
      pointLatRadians = Math.asin(Math.sin(centerLatRadians) * Math.cos(distRadians) + Math.cos(centerLatRadians) * Math.sin(distRadians) * Math.cos(degreesRadians));
      pointLngRadians = centerLngRadians + Math.atan2(Math.sin(degreesRadians) * Math.sin(distRadians) * Math.cos(centerLatRadians), Math.cos(distRadians) - Math.sin(centerLatRadians) * Math.sin(pointLatRadians));
      pointLat = pointLatRadians * 180 / Math.PI;
      pointLng = pointLngRadians * 180 / Math.PI;
      polygons.push([pointLat, pointLng]);
    }

    return {
      id: params.identifier,
      title: 'geofence',
      type: 'polygon',
      coordinates: polygons,
      strokeAlpha: 0.9,
      strokeColor: '#11b700',
      strokeWidth: 2,
      fillAlpha:  0.2,
      alpha: 0.2,
      fillColor: '#11b700'
    };
  },
  onCloseGeofenceModal: function() {

  },
  onSubmitGeofence: function(params) {
    var bgGeo = global.BackgroundGeolocation;
    bgGeo.playSound(SettingsService.getSoundId('ADD_GEOFENCE'));
    bgGeo.addGeofence(params, function(identifier) {
      this.setState({
        annotations: [ ...this.state.annotations, this.createGeofenceMarker(params)]
      });
    }.bind(this), function(error) {
      console.warn('- addGeofence error: ', error);
    }.bind(this))
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
            ref={map => {this._map = map;}}
            annotations={this.state.annotations}
            annotationsAreImmutable
            initialCenterCoordinate={this.state.initialCenterCoordinate}
            debugActive={false}
            direction={10}
            rotateEnabled={true}
            scrollEnabled={true}
            style={styles.mapBox}
            showsUserLocation={this.state.showsUserLocation}
            styleURL={Mapbox.mapStyles.dark}
            userTrackingMode={Mapbox.userTrackingMode.none}
            zoomEnabled={true}
            initialZoomLevel={this.state.initialZoomLevel}
            compassIsHidden={true}
            onUserLocationChange={this.onUserLocationChange}
            onLongPress={this.onLongPress}
            onOpenAnnotation={this.onOpenAnnotation}
            onFinishLoadingMap={this.onMapLoaded} />
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
  }
});

module.exports = HomeView;
