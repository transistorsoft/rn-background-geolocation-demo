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
      <Drawer ref="drawer" side="right" acceptPan={false} content={<Settings drawer={this.refs.drawer} />}>
        <Home drawer={this.refs.drawer} />    
      </Drawer>
    );
  }
});


var styles = StyleSheet.create({
  
});

AppRegistry.registerComponent('RNBackgroundGeolocationSample', () => Application);