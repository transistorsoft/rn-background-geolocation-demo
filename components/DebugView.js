'use strict';

import React, { Component } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  View,
  ScrollView,
  AsyncStorage,
  Switch,
  Picker,
  TouchableHighlight,
  TouchableWithoutFeedback
 } from 'react-native';

import Icon from 'react-native-vector-icons/Ionicons';
import { RadioButtons } from 'react-native-radio-buttons'

import SettingsService from './SettingsService';
import commonStyles from './styles';
import Config from './config';

const STORAGE_KEY = "@TSLocationManager";

var DebugView = React.createClass({

  bgGeo: undefined,

  getInitialState() {
    this.bgGeo = global.BackgroundGeolocation;
    this.bgGeo.getState(function(state) {
      var logLevel = this.decodeLogLevel(state.logLevel), 
          trackingMode = 'location', 
          debug = true;

      var trackingMode = (state.trackingMode === 1 || state.trackingMode === 'location') ? 'location' : 'geofence';

      this.setState({
        desiredAccuracy: state.desiredAccuracy,
        distanceFilter: state.distanceFilter,
        disableElasticity: state.disableElasticity,
        geofenceProximityRadius: (state.geofenceProximityRadius/1000)+'km',
        autoSync: state.autoSync,
        autoSyncThreshold: state.autoSyncThreshold,
        batchSync: state.batchSync,
        stopOnTerminate: state.stopOnTerminate,
        startOnBoot: state.startOnBoot,
        logLevel: logLevel,
        debug: state.debug,
        trackingMode: trackingMode
      });
    }.bind(this));

    AsyncStorage.getItem(STORAGE_KEY + ":email", function(err, value) {
      this.setState({email: value});
    }.bind(this));

    return {
      desiredAccuracy: 0,
      distanceFilter: 0,
      disableElasticity: false,
      trackingMode: 'location',
      geofenceProximityRadius: '1km',
      autoSync: false,
      autoSyncThreshold: 0,
      batchSync: false,
      stopOnTerminate: true,
      startOnBoot: false,
      email: undefined,
      logLevel: 'ALL',
      debug: true,
      notifyOnEntry: true,
      notifyONExit: false,
      notifyOnDwell: false,
      showMapMarkers: true,
      loiteringDelay: 1000,
      isLoadingGeofences: false
    };
  },

  componentDidMount() {
    
  },

  decodeLogLevel(value) {
    switch(value) {
      case 0:
        value = 'OFF';
        break;
      case 1:
        value = 'ERROR';
        break;
      case 2:
        value = 'WARN';
        break;
      default:
        value = 'ALL';
        break;
    }
    return value;
  },
  update: function(name, value) {
    var state = {};
    switch (name) {
      case 'logLevel':
        value = this.decodeLogLevel(value);
        break;
      case 'geofenceProximityRadius':
        value = (value/1000) + 'km';
        break;
    };
    state[name] = value;
    this.setState(state);
  },

  onShow() {
    console.log('onShow: DebugView');
  },

  onClickSync() {
    var bgGeo = this.bgGeo;
    bgGeo.sync(function(rs) {
      bgGeo.playSound(SettingsService.getSoundId('MESSAGE_SENT'));
    });
  },

  onClickLoadGeofences() {
    if (this.state.isLoadingGeofences) { return false; }
      this.setState({isLoadingGeofences: true});

      var data = SettingsService.getCityDriveData();
      var geofences = [];
      for (var n=0, len=data.length;n<len;n++) {
        geofences.push({
          identifier: 'city_drive_' + (n+1),
          extras: {
            "geofence_extra_foo": "extra geofence data"
          },
          latitude: data[n].lat,
          longitude: data[n].lng,
          radius: 200,
          notifyOnEntry: this.state.notifyOnEntry,
          notifyOnExit: this.state.notifyOnExit,
          notifyOnDwell: this.state.notifyOnDwell,
          loiteringDelay: this.state.loiteringDelay
        });
      }
      this.bgGeo.addGeofences(geofences, function() {
        this.setState({isLoadingGeofences: false});
        this.bgGeo.playSound(SettingsService.getSoundId('ADD_GEOFENCE'));
      }.bind(this));
  },

  onClickClearGeofences() {
    this.bgGeo.playSound(SettingsService.getSoundId('MESSAGE_SENT'));
    this.bgGeo.removeGeofences();
  },

  onClickEmailLogs() {
    if (!this.state.email) {
      alert('Enter an email address');
      return;
    }
    AsyncStorage.setItem(STORAGE_KEY + ":email", this.state.email);
    this.bgGeo.emailLog(this.state.email);
  },
  setAutoSync(value) {
    var me = this;
    this.bgGeo.playSound(SettingsService.getSoundId('BUTTON_CLICK'));
    this.setState({autoSync: value});

    SettingsService.set('autoSync', value, function(state) {
      if (typeof(me.props.onChange) === 'function') {  // <-- Android
        me.props.onChange('autoSync', value);
      }
    });
  },

  setAutoSyncThreshold(value) {
    var me = this;
    this.bgGeo.playSound(SettingsService.getSoundId('BUTTON_CLICK'));
    this.setState({autoSyncThreshold: value});

    SettingsService.set('autoSyncThreshold', value, function(state) {
      if (typeof(me.props.onChange) === 'function') {  // <-- Android
        me.props.onChange('autoSyncThreshold', value);
      }
    });
  },

  setBatchSync(value) {
    var me = this;
    this.bgGeo.playSound(SettingsService.getSoundId('BUTTON_CLICK'));
    this.setState({batchSync: value});

    SettingsService.set('batchSync', value, function(state) {
      if (typeof(me.props.onChange) === 'function') {  // <-- Android
        me.props.onChange('batchSync', value);
      }
    });
  },

  setTrackingMode(trackingMode){
    this.bgGeo.playSound(SettingsService.getSoundId('BUTTON_CLICK'));
    this.setState({
      trackingMode
    });
    if (trackingMode == "location") {
      this.bgGeo.start();
    } else {
      this.bgGeo.startGeofences();
    }
    if (typeof(this.props.onChange) === 'function') {  // <-- Android
      this.props.onChange('trackingMode', trackingMode);
    }
  },

  setLogLevel(logLevel) {
    var me = this;
    this.bgGeo.playSound(SettingsService.getSoundId('BUTTON_CLICK'));
    this.setState({logLevel});
    var decodedLogLevel = 0;
    switch(logLevel) {
      case 'OFF':
        decodedLogLevel = this.bgGeo.LOG_LEVEL_OFF;
        break;
      case 'ERROR':
        decodedLogLevel = this.bgGeo.LOG_LEVEL_ERROR;
        break;
      case 'WARN':
        decodedLogLevel = this.bgGeo.LOG_LEVEL_WARNING;
        break;
      case 'ALL':
        decodedLogLevel = this.bgGeo.LOG_LEVEL_VERBOSE;
        break;
    }
    SettingsService.set('logLevel', decodedLogLevel, function(state) {
      if (typeof(me.props.onChange) === 'function') {  // <-- Android
        me.props.onChange('logLevel', decodedLogLevel);
      }
    });
  },

  setGeofenceProximityRadius(value) {
    var me = this;
    this.bgGeo.playSound(SettingsService.getSoundId('BUTTON_CLICK'));
    var state = {geofenceProximityRadius: value}
    this.setState(state);
    var decodedValue = parseInt(value.match(/[0-9]+/)[0], 10)*1000;

    SettingsService.set('geofenceProximityRadius', decodedValue, function(state) {
      if (typeof(me.props.onChange) === 'function') {  // <-- Android
        me.props.onChange('geofenceProximityRadius', decodedValue);
      }
    });
  },

  setDebug(value) {
    var me = this;
    this.bgGeo.playSound(SettingsService.getSoundId('BUTTON_CLICK'));
    this.setState({debug: value});
    this.bgGeo.setConfig({debug: value});
    SettingsService.set('debug', value, function(state) {
      if (typeof(me.props.onChange) === 'function') {  // <-- Android
        me.props.onChange('debug', value);
      }
    });
  },

  createSetter(name) {
    var bgGeo = this.bgGeo;
    var me = this;
    var state = {};

    return function(value) {
      state[name] = value;
      bgGeo.playSound(SettingsService.getSoundId('BUTTON_CLICK'));
      me.setState(state);
      bgGeo.setConfig(state);
      SettingsService.set(name, value, function(state) {
        if (typeof(me.props.onChange) === 'function') {  // <-- Android
          me.props.onChange(name, value);
        }
      });
    }
  },

  render() {
    const desiredAccuracyOptions = [0, 10, 100, 1000];
    const trackingModeOptions = ["location", "geofence"];
    const logLevelOptions = ["OFF", "ERROR", "WARN", "ALL"];
    const distanceFilterOptions = [0, 10, 20, 50, 100, 500];
    const geofenceProximityRadiusOptions = ['1km', '2km', '5km', '10km'];
    const autoSyncThresholdOptions = [0, 5, 10, 25, 50, 100];

    function renderRadioOption(option, selected, onSelect, index){
      var containerStyle, textStyle = {};
      if (selected) {
        containerStyle = {
          backgroundColor: '#0076ff',
          borderColor: '#0076ff',
          padding: 5,
          borderRadius: 3,
          borderWidth: 0
        };
        textStyle = {
          fontWeight: 'bold',
          textAlign: 'center',
          color: '#fff'
        };
      } else {
        containerStyle = {marginRight: 5, padding: 5};
      }

      return (
        <TouchableWithoutFeedback onPress={onSelect} key={index}>
          <View style={containerStyle}><Text style={textStyle}>{option}</Text></View>
        </TouchableWithoutFeedback>
      );
    }

    function renderRadioContainer(optionNodes){
      return <View style={{flexDirection: "row", backgroundColor: '#eee', padding: 3, borderRadius: 5, borderWidth: 1, borderColor: '#ccc'}}>{optionNodes}</View>
    }

    return (
      <ScrollView style={{backgroundColor: "#eee"}}>
        <View style={{marginBottom: 10}}>
          <Text style={styles.sectionHeading}>Geolocation</Text>
          <View style={styles.panel}>
            <View style={styles.setting}>
              <Text style={styles.label}>Tracking Mode</Text>
              <RadioButtons
                options={ trackingModeOptions }
                onSelection={this.setTrackingMode}
                selectedOption={this.state.trackingMode }
                renderOption={ renderRadioOption }
                renderContainer={renderRadioContainer}
              />
            </View>
            <View style={styles.setting}>
              <Text style={styles.label}>desiredAccuracy</Text>
              <RadioButtons
                options={ desiredAccuracyOptions }
                onSelection={this.createSetter('desiredAccuracy')}
                selectedOption={this.state.desiredAccuracy }
                renderOption={ renderRadioOption }
                renderContainer={renderRadioContainer}
              />
            </View>
            <View style={styles.setting}>
              <Text style={styles.label}>distanceFilter</Text>
              <RadioButtons
                options={ distanceFilterOptions }
                onSelection={this.createSetter('distanceFilter')}
                selectedOption={this.state.distanceFilter }
                renderOption={ renderRadioOption }
                renderContainer={renderRadioContainer}
              />
            </View>
            <View style={styles.setting}>
              <Text style={styles.label}>disableElasticity</Text>
              <Switch 
                value={this.state.disableElasticity}
                onValueChange={this.createSetter('disableElasticity')}
              />
            </View>
            <View style={styles.setting}>
              <Text style={styles.label}>geofenceProximityRadius</Text>
              <RadioButtons
                options={ geofenceProximityRadiusOptions }
                onSelection={this.setGeofenceProximityRadius}
                selectedOption={this.state.geofenceProximityRadius }
                renderOption={ renderRadioOption }
                renderContainer={renderRadioContainer}
              />
            </View>

          </View>
        </View>

        <View style={{marginBottom: 10}}>
          <Text style={styles.sectionHeading}>HTTP & Persistence</Text>
          <View style={styles.panel}>
            <View style={styles.setting}>
              <View style={styles.label}>
                <TouchableHighlight onPress={this.onClickSync} underlayColor="#c00" style={{alignItems: 'center', backgroundColor: "#ff3824", padding:12, borderRadius:5}}>
                  <Text style={{color: "#fff"}}>Sync</Text>
                </TouchableHighlight>
              </View>
            </View>
            <View style={styles.setting}>
              <Text style={styles.label}>autoSync</Text>
              <Switch 
                value={this.state.autoSync}
                onValueChange={this.createSetter('autoSync')}
              />
            </View>
            <View style={styles.setting}>
              <Text style={styles.label}>autoSyncThreshold</Text>
              <RadioButtons
                options={ autoSyncThresholdOptions }
                onSelection={this.createSetter('autoSyncThreshold')}
                selectedOption={this.state.autoSyncThreshold }
                renderOption={ renderRadioOption }
                renderContainer={renderRadioContainer}
              />
            </View>
            <View style={styles.setting}>
              <Text style={styles.label}>batchSync</Text>
              <Switch 
                value={this.state.batchSync}
                onValueChange={this.createSetter('batchSync')}
              />
            </View>
          </View>
        </View>

        <View style={{marginBottom: 10}}>
          <Text style={styles.sectionHeading}>Application</Text>
          <View style={styles.panel}>
            <View style={styles.setting}>
              <Text style={styles.label}>stopOnTerminate</Text>
              <Switch 
                value={this.state.stopOnTerminate}
                onValueChange={this.createSetter('stopOnTerminate')}
              />
            </View>
            <View style={styles.setting}>
              <Text style={styles.label}>startOnBoot</Text>
              <Switch 
                value={this.state.startOnBoot}
                onValueChange={this.createSetter('startOnBoot')}
              />
            </View>
          </View>
        </View>

        <View style={{marginBottom: 10}}>
          <Text style={styles.sectionHeading}>Logging & Debug</Text>
          <View style={styles.panel}>
            <View style={styles.setting}>
              <View style={styles.label}>
                <TouchableHighlight 
                  onPress={this.onClickEmailLogs} 
                  underlayColor="#00c" 
                  style={{alignItems: 'center', backgroundColor: "#0076ff", padding:12, borderRadius:5}}>
                  <Text style={{color: "#fff"}}>Email logs</Text>
                </TouchableHighlight>
                <TextInput
                  style={{height: 30, fontSize: 14, marginTop: 3, padding: 3, borderColor: '#ccc', borderWidth: 1}}
                  onChangeText={(email) => this.setState({email})}
                  placeholder="Email"
                  autoCapitalize="none"
                  keyboardType="email-address"
                  value={this.state.email}
                />
              </View>
            </View>

            <View style={styles.setting}>
              <Text style={styles.label}>Log level</Text>
              <RadioButtons
                options={ logLevelOptions }
                onSelection={this.setLogLevel}
                selectedOption={this.state.logLevel }
                renderOption={ renderRadioOption }
                renderContainer={renderRadioContainer}
              />
            </View>
            <View style={styles.setting}>
              <Text style={styles.label}>Sounds & Notifications</Text>
              <Switch 
                value={this.state.debug}
                onValueChange={this.createSetter('debug')}
              />
            </View>
          </View>
        </View>

        <View style={{marginBottom: 10}}>
          <Text style={styles.sectionHeading}>Geofencing Test-data (City Drive)</Text>
          <View style={styles.panel}>
            <View style={[styles.setting, {flexDirection:"row"}]}>
              <View style={styles.label}>
                <TouchableHighlight 
                  onPress={this.onClickClearGeofences}
                  underlayColor="#c00" 
                  style={{alignItems: 'center', backgroundColor: "#ff3824", padding:12, borderRadius:5}}>
                  <Text style={{color: "#fff"}}>Clear</Text>
                </TouchableHighlight>
              </View>
              <Text>&nbsp;&nbsp;&nbsp;</Text>
              <View style={styles.label}>
                <TouchableHighlight 
                  onPress={this.onClickLoadGeofences}
                  underlayColor="#00c" 
                  style={{alignItems: 'center', backgroundColor: "#0076ff", padding:12, borderRadius:5}}>
                  <Text style={{color: "#fff"}}>Load</Text>
                </TouchableHighlight>
              </View>
            </View>

            <View style={styles.setting}>
              <Text style={styles.label}>notifyOnEntry</Text>
              <Switch 
                value={this.state.notifyOnEntry}
                onValueChange={(value) => this.setState({notifyOnEntry: value})}
              />
            </View>
            <View style={styles.setting}>
              <Text style={styles.label}>notifyOnExit</Text>
              <Switch 
                value={this.state.notifyOnExit}
                onValueChange={(value) => this.setState({notifyOnExit: value})}
              />
            </View>
            <View style={styles.setting}>
              <Text style={styles.label}>notifyOnDwell</Text>
              <Switch 
                value={this.state.notifyOnDwell}
                onValueChange={(value) => this.setState({notifyOnDwell: value})}
              />
            </View>
          </View>
        </View>

        <View>
          <Text style={styles.sectionHeading}>Map</Text>
          <View style={styles.panel}>
            <View style={styles.setting}>
              <Text style={styles.label}>Show Markers</Text>
              <Switch 
                value={this.state.showMapMarkers}
                onValueChange={(value) => this.setState({showMapMarkers: value})}
              />
            </View>
          </View>
        </View>


      </ScrollView>
    );
  }
});

var styles = StyleSheet.create({
  sectionHeading: {
    fontSize:16,
    fontWeight:"bold",
    margin: 10
  },
  setting: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderBottomWidth:1,
    borderBottomColor:"#ccc",
    padding: 10
  },
  bigButton: {
    flex: 1
  },
  label: {
    flex: 1
  },
  panel: {
    backgroundColor: "#fff",
    borderTopWidth:1,
    borderTopColor: "#ccc",
  }
});

module.exports = DebugView;
