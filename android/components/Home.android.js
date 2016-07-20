'use strict';

import React, { Component } from 'react';
import {
  StyleSheet,
  Text,
  View,
  SwitchAndroid,
  AppState
 } from 'react-native';

var Mapbox = require('react-native-mapbox-gl');
var mapRef = 'mapRef';

import Config from '../../components/config';
import Icon from 'react-native-vector-icons/Ionicons';
import SettingsService from '../../components/SettingsService';
import commonStyles from '../../components/styles';

SettingsService.init('Android');

var Home = React.createClass({
  mixins: [Mapbox.Mixin],
  locationIcon: require("image!green_circle"),
  currentLocation: undefined,
  locationManager: undefined,

  getInitialState: function() {
    return {
      currentState: AppState.currentState,
      enabled: false,
      isMoving: false,
      odometer: 0,
      paceButtonStyle: commonStyles.disabledButton,
      paceButtonIcon: 'md-play',
      navigateButtonIcon: 'ios-navigate',
      mapHeight: 300,
      mapWidth: 300,
      // mapbox
      center: {
        latitude: 40.7223,
        longitude: -73.9878
      },
      showsUserLocation: true,
      zoomLevel: 10,
      annotations: [],
      currentActivity: 'unknown',
      currentProvider: undefined
    };
  },
  
  componentDidMount: function() {
    var me = this;

    AppState.addEventListener('change', this._handleAppStateChange);

    this.configureBackgroundGeolocation();
    

    SettingsService.getValues(function(values) {
      values.license = "1a5558143dedd16e0887f78e303b0fd28250b2b3e61b60b8c421a1bd8be98774";
      
      // OPTIONAL:  Optionally generate a test schedule here.
      //  1: how many schedules?
      //  2: delay (minutes) from now to start generating schedules
      //  3: schedule duration (minutes); how long to stay ON.
      //  4: OFF time between (minutes) generated schedule events.
      //
      // UNCOMMENT TO AUTO-GENERATE A SERIES OF SCHEDULE EVENTS BASED UPON CURRENT TIME:
      // values.schedule = SettingsService.generateSchedule(24, 1, 30, 30);

      //values.url = 'http://192.168.11.120:8080/locations';

      me.locationManager.configure(values, function(state) {
        console.log('- configure state: ', state);
        
        // Start the scheduler if configured with one.
        if (state.schedulerEnabled) {
          me.locationManager.startSchedule(function() {
            console.info('- Scheduler started');
          });
        }

        me.setState({
          enabled: state.enabled
        });
        if (state.enabled) {
          //me.initializePolyline();
          me.updatePaceButtonStyle()
        }
      });
    });

    this.setState({
      enabled: false,
      isMoving: false
    });
  },
  componentWillUnmount: function() {
    AppState.removeEventListener('change', this._handleAppStateChange);
  },
  configureBackgroundGeolocation: function() {
    this.locationManager = this.props.locationManager;

    // location event
    this.locationManager.on("location", function(location) {
      console.log('- location: ', JSON.stringify(location));
      
      if (!location.sample) {
        me.addMarker(location);
      }

      me.setCenter(location);

      me.setState({
        odometer: (location.odometer/1000).toFixed(1)
      });

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
      me.setState({
        isMoving: event.isMoving
      });
      me.updatePaceButtonStyle();
    });
    // schedule event
    this.locationManager.on("schedule", function(state) {
      console.log("- schedule", state.enabled, state);
      me.setState({
        enabled: state.enabled
      });
      me.updatePaceButtonStyle();
    });
    this.locationManager.on("providerchange", function(provider) {
      me.setState({
        currentProvider: provider
      });
    });
    // activitychange event
    this.locationManager.on("activitychange", function(activityName) {
      me.setState({currentActivity: activityName});
    });
    // providerchange event
    this.locationManager.on("providerchange", function(provider) {
      console.log('- providerchange: ', provider.enabled, provider);
    });
    // getGeofences
    this.locationManager.getGeofences(function(rs) {
      console.log('- getGeofences: ', JSON.stringify(rs));
    }, function(error) {
      console.log("- getGeofences ERROR", error);
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
    this.props.drawer.open();
  },

  onClickEnable: function() {    
    var me = this;
    if (!this.state.enabled) {
      this.locationManager.start(function() {
        me.initializePolyline();
      });
    } else {
      this.locationManager.resetOdometer();
      this.locationManager.removeGeofences();
      this.locationManager.stop();
      this.locationManager.stopWatchPosition();

      this.setState({
        annotations: [{}],
        odometer: 0
      });

      if (this.polyline) {
        this.polyline = null;
      }
    }

    this.setState({
      enabled: !this.state.enabled
    });
    this.updatePaceButtonStyle();
  },
  onClickPace: function() {
    if (!this.state.enabled) { return; }
    var isMoving = !this.state.isMoving;
    this.locationManager.changePace(isMoving);

    this.setState({
      isMoving: isMoving
    });      
    this.updatePaceButtonStyle();
  },
  onClickLocate: function() {
    var me = this;

    this.locationManager.getCurrentPosition({
      timeout: 30,
      samples: 5,
      desiredAccuracy: 5,
      persist: false
    }, function(location) {
      me.setCenter(location);
      console.log('- current position: ', JSON.stringify(location));
    }, function(error) {
      console.error('ERROR: getCurrentPosition', error);
      me.setState({navigateButtonIcon: 'ios-navigate'});
    });
    this.locationManager.stopWatchPosition(function() {
      console.info('- Stopped watching position');
    });
  },
  onRegionChange: function() {
    console.log('onRegionChange');
  },
  setCenter: function(location) {
    this.setState({
      navigateButtonIcon: 'ios-navigate',
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
  updatePaceButtonStyle: function() {
    var style = commonStyles.disabledButton;
    if (this.state.enabled) {
      style = (this.state.isMoving) ? commonStyles.redButton : commonStyles.greenButton;
    }
    this.setState({
      paceButtonStyle: style,
      paceButtonIcon: (this.state.enabled && this.state.isMoving) ? 'md-pause' : 'md-play'
    });
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
        <View style={commonStyles.bottomToolbar}>
          <View style={{flex:1, flexDirection:"row", justifyContent:"flex-start", alignItems:"center"}}>
            <Icon.Button name={this.state.navigateButtonIcon} onPress={this.onClickLocate} size={30} color="#000" underlayColor="#eee" backgroundColor="transparent" style={styles.btnNavigate} />
            {Config.getLocationProviders(this.state.currentProvider)}
          </View>
          <View style={{flex:1, flexDirection: "row", alignItems:"center", justifyContent: "center"}}>            
            {Config.getActivityIcon(this.state.currentActivity)}
            <View style={styles.label}><Text style={styles.labelText}>{this.state.odometer}km</Text></View>
          </View>
          <Icon.Button name={this.state.paceButtonIcon} onPress={this.onClickPace} style={[this.state.paceButtonStyle, {width:75}]}></Icon.Button>
          <Text>&nbsp;</Text>
        </View>
      </View>
    );
  }
});

var styles = StyleSheet.create({
  workspace: {
    flex: 1
  },
  labelActivity: {
    alignItems: "center",
    justifyContent: "center",    
    borderRadius: 3,
    width: 40,
    padding: 3
  },
  label: {
    padding: 3,
    width: 75
  },
  labelText: {
    fontSize: 14,
    textAlign: 'center'
  },
  labelOdometer: {
    padding: 3
  },
  mapBox: {
    flex: 1
  }
});

module.exports = Home;
