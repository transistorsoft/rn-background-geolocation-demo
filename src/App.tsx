/**
 * Background Geolocation Demo App.
 * Transistor Software.
 */

import React, { Component } from 'react';

import AsyncStorage from '@react-native-community/async-storage';

import { createAppContainer, NavigationActions, StackActions } from 'react-navigation';

import {StyleProvider} from "native-base";
import Navigator from './Navigator';

import BackgroundGeolocation from "react-native-background-geolocation";

import {registerTransistorAuthorizationListener} from './lib/Authorization';

const AppContainer = createAppContainer(Navigator);

export default class App extends React.Component<{}> {

  static setRootRoute(routeName:string) {
    AsyncStorage.setItem("@transistorsoft:initialRouteName", routeName);
  }

  render() {
    return (
      <AppContainer />
    );
  }
}
