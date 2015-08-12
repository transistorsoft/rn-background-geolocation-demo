'use strict';

var React = require('react-native');
var MapboxGLMap = require('react-native-mapbox-gl');
var BackgroundGeolocation = require('react-native-background-geolocation');
var SettingsService = require('./SettingsService');
var MapBox = require('react-native-mapbox-gl');

var mapRef = 'mapRef';

// Map annotations stack.  pretty ugly business here.
// TODO MapboxGL doesn't handle annotations very well when we switch views (to Settings, for example), its annotations get all messed up.
// This needs work.
var annotations = [];

var {
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
  mixins: [MapboxGLMap.Mixin],

  getInitialState() {
    var me = this;
    
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
      });

      // This fires after plugin successfully synced to server.
      me.bgGeo.on('sync', function(rs) {
        console.log('- sync complete: ', JSON.stringify(rs));
      })
    });

    return {
      zoom: 11
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
  onToggleEnable(value) {
    var me = this;

    this.setState({
      enabled: value
    });
    annotations = [];
    if (value) {
      this.bgGeo.start(function() {
        // Successfully started.  Now fetch current position.
        me.bgGeo.getCurrentPosition(function(location) {
          me.setCenterCoordinateZoomLevelAnimated(mapRef, location.coords.latitude, location.coords.longitude, 14);
        });
      });
    } else {
      this.bgGeo.stop();
    }
  },
  onBackgroundGeolocation(location) {
    console.log('- [js] bgGeo location: ', JSON.stringify(location));
    var me    = this,
        now   = ((location.timestamp) ? new Date(location.timestamp) : new Date()),
        label = [now.getHours(), now.getMinutes(), now.getSeconds()].join(':');
    
    // Push onto our annotations stack
    annotations.push({
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      title: label,
      annotationImage: {
        // Can we provided svgs?
        url: 'https://cldup.com/7NLZklp8zS.png',
        height: 25,
        width: 25
      }
    });

    // Send annotations-stack to MapBoxGL.  Unfortunately, it has to destroy all existing then re-add...
    // TODO this needs to work better.  We need existing annotations to persist.  And we need polylines too.
    me.addAnnotations(mapRef, annotations);
  },
  onRegionChange(location) {
    //this.setState({ currentZoom: location.zoom });
  },
  onRegionWillChange(location) {
    //console.log(location);
  },
  onUpdateUserLocation(location) {
    this.setUserTrackingMode(mapRef, true);
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

        <View style={styles.toolbar}>          
          <TouchableHighlight style={styles.settingsButton} onPress={this.onClickSettings}>
            <Text style={styles.buttonText}>Settings</Text>
          </TouchableHighlight>
          <Text>BG Geolocation</Text>
          <SwitchIOS style={styles.toggleButton} value={this.state.enabled} onValueChange={this.onToggleEnable}></SwitchIOS>
        </View>

        <MapboxGLMap
          style={styles.map}
          direction={0}
          rotateEnabled={true}
          scrollEnabled={true}
          zoomEnabled={true}
          showsUserLocation={true}
          updateLocationInBackground={false}
          ref={mapRef}
          // This is a public-key provided for demo-purposes.  You should generate your own @ https://www.mapbox.com/account/apps/
          accessToken={'pk.eyJ1IjoiY2hyaXN0b2NyYWN5IiwiYSI6IjgxNjA5ZmFiZWVkY2EwZDFlYzI4OGFjZWEwODg3ZjE4In0.oyHMi64jNuUw4QlRg37E2w'}
          styleURL={'asset://styles/mapbox-streets-v7.json'}
          userLocationVisible={true}
          zoomLevel={this.state.zoom}
          onRegionChange={this.onRegionChange}
          onRegionWillChange={this.onRegionWillChange}
          annotations={this.state.annotations}
          onOpenAnnotation={this.onOpenAnnotation}
          onRightAnnotationTapped={this.onRightAnnotationTapped}
          onUpdateUserLocation={this.onUpdateUserLocation} />
        
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
    top: 0,
    height: 50,
    padding: 5,
    justifyContent: 'center',
    alignItems: 'center'
  },
  settingsButton: {
    position: 'absolute',
    left: 5,
    top: 15
  },
  toggleButton: {
    position: 'absolute',
    top: 10,
    right: 5
  },
  text: {
    padding: 2
  }
});

module.exports = Map;
