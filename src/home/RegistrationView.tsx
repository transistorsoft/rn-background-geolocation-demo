import React from 'react'
import {Component} from 'react';

import AsyncStorage from '@react-native-community/async-storage';

import {
  View,
  StyleSheet,
  Platform,
} from 'react-native';

import {
  Container,
  Button, Icon,
  Text,
  Header, Title,
  Content, Footer,
  Left, Body, Right,
  Card, CardItem,
  Form, Label, Input,
  Item as FormItem,
} from '@codler/native-base';

import ENV from "../ENV";

////
// Import BackgroundGeolocation plugin
// Note: normally you will not specify a relative url ../ here.  I do this in the sample app
// because the plugin can be installed from 2 sources:
//
// 1.  npm:  react-native-background-geolocation
// 2.  private github repo (customers only):  react-native-background-geolocation-android
//
// This simply allows one to change the import in a single file.
import BackgroundGeolocation, {
  State,
  DeviceSettingsRequest
} from "../react-native-background-geolocation";

const USERNAME_VALIDATOR =  /^[a-zA-Z0-9_-]*$/;

type IProps = {
  navigation: any
}
type IState = {
  username: string,
  usernameIsValid: boolean,
  orgname: string,
  orgnameIsValid: boolean,
  device: string
}

export default class RegistrationView extends Component<any, any> {
  constructor(props: IProps) {
    super(props);

    this.state = {
      username: '',
      usernameIsValid: true,
      orgname: '',
      orgnameIsValid: true,
      device: '',
      url: ENV.TRACKER_HOST
    };
  }

  async componentDidMount() {
    console.log('Component did mount');

    let orgname = await AsyncStorage.getItem('orgname');
    let username = await AsyncStorage.getItem('username');
    let url = (orgname != null) ? ENV.TRACKER_HOST + '/' + orgname : ENV.TRACKER_HOST;

    this.setState({
      orgname: orgname,
      username: username,
      url: url
    });

    BackgroundGeolocation.getDeviceInfo().then((deviceInfo) => {
      this.setState({
        device: deviceInfo.manufacturer + ' ' + deviceInfo.model
      });
    });
  }

  onClickCancel() {
    this.props.navigation.goBack()
  }

  async onClickRegister() {
    let orgnameIsValid = this.usernameIsValid(this.state.orgname);
    let usernameIsValid = this.usernameIsValid(this.state.username);

    this.setState({
      orgnameIsValid: orgnameIsValid,
      usernameIsValid: usernameIsValid
    });

    if (!orgnameIsValid || !usernameIsValid) {
      return;
    }

    // Persist org & username.
    await AsyncStorage.setItem('orgname', this.state.orgname);
    await AsyncStorage.setItem('username', this.state.username);

    // Ensure any current cached token is destroyed.
    await BackgroundGeolocation.destroyTransistorAuthorizationToken(ENV.TRACKER_HOST);
    // Register device with tracker.transistorsoft.com to receive a JSON Web Token (JWT).
    let token = await BackgroundGeolocation.findOrCreateTransistorAuthorizationToken(this.state.orgname, this.state.username, ENV.TRACKER_HOST);

    BackgroundGeolocation.setConfig({
      transistorAuthorizationToken: token
    });

    this.props.navigation.state.params.response({
      orgname: this.state.orgname,
      username: this.state.username
    });
    this.props.navigation.goBack();
  }

  usernameIsValid(value:any):boolean {
    return (value != null) && (value.length>0) && USERNAME_VALIDATOR.test(value);
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
            <Title style={styles.title}>Registration</Title>
          </Body>
        </Header>

        <Content style={styles.content}>
          <Text style={styles.deviceModel}>{this.state.device}</Text>

          <FormItem error={!this.state.orgnameIsValid} stackedLabel key="orgname" style={styles.formItem}>
            <Label style={styles.formLabel}>Organization name</Label>
            <Input
              placeholder="eg: Company name"
              value={this.state.orgname}
              onChangeText={value => {
                this.setState({
                  orgname: value,
                  url: ENV.TRACKER_HOST + '/' + value
                })
              }}
              style={styles.input}
              keyboardType="default"
              autoCapitalize="none"
              autoCompleteType="username"
              autoCorrect={false}
              autoFocus={false}
            />
          </FormItem>

          <FormItem error={!this.state.usernameIsValid} stackedLabel key="username" style={styles.formItem}>
            <Label style={styles.formLabel}>Username</Label>
            <Input
              style={styles.input}
              placeholder="eg: Github username or initials"
              value={this.state.username}
              onChangeText={value => {this.setState({username: value})}}
              keyboardType="default"
              autoCapitalize="none"
              autoCompleteType="username"
              autoCorrect={false}
            />
          </FormItem>

          <Card>
            <CardItem>
              <Body>
                <Text style={styles.bodyText}>Please provide an Organization and Username to register your device with the Demo Server.</Text>
                <Text style={styles.bodyText}>You will access your results at the url:</Text>
                <Text style={styles.url}>{this.state.url}</Text>
              </Body>
            </CardItem>
          </Card>

        </Content>
        <Footer>
          <Body>
            <Button danger full onPress={this.onClickRegister.bind(this)}><Text>REGISTER</Text></Button>
          </Body>
        </Footer>

      </Container>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    //backgroundColor: '#fefefe'
  },
  bodyText: {
    fontSize: 14,
    marginBottom: 10
  },
  header: {
    backgroundColor: '#fedd1e'
  },
  title: {
    color: '#000',
    fontWeight: 'bold'
  },
  content: {
    padding: 10,
    fontSize: 12
  },
  headerItem: {
    marginTop: 20,
    marginLeft: 0,
    paddingLeft: 10,
    paddingBottom: 5,
    backgroundColor: "transparent"
  },
  deviceModel: {
    fontStyle: 'italic',
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 10,
    marginBottom: 10,
    fontSize: 18
  },
  formItem: {
    backgroundColor: "#fff",
    minHeight: 50,
    marginLeft: 0,
    marginTop: 10
  },
  url: {
    fontStyle: 'italic',
    textAlign: 'center',
    fontSize: 14
  },
  input: {
    fontSize: 16
  },
  formLabel: {
    color: '#2677FF'
  }
});

