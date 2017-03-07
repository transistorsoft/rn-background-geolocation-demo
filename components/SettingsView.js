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
import ScrollableTabView from 'react-native-scrollable-tab-view';

import SettingsService from './SettingsService';
import SettingsListView from './SettingsListView.js';
import SettingDetailView from './SettingDetailView';
import DebugView from './DebugView';

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
      email: ''
    };
  },
  componentDidMount: function() {
    var me = this;
    var bgGeo = global.BackgroundGeolocation;

    // TSLocationManager should fire a "ready" event to signal to sub-components that the plugin
    // has been #configured.  Hack it for now with a setTimeout to #getState
    bgGeo.getState(function(state) {
      me.setState({
        debug: state.debug
      });
    });
  },
  onClickBack: function() {
    global.BackgroundGeolocation.playSound(SettingsService.getSoundId('BUTTON_CLICK'));
    this.props.drawer.close();
  },
  onClickSettingDone: function() {
    global.BackgroundGeolocation.playSound(SettingsService.getSoundId('BUTTON_CLICK'));
    this.refs.drawer.close();
  },
  onClickEmailLogs: function() {
    global.BackgroundGeolocation.playSound(SettingsService.getSoundId('BUTTON_CLICK'));
    this.refs.modal.open();
  },
  onClickSubmitLogs: function() {
    var modal = this.refs.modal;
    global.BackgroundGeolocation.emailLog(this.state.email, function() {
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
    global.BackgroundGeolocation.playSound(SettingsService.getSoundId('BUTTON_CLICK'));
    this.setState({
      setting: setting,
      settingDetailView: (
        <View style={commonStyles.container}>
          <View style={commonStyles.topToolbar}>
            <Icon.Button name="ios-arrow-back" onPress={this.onClickSettingDone} iconStyle={commonStyles.backButtonIcon} backgroundColor="transparent" size={30} color="#4f8ef7" underlayColor={"transparent"}><Text style={commonStyles.backButtonText}>Back</Text></Icon.Button>
            <Text style={commonStyles.toolbarTitle}>{setting.name}</Text>
            <Text style={{width: 60}}>&nbsp;</Text>
          </View>
          <SettingDetailView setting={setting} onSelectValue={this.onChange} />
        </View>
      )
    });
    this.refs.drawer.open();
  },
  onChange: function(name, value) {
    if (this.refs.settings) {
      this.refs.drawer.close();
      this.refs.settings.update(name, value);
    }
    if (this.refs.debug) {
      this.refs.debug.update(name, value);
    }
  },
  onClickSync: function() {
    var bgGeo = global.BackgroundGeolocation;
    bgGeo.playSound(SettingsService.getSoundId('BUTTON_CLICK'));
    var me = this;
    this.setState({
      syncButtonIcon: me.icons.spinner
    });
    bgGeo.sync(function(rs) {
      console.log('- sync success', rs.length);
      me.setState({
        syncButtonIcon: me.icons.syncButton
      });
      bgGeo.playSound(SettingsService.getSoundId('MESSAGE_SENT'));
    }, function(error) {
      console.log('- sync error: ', error);
    });
  },
  onChangeTab(event) {

  },
  render: function() {
    return (
      <Drawer ref="drawer" side="right" content={this.state.settingDetailView}>
        <View style={commonStyles.container}>
          <View style={commonStyles.topToolbar}>
            <Icon.Button name="ios-arrow-back" onPress={this.onClickBack} iconStyle={commonStyles.backButtonIcon} backgroundColor="transparent" size={30} color="#4f8ef7" underlayColor={"transparent"}><Text style={commonStyles.backButtonText}>Back</Text></Icon.Button>
            <Text style={commonStyles.toolbarTitle}>Settings</Text>
            <Text style={{width:75}} />
          </View>
          <ScrollableTabView onChangeTab={this.onChangeTab}>
            <DebugView tabLabel="Basic" ref={"debug"} onChange={this.onChange} />
            <SettingsListView tabLabel="Advanced" ref="settings" onSelectSetting={this.onSelectSetting} />            
          </ScrollableTabView>
        </View>

        <Modal style={styles.modal} ref={"modal"}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={{textAlign: "center", fontWeight: "bold"}}>Email application logs</Text>
              <TextInput editable={true} maxLength={50}/>
            </View>
            <View style={styles.modalBody}>
              <Text style={{textAlign: "center"}}>Recipient email</Text>
              <TextInput
                style={{marginTop: 5,padding:10, height: 40}}
                ref="email"
                value={this.state.email}
                onChangeText={this.onChangeEmail}
                placeholder="foo@bar.com"
                editable={true}
                keyboardType="email-address"
                autoCorrect={false}
                autoCapitalize="none"
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