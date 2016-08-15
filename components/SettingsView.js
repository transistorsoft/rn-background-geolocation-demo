'use strict';

import React, { Component } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableHighlight,
  Switch
 } from 'react-native';

import Icon from 'react-native-vector-icons/Ionicons';
import Drawer from 'react-native-drawer';
import Modal from 'react-native-modalbox';
import SettingsService from './SettingsService';
import SettingsListView from './SettingsListView.js';
import SettingDetailView from './SettingDetailView';
import commonStyles from './styles';
import Config from './config';

var SettingsView = React.createClass({
  icons: {
    syncButton: 'ios-cloud-upload',
    spinner: 'md-sync'
  },

  getInitialState: function() {
    return {
      settingDetailView: null,
      syncButtonIcon: this.icons.syncButton,
      debug: false,
      email: null
    };
  },
  componentDidMount: function() {
    var me = this;
    this.locationManager = this.props.locationManager;  // @see index.<platform>.js 

    this.locationManager.getState(function(state) {
      me.setState({
        debug: state.debug
      });
    });
  },
  onClickBack: function() {
    this.locationManager.playSound(Config.sounds.BUTTON_CLICK_ANDROID);
    this.props.drawer.close();
  },
  onClickSettingDone: function() {
    this.refs.drawer.close();
  },
  onClickEmailLogs: function() {
    this.locationManager.playSound(Config.sounds.BUTTON_CLICK_ANDROID);
    this.refs.modal.open();
  },
  onToggleDebug: function(value) {
    this.locationManager.playSound(Config.sounds.BUTTON_CLICK_ANDROID);
    this.setState({debug: value});
    this.locationManager.setConfig({
      debug: value
    });
    SettingsService.set('debug', value);
  },
  onClickSubmitLogs: function() {
    var modal = this.refs.modal;
    this.locationManager.emailLog(this.state.email, function() {
      modal.close();
    }, function(error) {
      modal.close();
      console.error('- emailLog failure: ', error);
    });
  },
  onClickCancelLogs: function() {
    this.refs.modal.close();
  },
  onChangeEmail: function(email) {
    this.setState({email: email});
  },
  onSelectSetting: function(setting) {
    this.locationManager.playSound(Config.sounds.BUTTON_CLICK_ANDROID);
    this.setState({
      setting: setting,
      settingDetailView: (
        <View style={commonStyles.container}>
          <View style={commonStyles.topToolbar}>
            <Icon.Button name="ios-arrow-back" onPress={this.onClickSettingDone} iconStyle={commonStyles.backButtonIcon} backgroundColor="transparent" size={30} color="#4f8ef7" underlayColor={"transparent"}><Text>Back</Text></Icon.Button>
            <Text style={commonStyles.toolbarTitle}>{setting.name}</Text>
            <Text style={{width: 60}}>&nbsp;</Text>
          </View>
          <SettingDetailView setting={setting} onSelectValue={this.onSelectValue} />
        </View>
      )
    });
    this.refs.drawer.open();
  },
  onSelectValue: function(value) {
    this.locationManager.playSound(Config.sounds.BUTTON_CLICK_ANDROID);
    this.refs.settings.update(this.state.setting, value);
    var config = {};
    config[this.state.setting.name] = value;
    this.locationManager.setConfig(config);
    this.refs.drawer.close();
  },
  onClickSync: function() {
    this.locationManager.playSound(Config.sounds.BUTTON_CLICK_ANDROID);
    var me = this;
    this.setState({
      syncButtonIcon: me.icons.spinner
    });
    this.locationManager.sync(function(rs) {
      console.log('- sync success', rs.length);
      me.setState({
        syncButtonIcon: me.icons.syncButton
      });
      this.locationManager.playSound(Config.sounds.MESSAGE_SENT_ANDROID);
    }, function(error) {
      console.log('- sync error: ', error);
    });
  },
  render: function() {
    return (
      <Drawer ref="drawer" side="right" content={this.state.settingDetailView}>
        <View style={commonStyles.container}>
          <View style={commonStyles.topToolbar}>
            <Icon.Button name="ios-arrow-back" onPress={this.onClickBack} iconStyle={commonStyles.backButtonIcon} backgroundColor="transparent" size={30} color="#4f8ef7" underlayColor={"transparent"}><Text style={commonStyles.backButtonText}>Back</Text></Icon.Button>
            <Text style={commonStyles.toolbarTitle}>Settings</Text>
            <Text>Debug</Text>
            <Switch onValueChange={this.onToggleDebug} value={this.state.debug} />
          </View>
          <SettingsListView ref="settings" onSelectSetting={this.onSelectSetting} />

          <View style={commonStyles.bottomToolbar}>
            <Icon.Button name="ios-share-alt" onPress={this.onClickEmailLogs}><Text style={[styles.btnLog, commonStyles.iconButton]}>Logs</Text></Icon.Button>
            <Text style={{flex: 1, textAlign: 'center'}}>&nbsp;</Text>
            <Icon.Button name={this.state.syncButtonIcon} onPress={this.onClickSync} style={commonStyles.redButton}><Text style={[styles.btnSync, commonStyles.iconButton, {color: "#fff"}]}>Sync</Text></Icon.Button>
          </View>        
        </View>

        <Modal style={styles.modal} ref={"modal"}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={{textAlign: "center", fontWeight: "bold"}}>Email application logs</Text>
            </View>
            <View style={styles.modalBody}>
              <Text style={{textAlign: "center"}}>Recipient email</Text>
              <TextInput
                ref="email"
                value={this.state.email}
                onChangeText={this.onChangeEmail}
                editable={true}
                keyboardType="email-address"
                autoCorrect={false}
                blurOnSubmit={true} />
            </View>
            <View style={styles.modalFooter}>
              <TouchableHighlight onPress={this.onClickCancelLogs} underlayColor="#acacac" style={styles.modalButtonCancel}><Text style={{textAlign: "center"}}>Cancel</Text></TouchableHighlight>
              <TouchableHighlight onPress={this.onClickSubmitLogs} underlayColor="#3879a2" style={styles.modalButtonSubmit}><Text style={{textAlign: "center", fontWeight: "bold", color: "#fff"}}>Send</Text></TouchableHighlight>
            </View>
          </View>
        </Modal>

      </Drawer>

    );
  }
});


var styles = StyleSheet.create({
  modal: {
    position: "absolute",
    top: 0,
    height: 200,
    width: 250
  },
  modalContainer: {
    backgroundColor: "#fff",
    flex: 1, 
    alignSelf: "stretch"
  },
  modalHeader: {
    padding: 10
  },
  modalBody: {
    flex: 1
  },
  modalFooter: {
    flexDirection: "row", 
    backgroundColor: "#fff",
    alignItems: "stretch"
  },
  modalButtonSubmit: {
    backgroundColor: "#3879e2",    
    flex: 1, 
    padding: 15
  },
  modalButtonCancel: {
    backgroundColor: "#efefef",
    flex: 1, 
    padding: 15
  },
  btnSync: {
    width: 50
  },
  btnLog: {
    color: "#fff",
    width: 50
  },
  btnDone: {
    color: '#000000'
  }
});

module.exports = SettingsView;