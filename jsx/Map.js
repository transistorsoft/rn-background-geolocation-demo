'use strict';

var React                 = require('react-native');
var Icon                  = require('react-native-vector-icons/Ionicons');
var BackgroundGeolocation = require('react-native-background-geolocation');
var SettingsService       = require('./SettingsService');

var mapRef = 'mapRef';

// Map annotations stack.  pretty ugly business here.
// TODO MapboxGL doesn't handle annotations very well when we switch views (to Settings, for example), its annotations get all messed up.
// This needs work.
var annotations = [];

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

      // Listen to location events coming out.
      me.bgGeo.on('location', me.onBackgroundGeolocation);
      
      // Listen to motionchange events.
      me.bgGeo.on('motionchange', function(location) {
        console.log('- motionchanged: ', JSON.stringify(location));
        me.setState({
          isStationary: !location.is_moving,
          paceButtonStyle: (location.is_moving) ? styles.redButton : styles.greenButton
        });
      });

      // This fires after plugin successfully synced to server.
      me.bgGeo.on('sync', function(rs) {
        console.log('- sync complete: ', JSON.stringify(rs));
      })
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
      me.bgGeo.getCurrentPosition(function(location) {
        //me.setCenterCoordinateAnimated(mapRef, location.coords.latitude, location.coords.longitude);  
      })      
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

    annotations = [];
    if (enabled) {
      this.bgGeo.start(function() {
        // Successfully started.  Now fetch current position.
        me.bgGeo.getCurrentPosition(function(location) {
          //me.setCenterCoordinateZoomLevelAnimated(mapRef, location.coords.latitude, location.coords.longitude, 14);
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
    me.bgGeo.getCurrentPosition(function(location) {
      //me.setCenterCoordinateAnimated(mapRef, location.coords.latitude, location.coords.longitude);
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
    
    me.bgGeo.getOdometer(function(distance) {
      me.setState({
        odometer: (distance/1000).toFixed(1)
      });
    });

    // Push onto our annotations stack
    annotations.push({
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      title: label,
      annotationImage: {
        url: 'https://dl.dropboxusercontent.com/u/2319755/react-native-background-geolocation-demo/green-dot.png',
        height: 20,
        width: 20
      }
    });

    // Send annotations-stack to MapBoxGL.  Unfortunately, it has to destroy all existing then re-add...
    // TODO this needs to work better.  We need existing annotations to persist.  And we need polylines too.
    //me.addAnnotations(mapRef, annotations);
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
