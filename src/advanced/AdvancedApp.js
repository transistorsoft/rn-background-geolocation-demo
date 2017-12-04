/**
* The AdvancedApp contains its own child-router for routing to:
* - SettingsView
* - GeofenceView
* - AboutView
*/
import React, { Component } from 'react';

import { StackNavigator, NavigationActions } from 'react-navigation';

import HomeView from './HomeView';
import SettingsView from './SettingsView';
import GeofenceView from './GeofenceView';
import AboutView from './AboutView';

export default AdvancedApp = StackNavigator({
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