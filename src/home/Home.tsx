
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
} from 'native-base';

import Modal, { ModalTitle, ModalContent, ModalFooter, ModalButton } from 'react-native-modals';

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
  usernameRaw: string,
  orgname: string,
  orgnameRaw: string,
  deviceManufacturer: string,
  deviceModel: string,
  deviceIdentifier: string,
  orgnameIsValid: boolean,
  usernameIsValid: boolean,
  visible: boolean
}

export default class Home extends Component<IProps, IState> {

  constructor(props:IProps) {
    super(props);

    let navigation = props.navigation;
    this.state = {
      visible: false,
      deviceModel: '',
      deviceManufacturer: '',
      deviceIdentifier: '',
      orgname: '',
      orgnameRaw: '',
      orgnameIsValid: false,
      username: '',
      usernameRaw: '',
      usernameIsValid: false
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
      orgnameIsValid: this.usernameIsValid(orgname),
      username: username,
      usernameIsValid: this.usernameIsValid(username),
      deviceModel: deviceInfo.model,
      deviceManufacturer: deviceInfo.manufacturer,
      deviceIdentifier: deviceIdentifier
    });

    BackgroundGeolocation.setConfig({logLevel: 5});

    if (!this.state.usernameIsValid || !this.state.orgnameIsValid) {
      this.onClickEditUsername();
    }
  }

  async onClickNavigate(routeName:string) {
    if (!this.usernameIsValid(this.state.orgname) || !this.usernameIsValid(this.state.username)) {
      return this.onClickEditUsername();
    }
    await AsyncStorage.setItem("@transistorsoft:initialRouteName", routeName);
    let action = StackActions.reset({
      index: 0,
      actions: [
        NavigationActions.navigate({routeName: routeName, params: {
          username: this.state.username
        }})
      ],
      key: null
    });

    this.props.navigation.dispatch(action);
  }

  onClickEditUsername() {
    this.setState({
      visible: true,
      orgnameRaw: this.state.orgname,
      orgnameIsValid: true,
      usernameRaw: this.state.username,
      usernameIsValid: true
    });
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

  async onClickSave() {
    let orgname = this.state.orgnameRaw.replace(/\s+/, "");
    let username = this.state.usernameRaw.replace(/\s+/, "");

    // Handle install of previous version, where orgname didn't exist and reverse the values, placing username into orgname.
    if (this.usernameIsValid(username) && orgname == null) {
      await AsyncStorage.setItem('orgname', username);
      await AsyncStorage.removeItem('username');
      orgname = username;
      username = '';
    }

    let usernameIsValid = this.usernameIsValid(username);
    let orgnameIsValid = this.usernameIsValid(orgname);

    this.setState({
      usernameIsValid: usernameIsValid,
      orgnameIsValid: orgnameIsValid
    });

    // No supper for you
    if (!usernameIsValid || !orgnameIsValid) {
      return;
    }
    // Persist org & username.
    await AsyncStorage.setItem('orgname', orgname);
    await AsyncStorage.setItem('username', username);

    // Ensure any current cached token is destroyed.
    await BackgroundGeolocation.destroyTransistorAuthorizationToken(ENV.TRACKER_HOST);
    // Register device with tracker.transistorsoft.com to receive a JSON Web Token (JWT).
    let token = await BackgroundGeolocation.findOrCreateTransistorAuthorizationToken(orgname, username, ENV.TRACKER_HOST);

    BackgroundGeolocation.setConfig({
      transistorAuthorizationToken: token
    });

    let deviceInfo = await BackgroundGeolocation.getDeviceInfo();
    let deviceIdentifier = deviceInfo.model + '-' + username;

    this.setState({
      orgname: orgname,
      username: username,
      deviceIdentifier: deviceIdentifier,
      visible: false
    });

  }

  render() {
    return (
      <Container>
        <Modal visible={this.state.visible} width={0.9} modalTitle={<ModalTitle title="Register Device" />} footer={
            <ModalFooter>
              <ModalButton
                text="CANCEL"
                onPress={() => {this.setState({visible: false})}}
              />
              <ModalButton
                text="REGISTER"
                onPress={() => {this.onClickSave()}}
              />
            </ModalFooter>
          }>
          <ModalContent>
            <Text style={styles.deviceModel}>{this.state.deviceManufacturer} {this.state.deviceModel}</Text>
            {/**
              * This content is too long for the modal dialog.
            <Text style={styles.p}>Please provide an Organization and User identifier to register with the demo server.  You may register multiple devices with the same organization &amp; username.</Text>

            *
            */}
            <Form>
              <Item error={!this.state.orgnameIsValid} stackedLabel key="orgname">
                <Label style={styles.formLabel}>Organization</Label>
                <Input
                  autoCapitalize="none"
                  autoCompleteType="username"
                  autoCorrect={false}
                  placeholder="eg: Company name"
                  value={this.state.orgnameRaw}
                  onChangeText={value => {this.setState({orgnameRaw: value, orgnameIsValid:this.usernameIsValid(value)})}}
                />
              </Item>
              <Item error={!this.state.usernameIsValid} stackedLabel key="username">
                <Label style={styles.formLabel}>Username</Label>
                <Input
                  autoCapitalize="none"
                  autoCompleteType="username"
                  autoCorrect={false}
                  placeholder="eg: Github username or initials"
                  value={this.state.usernameRaw}
                  onChangeText={value => {this.setState({usernameRaw: value, usernameIsValid:this.usernameIsValid(value)})}}
                />
              </Item>
            </Form>
          </ModalContent>
        </Modal>

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
                  <Button danger full onPress={this.onClickEditUsername.bind(this)}><Text>Edit username</Text></Button>
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
