import React, { Component } from 'react';
import {
  StyleSheet,
  Text,
  View
 } from 'react-native';
import Config from './config';
import Icon from 'react-native-vector-icons/Ionicons';
import commonStyles from './styles';

/**
* This is the common shared bottom-toolbar.  It's passed the BackgroundGeolocation instance
* via #props.  It manages the #changePace, #getCurrentPosition buttons, #odometer, #activity
* and location #provider.
*/
var BottomToolbarView = React.createClass({

  getInitialState: function() {
    return {
      enabled: false,
      isMoving: false,
      isChangingPace: false,
      odometer: (0/1).toFixed(1),
      currentActivity: 'unknown',
      currentProvider: undefined
    };
  },

  componentDidMount: function() {
    var me = this;

    // Listen to events from our parent
    this.props.eventEmitter.addListener('enabled', this.onChangeEnabled);

    var bgGeo = global.BackgroundGeolocation;

    bgGeo.on("activitychange", this.onActivityChange);
    bgGeo.on("providerchange", this.onProviderChange);
    bgGeo.on("location", this.onLocation);
    bgGeo.on("motionchange", this.onMotionChange);

    bgGeo.getState(function(state) {
      this.setState({
        enabled: state.enabled,
        isMoving: state.isMoving,
        odometer: state.odometer
      });
    }.bind(this));
  },
  componentWillUnmount: function() {
    // Unregister BackgroundGeolocation listeners!
    var bgGeo = global.BackgroundGeolocation;
    bgGeo.un("activitychange", this.onActivityChange);
    bgGeo.un("providerchange", this.onProviderChange);
    bgGeo.un("location", this.onLocation);
    bgGeo.un("motionchange", this.onMotionChange);

    this.props.eventEmitter.removeListener('enabled', this.onChangeEnabled);

  },
  onActivityChange: function(activityName) {
    this.setState({
      currentActivity: activityName
    });
  },
  onProviderChange: function(provider) {
    this.setState({
      currentProvider: provider
    });
  },
  onChangeEnabled: function(enabled) {
    this.setState({
      enabled: enabled
    });
  },
  onLocation: function(location) {
    if (location.sample) { return; }
    this.setState({
      odometer: (location.odometer/1000).toFixed(1)
    });
  },
  onMotionChange: function(event) {
    console.log('motionchange: ', event);

    this.setState({
      isMoving: event.isMoving
    });
  },
  onClickPace: function() {
    if (!this.state.enabled) { return; }

    var isMoving = !this.state.isMoving;
    var bgGeo = global.BackgroundGeolocation;

    this.setState({
      isMoving: isMoving,
      isChangingPace: true
    });

    bgGeo.changePace(isMoving, function(state) {
      this.setState({
        isChangingPace: false
      });
    }.bind(this), function(error) {
      console.info("Failed to changePace: ", error);
      this.setState({
        isMoving: !isMoving // <-- reset state back
      });
    }.bind(this));
  },
  onClickLocate: function() {
    var bgGeo = global.BackgroundGeolocation

    bgGeo.getCurrentPosition({
      timeout: 30,
      samples: 3,
      desiredAccuracy: 10,
      maximumAge: 0,
      persist: false
    }, function(location) {
      console.log('- current position: ', JSON.stringify(location));
    }, function(error) {
      console.info('ERROR: Could not get current position', error);
    }.bind(this));
  },
  getPaceButton: function() {
    var icon = Config.icons.play;
    var style = commonStyles.disabledButton;

    if (this.state.enabled) {
      if (this.state.isMoving) {
        icon = Config.icons.pause;
        style = commonStyles.redButton;
      } else {
        icon = Config.icons.play;
        style = commonStyles.greenButton;
      }
    }
    var spinner = undefined;
    var button = <Icon.Button name={icon} onPress={this.onClickPace} iconStyle={{marginLeft:15}} style={[style, styles.paceButton]} />
    if (this.state.isChangingPace) {
      spinner = Config.icons.spinner;
    }
    return (
      <View style={styles.paceButtonContainer}>
        {spinner}
        <View style={[style, {flexDirection: 'row'}]}>{button}</View>
      </View>
    );
  },

  render: function() {
    return (
      <View style={styles.bottomToolbar}>
        <View style={styles.navigateContainer}>
          <Icon.Button name={Config.icons.navigate} onPress={this.onClickLocate} size={30} color="black" backgroundColor="transparent" style={styles.btnNavigate} />
          {Config.getLocationProviders(this.state.currentProvider)}
        </View>
        <View style={styles.statusContainer}>
          <Text style={styles.statusLabel}>Activity</Text>
          {Config.getActivityIcon(this.state.currentActivity)}
          <Text style={styles.statusLabel}>{this.state.odometer}km</Text>
        </View>
        {this.getPaceButton()}
      </View>
    );
  }
});

var styles = StyleSheet.create({
  bottomToolbar: {
    borderTopColor: '#ccc',
    borderTopWidth: 1,
    backgroundColor: '#eee',
    flexDirection: 'row',
    height: 50
  },
  navigateContainer: {
    flex:0.4,
    flexDirection:"row",
    justifyContent:"flex-start",
    alignItems:"center"
  },
  btnNavigate: {
    padding: 3,
    flex: 1,
    borderRadius: 0,
    paddingLeft: 15
  },
  statusContainer: {
    flex:1,
    flexDirection: "row",
    alignItems:"center",
    justifyContent: "center"
  },
  labelActivity: {
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 3,
    width: 40,
    padding: 3
  },
  statusLabel: {
    marginLeft:5
  },
  paceButtonContainer: {
    flex:0.4,
    flexDirection:"row",
    alignItems:"stretch",
    justifyContent:"flex-end"
  },
  paceButton: {
    flex: 1,
    borderRadius: 0
  }
});

module.exports = BottomToolbarView;