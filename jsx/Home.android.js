'use strict';

var React = require('react-native');
var {
  StyleSheet,
  Text,
  View,
  ToolbarAndroid,
  SwitchAndroid
} = React;

var RNGMap                = require('react-native-gmaps');
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

var Home = React.createClass({
  getInitialState: function() {
    return {
      enabled: false,
      isMoving: false,
      paceButtonStyle: styles.disabledButton,
      paceButtonIcon: 'play',
      navigateButtonIcon: 'navigate',
      mapHeight: 300,
      mapWidth: 300,
      // mapbox
      center: {
        lat: 40.7223,
        lng: -73.9878
      },
      zoom: 10,
      markers: []
    };
  },

  componentDidMount: function() {
    var me = this;    
    // location event
    BackgroundGeolocation.on("location", function(location) {
      console.log('- location: ', JSON.stringify(location));
      var marker = {
        title: location.timestamp,
        coordinates: {
          lat: location.coords.latitude, 
          lng: location.coords.longitude
        }
      };
      var markers = me.state.markers;
      markers.push(marker);
      me.setState({
        markers: markers
      });

      // TODO MapBox for Android has no API for adding annotations at run-time.
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
      me.setState({
        paceButtonStyle: (event.isMoving) ? commonStyles.redButton : commonStyles.greenButton,
        paceButtonIcon: (event.isMoving) ? 'stop' : 'play'
      });
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
  onClickMenu: function() {
    this.props.drawer.open();
  },
  onClickEnable: function() {    
    var me = this;
    if (!this.state.enabled) {
      BackgroundGeolocation.start(function() {
        console.log('- start success');
        BackgroundGeolocation.getCurrentPosition(function(location) {
          me.setState({
            zoom: 16,
            center: {
              lat: location.coords.latitude,
              lng: location.coords.longitude
            }
          });
        })
      });
      this.state.paceButtonStyle = (this.state.isMoving) ? commonStyles.redButton : commonStyles.greenButton;
    } else {
      BackgroundGeolocation.stop();
      this.setState({
        markers: []
      });
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
      paceButtonStyle: (isMoving) ? commonStyles.redButton : commonStyles.greenButton,
      paceButtonIcon: (isMoving) ? 'stop' : 'play'
    });      
  },
  onClickLocate: function() {
    var me = this;
    this.setState({
      navigateButtonIcon: 'load-d'
    });
    BackgroundGeolocation.getCurrentPosition(function(location) {
      me.setState({navigateButtonIcon: 'navigate'});
      console.log('- current position: ', JSON.stringify(location));
    });
  },
  onRegionChange: function() {
    console.log('onRegionChange');
  },
  
  onLayout: function() {
    console.log('- onLayout');
    var me = this,
        gmap = this.refs.gmap;

    this.refs.workspace.measure(function(ox, oy, width, height, px, py) {
      console.log('measure: ', width, height);
      me.setState({
        mapHeight: height,
        mapWidth: width
      });
    });
  },
  render: function() {
    return (
      <View style={commonStyles.container}>
        <View style={commonStyles.topToolbar}>
          <Icon.Button name="android-options" onPress={this.onClickMenu} backgroundColor="transparent" size={30} color="#000" style={styles.btnMenu} underlayColor={"transparent"} />
          <Text style={commonStyles.toolbarTitle}>Background Geolocation</Text>
          <SwitchAndroid onValueChange={this.onClickEnable} value={this.state.enabled} />
        </View>
        <View ref="workspace" style={styles.workspace} onLayout={this.onLayout}>
          <RNGMap
            ref={'gmap'}
            style={{width: this.state.mapWidth, height: this.state.mapHeight}}
            markers={this.state.markers}
            zoomLevel={this.state.zoom}
            onMapChange={(e) => console.log(e)}
            onMapError={(e) => console.log('Map error --> ', e)}
            center={this.state.center} />

        </View>
        <View style={commonStyles.bottomToolbar}>
          <Icon.Button name={this.state.navigateButtonIcon} onPress={this.onClickLocate} size={25} color="#000" underlayColor="#ccc" backgroundColor="transparent" style={styles.btnNavigate} />
          <Text style={{fontWeight: 'bold', fontSize: 18, flex: 1, textAlign: 'center'}}></Text>
          <Icon.Button name={this.state.paceButtonIcon} onPress={this.onClickPace} iconStyle={commonStyles.iconButton} style={[this.state.paceButtonStyle]}><Text>State</Text></Icon.Button>
          <Text>&nbsp;</Text>
        </View>
      </View>
    );
  }
});

var toolbarActions = [];

var commonStyles = require('./Styles.common');

var styles = StyleSheet.create({
  workspace: {
    flex: 1
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
  map: {
    width: require('Dimensions').get('window').width,
    flex: 1
  }
});

module.exports = Home;