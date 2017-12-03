import React, { Component } from 'react';
import {  
  View,
  StyleSheet,
  Platform,
} from 'react-native';

import { 
  Container,
  Button, Icon,
  Text,
  Header, Title,
  Content, 
  Left, Body, Right,
  Form, Label, Input, Picker, Switch,
  Item as FormItem,
  Spinner
} from 'native-base';

const Item = Picker.Item;

////
// Import BackgroundGeolocation plugin
// Note: normally you will not specify a relative url ../ here.  I do this in the sample app
// because the plugin can be installed from 2 sources:
//
// 1.  npm:  react-native-background-geolocation
// 2.  private github repo (customers only):  react-native-background-geolocation-android
//
// This simply allows one to change the import in a single file.
import BackgroundGeolocation from "../react-native-background-geolocation";

import SettingsService from './lib/SettingsService';
import {SOUNDS, COLORS} from './lib/config';

export default class SettingsView extends Component<{}> {

  constructor(props) {
    super(props);

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

  componentDidMount() {
    this.settingsService.getPluginState((state) => {
      this.setState({
        ...state,
        logLevel: this.decodeLogLevel(state.logLevel),
        trackingMode: this.decodeTrackingMode(state.trackingMode),
        notificationPriority: this.decodeNotificationPriority(state.notificationPriority)
      });
    });

    // Load app settings
    this.settingsService.getApplicationState((state) => {
      this.setState(state);
    });
  }  

  /**
  * Navigate back to home-screen app-switcher
  */
  onClickClose() {
    this.props.navigation.goBack();
    this.settingsService.playSound('CLOSE');
  }

  /**
  * Navigate to About screen
  */
  onClickAbout() {
    this.props.navigation.navigate('About');
  }

  onChangeTrackingMode(value) {    
    if (this.state.trackingMode === value) { return; }
    this.setState({trackingMode: value});
    if (value === 'location') {
      BackgroundGeolocation.start((state) => {
        console.log('- Start location tracking mode');
      });
    } else {
      BackgroundGeolocation.startGeofences((state) => {
        console.log('- Start geofence tracking mode');
      });
    }
  }

  onChangeEmail(value) {
    this.settingsService.onChange('email', value);
    this.setState({email: value});
  }

  onClickDestroyLog() {
    this.settingsService.confirm('Confirm Destroy', 'Destroy Logs?', () => {
      this.setState({isDestroyingLog: true});
      BackgroundGeolocation.destroyLog(() => {
        this.setState({isDestroyingLog: false});
        this.settingsService.toast('Destroyed logs');
      });
    });
  }

  onClickLoadGeofences() {
    if (this.state.isLoadingGeofences) { return false; }
    this.setState({isLoadingGeofences: true});

    this.settingsService.getApplicationState((state) => {
      let geofences = this.settingsService.getTestGeofences('city_drive', state);

      BackgroundGeolocation.addGeofences(geofences, () => {
        this.settingsService.playSound('ADD_GEOFENCE');
        this.settingsService.toast('Loaded City Drive geofences');
        this.setState({isLoadingGeofences: false});
      }, () => {
        this.settingsService.toast('Loaded City Drive geofences');
        this.setState({isLoadingGeofences: false});
      });
    });
  }

  onClickClearGeofences() {
    this.settingsService.playSound('MESSAGE_SENT');
    BackgroundGeolocation.removeGeofences();
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
        case 'notificationPriority':
          value = this.encodeNotficationPriority(value);
          break;
      }
      let config = {};
      config[setting.name] = value;

      BackgroundGeolocation.setConfig(config, (state) => {
        console.log('- setConfig success', state);
      });
    }

    if (this.changeBuffer) {
      this.changeBuffer = clearTimeout(this.changeBuffer);
    }
    this.changeBuffer = setTimeout(doChange.bind(this), 500);
  }

  onChangeGeofence(setting, value) {
    this.settingsService.onChange(setting, value);
    let state = {};
    state[setting.name] = value;
    this.setState(state);
  }

  render() {
    return (
      <Container style={styles.container}>
        <Header style={styles.header}>
          <Left>
            <Button small transparent dark onPress={this.onClickClose.bind(this)}>
              <Icon color="#000" active name="ios-arrow-dropdown-circle" />
            </Button>
          </Left>
          <Body>
            <Title style={styles.title}>Settings</Title>
          </Body>
          <Right>
            <Button dark small bordered onPress={this.onClickAbout.bind(this)}><Text>About</Text></Button>
          </Right>
        </Header>

        <Content style={styles.content}>
          <Form>
            <FormItem style={styles.headerItem}>
              <Text>GEOLOCATION</Text>
            </FormItem>
            {this.renderTrackingModeField()}
            {this.renderPluginSettings('geolocation')}
            <FormItem style={styles.headerItem}>
              <Text>ACTIVITY RECOGNITION</Text>
            </FormItem>
            {this.renderPluginSettings('activity recognition')}
            <FormItem style={styles.headerItem}>
              <Text>HTTP &amp; PERSISTENCE</Text>
            </FormItem>
            {this.renderPluginSettings('http')}
            <FormItem style={styles.headerItem}>
              <Text>APPLICATION</Text>
            </FormItem>
            {this.renderPluginSettings('application')}
            <FormItem style={styles.headerItem}>
              <Text>DEBUG</Text>
            </FormItem>
            <FormItem inlineLabel key="email" style={styles.formItem}>
              <Input placeholder="your@email.com" value={this.state.email} onChangeText={this.onChangeEmail.bind(this)} />
            </FormItem>
            {this.renderPluginSettings('debug')}

            <Content style={styles.formItem}>
              <Button full danger onPress={this.onClickDestroyLog.bind(this)} isLoading={this.state.isDestroyingLog}>
                {!this.state.isDestroyingLog ? (<Text>Destroy logs</Text>) : (<Spinner color="white" size="small" />)}
              </Button>
            </Content>

            <FormItem style={styles.headerItem}>
              <Text>GEOFENCE TESTING (Freeway Drive)</Text>
            </FormItem>

            <FormItem style={styles.formItem}>
              <Left style={{marginRight:3}}>
                <Button full danger onPress={this.onClickClearGeofences.bind(this)}>
                  <Text>Clear</Text>
                </Button>
              </Left>              
              <Right style={{marginLeft: 3}}>
                <Button full onPress={this.onClickLoadGeofences.bind(this)} isLoading={this.state.isLoadingGeofences}>                  
                  {!this.state.isLoadingGeofences ? (<Text>Load</Text>) : (<Spinner color="white" size="small" />)}
                </Button>
              </Right>
            </FormItem>
            
            {this.getGeofenceTestSettings()}
          </Form>
        </Content>
                  
      </Container>
    );
  }

  renderPluginSettings(section) {
    return this.settingsService.getPluginSettings(section).map((setting) => {
      return this.buildField(setting, this.onFieldChange.bind(this));
    });
  }

  getGeofenceTestSettings() {
    return this.settingsService.getApplicationSettings('geofence').map((setting) => {
      console.log('- setting: ', setting);

      return this.buildField(setting, this.onChangeGeofence.bind(this));
    });
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

  decodeTrackingMode(trackingMode) {
    return (trackingMode === 1 || trackingMode === 'location') ? 'location' : 'geofence';
  }

  decodeLogLevel(logLevel) {
    let value = 'VERBOSE';
    switch(logLevel) {
      case BackgroundGeolocation.LOG_LEVEL_OFF:
        value = 'OFF';
        break;
      case BackgroundGeolocation.LOG_LEVEL_ERROR:
        value = 'ERROR';
        break;
      case BackgroundGeolocation.LOG_LEVEL_WARNING:
        value = 'WARN';
        break;
      case BackgroundGeolocation.LOG_LEVEL_INFO:
        value = 'INFO';
        break;
      case BackgroundGeolocation.LOG_LEVEL_DEBUG:
        value = 'DEBUG';
        break;
      case BackgroundGeolocation.LOG_LEVEL_VERBOSE:
        value = 'VERBOSE';
        break;
    }
    return value;
  }

  encodeLogLevel(logLevel) {
    let value = 0;
    switch(logLevel) {
      case 'OFF':
        value = BackgroundGeolocation.LOG_LEVEL_OFF;
        break;
      case 'ERROR':
        value = BackgroundGeolocation.LOG_LEVEL_ERROR;
        break;
      case 'WARN':
        value = BackgroundGeolocation.LOG_LEVEL_WARNING;
        break;
      case 'INFO':
        value = BackgroundGeolocation.LOG_LEVEL_INFO;
        break;
      case 'DEBUG':
        value = BackgroundGeolocation.LOG_LEVEL_DEBUG;
        break;
      case 'VERBOSE':
        value = BackgroundGeolocation.LOG_LEVEL_VERBOSE;
        break;
    }
    return value;
  }

  decodeNotificationPriority(value) {
    switch(value) {
      case BackgroundGeolocation.NOTIFICATION_PRIORITY_DEFAULT:
        value = 'DEFAULT';
        break;
      case BackgroundGeolocation.NOTIFICATION_PRIORITY_HIGH:
        value = 'HIGH';
        break;
      case BackgroundGeolocation.NOTIFICATION_PRIORITY_LOW:
        value = 'LOW';
        break;
      case BackgroundGeolocation.NOTIFICATION_PRIORITY_MAX:
        value = 'MAX';
        break;
      case BackgroundGeolocation.NOTIFICATION_PRIORITY_MIN:
        value = 'MIN';
        break;
      default:
        value = BackgroundGeolocation.NOTIFICATION_PRIORITY_DEFAULT;
    }
    return value;
  }

  encodeNotficationPriority(value) {
    switch(value) {
      case 'DEFAULT':
        value = BackgroundGeolocation.NOTIFICATION_PRIORITY_DEFAULT;
        break;
      case 'HIGH':
        value = BackgroundGeolocation.NOTIFICATION_PRIORITY_HIGH;
        break;
      case 'LOW':
        value = BackgroundGeolocation.NOTIFICATION_PRIORITY_LOW;
        break;
      case 'MAX':
        value = BackgroundGeolocation.NOTIFICATION_PRIORITY_MAX;
        break;
      case 'MIN':
        value = BackgroundGeolocation.NOTIFICATION_PRIORITY_MIN;
        break;
    }
    return value;
  }

}

const styles = StyleSheet.create({
  container: {
    //backgroundColor: '#fefefe'
  }, 
  header: {
    backgroundColor: '#fedd1e'
  },
  title: {
    color: '#000'
  },
  headerItem: {
    marginTop: 20,
    marginLeft: 0,
    paddingLeft: 10,
    paddingBottom: 5,
    backgroundColor: "transparent"
  },
  formItem: {
    backgroundColor: "#fff",
    minHeight: 50,
    marginLeft: 0
  },
  formLabel: {
    color: COLORS.light_blue,
    paddingLeft: 10
  }
});
