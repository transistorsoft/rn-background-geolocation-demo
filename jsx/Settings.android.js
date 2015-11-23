'use strict';

var React = require('react-native');
var {
  StyleSheet,
  Text,
  View
} = React;

var Icon                  = require('react-native-vector-icons/Ionicons');
var Settings              = require('./Settings.js');
var SettingDetail         = require('./SettingDetail');
var Drawer                = require('react-native-drawer')
var BackgroundGeolocation = require('react-native-background-geolocation-android');
var commonStyles          = require('./Styles.common');
var config                = require('./config');

var SettingsContainer = React.createClass({
  icons: {
    syncButton: 'android-upload',
    spinner: 'load-d'
  },

  getInitialState: function() {
    return {
      settingDetailView: null,
      syncButtonIcon: this.icons.syncButton
    };
  },
  onClickBack: function() {
    this.props.drawer.close();
  },
  onClickSettingDone: function() {
    this.refs.drawer.close();
  },
  onSelectSetting: function(setting) {
    this.setState({
      setting: setting,
      settingDetailView: (
        <View style={commonStyles.container}>
          <View style={commonStyles.topToolbar}>
            <Icon.Button name="chevron-left" onPress={this.onClickSettingDone} iconStyle={commonStyles.backButtonIcon} backgroundColor="transparent" size={30} color="#4f8ef7" underlayColor={"transparent"}><Text style={commonStyles.backButtonText}>Back</Text></Icon.Button>
            <Text style={commonStyles.toolbarTitle}>{setting.name}</Text>
            <Text style={{width: 60}}>&nbsp;</Text>
          </View>
          <SettingDetail setting={setting} onSelectValue={this.onSelectValue} />
        </View>
      )
    });
    this.refs.drawer.open();
  },
  onSelectValue: function(value) {
    this.refs.settings.update(this.state.setting, value);
    this.refs.drawer.close();
  },
  onClickSync: function() {
    var me = this;
    this.setState({
      syncButtonIcon: this.icons.spinner
    });
    BackgroundGeolocation.sync(function(rs) {
      console.log('- sync success');
      me.setState({
        syncButtonIcon: me.icons.syncButton
      });
      BackgroundGeolocation.playSound(config.sounds.MESSAGE_SENT_ANDROID);
    }, function(error) {
      console.log('- sync error: ', error);
    });
  },
	render: function() {
    return (
      <Drawer ref="drawer" side="right" content={this.state.settingDetailView}>
        <View style={commonStyles.container}>
          <View style={commonStyles.topToolbar}>
            <Icon.Button name="chevron-left" onPress={this.onClickBack} iconStyle={commonStyles.backButtonIcon} backgroundColor="transparent" size={30} color="#4f8ef7" underlayColor={"transparent"}><Text style={commonStyles.backButtonText}>Back</Text></Icon.Button>
            <Text style={commonStyles.toolbarTitle}>Settings</Text>
            <Icon.Button name={this.state.syncButtonIcon} onPress={this.onClickSync} iconStyle={commonStyles.iconButton} style={[styles.btnSync, commonStyles.redButton]}><Text>Sync</Text></Icon.Button>
            <Text>&nbsp;</Text>
          </View>
          <Settings ref="settings" onSelectSetting={this.onSelectSetting} />
        </View>
      </Drawer>

    );
  }
});



var styles = StyleSheet.create({
  btnSync: {
    
  }
});

module.exports = SettingsContainer;