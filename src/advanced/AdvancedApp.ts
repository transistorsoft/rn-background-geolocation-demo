/**
* The AdvancedApp contains its own child-router for routing to:
* - SettingsView
* - GeofenceView
* - AboutView
*/

//////////////////////////////////////////////////////////////////////////////////////
//
// IGNORE WARNINGS FOR NOW.  I think react-navigation is responsible for following:
// - ViewPagerAndroid has been extracted from react-native core
// - Slider has been extracted from react-native core.
//
///////////////////////////////////////////////////////////////////////////////////////

console.disableYellowBox = true;

import React from 'react'
import {Component} from 'react';

import { createAppContainer, createStackNavigator } from 'react-navigation';

import HomeView from './HomeView';
import SettingsView from './SettingsView';
import GeofenceView from './GeofenceView';
import AboutView from './AboutView';

const AdvancedApp = createStackNavigator({
  Home: {
    screen: HomeView
  },
  Settings: {
    screen: SettingsView
  },
  Geofence: {
    screen: GeofenceView
  },
  About: {
    screen: AboutView
  }
}, {
  initialRouteName: 'Home',
  headerMode: 'none',
  mode: 'modal'
});

export default createAppContainer(AdvancedApp);