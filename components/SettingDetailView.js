'use strict';


import React, { Component } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  View,
  ListView,
  Navigator,
  TouchableHighlight
 } from 'react-native';

import Icon from 'react-native-vector-icons/Ionicons';

import SettingsView from './SettingsView';

var styles = StyleSheet.create({
  container: {
    marginTop: 10,
    position: 'absolute',
    top: 5,
    left: 0,
    bottom: 0,
    right: 0,
    flexDirection: 'column',
    padding: 0,
    backgroundColor: '#efefef'
  },
  cancelButton: {
    position: 'absolute',
    left: 5,
    top: 15
  },
  row: {
    alignItems: 'center',
    padding: 15,
    flexDirection: 'row'
  },
  leftContainer: {
    flex: 1,
    left: 0
  },
  rightContainer: {
    width: 20,
    alignItems: 'flex-end',
  },
  title: {
    fontSize: 16
  },
  listView: {
    backgroundColor: '#fff'
  },
  separator: {
    height: 1,
    backgroundColor: '#dddddd'
  },
  checkmark: {

  }
});
 
var SettingDetailView = React.createClass({
  onCancel() {
    this.props.navigator.pop();
  },
  componentDidMount() {
    this.settingsService = require('./SettingsService');
    this.load(this.props.setting);
  },
  
  getInitialState() {
    var ds = new ListView.DataSource({
      rowHasChanged: function(r1, r2) {
        return true;
      }
    });
    return {
      dataSource: ds.cloneWithRows([]),
      setting: undefined
    };
  },
  // Very N.B. for changing nature of list with each different setting.
  componentWillReceiveProps: function( nextProps ) {
    if (nextProps.setting) {
      this.load(nextProps.setting);
    }
  },
  load: function(setting) {
    var state = {
      setting: setting,
      value: this.settingsService.get(setting.name),
      isLoading: false
    };
    if (setting.inputType !== 'text') {
      state.dataSource = this.state.dataSource.cloneWithRows(setting.values);
    }

    this.setState(state);
  },
  onSubmit: function(value) {
    this.props.setting.value = this.refs.text.value;
    if (typeof(this.props.onSelectValue) === 'function') {  // <-- Android
        this.props.onSelectValue(this.state.text);    
      }
  },
  onChangeText: function(value) {
    this.setState({
      text: value
    });
  },

  renderRow(setting) {
    return (
      <TouchableHighlight onPress={() => this.onSelectValue(setting)}  underlayColor='#dddddd'>
        <View>
          <View style={styles.row}>
            <View style={styles.leftContainer}>
              <Text style={styles.title}>{setting.toString()}</Text>
            </View>
            <View style={styles.rightContainer}>
              {this.state.value == setting ? <Icon name="md-checkmark" size={20} color="#4f8ef7" style={styles.checkbox} /> : null}
            </View>
          </View>
          <View style={styles.separator} />
        </View>
      </TouchableHighlight>
    );
  },
  render() {
    return this.props.setting.inputType !== 'text' ? (
      <ListView
        ref="list"
        dataSource={this.state.dataSource}
        renderRow={this.renderRow}
        enableEmptySections={true}
        style={styles.listView} />
    ) : (
      <TextInput
        ref="text"
        style={{height: 40, borderColor: 'gray', borderWidth: 1}}
        defaultValue={this.props.setting.value}
        editable={true}
        autoCorrect={false}
        blurOnSubmit={true}
        onSubmitEditing={this.onSubmit}
        onChangeText={this.onChangeText}
        keyboardType="url"/>
    );
  },
  onSelectValue(value) {
    var me      = this;
    var setting = this.props.setting;
    
    this.setState({
      value: value
    });
    this.settingsService.set(setting.name, value, function(config) {
      if (typeof(me.props.onSelectValue) === 'function') {  // <-- Android
        me.props.onSelectValue(value);    
      }
    });
   }
});
 
module.exports = SettingDetailView;