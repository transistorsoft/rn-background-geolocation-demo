'use strict';

var React = require('react-native');
var {
  StyleSheet
} = React;

var styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'column',
    backgroundColor: '#F5FCFF'
  },
  topToolbar: {
    paddingLeft: 10,
    backgroundColor: '#ffd700',  //ff d7 00
    borderBottomColor: '#E6BE00',
    borderBottomWidth: 1,
    alignSelf: 'stretch',
    flexDirection: 'row',
    alignItems: 'center',
    height: 46
  },
  bottomToolbar: {
  	paddingLeft: 10,
    backgroundColor: '#efefef',
    borderTopColor: '#d6d6d6',
    borderTopWidth: 1,
    alignSelf: 'stretch',
    flexDirection: 'row',
    alignItems: 'center',
    height: 46
  },
  toolbarTitle: {
  	fontWeight: 'bold', 
  	fontSize: 18, 
  	flex: 1, 
  	textAlign: 'center', 
  	paddingLeft: -60
  },
  iconButton: {
    marginRight: 5
  },
  backButtonIcon: {
  	marginRight: -10
  },
  backButtonText: {
  	fontSize: 18,
  	color: '#4f8ef7'
  },
  redButton: {
    backgroundColor: '#D9534F'
  },
  greenButton: {
    backgroundColor: '#5CB85C'
  }
  
});

module.exports = styles;
