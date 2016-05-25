'use strict';

import React, { Component } from 'react';
import {
  StyleSheet,
  Text,
  View,
  SwitchAndroid
 } from 'react-native';

import RNGMap from 'react-native-gmaps';
import Polyline from 'react-native-gmaps/Polyline';
import Icon from 'react-native-vector-icons/Ionicons';
import SettingsService from '../../components/SettingsService';
import commonStyles from '../../components/styles';

var styles = StyleSheet.create({
  workspace: {
    flex: 1
  }
});

SettingsService.init('Android');

var Home = React.createClass({
  locationIcon: require("image!green_circle"),
  currentLocation: undefined,
  locationManager: undefined,

  getInitialState: function() {
    return {
      enabled: false,
      isMoving: false,
      odometer: 0,
      paceButtonStyle: commonStyles.disabledButton,
      paceButtonIcon: 'md-play',
      navigateButtonIcon: 'md-locate',
      mapHeight: 300,
      mapWidth: 300,
      // mapbox
      center: {
        lat: 40.7223,
        lng: -73.9878
      },
      zoom: 10,
      markers: []
    };
  },
  
  componentDidMount: function() {

    var me = this,
        gmap = this.refs.gmap;

    this.locationManager = this.props.locationManager;

    // location event
    this.locationManager.on("location", function(location) {
      console.log('- location: ', JSON.stringify(location));
      me.locationManager.getCount(function(count) {
        console.log('- count: ', count);
      });

      me.setCenter(location);
      gmap.addMarker(me._createMarker(location));

      me.setState({
        odometer: (location.odometer/1000).toFixed(1)
      });

      // Add a point to our tracking polyline
      if (me.polyline) {
        me.polyline.addPoint(location.coords.latitude, location.coords.longitude);
      }
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
    // getGeofences
    this.locationManager.getGeofences(function(rs) {
      console.log('- getGeofences: ', JSON.stringify(rs));
    }, function(error) {
      console.log("- getGeofences ERROR", error);
    });
    

    SettingsService.getValues(function(values) {
      values.license = "686053fd88dcd5df60b56c5690e990a176a0fb2be3ab9c8953e4a2cc09ba7179";
      values.stopOnTerminate = false;
      
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
        if (state.schedule) {
          me.locationManager.startSchedule(function() {
            console.info('- Scheduler started');
          });
        }

        me.setState({
          enabled: state.enabled
        });
        if (state.enabled) {
          me.initializePolyline();
          me.updatePaceButtonStyle()
        }
      });
    });

    this.setState({
      enabled: false,
      isMoving: false
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
    // Create our tracking Polyline
    var me = this;
    Polyline.create({
      points: [],
      geodesic: true,
      color: '#2677FF',
      width: 12
    }, function(polyline) {
      me.polyline = polyline;
    });
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

      this.setState({
        markers: [{}],
        odometer: 0
      });
      this.setState({
        markers: []
      });
      if (this.polyline) {
        this.polyline.remove(function(result) {
          me.polyline = undefined;
        });
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

    this.locationManager.getCurrentPosition({timeout: 30}, function(location) {
      me.setCenter(location);
      console.log('- current position: ', JSON.stringify(location));
    }, function(error) {
      console.error('ERROR: getCurrentPosition', error);
      me.setState({navigateButtonIcon: 'md-locate'});
    });
  },
  onRegionChange: function() {
    console.log('onRegionChange');
  },
  setCenter: function(location) {
    this.setState({
      navigateButtonIcon: 'md-locate',
      center: {
        lat: location.coords.latitude,
        lng: location.coords.longitude
      },
      zoom: 16
    });
  },
  onLayout: function() {
    var me = this,
        gmap = this.refs.gmap;

    this.refs.workspace.measure(function(ox, oy, width, height, px, py) {
      me.setState({
        mapHeight: height,
        mapWidth: width
      });
    });
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
        <View ref="workspace" style={styles.workspace} onLayout={this.onLayout}>
          <RNGMap
            ref={'gmap'}
            style={{width: this.state.mapWidth, height: this.state.mapHeight}}
            markers={this.state.markers}
            zoomLevel={this.state.zoom}
            onMapChange={(e) => console.log(e)}
            onMapError={(e) => console.log('Map error --> ', e)}
            center={this.state.center} />

        </View>
        <View style={commonStyles.bottomToolbar}>
          <Icon.Button name={this.state.navigateButtonIcon} onPress={this.onClickLocate} size={25} color="#000" underlayColor="#ccc" backgroundColor="transparent" style={styles.btnNavigate} />
          <Text style={{fontWeight: 'bold', fontSize: 18, flex: 1, textAlign: 'center'}}>{this.state.odometer} km</Text>
          <Icon.Button name={this.state.paceButtonIcon} onPress={this.onClickPace} iconStyle={commonStyles.iconButton} style={this.state.paceButtonStyle}><Text>State</Text></Icon.Button>
          <Text>&nbsp;</Text>
        </View>
      </View>
    );
  }
});

module.exports = Home;
