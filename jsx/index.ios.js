'use strict';

var React = require('react-native');
var {
  AppRegistry,
  StyleSheet,
  View,
  TouchableHighlight,
  StatusBarIOS,
  Text
} = React;

var Drawer                = require('react-native-drawer');
var Icon                  = require('react-native-vector-icons/Ionicons');
var BackgroundGeolocation = require('react-native-background-geolocation');

var Home                  = require('./ios/Home.ios');
var Settings              = require('./ios/Settings.ios');

var Application = React.createClass({
  getInitialState: function() {
    return {
      drawer: undefined
    };
  },
  componentDidMount: function() {
    var me = this;
    StatusBarIOS.setStyle('default');
    this.setState({
      drawer: this.refs.drawer
    });
  },
  onClickMenu: function() {
    this.refs.drawer.open();
  },
  getDrawer: function() {
    return this.refs.drawer;
  },
  render: function() {
    return (
      <View style={{paddingTop: 20, backgroundColor: "#ffd700", flex: 1}}>
        <Drawer ref="drawer" side="right" acceptPan={false} content={<Settings drawer={this.refs.drawer} locationManager={BackgroundGeolocation} />}>
          <Home drawer={this.state.drawer} locationManager={BackgroundGeolocation} />    
        </Drawer>
      </View>
    );
  }
});

AppRegistry.registerComponent('RNBackgroundGeolocationDemo', () => Application);