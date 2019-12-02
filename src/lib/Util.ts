import { Alert } from 'react-native';

import { NavigationActions, StackActions } from 'react-navigation';

import BackgroundGeolocation from "../react-native-background-geolocation";

import AsyncStorage from '@react-native-community/async-storage';

import ENV from '../ENV';

export default class Util {
	/**
  * Helper method for resetting the router to Home screen
  */
  static navigateHome(navigation:any) {
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
}