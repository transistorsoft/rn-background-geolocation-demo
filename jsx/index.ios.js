'use strict';

var React = require('react-native');
var Map = require('./Map');
var Settings = require('./Settings');
var SettingDetail = require('./SettingDetail');

var {
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

  renderScene: function(route, nav) {
    switch(route.id) {
      case 'initial':
        return <Map navigator={nav} />
      case 'settings':
        return <Settings title="Settings" navigator={nav} />
      case 'settingDetail':
        return <SettingDetail title={route.passProps.setting.name} navigator={nav} setting={route.passProps.setting} />
    }
  },

  render: function() {
    return (
      <Navigator
        style={styles.container}
        initialRoute={{id: "initial", }}
        renderScene={this.renderScene}
        configureScene={(route) => {
          if (route.sceneConfig) {
            return route.sceneConfig;
          }
          return Navigator.SceneConfigs.FloatFromBottom;
        }} />
    );
  }
});



AppRegistry.registerComponent('RNBackgroundGeolocationSample', () => Index);