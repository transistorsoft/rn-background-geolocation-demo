'use strict';

import React, { Component } from 'react';
import {
  AppRegistry,
  StyleSheet,
  View,
  TouchableHighlight,
  StatusBar,
  Text,
  PermissionsAndroid
 } from 'react-native';

import Icon from 'react-native-vector-icons/Ionicons';
import BackgroundGeolocation from 'react-native-background-geolocation';

async function requestLocationPermission() {
  try {
    const granted = await PermissionsAndroid.requestPermission(PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION);
    if (granted) {
      console.log("You can location")
    } else {
      console.log("Location permission denied")
    }
  } catch (err) {
    console.warn(err)
  }
}

global.BackgroundGeolocation = BackgroundGeolocation;

import HomeView from './components/HomeView';

var Application = React.createClass({
  getInitialState: function() {
    return {
      drawer: undefined
    };
  },

  componentDidMount: function() {
    var me = this;
    //requestLocationPermission();
    this.setState({

    });
  },

  render: function() {
    return (
      <HomeView />
    );
  }
});


var styles = StyleSheet.create({

});

AppRegistry.registerComponent('RNBackgroundGeolocationSample', () => Application);