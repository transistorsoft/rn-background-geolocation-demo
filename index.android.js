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
import BackgroundGeolocation from 'react-native-background-geolocation-android';


global.BackgroundGeolocation = BackgroundGeolocation;

import HomeView from './components/HomeView';
import SettingsView from './components/SettingsView';

var Application = React.createClass({
  getInitialState: function() {
    return {
      drawer: undefined
    };
  },

  componentDidMount: function() {
    var me = this;

    this.setState({

    });
  },
  onClickMenu: function() {
    this.props.refs.drawer.open();
  },

  render: function() {
    return (
      <Drawer ref="drawer" side="right" acceptPan={false} content={<SettingsView drawer={this.refs.drawer} locationManager={BackgroundGeolocation} />}>
        <HomeView drawer={this.refs.drawer} />
      </Drawer>
    );
  }
});


var styles = StyleSheet.create({

});

AppRegistry.registerComponent('RNBackgroundGeolocationSample', () => Application);