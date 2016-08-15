'use strict';

import React, { Component } from 'react';
import {
  StyleSheet,
  Text,
  View
 } from 'react-native';

import Icon from 'react-native-vector-icons/Ionicons';
import Styles from './styles';

var config = (function() {
  
  return {
    sounds: {
      "LONG_PRESS_ACTIVATE_IOS": 1113,
      "LONG_PRESS_ACTIVATE_ANDROID": 27,
      "LONG_PRESS_CANCEL_IOS": 1075,
      "LONG_PRESS_CANCEL_ANDROID": 94,
      "ADD_GEOFENCE_IOS": 1114,
      "ADD_GEOFENCE_ANDROID": 28,
      "BUTTON_CLICK_IOS": 1104,
      "BUTTON_CLICK_ANDROID": 89,
      "MESSAGE_SENT_IOS": 1303,
      "MESSAGE_SENT_ANDROID": 90,
      "ERROR_IOS": 1006
    },

    icons: {
      play: 'md-play',
      pause: 'md-pause',
      navigate: 'md-navigate',
      load: 'ios-sync',

      spinner: <Icon name="ios-sync" size={20} style={{marginRight:3}} />,
      disabled: <Icon name="ios-warning" size={20} style={{color: "#D9534F"}} />,
      network: <Icon name="ios-wifi" size={20} style={{marginRight:5}}/>,
      gps: <Icon name="ios-locate" size={20} style={{marginRight:5}}/>,
      on_foot: <Icon name="ios-walk" size={20} style={{color:"#000"}} />,
      still: <Icon name="ios-man" size={20} style={{color:"#000"}}/>,
      walking: <Icon name="ios-walk" size={20} style={{color:"#000"}}/>,
      running: <Icon name="ios-walk" size={20} style={{color:"#000"}}/>,
      in_vehicle: <Icon name="ios-car" size={20}style={{color:"#000"}}/>,
      on_bicycle: <Icon name="ios-bicycle" size={20} style={{color:"#000"}} />,
      unknown: <Icon name="ios-help-circle" size={20} style={{color:"#666"}}/>
    },
    getActivityIcon(activityName) {
      var icon = this.icons[activityName];
      var bgColor;
      switch(activityName) {
        case 'still':
          bgColor = Styles.redButton;
          break;
        case 'unknown':
          bgColor = {backgroundColor: "#ccc"}
          break;
        default:
          bgColor = Styles.greenButton;
      }
      return (
        <View style={[Styles.labelActivity]}>
          {icon}
        </View>
      );
    },
    getLocationProviders(provider) {
      var iconGps = undefined;
      var iconNetwork = undefined;
      var iconDisabled = undefined;

      if (provider) {
        if (!provider.enabled) {
          iconDisabled = config.icons.disabled;
        } else {
          if (provider.gps) {
            iconGps = config.icons.gps;
          }
          if (provider.network) {
            iconNetwork = config.icons.network
          }
        }
      }
      return (
        <View style={{flexDirection:"row", alignItems: "center", marginLeft:3}}>
          {iconDisabled}
          {iconGps}
          {iconNetwork}
        </View>
      )
    }
  }
})();

module.exports = config;