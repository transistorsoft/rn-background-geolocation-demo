'use strict';

import React, { Component } from 'react';
import {
  StyleSheet
 } from 'react-native';

var styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'column',
    backgroundColor: '#F5FCFF'    
  },
  topToolbar: {    
    backgroundColor: '#ffd700',  //ff d7 00
    borderBottomColor: '#E6BE00',
    borderBottomWidth: 1,
    paddingRight: 5,
    alignSelf: 'stretch',
    flexDirection: 'row',
    alignItems: 'center',
    height: 46
  },
  iosStatusBar: {
    height: 20,
    backgroundColor: '#ffd700'
  },
  bottomToolbar: {
  	paddingLeft: 5,
    paddingRight: 5,
    backgroundColor: '#eee',
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
  	textAlign: 'center'
  },
  disabledButton: {
    backgroundColor: '#ccc'
  },
  iconButton: {
    width: 50,
    flex: 1
  },
  labelActivity: {
    alignItems: "center",
    justifyContent: "center",    
    borderRadius: 3,
    width: 40,
    padding: 3
  },
  label: {
    padding: 3,
    width: 75
  },
  labelText: {
    fontSize: 14,
    textAlign: 'center'
  },
  backButtonIcon: {
  	//marginRight: 
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
