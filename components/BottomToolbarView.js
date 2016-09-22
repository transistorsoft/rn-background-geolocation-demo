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

    var bgGeo = this.props.locationManager;

    bgGeo.on('activitychange', function(activityName) {
      this.setState({
        currentActivity: activityName
      });
    }.bind(this));

    bgGeo.on('providerchange', function(provider) {
      this.setState({
        currentProvider: provider
      });
    }.bind(this));

    bgGeo.on("location", function(location) {
      if (location.sample) { return; }
      me.setState({
        odometer: (location.odometer/1000).toFixed(1)
      });
    });

    bgGeo.on("motionchange", function(event) {
      console.log('motionchange: ', event);

      me.setState({
        isMoving: event.isMoving
      });
    });

    bgGeo.getState(function(state) {
      this.setState({
        enabled: state.enabled,
        isMoving: state.isMoving,
        odometer: state.odometer
      });
    }.bind(this));
  },
  onChangeEnabled: function(enabled) {
    this.setState({
      enabled: enabled
    });
  },
  onClickPace: function() {
    if (!this.state.enabled) { return; }

    var isMoving = !this.state.isMoving;
    var bgGeo = this.props.locationManager;    

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
    var bgGeo = this.props.locationManager;

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
    var button = <Icon.Button name={icon} onPress={this.onClickPace} iconStyle={{marginLeft:12}} style={[style, {paddingLeft:5}]} />
    if (this.state.isChangingPace) {
      spinner = Config.icons.spinner;
    }
    return (
      <View style={styles.paceButtonContainer}>{spinner}{button}</View>
    );
  },

  render: function() {
    return (
      <View style={commonStyles.bottomToolbar}>
        <View style={styles.navigateContainer}>
          <Icon.Button name={Config.icons.navigate} onPress={this.onClickLocate} size={30} color="#000" backgroundColor="#eee" underlayColor="green" style={styles.btnNavigate} />
          {Config.getLocationProviders(this.state.currentProvider)}
        </View>
        <View style={styles.statusContainer}>
          <Text style={styles.statusLabel}>Activity</Text>
          {Config.getActivityIcon(this.state.currentActivity)}
          <Text style={styles.statusLabel}>{this.state.odometer}km</Text>
        </View>        
        {this.getPaceButton()}
        <Text>&nbsp;</Text>
      </View>
    );
  }
});

var styles = StyleSheet.create({
  navigateContainer: {
    flex:0.3,
    flexDirection:"row", 
    justifyContent:"flex-start", 
    alignItems:"center"
  },
  paceButtonContainer: {
    flex:0.3, 
    flexDirection:"row", 
    alignItems:"center", 
    justifyContent:"flex-end"
  },
  btnNavigate: {
    padding: 3,
    paddingLeft: 10
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
  }
});

module.exports = BottomToolbarView;