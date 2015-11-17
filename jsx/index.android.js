'use strict';

/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 */
'use strict';

var React = require('react-native');
var {
  AppRegistry,
  StyleSheet,
  Text,
  View,
  ToolbarAndroid,
  SwitchAndroid,
  TouchableHighlight
} = React;

var BackgroundGeolocation = require('react-native-background-geolocation-android');
var Icon                  = require('react-native-vector-icons/Ionicons');
var SettingsService       = require('./SettingsService');

SettingsService.init('Android');

SettingsService.getValues(function(values) {
  values.license = "eddbe81bbd86fa030ea466198e778ac78229454c31100295dae4bfc5c4d0f7e2";
  values.orderId = 1;
  values.stopTimeout = 0;
  values.autoSync = false;
  values.url = 'http://192.168.11.120:8080/locations';
  values.params = {
    device: {
      uuid: 'TODO',
      model: 'TODO'
    }
  };
  BackgroundGeolocation.configure(values);
});

// UI Sounds.
var SOUNDS = {
  "LONG_PRESS_ACTIVATE_IOS": 1113,
  "LONG_PRESS_ACTIVATE_ANDROID": 27,
  "LONG_PRESS_CANCEL_IOS": 1075,
  "LONG_PRESS_CANCEL_ANDROID": 94,
  "ADD_GEOFENCE_IOS": 1114,
  "ADD_GEOFENCE_ANDROID": 28,
  "BUTTON_CLICK_IOS": 1104,
  "BUTTON_CLICK_ANDROID": 89,
  "MESSAGE_SENT_IOS": 1303,
  "MESSAGE_SENT_ANDROID": 90,
  "ERROR_IOS": 1006
};

var RNBackgroundGeolocationSample = React.createClass({
  getInitialState: function() {
    return {
      enabled: false,
      isMoving: false,
      paceButtonStyle: styles.disabledButton,
      paceButtonIcon: 'play'
    };
  },

  componentDidMount: function() {
    var me = this;

    // location event
    BackgroundGeolocation.on("location", function(location) {
      console.log('- location: ', JSON.stringify(location));
    });
    // http event
    BackgroundGeolocation.on("http", function(response) {
      console.log('- http ' + response.status);
      console.log(response.responseText);
    });
    // geofence event
    BackgroundGeolocation.on("geofence", function(geofence) {
      console.log('- onGeofence: ', JSON.stringify(geofence));
    });
    // error event
    BackgroundGeolocation.on("error", function(error) {
      console.log('- ERROR: ', JSON.stringify(error));
    });
    // motionchange event
    BackgroundGeolocation.on("motionchange", function(event) {
      console.log("- motionchange", JSON.stringify(event));
    });

    // getGeofences
    BackgroundGeolocation.getGeofences(function(rs) {
      console.log('- getGeofences: ', JSON.stringify(rs));
    }, function(error) {
      console.log("- getGeofences ERROR", error);
    });
    
    this.setState({
      enabled: false,
      isMoving: false
    });
  },

  onClickEnable: function() {    
    if (!this.state.enabled) {
      BackgroundGeolocation.start(function() {
        console.log('- start success');
      });
      this.state.paceButtonStyle = (this.state.isMoving) ? styles.redButton : styles.greenButton;
    } else {
      BackgroundGeolocation.stop();
      this.state.paceButtonStyle = styles.disabledButton;
    }

    this.setState({
      enabled: !this.state.enabled
    });
  },
  onClickPace: function() {
    if (!this.state.enabled) { return; }
    var isMoving = !this.state.isMoving;
    BackgroundGeolocation.changePace(isMoving);
    
    this.setState({
      isMoving: isMoving,
      paceButtonStyle: (isMoving) ? styles.redButton : styles.greenButton,
      paceButtonIcon: (isMoving) ? 'stop' : 'play'
    });      
  },
  onClickLocate: function() {
    BackgroundGeolocation.getCurrentPosition(function(location) {
      console.log('- current position: ', JSON.stringify(location));
    });
  },
  onClickSync: function() {
    BackgroundGeolocation.sync(function(rs) {
      console.log('- sync success');
      BackgroundGeolocation.playSound(SOUNDS.MESSAGE_SENT_ANDROID);
    }, function(error) {
      console.log('- sync error: ', error);
    });
  },
  render: function() {
    return (
      <View style={styles.container}>
        <View style={styles.topToolbar}>
          <TouchableHighlight onPress={this.onClickMenu} underlayColor={"transparent"}><Icon name="navicon" size={30} style={styles.btnMenu} /></TouchableHighlight>

          <Text style={{fontWeight: 'bold', fontSize: 18, flex: 1, textAlign: 'center'}}>Background Geolocation</Text>
          <SwitchAndroid onValueChange={this.onClickEnable} value={this.state.enabled} />
        </View>
        <View style={styles.workspace}>
          <Text style={{flex: 1, textAlign: 'center'}}>Map goes here</Text>
        </View>
        <View style={styles.bottomToolbar}>
          <Icon.Button name="navigate" onPress={this.onClickLocate} color="#000" underlayColor="#ccc" backgroundColor="transparent" style={styles.btnNavigate} />
          <Text style={{fontWeight: 'bold', fontSize: 18, flex: 1, textAlign: 'center'}}></Text>
          <Icon.Button name="android-upload" onPress={this.onClickSync} style={styles.btnSync}><Text>Sync</Text></Icon.Button>
          <Text>&nbsp;</Text>
          <Icon.Button name={this.state.paceButtonIcon} onPress={this.onClickPace} style={[this.state.paceButtonStyle]}><Text>State</Text></Icon.Button>
          <Text>&nbsp;</Text>
        </View>
      </View>
    );
  }
});

var toolbarActions = [];

var styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'column',
    backgroundColor: '#F5FCFF'
  },
  topToolbar: {
    paddingLeft: 10,
    backgroundColor: '#e9eaed',    
    alignSelf: 'stretch',
    flexDirection: 'row',
    alignItems: 'center',
    height: 46,
    justifyContent: 'center'
  },
  workspace: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center'    
  },
  bottomToolbar: {
    paddingLeft: 10,
    backgroundColor: '#e9eaed',    
    alignSelf: 'stretch',
    flexDirection: 'row',
    alignItems: 'center',
    height: 46,
    justifyContent: 'center'
  },
  iconButton: {
    width: 50,
    justifyContent: 'center',
    alignItems: 'center'
    
  },
  btnMenu: {

  },
  btnNavigate: {

  },
  disabledButton: {
    backgroundColor: '#ccc'
  },
  btnPace: {
    backgroundColor: '#0c0'
  },
  btnSync: {
    
  },
  redButton: {
    backgroundColor: '#ff1300'
  },
  greenButton: {
    backgroundColor: '#4cd964'
  },
});

AppRegistry.registerComponent('RNBackgroundGeolocationSample', () => RNBackgroundGeolocationSample);