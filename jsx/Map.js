'use strict';

var React = require('react-native');
var MapboxGLMap = require('react-native-mapbox-gl');
var BackgroundGeolocation = require('react-native-background-geolocation');
var SettingsService = require('./SettingsService');
var MapBox = require('react-native-mapbox-gl');

var mapRef = 'mapRef';
var locations = [];

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

    this.settings = SettingsService;
    this.bgGeo = BackgroundGeolocation;

    var me = this;
    this.settings.getValues(function(values) {
      me.bgGeo.configure(values);

      me.bgGeo.on('location', function(location) {
        console.log('- location received: ', JSON.stringify(location));
        
        locations.push({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          title: 'Foo',
          annotationImage: {
           url: 'https://cldup.com/7NLZklp8zS.png',
           height: 25,
           width: 25
         }
        });

        me.addAnnotations(mapRef, locations);
        /*
        locations.push({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          title: 'Foo'
        });
        */

      });

      me.bgGeo.on('motionchange', function(location) {
        console.log('- motionchanged: ', JSON.stringify(location));
      });

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
    locations = [];
    if (value) {
      this.bgGeo.start();
      me.bgGeo.getCurrentPosition(function(location) {
        me.setCenterCoordinateAnimated(mapRef, location.coords.latitude, location.coords.longitude);
      });
    } else {
      this.bgGeo.stop();
    }
  },
  onRegionChange(location) {
    //this.setState({ currentZoom: location.zoom });
  },
  onRegionWillChange(location) {
    //console.log(location);
  },
  onUpdateUserLocation(location) {
    this.setCenterCoordinateAnimated(mapRef, location.latitude, location.longitude);
    console.log('- onUpdateLocation: ', location);
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
          accessToken={'pk.eyJ1IjoiY2hyaXN0b2NyYWN5IiwiYSI6ImVmM2Y2MDA1NzIyMjg1NTdhZGFlYmZiY2QyODVjNzI2In0.htaacx3ZhE5uAWN86-YNAQ'}
          styleURL={'asset://styles/mapbox-streets-v7.json'}
          //centerCoordinate={this.state.center}
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
    //underlayColor: 'transparent'
  },
  text: {
    padding: 2
  }
});

module.exports = Map;

/** Native Map
*

var React = require('react-native');
var StyleSheet = require('StyleSheet');
var BackgroundGeolocation = require('react-native-background-geolocation');
var SettingsService = require('./SettingsService');

var MapBox = require('react-native-mapbox-gl');

var {
  StyleSheet,
  MapView,
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
    
    this.settings = SettingsService;
    this.bgGeo = BackgroundGeolocation;

    var locations = [];

    this.settings.getValues(function(values) {
      me.bgGeo.configure(values);

      me.bgGeo.on('location', function(location) {
        console.log('- location received: ', JSON.stringify(location));
        locations.push({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          title: 'Foo'
        });
      });

      me.bgGeo.on('motionchange', function(location) {
        console.log('- motionchanged: ', JSON.stringify(location));
        if (location.is_moving == false) {
          setTimeout(function() {
            me.bgGeo.changePace(true);
          }, 2000);
        }
      });

      me.bgGeo.on('sync', function(rs) {
        console.log('- sync complete: ', JSON.stringify(rs));
      })
    });

    return {
      isFirstLoad: true,
      enabled: false,
      annotations: null
    };
  },
  
  onClickSettings() {
    console.log('onClickSettings', this.props.navigator);
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
    if (value) {
      this.bgGeo.start();      
    } else {
      this.bgGeo.stop();
    }
  },
  render() {
    return (
      <View style={styles.container}>        

        <View style={styles.toolbar}>          
          <TouchableHighlight style={styles.settingsButton} onPress={this.onClickSettings}>
            <Text style={styles.buttonText}>Settings</Text>
          </TouchableHighlight>
          <Text>BG Geolocation</Text>
          <SwitchIOS style={styles.toggleButton} value={this.state.enabled} onValueChange={this.onToggleEnable}></SwitchIOS>
        </View>

        <MapView
          ref={"map"}
          style={styles.map}
          annotations={this.state.annotations}
          showsUserLocation={true}
        />
        
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
      //underlayColor: 'transparent'
    }
});



module.exports = Map;

*/