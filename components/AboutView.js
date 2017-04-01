import React, { Component } from 'react';
import {
  StyleSheet,
  Text,
  View,
  WebView,
  ScrollView,
 } from 'react-native';

import Icon from 'react-native-vector-icons/Ionicons';
import Button from 'apsl-react-native-button'

import SettingsService from './lib/SettingsService';
import BGService from './lib/BGService';

import commonStyles from './styles';
import Config from './config';

class AboutView extends React.Component {
  constructor(props) {
    super(props);
    this.modal = props.modal;
  }

  onClickClose() {
    this.modal().close();
  }

  render() {
    return (
      <View style={styles.container}>
        <View style={commonStyles.topToolbar}>
          <Icon.Button
              name="ios-arrow-dropdown-circle"
              size={25}
              onPress={this.onClickClose.bind(this)}
              backgroundColor="transparent"
              underlayColor="transparent"
              color={Config.colors.black}>
            </Icon.Button>
          <Text style={commonStyles.toolbarTitle}>Transistor Software</Text>
          <Text style={{width:50}}>&nbsp;</Text>
        </View>
        <WebView
            source={{uri: 'http://www.transistorsoft.com/shop/products/react-native-background-geolocation'}}
          />
        <View style={styles.footer}>
          <Button onPress={this.onClickClose.bind(this)} style={styles.closeButton} textStyle={{color: '#fff'}}>Close</Button>
        </View>
      </View>
    );
  }
}


let styles = StyleSheet.create({
  container: {
    flexDirection: 'column',
    alignItems: 'stretch',
    backgroundColor: Config.colors.black,
    flex: 1
  },
  body: {
    flex: 1,
    padding: 5,
  },
  footer: {
    height: 55,
    padding: 5
  },
  closeButton: {
    backgroundColor: Config.colors.black,
    borderWidth: 0
  }
});

module.exports = AboutView;