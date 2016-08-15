'use strict';

import React, { Component } from 'react';
import {
  AppRegistry,
  StyleSheet,
  View,
  TouchableHighlight,
  StatusBar,
  Text
 } from 'react-native';

import Drawer from 'react-native-drawer';
import Icon from 'react-native-vector-icons/Ionicons';
import BackgroundGeolocation from 'react-native-background-geolocation';

global.bgGeo = BackgroundGeolocation;

import MapView from './components/MapView';
import SettingsView from './components/SettingsView';

var Application = React.createClass({
  getInitialState: function() {
    return {
      drawer: undefined
    };
  },
  componentDidMount: function() {
    var me = this;
    StatusBar.setBarStyle('default');
    this.setState({
      drawer: this.refs.drawer
    });
  },
  onClickMenu: function() {
    this.refs.drawer.open();
  },
  getDrawer: function() {
    return this.refs.drawer;
  },
  render: function() {
    return (
      <View style={{backgroundColor: "#ffd700", flex: 1, paddingTop:17}}>
        <Drawer ref="drawer" side="right" acceptPan={false} content={<SettingsView drawer={this.refs.drawer} locationManager={BackgroundGeolocation} />}>
          <MapView drawer={this.state.drawer} locationManager={BackgroundGeolocation} />    
        </Drawer>
      </View>
    );
  }
});

AppRegistry.registerComponent('RNBackgroundGeolocationSample', () => Application);