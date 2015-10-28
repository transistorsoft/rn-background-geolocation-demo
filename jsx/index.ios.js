'use strict';

var React = require('react-native');
var Map = require('./Map');
var Settings = require('./Settings');
var SettingDetail = require('./SettingDetail');

var {
  NavigatorIOS,
  Navigator,
  StyleSheet,
  AppRegistry,
  Text,
  View,
  TouchableHighlight,
} = React;

var styles = StyleSheet.create({
  messageText: {
    fontSize: 17,
    fontWeight: '500',
    padding: 15,
    marginTop: 50,
    marginLeft: 15,
  },
  container: {
    flex: 1,
  },
  button: {
    backgroundColor: 'white',
    padding: 15,
    borderBottomColor: '#CDCDCD',
  },
  buttonText: {
    fontSize: 17,
    fontWeight: '500',
  },
  scene: {
    flex: 1,
    paddingTop: 20,
    backgroundColor: '#EAEAEA',
  }
});

var Index = React.createClass({

  render: function() {
    return (
      <NavigatorIOS
        style={styles.container}
        ref="nav"
        initialRoute={{
          component: Map,
          title: "Map",
          leftButtonTitle: 'Settings',
          onLeftButtonPress: () => {
            this.refs.nav.navigator.push({
              component: Settings,
              id: 'settings',
              title: 'Settings'
            })
          }
        }}
        configureScene={(route) => {
          if (route.sceneConfig) {
            return route.sceneConfig;
          }
          return Navigator.SceneConfigs.FloatFromBottom;
        }} />
    );
  }
});



AppRegistry.registerComponent('RNBackgroundGeolocationDemo', () => Index);