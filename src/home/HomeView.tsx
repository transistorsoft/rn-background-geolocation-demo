
import React from 'react'
import {Component} from 'react';

import {
  Platform,
  StyleSheet,
  Linking,
  Alert,
  TextInput,
  View
} from 'react-native';

import AsyncStorage from '@react-native-community/async-storage';

import { NavigationActions, StackActions } from 'react-navigation';

import {
  Container, Header, Content, Footer,
  Left, Body, Right,
  Card, CardItem,
  Text, H1,
  Button, Icon,
  Title,
  Form, Item, Input, Label
} from '@codler/native-base';

import BackgroundGeolocation, {DeviceInfo, TransistorAuthorizationToken} from "../react-native-background-geolocation";

import {registerTransistorAuthorizationListener} from '../lib/Authorization';

import ENV from "../ENV";

// Only allow alpha-numeric usernames with '-' and '_'
const USERNAME_VALIDATOR =  /^[a-zA-Z0-9_-]*$/;

type IProps = {
  navigation: any
}
type IState = {
  username: string,
  orgname: string,
  deviceManufacturer: string,
  deviceModel: string,
  deviceIdentifier: string
}

export default class HomeView extends Component<IProps, IState> {

  constructor(props:IProps) {
    super(props);

    let navigation = props.navigation;
    this.state = {
      deviceModel: '',
      deviceManufacturer: '',
      deviceIdentifier: '',
      orgname: '',
      username: ''
    }
  }

  async componentDidMount() {
    // #stop BackroundGeolocation and remove-listeners when Home Screen is rendered.
    await BackgroundGeolocation.stop();
    await BackgroundGeolocation.removeListeners();

    let deviceInfo:DeviceInfo = await BackgroundGeolocation.getDeviceInfo();

    let orgname = await AsyncStorage.getItem('orgname') || '';
    let username = await AsyncStorage.getItem('username') || '';
    let deviceIdentifier = deviceInfo.model;

    if (this.usernameIsValid(username) && !this.usernameIsValid(orgname)) {
      await AsyncStorage.setItem('orgname', username);
      await AsyncStorage.removeItem('username');
      orgname = username;
      username = '';
    }
    if (username && username.length) {
      deviceIdentifier += '-' + username;
    }

    this.setState({
      orgname: orgname,
      username: username,
      deviceModel: deviceInfo.model,
      deviceManufacturer: deviceInfo.manufacturer,
      deviceIdentifier: deviceIdentifier
    });

    BackgroundGeolocation.setConfig({logLevel: 5});

    if (!this.usernameIsValid(orgname) || !this.usernameIsValid(username)) {
      this.register();
    }
  }

  async onClickNavigate(routeName:string) {
    if (!this.usernameIsValid(this.state.orgname) || !this.usernameIsValid(this.state.username)) {
      return this.register();
    }
    await AsyncStorage.setItem("@transistorsoft:initialRouteName", routeName);
    let action = StackActions.reset({
      index: 0,
      actions: [
        NavigationActions.navigate({routeName: routeName, params: {
          orgname: this.state.orgname,
          username: this.state.username
        }})
      ],
      key: null
    });

    this.props.navigation.dispatch(action);
  }

  register() {
    this.props.navigation.navigate('Registration', {response: (result:any) => {
      if (result == null) return;
      this.setState({
        orgname: result.orgname,
        username: result.username,
        deviceIdentifier: this.state.deviceModel + '-' + result.username
      })
    }});
  }

  onClickViewServer() {
    let url = ENV.TRACKER_HOST + '/' + this.state.orgname;
    Linking.canOpenURL(url).then(supported => {
      if (supported) {
        Linking.openURL(url);
      } else {
        console.log("Don't know how to open URI: " + url);
      }
    });
  }

  usernameIsValid(value:string):boolean {
    return (value.length>0) && USERNAME_VALIDATOR.test(value);
  }

  render() {
    return (
      <Container>

        <Header style={styles.header}>
          <Body>
            <Title style={styles.title}>BG Geolocation</Title>
          </Body>
        </Header>
        <Body style={styles.body}>
            <H1 style={styles.h1}>Example Applications</H1>
            <Button full style={styles.button} onPress={() => this.onClickNavigate('HelloWorld')}><Text>Hello World</Text></Button>
            <Button full style={styles.button} onPress={() => this.onClickNavigate('SimpleMap')}><Text>Simple Map</Text></Button>
            <Button full style={styles.button} onPress={() => this.onClickNavigate('Advanced')}><Text>Advanced</Text></Button>
        </Body>

        <Footer style={styles.footer}>
            <Card style={styles.userInfo}>
              <Text style={styles.p}>These apps will post locations to Transistor Software's demo server.  View your tracking in the browser by visiting:</Text>
              <Text style={styles.url}>{ENV.TRACKER_HOST + '/' + this.state.orgname}</Text>

              <CardItem cardBody>
                <Text style={styles.formLabel}>Organization: </Text><Text>{this.state.orgname}</Text>
              </CardItem>
              <CardItem cardBody>
                <Text style={styles.formLabel}>Device ID: </Text><Text>{this.state.deviceIdentifier}</Text>
              </CardItem>
              <CardItem footer bordered>
                <Left>
                  <Button danger full onPress={this.register.bind(this)}><Text>Edit username</Text></Button>
                </Left>
                <Right>
                  <Button full onPress={this.onClickViewServer.bind(this)}><Text>View server</Text></Button>
                </Right>
              </CardItem>
            </Card>
        </Footer>
      </Container>
    );
  }
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: '#fedd1e'
  },
  title: {
    color: '#000'
  },
  body: {
    width: '100%',
    justifyContent: 'center',
    backgroundColor:'#272727'
  },
  h1: {
    color: '#fff',
    marginBottom: 20
  },
  deviceModel: {
    textAlign:'center',
    fontWeight:'bold',
    fontStyle:'italic',
    paddingTop: 10
  },
  p: {
    fontSize: 13,
    marginBottom: 5
  },
  url: {
    fontSize: 13,
    fontStyle: 'italic',
    textAlign: 'center'
  },
  button: {
    marginBottom: 10
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5FCFF',
  },
  footer: {
    backgroundColor:"transparent",
    height: 190
  },
  userInfo: {
    padding: 10
  },
  formLabel: {
    color: '#337AB7'
  }
});
