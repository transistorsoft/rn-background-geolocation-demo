/**
* This is the Application's root navigator which automatically routes to the currently
* selected example app.
* - HelloWorld
* - SimpleMap
* - Advanced
*
* The default route is home/Home
*
* This file contains nothing related to Background Geolocation plugin.  This is just
* boilerplate routing stuff.
*/
import React, { Component } from 'react';
import {
  View,
  Text,
  StyleSheet
} from 'react-native';

import AsyncStorage from '@react-native-community/async-storage';

import { createAppContainer, createStackNavigator, StackActions, NavigationActions } from 'react-navigation';

import Home from './home/Home';
import HelloWorld from './hello-world/HelloWorld';
import SimpleMap from './simple-map/SimpleMap';
import AdvancedApp from './advanced/AdvancedApp';

class Root extends React.Component<any, any> {
  static DEFAULT_PAGE = "Home";

  componentDidMount() {
    let navigation = this.props.navigation;

    // Fetch current routeName (ie: HelloWorld, SimpleMap, Advanced)
    AsyncStorage.getItem("@transistorsoft:initialRouteName", (err, page) => {
      let params:any = {username: undefined};
      if (!page) {
        // Default route:  Home
        AsyncStorage.setItem("@transistorsoft:initialRouteName", Root.DEFAULT_PAGE);
      }
      // Append username to route params.
      AsyncStorage.getItem("@transistorsoft:username", (err, username) => {
        // Append username to route-params
        if (username) { params.username = username; }
        let action = StackActions.reset({
          index: 0,
          actions: [
            NavigationActions.navigate({
              routeName: page || Root.DEFAULT_PAGE,
              params: params,
            })
          ],
          key: null
        });
        navigation.dispatch(action);
      });
    });
  }
  render() {
    return (<View></View>);
  }
}

const AppNavigator = createStackNavigator({
  Root: {
    screen: Root,
  },
  Home: {
    screen: Home
  },
  HelloWorld: {
    screen: HelloWorld
  },
  SimpleMap: {
    screen: SimpleMap
  },
  Advanced: {
    screen: AdvancedApp
  }
}, {
  initialRouteName: 'Root',
  headerMode: 'none',
  onTransitionStart: (transition:any) => {
    // Store the current page route as the initialRouteName so that app boots immediately
    // into the currently selected SampleApp
    // - HelloWorld
    // - SimpleMap
    // - Advanced
    let routeName = transition.scene.route.routeName;
    AsyncStorage.setItem("@transistorsoft:initialRouteName", routeName);
  }
});

export default createAppContainer(AppNavigator);

