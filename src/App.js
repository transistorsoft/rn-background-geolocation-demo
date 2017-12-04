/**
 * Background Geolocation Demo App.
 * Transistor Software.
 */

import React, { Component } from 'react';

import { StackNavigator, NavigationActions } from 'react-navigation';

import {StyleProvider} from "native-base";
import Navigator from './Navigator';

export default class App extends Component<{}> {
  /**
  * Helper method for resetting the router to Home screen
  */
  static goHome(navigation) {
    navigation.dispatch(NavigationActions.reset({
      index: 0,
      key: null,
      actions: [
        NavigationActions.navigate({ routeName: 'Home', params: navigation.state.params})
      ]
    }));
  }
  render() {
    return (
      <Navigator />
    );
  }
}
