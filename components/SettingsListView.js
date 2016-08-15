'use strict';
 
import React, { Component } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ListView,
  ScrollView,
  Navigator,
  TouchableHighlight,
  AsyncStorage,
  SettingsService
 } from 'react-native';

import Icon from 'react-native-vector-icons/Ionicons';
import SettingDetail from './SettingDetailView';
 
var SettingsListView = React.createClass({
    
  onCancel() {
    this.props.navigator.pop();
  },
  componentDidMount() {
    var me = this;
    this.settingsService = require('./SettingsService');
    this.createDataSource();
  },
  createDataSource: function() {
    var me = this;
    this.settingsService.getSettings(function(values) {
      var getSectionData = (dataBlob, sectionID) => {
        return dataBlob[sectionID];
      };

      var getRowData = (dataBlob, sectionID, rowID) => {
        return dataBlob[sectionID + ':' + rowID];
      };

      var ds = new ListView.DataSource({
        getSectionData: getSectionData,
        getRowData: getRowData,
        rowHasChanged: (row1, row2) => row1 !== row2,
        sectionHeaderHasChanged: (s1, s2) => s1 !== s2
      });

      var sections  = ['geolocation', 'activity recognition', 'application', 'persistence', 'http'],
          sectionIds = [],
          rowIds    = [],
          dataBlob  = {};

      for (var n=0,len=sections.length;n<len;n++) {
        var section = sections[n];
        var settings = values[section];
        sectionIds.push(section);        
        rowIds[n] = [];
        
        dataBlob[section] = settings;
        for (var s=0,lens=settings.length;s<lens;s++) {
          var setting = settings[s];
          rowIds[n].push(setting.name);
          dataBlob[section + ':' + setting.name] = setting;
        }
      }

      me.setState({
        loaded: true,
        dataSource: ds.cloneWithRowsAndSections(dataBlob, sectionIds, rowIds)
      });
    });
  },
  update: function(setting, value) {
    var me = this;
    var settings = this.settingsService;
    settings.set(setting.name, value, function(s, values) {
      me.createDataSource();
    });
  },

  getInitialState() {
    var getSectionData = (dataBlob, sectionID) => {
      return dataBlob[sectionID];
    };

    var getRowData = (dataBlob, sectionID, rowID) => {
      return dataBlob[sectionID + ':' + rowID];
    };
    return {
      loaded: false,
      dataSource: new ListView.DataSource({
        getSectionData: getSectionData,
        getRowData: getRowData,
        rowHasChanged: (row1, row2) => row1 !== row2,
        sectionHeaderHasChanged: (s1, s2) => s1 !== s2
      })
    };
  },
  renderSectionHeader(sectionData, sectionId) {
    var sectionTitle = sectionId.toUpperCase();
    return (
      <View style={styles.section}>
        <Text style={styles.text}>{sectionTitle}</Text>
      </View>
    ); 
  },
  renderSetting(setting, sectionId, rowId) {
    return (
      <TouchableHighlight onPress={() => this.onSelectSetting(setting)}  underlayColor='#dddddd'>
        <View>
          <View style={styles.row}>
            <View style={styles.leftContainer}>
              <Text style={styles.name}>{setting.name}</Text>
            </View>
            <View style={styles.rightContainer}>
              <Text style={styles.value}>{this.settingsService.get(setting.name).toString()}</Text>
              <Icon name="ios-arrow-forward" size={22} color="#4f8ef7" style={styles.disclosure} />
            </View>
          </View>
          <View style={styles.separator} />
        </View>
      </TouchableHighlight>
     );
  },
  onSelectSetting(setting) {
    if (typeof(this.props.onSelectSetting) === 'function') {  // <-- Android (@see Settings.android.js)
      this.props.onSelectSetting(setting);
    } else {
      this.props.navigator.push({ // <-- iOS
        id: 'settingDetail',
        title: setting.name,
        sceneConfig: Navigator.SceneConfigs.FloatFromRight,
        component: SettingDetail,
        passProps: {setting}
      });
    }
  },

  render() {
    return (
      <View style={styles.container}>
        <ListView
          dataSource={this.state.dataSource}
          renderRow={this.renderSetting}
          renderSectionHeader={this.renderSectionHeader}
          style={styles.listView}
        />
      </View>
    );
  },    
    
});

var styles = StyleSheet.create({
    container: {
      flex: 1,
      flexDirection: 'column',
      padding: 0
    },
    section: {
      backgroundColor: '#f5f5f5',
      paddingTop: 30,
      paddingLeft: 15,
      paddingBottom: 10,
      paddingRight: 15
    },
    cancelButton: {
      position: 'absolute',
      left: 5,
      top: 17
    },
    row: {
      alignItems: 'center',
      flex: 1,
      padding: 15,
      flexDirection: 'row'
    },
    leftContainer: {
      flex: 1,
      left: 0
    },
    rightContainer: {
        flex: 0.4,
        alignItems: 'flex-end',
    },
    name: {
      fontSize: 16
    },
    value: {
      marginRight: 15,
      fontSize: 16
    },
    separator: {
      height: 1,
      backgroundColor: '#dddddd'
    },
    listView: {
      backgroundColor: '#fff'
    },
    disclosure: {
      position: 'absolute',
      right: -10,
      top: 0
    }
});

module.exports = SettingsListView;