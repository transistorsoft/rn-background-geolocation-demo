/**
 * Background Geolocation Demo App.
 * Transistor Software.
 */

import React, { Component } from 'react';
import {
  AsyncStorage
} from 'react-native';

import { NavigationActions, StackActions } from 'react-navigation';

import {StyleProvider} from "native-base";
import Navigator from './Navigator';

export default class App extends Component<{}> {
  /**
  * Helper method for resetting the router to Home screen
  */
  static goHome(navigation) {
    AsyncStorage.setItem("@transistorsoft:initialRouteName", 'Home');
    let action = StackActions.reset({
      index: 0,
      actions: [
        NavigationActions.navigate({ routeName: 'Home', params: navigation.state.params})
      ],
      key: null
    });
    navigation.dispatch(action);    
  }

  static setRootRoute(routeName) {
    AsyncStorage.setItem("@transistorsoft:initialRouteName", routeName);
  }

  render() {
    return (
      <Navigator />
    );
  }
}
