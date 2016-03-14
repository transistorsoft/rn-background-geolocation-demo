'use strict';

var React                 = require('react-native');
var Icon                  = require('react-native-vector-icons/Ionicons');
var BackgroundGeolocation = require('react-native-background-geolocation');
var SettingsService       = require('./SettingsService');

SettingsService.init('iOS');

var mapRef = 'mapRef';

var {
  AsyncStorage,
  StyleSheet,
  MapView,
  AppStateIOS,
  Text,
  TextInput,
  View,
  SwitchIOS,
  Navigator,
  NavButton,
  TouchableHighlight
} = React;

var Map = React.createClass({
  
  getInitialState() {
    var me = this;
    
    AsyncStorage.getItem("state")
    .then((values) => {
      if (values !== null){
        values = JSON.parse(values);
        values.isStationary = true;
        me.setState(values);
        if (values.isEnabled) {
          me.onToggleEnabled(values.isEnabled);
        }
      } 
    })
    .catch((error) => console.error("- error: ", error.message))
    .done();

    AppStateIOS.addEventListener('change', this.onAppStateChange);

    this.bgGeo = BackgroundGeolocation;

    // Fetch bg-geo settings.
    SettingsService.getValues(function(values) {

      // Configure Background Geolocation.
      me.bgGeo.configure(values);

      // Event: location.  Listen to location events coming out.
      me.bgGeo.on('location', me.onBackgroundGeolocation);
      
      // Event: motionchange. Listen to motionchange events.
      me.bgGeo.on('motionchange', function(location) {
        console.log('- motionchanged: ', JSON.stringify(location));
        me.setState({
          isStationary: !location.is_moving,
          paceButtonStyle: (location.is_moving) ? styles.redButton : styles.greenButton
        });
      });

      // Event: sync:  This fires after plugin successfully synced to server.
      me.bgGeo.on('sync', function(rs) {
        console.log('- sync complete: ', JSON.stringify(rs));
      });

      // Event: http
      me.bgGeo.on('http', function(response) {
        console.log('- EVENT: http', JSON.stringify(response));
      });

      // Event: error
      me.bgGeo.on('error', function(error) {
        alert(error.type + ' error: ' + error.code);
        console.log('- ERROR: ', JSON.stringify(error));
      });
    });

    return {
      zoom: 11,
      odometer: 0,
      isEnabled: false,
      isStationary: true,
      paceButtonStyle: styles.greenButton,
      navigateButton: 'navigate'
    };
  },
  onAppStateChange(state) {
    if (state === 'active') {
      var me = this;
      me.bgGeo.getCurrentPosition({timeout: 1000}, function(location) {
        console.log('- received current position: ', location);
      }, function(error) {
        alert('Location error: ' + error);
      });
    }
  },
  onClickSettings() {
    this.props.navigator.push({
      id: 'settings',
      sceneConfig: Navigator.SceneConfigs.FloatFromBottom,
    });
  },
  onToggleEnabled(enabled) {
    var me = this;

    if (!enabled && !this.state.isStationary) {
      this.onToggleStationary();
    }
    this.setState({
      isEnabled: enabled,
      odometer: 0
    }, function() {
      AsyncStorage.setItem("state", JSON.stringify(me.state));
    });

    this.bgGeo.resetOdometer(function() {
      console.log('- resetOdometer success');
    });

    if (enabled) {
      this.bgGeo.start(function() {
        // Successfully started.  Now fetch current position.
        me.bgGeo.getCurrentPosition({timeout: 1000}, function(location) {
          console.log('[js] received current position: ', location);  
        }, function(error) {
          alert('Location error: ' + error);
        });
      });
    } else {
      this.bgGeo.stop();
    }
  },
  onToggleStationary() {  
    var me = this;
    var value = !this.state.isStationary;

    this.setState({
      isStationary: value,
      paceButtonStyle: (value) ? styles.greenButton : styles.redButton
    });

    this.bgGeo.changePace(!value);
  },
  onUpdatePosition() {
    var me = this;
    this.setState({
      navigateButton: 'load-d'
    });

    me.bgGeo.getCurrentPosition({timeout: 1000}, function(location) {
      me.bgGeo.sync(function(locations) {
        console.log(JSON.stringify(locations));
      });

      me.bgGeo.getGeofences(function(rs) {
        console.log('- current geofences: ', rs);
      });
      me.setState({
        navigateButton: 'navigate'
      });
    }, function(error) {
      alert('Location error: ' + error);
      me.setState({
        navigateButton: 'navigate'
      });
    });
  },
  onBackgroundGeolocation(location) {
    console.log('- [js] bgGeo location: ', JSON.stringify(location));
    var me    = this,
        now   = ((location.timestamp) ? new Date(location.timestamp) : new Date()),
        label = [now.getHours(), now.getMinutes(), now.getSeconds()].join(':');
    
    me.bgGeo.beginBackgroundTask(function(taskId) {
      me.bgGeo.getLocations(function(rs) {
        console.log('- locations: ', JSON.stringify(rs));
        // sync
        me.bgGeo.sync(function(rs) {
          console.log('- sync: ', JSON.stringify(rs));
          me.bgGeo.finish(taskId);
        }, function(error) {
          console.log('- sync ERROR: ', error);
          me.bgGeo.finish(taskId);
        });      
      }, function(error) {
        console.log('- getLocations ERROR: ', error);
        me.bgGeo.finish(taskId);
      });

    });

    me.bgGeo.getOdometer(function(distance) {
      me.setState({
        odometer: (distance/1000).toFixed(1)
      });
    });
  },
  onRegionChange(location) {
    //this.setState({ currentZoom: location.zoom });
  },
  onRegionWillChange(location) {
    //console.log(location);
  },
  onUpdateUserLocation(location) {
    //console.log('[js]MapBox location: ', location);
  },
  onOpenAnnotation(annotation) {
    //console.log(annotation);
  },
  onRightAnnotationTapped(e) {
    //console.log(e);
  },
  render: function() {
    
    return (
      <View style={styles.container}>        
        <View style={styles.map}><Text>Map Goes Here</Text></View>
        <View style={styles.toolbar}>
          <TouchableHighlight style={[styles.locationButton, styles.iconButton]} underlayColor={"transparent"} onPress={this.onUpdatePosition}>
            <Icon name={this.state.navigateButton} size={24} color="#4f8ef7" />
          </TouchableHighlight>
          <Text>{this.state.odometer}km</Text>

          <SwitchIOS style={styles.enabledButton} value={this.state.isEnabled} onValueChange={this.onToggleEnabled}></SwitchIOS>

          <TouchableHighlight style={[this.state.paceButtonStyle, styles.stationaryButton, styles.iconButton]} underlayColor={"transparent"} onPress={this.onToggleStationary}>
            <Icon name={this.state.isStationary ? 'play' : 'pause'} size={24} />
          </TouchableHighlight>

        </View>
      </View>
    );
  }
});

var styles = StyleSheet.create({
  container: {
    flex: 1,
    marginTop: 10,
    backgroundColor: 'transparent',
  },
  map: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5FCFF',
  },
  toolbar: {
    //top: 50,
    height: 50,
    padding: 5,
    justifyContent: 'center',
    alignItems: 'center'
  },
  settingsButton: {
    position: 'absolute',
    left: 10,
    top: 15
  },
  buttonText: {
    color: 'blue',
    fontSize: 16
  },
  locationButton: {
    position: 'absolute',
    left: 0,
    top: 0
  },
  spinner: {
    position: 'absolute',
    top: 10,
    left: 40
  },
  iconButton: {
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center'
  },
  enabledButton: {
    position: 'absolute',
    top: 10,
    right: 60
  },
  stationaryButton: {
    position: 'absolute',
    top: 0,
    right: 0
  },
  paceButton: {

  },
  redButton: {
    backgroundColor: '#ff1300'
  },
  greenButton: {
    backgroundColor: '#4cd964'
  },
  text: {
    padding: 2
  }
});

module.exports = Map;
