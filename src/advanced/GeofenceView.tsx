import React from 'react'
import {Component} from 'react';

import {
  StyleSheet
} from 'react-native';

import {
  Container,
  Button, Icon,
  Text,
  Header, Title,
  Content,
  Left, Body, Right,
  Form, Label, Input, Picker, Switch,
  Item as FormItem
} from 'native-base';

////
// Import BackgroundGeolocation plugin
// Note: normally you will not specify a relative url ../ here.  I do this in the sample app
// because the plugin can be installed from 2 sources:
//
// 1.  npm:  react-native-background-geolocation
// 2.  private github repo (customers only):  react-native-background-geolocation-android
//
// This simply allows one to change the import in a single file.
import BackgroundGeolocation from "../react-native-background-geolocation";

import {COLORS} from './lib/config';
import SettingsService from './lib/SettingsService';

export default class GeofenceView extends Component<any, any> {
  constructor(props:any) {
    super(props);
    this.state = {
      identifier: undefined,
      radius: '200',
      notifyOnEntry: true,
      notifyOnExit: true,
      notifyOnDwell: false,
      loiteringDelay: '0'
    }
  }

  onClickCancel() {
    this.props.navigation.goBack();
    SettingsService.getInstance().playSound('CLOSE');
  }

  onAddGeofence() {
    console.log('- onAddGeofence', this.state);
    let settingsService = SettingsService.getInstance();


    settingsService.playSound('ADD_GEOFENCE');

    let coordinate = this.props.navigation.state.params.coordinate;
    let radius = parseInt(this.state.radius, 10);
    let loiteringDelay = parseInt(this.state.loiteringDelay, 10);

    BackgroundGeolocation.addGeofence({
      latitude: coordinate.latitude,
      longitude: coordinate.longitude,
      identifier: this.state.identifier,
      radius: radius,
      notifyOnEntry: this.state.notifyOnEntry,
      notifyOnExit: this.state.notifyOnExit,
      notifyOnDwell: this.state.notifyOnDwell,
      extras: { // For tracker.transistorsoft.com to render geofence hits.
        radius: radius,
        center: coordinate
      }
    }, () => {
      console.log('- addGeofence success');
    }, (error) => {
      console.warn('- addGeofence error: ', error);
    });

    this.props.navigation.goBack();
  }

  onChangeText(field:any, value:any) {
    let state:any = {};
    state[field] = value;
    this.setState(state);
  }

  onToggle(field:any, value:any) {
    let state:any = {};
    state[field] = value;
    this.setState(state);
  }

  render() {
    return (
      <Container style={styles.container}>
        <Header style={styles.header}>
          <Left>
            <Button transparent onPress={this.onClickCancel.bind(this)}>
              <Icon color="#000" style={{color: "#000"}} active name="close" />
            </Button>
          </Left>
          <Body>
            <Title style={styles.title}>Add Geofence</Title>
          </Body>
          <Right>
            <Button small bordered dark onPress={this.onAddGeofence.bind(this)}><Text>Add</Text></Button>
          </Right>
        </Header>

        <Content style={styles.content}>
          <Form>
            <FormItem inlineLabel style={styles.formItem}>
              <Label style={styles.label}>Identifier</Label>
              <Input value={this.state.identifier} onChangeText={(value) => {this.onChangeText('identifier', value)}} />
            </FormItem>
            <FormItem inlineLabel style={styles.formItem}>
              <Label style={styles.label}>Radius (meters)</Label>
              <Input value={this.state.radius} onChangeText={(value) => {this.onChangeText('radius', value)}}/>
            </FormItem>
            <FormItem inlineLabel style={styles.formItem}>
              <Label style={styles.label}>Notify on Entry</Label>
              <Right><Switch style={styles.switch} value={this.state.notifyOnEntry} onValueChange={(value) => {this.onToggle('notifyOnEntry', value)}} /></Right>
            </FormItem>
            <FormItem inlineLabel style={styles.formItem}>
              <Label style={styles.label}>Notify on Exit</Label>
              <Right><Switch style={styles.switch} value={this.state.notifyOnExit} onValueChange={(value) => {this.onToggle('notifyOnExit', value)}}/></Right>
            </FormItem>
            <FormItem inlineLabel style={styles.formItem}>
              <Label style={styles.label}>Notify on Dwell</Label>
              <Right><Switch style={styles.switch} value={this.state.notifyOnDwell} onValueChange={(value) => {this.onToggle('notifyOnDwell', value)}}/></Right>
            </FormItem>
            <FormItem inlineLabel style={styles.formItem}>
              <Label style={styles.label}>Loitering delay (ms)</Label>
              <Input value={this.state.loiteringDelay} onChangeText={(value) => {this.onChangeText('loiteringDelay', value)}} />
            </FormItem>
          </Form>
        </Content>
      </Container>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fefefe'
  },
  header: {
    backgroundColor: '#fedd1e'
  },
  title: {
    color: '#000'
  },
  content: {},
  headerItem: {
    marginTop: 20,
    marginLeft: 0,
    paddingLeft: 10,
    paddingBottom: 5,
    backgroundColor: "transparent"
  },
  formItem: {
    backgroundColor: "#fff",
    paddingLeft: 10,
    minHeight: 50,
    marginLeft: 0
  },
  label: {
    color: COLORS.light_blue,
  },
  switch: {
    marginRight: 10
  }
});
