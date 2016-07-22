'use strict';


import SettingDetail from '../../components/SettingDetail';
import React, { Component } from 'react';
import {
  StyleSheet,
  Text,
  View,
  SwitchIOS
 } from 'react-native';

import Mapbox from 'react-native-mapbox-gl';
import EventEmitter from 'EventEmitter';

var mapRef = 'mapRef';

import Icon from 'react-native-vector-icons/Ionicons';
import SettingsService from '../../components/SettingsService';
import commonStyles from '../../components/styles';
import Config from '../../components/config';
import BottomToolbar from '../../components/BottomToolbar';

var styles = StyleSheet.create({
  workspace: {
    flex: 1
  },
  map: {
    flex: 1
  },
  toolbarContainer: {
    flexDirection: "row",
    alignItems: "center"
  }
});

SettingsService.init('iOS');

var Home = React.createClass({
  mixins: [Mapbox.Mixin],
  annotations: [],
  currentLocation: undefined,
  locationManager: undefined,
  eventEmitter: new EventEmitter(),

  getInitialState: function() {
    return {
      enabled: false,
      zoom: 10,
      annotations: [],
      center: {
        latitude: 40.72052634,
        longitude: -73.97686958312988
      },
      zoom: 12
    };
  },

  componentDidMount: function() {

    var me = this,
        gmap = this.refs.gmap;

    this.locationManager = this.props.locationManager;

    // location event
    this.locationManager.on("location", function(location) {
      console.log('- location: ', JSON.stringify(location, null, 2));
      if (location.sample) {
        console.log('<sample location>');
        return;
      }
      me.addMarker(location);
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
      me.locationManager.removeGeofence(geofence.identifier);
    });
    // error event
    this.locationManager.on("error", function(error) {
      console.log('- ERROR: ', JSON.stringify(error));
    });
    // motionchange event
    this.locationManager.on("motionchange", function(event) {
      console.log("- motionchange", JSON.stringify(event, null, 2));
    });
    // heartbeat event
    this.locationManager.on("heartbeat", function(params) {
      console.log("- heartbeat: ", params.location);
    });
    // schedule event
    this.locationManager.on("schedule", function(state) {
      console.log("- schedule fired: ", state.enabled, state);
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

    // Fetch settings and configure.
    SettingsService.getValues(function(values) {

      //values.schedule = SettingsService.generateSchedule(24, 1, 1, 1);
      
      // Configure BackgroundGeolocaiton!
      me.locationManager.configure(values, function(state) {
        console.log('- configure, current state: ', state);
        me.eventEmitter.emit('enabled', state.enabled);
        me.locationManager.startSchedule(function() {
          console.log('- Schedule start success');
        });

        me.setState({
          enabled: state.enabled
        });

        if (state.enabled) {
          me.initializePolyline();
        }
      });
    });

    this.setState({
      enabled: false
    });
  },
  addMarker :function(location) {
    this.addAnnotations(mapRef, [this.createMarker(location)]);
    if (this.polyline) {
      this.polyline.coordinates.push([location.coords.latitude, location.coords.longitude]);
      this.updateAnnotation(mapRef, this.polyline);
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
    var enabled = !this.state.enabled;

    if (enabled) {
      this.locationManager.start(function() {
        me.initializePolyline();
      });
    } else {
      this.locationManager.removeGeofences();
      this.locationManager.stop();
      this.locationManager.resetOdometer();
      this.removeAllAnnotations(mapRef);
      this.polyline = null;
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
    this.setCenterCoordinateAnimated(mapRef, location.coords.latitude, location.coords.longitude)
  },
  // MapBox
  onRegionChange: function(location) {
    this.setState({ currentZoom: location.zoom });
  },
  onRegionWillChange:function(location) {
    console.log(location);
  },
  onUpdateUserLocation:function(location) {
    console.log(location);
  },
  onOpenAnnotation:function(annotation) {
    console.log(annotation);
  },
  onRightAnnotationTapped:function(e) {
    console.log(e);
  },
  
  render: function() {
    return (
      <View style={commonStyles.container}>
        <View style={commonStyles.iosStatusBar} />
        <View style={commonStyles.topToolbar}>
          <Icon.Button name="ios-options" onPress={this.onClickMenu} backgroundColor="transparent" size={30} color="#000" style={styles.btnMenu} underlayColor={"transparent"} />
          <Text style={commonStyles.toolbarTitle}>Background Geolocation</Text>
          <SwitchIOS onValueChange={this.onClickEnable} value={this.state.enabled} />
        </View>
        <View ref="workspace" style={styles.workspace}>
          <Mapbox
            style={styles.map}
            direction={0}
            rotateEnabled={true}
            scrollEnabled={true}
            zoomEnabled={true}
            showsUserLocation={false}
            ref={mapRef}
            accessToken={'pk.eyJ1IjoiY2hyaXN0b2NyYWN5IiwiYSI6ImVmM2Y2MDA1NzIyMjg1NTdhZGFlYmZiY2QyODVjNzI2In0.htaacx3ZhE5uAWN86-YNAQ'}
            styleURL={this.mapStyles.emerald}
            userTrackingMode={this.userTrackingMode.none}
            centerCoordinate={this.state.center}
            zoomLevel={this.state.zoom}
            onRegionChange={this.onRegionChange}
            onRegionWillChange={this.onRegionWillChange}
            annotations={this.state.annotations}
            onOpenAnnotation={this.onOpenAnnotation}
            onRightAnnotationTapped={this.onRightAnnotationTapped}
            onUpdateUserLocation={this.onUpdateUserLocation} />
        </View>
        <BottomToolbar locationManager={this.props.locationManager} eventEmitter={this.eventEmitter} enabled={this.state.enabled} />
      </View>
    );
  }
});


module.exports = Home;

