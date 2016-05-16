'use strict';

import React, { Component } from 'react';
import {
  StyleSheet,
  Text,
  View,
  AlertIOS,
  SwitchIOS
 } from 'react-native';

import Drawer from 'react-native-drawer';
import Icon from 'react-native-vector-icons/Ionicons';

import Settings from '../../components/Settings.js';
import SettingsService from '../../components/SettingsService';
import SettingDetail from '../../components/SettingDetail';
import commonStyles from '../../components/styles';
import config from '../../components/config';


var styles = StyleSheet.create({
  backButtonText: {
    marginBottom: 3
  },
  toolbarButton: {
    width: 100
  },
  red: {
    color: '#EF473A'
  }
});

var SettingsContainer = React.createClass({
  locationManager: undefined,
  icons: {
    syncButton: 'ios-cloud-upload',
    spinner: 'ios-load-d'
  },

  getInitialState: function() {
    return {
      settingDetailView: <Text/>,
      syncButtonIcon: this.icons.syncButton,
      debug: false
    };
  },
  componentDidMount: function() {
    var me = this;
    this.locationManager = this.props.locationManager;
    SettingsService.getValues(function(settings) {
      me.setState({
        debug: settings.debug
      });
    });
  },
  onClickBack: function() {
    this.props.drawer.close();
  },
  onClickSettingDone: function() {
    this.refs.drawer.close();
  },
  onSelectSetting: function(setting) {
    // TODO find a better way to disable & hide a button.
    this.setState({
      doneButtonStyle: {
        opacity: (setting.inputType === 'text') ? 1 : 0
      }
    });

    this.setState({
      setting: setting,
      settingDetailView: (
        <View style={commonStyles.container}>
          <View style={commonStyles.iosStatusBar} />
          <View style={commonStyles.topToolbar}>
            <Icon.Button name="ios-arrow-back" onPress={this.onClickSettingDone} iconStyle={commonStyles.iconButton} backgroundColor="transparent" size={30} color="#4f8ef7" underlayColor={"transparent"}><Text style={[commonStyles.backButtonText, styles.backButtonText]}>Back</Text></Icon.Button>
            <Text style={commonStyles.toolbarTitle}>{setting.name}</Text>
            <Text style={{width: 80}}>&nbsp;</Text>        
          </View>
          <SettingDetail setting={setting} onSelectValue={this.onSelectValue} />
        </View>
      )
    });
    this.refs.drawer.open();
  },
  onSelectValue: function(value) {
    this.refs.settings.update(this.state.setting, value);
    var config = {};
    config[this.state.setting.name] = value;
    this.locationManager.setConfig(config);
    this.refs.drawer.close();
    if (this.state.setting.name === "debug") {
      this.setState({
        debug: value
      });
    }
  },
  onClickSync: function() {
    var me = this,
        locationManager = this.locationManager;

    /*
    this.setState({
      syncButtonIcon: this.icons.spinner
    });
    */
    locationManager.sync(function(rs) {
      console.log('- sync success');
      me.setState({
        syncButtonIcon: me.icons.syncButton
      });
      locationManager.playSound(config.sounds.MESSAGE_SENT_IOS);
    }, function(error) {
      console.log('- sync error: ', error);
      me.setState({
        syncButtonIcon: me.icons.syncButton
      });
    });
  },
  onClickDebug: function(value) {
    SettingsService.set('debug', value);
    this.setState({
      debug: value
    });
    this.locationManager.setConfig({
      debug: value
    });
  },

  onClickLogs: function() {
    var me = this,
      locationManager = this.locationManager;

    AlertIOS.prompt(
      'Send application logs',
      'Email address', [{
        text: 'Send', 
        onPress: function(email) {
          console.log('Text: ', email);
          locationManager.emailLog(email, function() {
            console.log('- emailed logs');
          });
        }, 
        type: 'plain-text'
      }, {
        text: 'Cancel', 
        onPress: function() {}, 
        style: 'cancel'
      }]
    );
  },

	render: function() {
    return (
      <Drawer ref="drawer" side="right" content={this.state.settingDetailView}>
        <View style={commonStyles.container}>
          <View style={commonStyles.iosStatusBar} />
          <View style={commonStyles.topToolbar}>
            <Icon.Button name="ios-arrow-back" onPress={this.onClickBack} iconStyle={commonStyles.iconButton} backgroundColor="transparent" size={40} color="#4f8ef7" underlayColor={"transparent"}><Text style={[commonStyles.backButtonText, styles.backButtonText]}>Back</Text></Icon.Button>
            <Text style={[commonStyles.toolbarTitle, {marginLeft: 20}]}>Settings</Text>
            <Text>Debug&nbsp;</Text><SwitchIOS onValueChange={this.onClickDebug} value={this.state.debug} />
          </View>
          <Settings ref="settings" onSelectSetting={this.onSelectSetting} />
          <View style={commonStyles.bottomToolbar}>
            <Icon.Button name="ios-share-alt" iconStyle={commonStyles.iconButton} style={{width:100}} onPress={this.onClickLogs}>Logs</Icon.Button>
            <View style={{flex: 1}} />
            <Icon.Button name={this.state.syncButtonIcon} onPress={this.onClickSync} style={commonStyles.redButton} iconStyle={commonStyles.iconButton}>Sync</Icon.Button>            
          </View>
        </View>
      </Drawer>
    );
  }
});

module.exports = SettingsContainer;
