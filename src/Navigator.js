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
  AsyncStorage,
  View,
  Text,
  StyleSheet
} from 'react-native';

import { StackNavigator, NavigationActions } from 'react-navigation';

import Home from './home/Home';
import HelloWorld from './hello-world/HelloWorld';
import SimpleMap from './simple-map/SimpleMap';
import AdvancedApp from './advanced/AdvancedApp';

class Root extends Component<{}> {  
  componentDidMount() {
    let navigation = this.props.navigation;

    // Fetch current routeName (ie: HelloWorld, SimpleMap, Advanced)
    AsyncStorage.getItem("@transistorsoft:initialRouteName", (err, page) => {
      let params = {username: undefined};
      if (!page) {
        // Default route:  Home
        page = "Home";
        AsyncStorage.setItem("@transistorsoft:initialRouteName", page);
      }
      // Append username to route params.
      AsyncStorage.getItem("@transistorsoft:username", (err, username) => {
        // Append username to route-params
        if (username) { params.username = username; }
        navigation.dispatch(NavigationActions.reset({
          index: 0,
          key: null,
          actions: [
            NavigationActions.navigate({ routeName: page, params: params})
          ]
        }));        
      });
    });
  }
  render() {
    return (<View></View>);
  }
}

export default Navigator = StackNavigator({
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
  onTransitionStart: (transition) => {
    // Store the current page route as the initialRouteName so that app boots immediately
    // into the currently selected SampleApp
    // - HelloWorld
    // - SimpleMap
    // - Advanced
    let routeName = transition.scene.route.routeName;
    AsyncStorage.setItem("@transistorsoft:initialRouteName", routeName);
  }
});
