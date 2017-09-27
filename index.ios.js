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

import Icon from 'react-native-vector-icons/Ionicons';
import BackgroundGeolocation from 'react-native-background-geolocation';

global.BackgroundGeolocation = BackgroundGeolocation;

import Config from './components/config';
import HomeView from './components/HomeView';

export default class Application extends Component {
  componentDidMount() {
    StatusBar.setBarStyle('default');
  }
  render() {
    return (
      <View style={{backgroundColor: Config.colors.gold, flex: 1, paddingTop:17}}>
        <HomeView />
      </View>
    );
  }
}

AppRegistry.registerComponent('RNBackgroundGeolocationSample', () => Application);