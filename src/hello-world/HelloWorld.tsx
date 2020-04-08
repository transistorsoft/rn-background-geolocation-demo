import React from 'react'
import {Component} from 'react';

import AsyncStorage from '@react-native-community/async-storage';

import {
  Platform,
  StyleSheet,
  View
} from 'react-native';

import {
  Container,
  Button, Icon,
  Text,
  Header, Footer, Title,
  Content,
  Left, Body, Right,
  Switch
} from 'native-base';

import { Row } from 'react-native-easy-grid';

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
  Location,
  MotionChangeEvent,
  ProviderChangeEvent,
  HttpEvent,
  HeartbeatEvent,
  MotionActivityEvent,
  AuthorizationEvent,
  TransistorAuthorizationToken
} from "../react-native-background-geolocation";

import Util from '../lib/Util';
import ENV from '../ENV';
import {registerTransistorAuthorizationListener} from '../lib/Authorization';

type IProps = {
  navigation: any;
};
type IState = {
  enabled?: boolean;
  isMoving?: boolean;
  username?: string;
  events: Array<any>
};

export default class HelloWorld extends Component<IProps, IState> {
  eventId: number;
  constructor(props:IProps) {
    super(props);

    this.eventId = 1;

    this.state = {
      enabled: false,
      isMoving: false,
      username: props.navigation.state.params.username,
      events: []
    };
  }

  componentDidMount() {
    this.configureBackgroundGeolocation();
    // Nothing to see here -- just demo app boilerplace authorization handling with Demo server.
    registerTransistorAuthorizationListener(this.props.navigation);
  }

  componentWillUnmount() {
    // It's a good idea to #removeListeners when your component is unmounted, especially when hot-relaoding
    // Otherwise, you'll accumulate event-listeners.
    BackgroundGeolocation.removeListeners();
  }

  async configureBackgroundGeolocation() {
    let orgname = await AsyncStorage.getItem('orgname');
    let username = await AsyncStorage.getItem('username');

    // Sanity check orgname / username.
    if (orgname == null || username == null) return this.onClickHome();

    let token:TransistorAuthorizationToken = await BackgroundGeolocation.findOrCreateTransistorAuthorizationToken(orgname, username, ENV.TRACKER_HOST);

    // Step 1:  Listen to events:
    BackgroundGeolocation.onLocation(this.onLocation.bind(this));
    BackgroundGeolocation.onMotionChange(this.onMotionChange.bind(this));
    BackgroundGeolocation.onActivityChange(this.onActivityChange.bind(this));
    BackgroundGeolocation.onProviderChange(this.onProviderChange.bind(this));
    BackgroundGeolocation.onPowerSaveChange(this.onPowerSaveChange.bind(this));
    BackgroundGeolocation.onHttp(this.onHttp.bind(this));
    BackgroundGeolocation.onHeartbeat(this.onHeartbeat.bind(this));
    BackgroundGeolocation.onAuthorization(this.onAuthorization.bind(this));

    // Step 2:  #configure:
    BackgroundGeolocation.ready({
      distanceFilter: 10,
      stopOnTerminate: false,
      startOnBoot: true,
      enableHeadless: true,
      heartbeatInterval: 60,
      url: ENV.TRACKER_HOST + '/api/locations',
      authorization: {  // <-- JWT authorization for tracker.transistorsoft.com
        strategy: 'JWT',
        accessToken: token.accessToken,
        refreshToken: token.refreshToken,
        refreshUrl: ENV.TRACKER_HOST + '/api/refresh_token',
        refreshPayload: {
          refresh_token: '{refreshToken}'
        },
        expires: token.expires
      },
      autoSync: true,
      debug: true,
      logLevel: BackgroundGeolocation.LOG_LEVEL_VERBOSE
    }, (state) => {
      console.log('- Configure success: ', state);
      this.setState({
        enabled: state.enabled,
        isMoving: state.isMoving
      });
    });
  }

  /**
  * @event location
  */
  onLocation(location:Location) {
    console.log('[event] location: ', location);
    this.addEvent('location', new Date(location.timestamp), location);
  }
  /**
  * @event motionchange
  */
  onMotionChange(event:MotionChangeEvent) {
    console.log('[event] motionchange: ', event.isMoving, event.location);
    this.setState({
      isMoving: event.isMoving
    });
    this.addEvent('motionchange', new Date(event.location.timestamp), event.location);
  }
  /**
  * @event activitychange
  */
  onActivityChange(event:MotionActivityEvent) {
    console.log('[event] activitychange: ', event);
    this.addEvent('activitychange', new Date(), event);
  }

  /**
  * @event providerchange
  */
  onProviderChange(event:ProviderChangeEvent) {
    console.log('[event] providerchange', event);
    this.addEvent('providerchange', new Date(), event);
  }
  /**
  * @event powersavechange
  */
  onPowerSaveChange(isPowerSaveMode:boolean) {
    console.log('[event] powersavechange', isPowerSaveMode);
    this.addEvent('powersavechange', new Date(), {isPowerSaveMode: isPowerSaveMode});
  }
  /**
  * @event heartbeat
  */
  onHttp(response:HttpEvent) {
    console.log('[event] http: ', response);
    this.addEvent('http', new Date(), response);
  }
  /**
  * @event heartbeat
  */
  onHeartbeat(event:HeartbeatEvent) {
    console.log('[event] heartbeat: ', event);
    this.addEvent('heartbeat', new Date(), event);
  }
  /**
  * @event authorization
  */
  onAuthorization(event:AuthorizationEvent) {
    console.log('[event] authorization: ', event);
    this.addEvent('authorization', new Date(), event);

    BackgroundGeolocation.setConfig({
      url: ENV.TRACKER_HOST + '/api/locations'
    });
  }

  onToggleEnabled() {
    let enabled = !this.state.enabled;
    this.setState({
      enabled: enabled,
      isMoving: false
    });
    if (enabled) {
      BackgroundGeolocation.start();
    } else {
      BackgroundGeolocation.stop();
    }
  }

  onClickGetCurrentPosition() {
    BackgroundGeolocation.getCurrentPosition({
      persist: true,
      samples: 1,
      maximumAge: 0
    }, (location:Location) => {
      console.log('- getCurrentPosition success: ', location);
    }, (error:number) => {
      console.warn('- getCurrentPosition error: ', error);
    });
  }

  onClickChangePace() {
    console.log('- onClickChangePace');
    let isMoving = !this.state.isMoving;
    this.setState({isMoving: isMoving});
    BackgroundGeolocation.changePace(isMoving);
  }

  onClickClear() {
    this.setState({events: []});
  }

  /**
  * Add an event to list
  */
  addEvent(name:string, date:Date, object:any) {
    let event = {
      key: this.eventId++,
      name: name,
      timestamp: date.toLocaleTimeString(),
      json: JSON.stringify(object, null, 2)
    };
    let rs = this.state.events;
    rs.unshift(event);
    this.setState({
      events: rs
    });
  }

  renderEvents() {
    return this.state.events.map((event:any) => (
      <View key={event.key} style={styles.listItem}>
        <Row style={styles.itemHeader}>
          <Left style={{flex:1}}><Text style={styles.eventName}>[event] {event.name}</Text></Left>
          <Right><Text style={styles.eventTimestamp}>{event.timestamp}</Text></Right>
        </Row>
        <Row><Text style={styles.eventJson}>{event.json}</Text></Row>
      </View>
    ));
  }

  render() {
    return (
      <Container style={styles.container}>
        <Header style={styles.header}>
          <Left>
            <Button transparent onPress={this.onClickHome.bind(this)}>
              <Icon active name="arrow-back" style={{color: '#000'}}/>
            </Button>
          </Left>
          <Body>
            <Title style={styles.title}>Hello World</Title>
          </Body>
          <Right>
            <Switch onValueChange={() => this.onToggleEnabled()} value={this.state.enabled} />
          </Right>
        </Header>

        <Content style={styles.content}>
          <View style={styles.list}>
            {this.renderEvents()}
          </View>
        </Content>

        <Footer style={styles.footer}>
          <Left style={{flex:0.3}}>
            <Button info>
              <Icon active name="md-navigate" style={styles.icon} onPress={this.onClickGetCurrentPosition.bind(this)} />
            </Button>
          </Left>
          <Body style={styles.footerBody}>
            <Button danger bordered onPress={this.onClickClear.bind(this)}><Icon name="trash" /></Button>
          </Body>
          <Right style={{flex:0.3}}>
            <Button danger={this.state.isMoving} success={!this.state.isMoving} onPress={this.onClickChangePace.bind(this)}>
              <Icon active name={(this.state.isMoving) ? 'pause' : 'play'} style={styles.icon}/>
            </Button>
          </Right>
        </Footer>
      </Container>
    );
  }

  /**
  * Navigate back to home-screen app-switcher
  */
  onClickHome() {
    Util.navigateHome(this.props.navigation);
  }
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#272727'
  },
  content: {},
  list: {},
  header: {
    backgroundColor: '#fedd1e'
  },
  title: {
    color: '#000'
  },
  listItem: {
    marginBottom: 10
  },
  itemHeader: {
    backgroundColor: '#D5B601',
    padding: 5
  },
  eventName: {
    fontSize: 12,
    fontWeight: 'bold'
  },
  eventTimestamp: {
    fontSize: 12
  },
  eventJson: {
    fontFamily: 'Courier New',
    fontSize: 12,
    color: '#e6db74'
  },
  footer: {
    backgroundColor: '#fedd1e',
    paddingLeft: 10,
    paddingRight: 10
  },
  footerBody: {
    justifyContent: 'center'
  },
  icon: {
    color: '#fff'
  }
});
