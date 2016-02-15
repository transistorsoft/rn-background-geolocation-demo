'use strict';

var React = require('react-native');
var {
  AppRegistry,
  StyleSheet,
  Text
} = React;

var Drawer                = require('react-native-drawer');
var Icon                  = require('react-native-vector-icons/Ionicons');
var BackgroundGeolocation = require('react-native-background-geolocation-android');

global.bgGeo = BackgroundGeolocation;


var Home                  = require('./android/Home.android');
var Settings              = require('./android/Settings.android');

var Application = React.createClass({
  getInitialState: function() {
    return {
      
    };
  },

  componentDidMount: function() {
    var me = this;

    this.setState({
      
    });
  },
  onClickMenu: function() {
    this.props.refs.drawer.open();
  },

  render: function() {
    return (
      <Drawer ref="drawer" side="right" acceptPan={false} content={<Settings drawer={this.refs.drawer} locationManager={BackgroundGeolocation} />}>
        <Home drawer={this.refs.drawer} locationManager={BackgroundGeolocation} />    
      </Drawer>
    );
  }
});


var styles = StyleSheet.create({
  
});

AppRegistry.registerComponent('RNBackgroundGeolocationSample', () => Application);