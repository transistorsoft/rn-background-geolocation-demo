'use strict';

var React = require('react-native');
var {
  AppRegistry,
  StyleSheet,
  Text
} = React;

var Drawer                = require('react-native-drawer');
var Home                  = require('./Home.android');
var Settings              = require('./Settings.android');
var Icon                  = require('react-native-vector-icons/Ionicons');

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
      <Text>MOtherfucker</Text>
    );
  }
});


var styles = StyleSheet.create({
  
});

AppRegistry.registerComponent('RNBackgroundGeolocationSample', () => Application);