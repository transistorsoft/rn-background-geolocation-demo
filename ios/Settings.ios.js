'use strict';

var React = require('react-native');
var {
  StyleSheet,
  Text,
  View
} = React;

var Drawer                = require('react-native-drawer')
var Icon                  = require('react-native-vector-icons/Ionicons');

var Settings              = require('../Settings.js');
var SettingDetail         = require('../SettingDetail');
var commonStyles          = require('../styles');
var config                = require('../config');


var styles = StyleSheet.create({
  backButtonText: {
    marginBottom: 3
  }
});

var SettingsContainer = React.createClass({
  locationManager: undefined,
  icons: {
    syncButton: 'android-upload',
    spinner: 'load-d'
  },

  getInitialState: function() {
    return {
      settingDetailView: <Text/>,
      syncButtonIcon: this.icons.syncButton
    };
  },
  componentDidMount: function() {
    this.locationManager = this.props.locationManager;
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
          <View style={commonStyles.topToolbar}>
            <Icon.Button name="ios-arrow-back" onPress={this.onClickSettingDone} iconStyle={commonStyles.iconButton} backgroundColor="transparent" size={30} color="#4f8ef7" underlayColor={"transparent"}><Text style={[commonStyles.backButtonText, styles.backButtonText]}>Back</Text></Icon.Button>
            <Text style={commonStyles.toolbarTitle}>{setting.name}</Text>
            <Text style={{width: 60}}>&nbsp;</Text>
            <Icon.Button name="android-done" onPress={this.onClickSettingDone} color="#000000" size={25} backgroundColor="transparent" iconStyle={[commonStyles.iconButton, this.state.doneButtonStyle]}/>
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
  },
  onClickSync: function() {
    var me = this,
        locationManager = this.locationManager;

    this.setState({
      syncButtonIcon: this.icons.spinner
    });
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
	render: function() {
    return (

      <Drawer ref="drawer" side="right" content={this.state.settingDetailView}>
        <View style={commonStyles.container}>
          <View style={commonStyles.topToolbar}>
            <Icon.Button name="ios-arrow-back" onPress={this.onClickBack} iconStyle={commonStyles.iconButton} backgroundColor="transparent" size={40} color="#4f8ef7" underlayColor={"transparent"}><Text style={[commonStyles.backButtonText, styles.backButtonText]}>Back</Text></Icon.Button>
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

module.exports = SettingsContainer;
