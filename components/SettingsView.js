'use strict';

import React, { Component } from 'react';
import {
  StyleSheet,
  View,
  Switch,
  Platform
 } from 'react-native';


import { 
  Container, 
  Header, 
  Content, 
  Text, 
  Right, 
  Left, 
  Picker, 
  Form, 
  Label,
  Input,
  Item as FormItem  
} from "native-base";
const Item = Picker.Item;

import Icon from 'react-native-vector-icons/Ionicons';
import Modal from 'react-native-modalbox';
import Button from 'apsl-react-native-button'

import AboutView from './AboutView';
import SettingsService from './lib/SettingsService';
import BGService from './lib/BGService';

import commonStyles from './styles';
import Config from './config';

class SettingsView extends React.Component {
  constructor(props) {
    super(props);


    this.bgService = BGService.getInstance();
    this.settingsService = SettingsService.getInstance();

    // Default state
    this.state = {
      isDestroyingLog: false,
      isLoadingGeofences: false,
      geofence: {
        radius: '200',
        notifyOnEntry: true,
        notifyOnExit: false,
        notifyOnDwell: false,
        loiteringDelay: '0'
      }
    };
  }

  open() {
    this.refs.modal.open();
  }

  load() {
    // Fetch current state of BackgroundGeolocation
    this.bgService.getState((state) => {
      
      this.setState({
        ...state,
        logLevel: this.decodeLogLevel(state.logLevel),
        trackingMode: this.decodeTrackingMode(state.trackingMode)
      });
    });

    // Load app settings
    this.settingsService.getState((state) => {
      this.setState(state);
    });    
  }

  componentDidMount() {

  }

  onClickClose() {
    this.bgService.playSound('CLOSE');
    this.refs.modal.close();
  }

  onClickAbout() {
    this.refs.aboutModal.open();
  }

  onChangeGeofence(setting, value) {
    this.settingsService.onChange(setting, value);
    let state = {};
    state[setting.name] = value;
    this.setState(state);
  }

  onClickLoadGeofences() {
    if (this.state.isLoadingGeofences) { return false; }
    this.setState({isLoadingGeofences: true});

    this.settingsService.getState((state) => {
      this.bgService.loadTestGeofences('city_drive', state, () => {
        this.settingsService.toast('Loaded City Drive geofences');
        this.setState({isLoadingGeofences: false});
      });
    });
  }

  onClickClearGeofences() {
    this.bgService.removeGeofences();
  }

  onClickEmailLogs() {

  }

  onClickDestroyLog() {
    this.settingsService.confirm('Confirm Destroy', 'Destroy Logs?', () => {
      this.setState({isDestroyingLog: true});
      this.bgService.getPlugin().destroyLog(() => {
        this.setState({isDestroyingLog: false});
        this.settingsService.toast('Destroyed logs');
      });
    });
  }

  setTrackingMode(trackingMode){
    this.bgService.playSound('BUTTON_CLICK');
    this.setState({
      trackingMode
    });
    let bgGeo = this.bgService.getPlugin();
    if (trackingMode == "location") {
      bgGeo.start();
    } else {
      bgGeo.startGeofences();
    }
    if (typeof(this.props.onChange) === 'function') {  // <-- Android
      this.props.onChange('trackingMode', trackingMode);
    }
  }

  decodeTrackingMode(trackingMode) {
    return (trackingMode === 1 || trackingMode === 'location') ? 'location' : 'geofence';
  }

  decodeLogLevel(logLevel) {
    let value = 'VERBOSE';
    switch(logLevel) {
      case 0:
        value = 'OFF';
        break;
      case 1:
        value = 'ERROR';
        break;
      case 2:
        value = 'WARN';
        break;
      case 3:
        value = 'INFO';
        break;
      case 4:
        value = 'DEBUG';
        break;
      case 5:
        value = 'VERBOSE';
        break;
    }
    return value;
  }

  encodeLogLevel(logLevel) {
    let value = 0;
    let bgGeo = this.bgService.getPlugin();
    switch(logLevel) {
      case 'OFF':
        value = bgGeo.LOG_LEVEL_OFF;
        break;
      case 'ERROR':
        value = bgGeo.LOG_LEVEL_ERROR;
        break;
      case 'WARN':
        value = bgGeo.LOG_LEVEL_WARNING;
        break;
      case 'INFO':
        value = bgGeo.LOG_LEVEL_INFO;
        break;
      case 'DEBUG':
        value = bgGeo.LOG_LEVEL_DEBUG;
        break;
      case 'VERBOSE':
        value = bgGeo.LOG_LEVEL_VERBOSE;
        break;
    }
    return value;
  }

  setGeofenceProximityRadius(value) {
    this.bgService.playSound('BUTTON_CLICK');
    var state = {geofenceProximityRadius: value}
    this.setState(state);
    var decodedValue = parseInt(value.match(/[0-9]+/)[0], 10)*1000;

    /*
    SettingsService.set('geofenceProximityRadius', decodedValue, function(state) {
      if (typeof(me.props.onChange) === 'function') {  // <-- Android
        me.props.onChange('geofenceProximityRadius', decodedValue);
      }
    });
    */
    console.warn('TODO setGeofenceProximityRadius');
  }

  onFormChange() {

  }

  onChangeTrackingMode(value) {
    let bgGeo = this.bgService.getPlugin();
    if (this.state.trackingMode === value) { return; }
    this.setState({trackingMode: value});
    this.bgService.set('trackingMode', value);
  }

  onChangeEmail(value) {
    this.settingsService.onChange('email', value);
    this.setState({email: value});
  }

  onFieldChange(setting, value) {
    let currentValue = this.state[setting.name];

    switch (setting.dataType) {
      case 'integer':
        value = parseInt(value, 10);
        break;
    }

    if (this.state[setting.name] === value) {
      return;
    }

    let state = {};
    state[setting.name] = value;
    this.setState(state);

    // Buffer field-changes by 500ms
    function doChange() {
      // Encode applicable settings for consumption by plugin.
      switch(setting.name) {
        case 'logLevel':
          value = this.encodeLogLevel(value);
          break;
      }
      this.bgService.set(setting.name, value);
    }

    if (this.changeBuffer) {
      this.changeBuffer = clearTimeout(this.changeBuffer);
    }
    this.changeBuffer = setTimeout(doChange.bind(this), 500);
  }

  buildField(setting, onValueChange) {
    let field = null;
    switch(setting.inputType) {
      case 'text':
        field = (
          <FormItem inlineLabel key={setting.name} style={styles.formItem}>
            <Input placeholder={setting.defaultValue} value={this.state[setting.name]} onChangeText={value => {onValueChange(setting, value)}}/>
          </FormItem>
        );
        break;
      case 'select':
        let items = [];
        setting.values.forEach((value) => {
          items.push((<Item label={value.toString()} value={value} key={setting.name + ":" + value} />));
        });
        field = (
          <FormItem inlineLabel key={setting.name} style={styles.formItem}>
            <Label style={styles.formLabel}>{setting.name}</Label>
            <Right>
              <Picker
                mode="dropdown"
                style={{width:(Platform.OS === 'ios') ? undefined : 150}}
                selectedValue={this.state[setting.name]}
                onValueChange={value => {onValueChange(setting, value)}}
              >{items}</Picker>
            </Right>
          </FormItem>
        );
        break;
      case 'toggle':
        field = (
          <FormItem inlineLabel key={setting.name} style={styles.formItem}>
            <Label style={styles.formLabel}>{setting.name}</Label>
            <Right style={{paddingRight:10}}>
              <Switch value={this.state[setting.name]} onValueChange={value => {onValueChange(setting, value)}} />
            </Right>
          </FormItem>
        );
        break;
      default:
        field = (
          <FormItem key={setting.name}>
            <Text>Unknown field-type for {setting.name} {setting.inputType}</Text>
          </FormItem>
        );
        break;
    }
    return field;
  }

  renderTrackingModeField() {
    return (
      <FormItem inlineLabel key="trackingMode" style={styles.formItem}>
        <Label style={styles.formLabel}>trackingMode</Label>
        <Right>
          <Picker 
            mode="dropdown" 
            selectedValue={this.state.trackingMode}
            onValueChange={this.onChangeTrackingMode.bind(this)}
            style={{width:(Platform.OS === 'ios') ? undefined : 150}}>
            <Item label="Location" value="location" />
            <Item label="Geofence" value="geofence" />
          </Picker>
        </Right>
      </FormItem>
    );
  }
  renderPlatformSettings(section) {
    return this.bgService.getPlatformSettings(section).map((setting) => {
      return this.buildField(setting, this.onFieldChange.bind(this));
    });
  }

  getGeofenceTestSettings() {
    return this.settingsService.getSettings('geofence').map((setting) => {
      return this.buildField(setting, this.onChangeGeofence.bind(this));
    });
  }

  getAboutModal() {
    return this.refs.aboutModal;
  }
  
  render() {
    return (
      <Modal ref="modal" swipeToClose={false} animationDuration={300} onOpened={this.load.bind(this)}>
        <View style={commonStyles.container}>
          <View style={commonStyles.topToolbar}>
            <Icon.Button
              name="ios-arrow-dropdown-circle"
              size={25}
              onPress={this.onClickClose.bind(this)}
              backgroundColor="transparent"
              underlayColor="transparent"
              color={Config.colors.black}>
            </Icon.Button>
            <Text style={commonStyles.toolbarTitle}>Settings</Text>
            <Button onPress={this.onClickAbout.bind(this)} style={styles.aboutButton}>About</Button>
          </View>
          <Content>          
            <Form>
              <FormItem style={styles.headerItem}>
                <Text style={styles.header}>GEOLOCATION</Text>
              </FormItem>
              {this.renderTrackingModeField()}
              {this.renderPlatformSettings('geolocation')}
              <FormItem style={styles.headerItem}>
                <Text style={styles.header}>ACTIVITY RECOGNITION</Text>
              </FormItem>
              {this.renderPlatformSettings('activity recognition')}
              <FormItem style={styles.headerItem}>
                <Text style={styles.header}>HTTP &amp; PERSISTENCE</Text>
              </FormItem>
              {this.renderPlatformSettings('http')}
              <FormItem style={styles.headerItem}>
                <Text style={styles.header}>APPLICATION</Text>
              </FormItem>
              {this.renderPlatformSettings('application')}
              <FormItem style={styles.headerItem}>
                <Text style={styles.header}>DEBUG</Text>
              </FormItem>
              <FormItem inlineLabel key="email" style={styles.formItem}>
                <Input placeholder="your@email.com" value={this.state.email} onChangeText={this.onChangeEmail.bind(this)} />
              </FormItem>              
              {this.renderPlatformSettings('debug')}
              <View style={styles.setting}>
                <Button onPress={this.onClickDestroyLog.bind(this)} activeOpacity={0.7} isLoading={this.state.isDestroyingLog} style={[styles.button, styles.redButton, {flex:1}]} textStyle={styles.buttonLabel}>
                  Destroy logs
                </Button>
              </View>

              <FormItem style={styles.headerItem}>
                <Text style={styles.header}>GEOFENCE TESTING (Freeway Drive)</Text>
              </FormItem>
              <View style={styles.setting}>
                <View style={styles.label}>
                  <Button onPress={this.onClickClearGeofences.bind(this)} activeOpacity={0.7} style={[styles.button, styles.redButton]} textStyle={styles.buttonLabel}>
                    Clear
                  </Button>
                </View>
                <Text>&nbsp;&nbsp;&nbsp;</Text>
                <View style={styles.label}>
                  <Button onPress={this.onClickLoadGeofences.bind(this)} isLoading={this.state.isLoadingGeofences} activeOpacity={0.7} style={[styles.button, styles.blueButton]} textStyle={styles.buttonLabel}>
                    Load
                  </Button>
                </View>
              </View>
              {this.getGeofenceTestSettings()}
            </Form>
          </Content>
        </View>
        <Modal swipeToClose={false} animationDuration={300} ref="aboutModal"><AboutView modal={() => {return this.refs.aboutModal}}/></Modal>
      </Modal>
    );
  }
};

var styles = StyleSheet.create({  
  setting: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderBottomWidth:1,
    borderBottomColor:"#ccc",
    padding: 10
  },
  headerItem: {
    marginTop: 20,
    backgroundColor: "transparent"
  },
  header: {
    fontSize: 16    
  },
  label: {
    flex: 1
  },  
  button: {
    borderWidth:0,
    borderRadius: 5,
    marginBottom: 0
  },
  aboutButton: {
    borderRadius: 5,
    width: 70,
    height: 34

  },
  buttonLabel: {
    fontSize: 14, 
    color: '#fff'
  },
  redButton: {
    backgroundColor: '#ff3824'
  },
  blueButton: {
    backgroundColor: '#0076ff'
  },
  formItem: {
    backgroundColor: "#fff"
  },
  formLabel: {
    color: Config.colors.light_blue
  }
});


module.exports = SettingsView;