'use strict';

var React = require('react-native');
var {
  AppRegistry,
  StyleSheet,
  TouchableHighlight,
  Text
} = React;

var Drawer                = require('react-native-drawer');
var Home                  = require('./Home.ios');
var Settings              = require('./Settings.ios');
var Icon                  = require('react-native-vector-icons/Ionicons');
var BackgroundGeolocation = require('react-native-background-geolocation');

var Drawer = require('react-native-drawer');

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
    this.refs.drawer.open();
  },

  render: function() {
    return (
      <Drawer ref="drawer" side="right" acceptPan={false} style={{marginTop: 70}} content={<Settings drawer={this.refs.drawer} locationManager={BackgroundGeolocation} />}>
        <Home drawer={this.refs.drawer} locationManager={BackgroundGeolocation} />    
      </Drawer>
    );
  }
});

AppRegistry.registerComponent('RNBackgroundGeolocationDemo', () => Application);