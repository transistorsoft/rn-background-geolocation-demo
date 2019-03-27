import React from 'react'
import {Component} from 'react';

import {
  Platform,
  StyleSheet,
  View
} from 'react-native';

// For dispatching back to HomeScreen
import Home from '../home/Home';

// For posting to tracker.transistorsoft.com
import DeviceInfo from 'react-native-device-info';

// Import native-base UI components
import {
  Container,
  Button, Icon,
  Text,
  Header, Footer, Title,
  Content,
  Left, Body, Right,
  Switch
} from 'native-base';

// react-native-maps
import MapView, {
  Marker,
  Polyline
} from 'react-native-maps';

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
  MotionActivityEvent,
  ProviderChangeEvent
} from '../react-native-background-geolocation';

const LATITUDE_DELTA = 0.00922;
const LONGITUDE_DELTA = 0.00421;

const TRACKER_HOST = 'http://tracker.transistorsoft.com/locations/';

type IProps = {
  navigation: any
};
type IState = {
  enabled?: boolean;
  isMoving?: boolean;
  showsUserLocation?: boolean;
  motionActivity: MotionActivityEvent;
  odometer: string;
  username: string;
  markers: Array<any>;
  coordinates: Array<any>;

};
export default class SimpleMap extends Component<IProps, IState> {
  constructor(props:any) {
    super(props);

    this.state = {
      enabled: false,
      isMoving: false,
      motionActivity: {activity: 'unknown', confidence: 100},
      odometer: '0.0',
      username: props.navigation.state.params.username,
      // MapView
      markers: [],
      coordinates: [],
      showsUserLocation: false
    };
  }

  componentDidMount() {
    // Step 1:  Listen to events:
    BackgroundGeolocation.onLocation(this.onLocation.bind(this));
    BackgroundGeolocation.onMotionChange(this.onMotionChange.bind(this));
    BackgroundGeolocation.onActivityChange(this.onActivityChange.bind(this));
    BackgroundGeolocation.onProviderChange(this.onProviderChange.bind(this));
    BackgroundGeolocation.onPowerSaveChange(this.onPowerSaveChange.bind(this));

    // Step 2:  #configure:
    BackgroundGeolocation.configure({
      distanceFilter: 10,
      url: TRACKER_HOST + this.state.username,
      params: {
        // Required for tracker.transistorsoft.com
        device: {
          uuid: (DeviceInfo.getModel() + '-' + DeviceInfo.getSystemVersion()).replace(/[\s\.,]/g, '-'),
          model: DeviceInfo.getModel(),
          platform: DeviceInfo.getSystemName(),
          manufacturer: DeviceInfo.getManufacturer(),
          version: DeviceInfo.getSystemVersion(),
          framework: 'ReactNative'
        }
      },
      autoSync: true,
      stopOnTerminate: false,
      startOnBoot: true,
      foregroundService: true,
      debug: true,
      logLevel: BackgroundGeolocation.LOG_LEVEL_VERBOSE,
    }, (state) => {
      this.setState({
        enabled: state.enabled,
        isMoving: state.isMoving,
        showsUserLocation: state.enabled
      });
    });
  }

  /**
  * @event location
  */
  onLocation(location:Location) {
    console.log('[event] location: ', location);

    if (!location.sample) {
      this.addMarker(location);
      this.setState({
        odometer: (location.odometer/1000).toFixed(1)
      });
    }
    this.setCenter(location);
  }
  /**
  * @event motionchange
  */
  onMotionChange(event:MotionChangeEvent) {
    console.log('[event] motionchange: ', event.isMoving, event.location);
    this.setState({
      isMoving: event.isMoving
    });
    let location = event.location;
  }
  /**
  * @event activitychange
  */
  onActivityChange(event:MotionActivityEvent) {
    console.log('[event] activitychange: ', event);
    this.setState({
      motionActivity: event
    });
  }
  /**
  * @event providerchange
  */
  onProviderChange(event:ProviderChangeEvent) {
    console.log('[event] providerchange', event);
  }
  /**
  * @event powersavechange
  */
  onPowerSaveChange(isPowerSaveMode:boolean) {
    console.log('[event] powersavechange', isPowerSaveMode);
  }

  onToggleEnabled() {
    let enabled = !this.state.enabled;

    this.setState({
      enabled: enabled,
      isMoving: false,
      showsUserLocation: false,
      coordinates: [],
      markers: []
    });

    if (enabled) {
      BackgroundGeolocation.start((state) => {
        // NOTE:  We tell react-native-maps to show location only AFTER BackgroundGeolocation
        // has requested location authorization.  If react-native-maps requests authorization first,
        // it will request WhenInUse -- "Permissions Tug-of-war"
        this.setState({
          showsUserLocation: true
        });
      });
    } else {
      BackgroundGeolocation.stop();
    }
  }

  onClickGetCurrentPosition() {
    BackgroundGeolocation.getCurrentPosition({
      persist: true,
      samples: 1
    }, (location:Location) => {
      console.log('- getCurrentPosition success: ', location);
    }, (error) => {
      console.warn('- getCurrentPosition error: ', error);
    });
  }

  onClickChangePace() {
    console.log('- onClickChangePace');
    let isMoving = !this.state.isMoving;
    this.setState({isMoving: isMoving});
    BackgroundGeolocation.changePace(isMoving);
  }

  addMarker(location:Location) {
    let marker = {
      key: location.uuid,
      title: location.timestamp,
      heading: location.coords.heading,
      coordinate: {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude
      }
    };

    this.setState({
      markers: [...this.state.markers, marker],
      coordinates: [...this.state.coordinates, {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude
      }]
    });
  }

  setCenter(location:Location) {
    if (!this.refs.map) { return; }

    this.refs.map.animateToRegion({
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      latitudeDelta: LATITUDE_DELTA,
      longitudeDelta: LONGITUDE_DELTA
    });
  }

  renderMarkers() {
    let rs:any = [];
    this.state.markers.map((marker:any) => {
      rs.push((
        <Marker
          key={marker.key}
          coordinate={marker.coordinate}
          anchor={{x:0, y:0.1}}
          title={marker.title}>
          <View style={[styles.markerIcon]}></View>
        </Marker>
      ));
    });
    return rs;
  }

  render() {
    return (
      <Container style={styles.container}>
        <Header style={styles.header}>
          <Left>
            <Button transparent onPress={this.onClickHome.bind(this)}>
              <Icon active name="arrow-back" style={styles.title} />
            </Button>
          </Left>
          <Body>
            <Title style={styles.title}>Simple Map</Title>
          </Body>
          <Right>
            <Switch onValueChange={() => this.onToggleEnabled()} value={this.state.enabled} />
          </Right>
        </Header>

        <MapView
          ref="map"
          style={styles.map}
          showsUserLocation={this.state.showsUserLocation}
          followsUserLocation={false}
          scrollEnabled={true}
          showsMyLocationButton={false}
          showsPointsOfInterest={false}
          showsScale={false}
          showsTraffic={false}
          toolbarEnabled={false}>
          <Polyline
            key="polyline"
            coordinates={this.state.coordinates}
            geodesic={true}
            strokeColor='rgba(0,179,253, 0.6)'
            strokeWidth={6}
            zIndex={0}
          />
          {this.state.markers.map((marker:any) => (
            <Marker
              key={marker.key}
              coordinate={marker.coordinate}
              anchor={{x:0, y:0.1}}
              title={marker.title}>
              <View style={[styles.markerIcon]}></View>
            </Marker>))
          }
        </MapView>

        <Footer style={styles.footer}>
          <Left style={{flex:0.3}}>
            <Button info>
              <Icon active name="md-navigate" style={styles.icon} onPress={this.onClickGetCurrentPosition.bind(this)} />
            </Button>
          </Left>
          <Body style={styles.footerBody}>
            <Text style={styles.status}>{this.state.motionActivity.activity}:{this.state.motionActivity.confidence}% &middot; {this.state.odometer}km</Text>
          </Body>

          <Right style={{flex: 0.25}}>
            <Button danger={this.state.isMoving} success={!this.state.isMoving} onPress={this.onClickChangePace.bind(this)}>
              <Icon active name={(this.state.isMoving) ? 'pause' : 'play'} style={styles.icon}/>
            </Button>
          </Right>
        </Footer>
      </Container>
    );
  }

  /**
  * Dispatch back to HomeScreen Application-switcher
  */
  onClickHome() {
    // Tell MapView to stop updating location
    this.setState({
      showsUserLocation: false
    });

    Home.navigate(this.props.navigation);
  }
}

var styles = StyleSheet.create({
  container: {
    backgroundColor: '#272727'
  },
  header: {
    backgroundColor: '#fedd1e'
  },
  title: {
    color: '#000'
  },
  footer: {
    backgroundColor: '#fedd1e',
    paddingLeft: 10,
    paddingRight: 10
  },
  footerBody: {
    justifyContent: 'center',
    width: 200,
    flex: 1
  },
  icon: {
    color: '#fff'
  },
  map: {
    flex: 1
  },
  status: {
    fontSize: 12
  },
  markerIcon: {
    borderWidth:1,
    borderColor:'#000000',
    backgroundColor: 'rgba(0,179,253, 0.6)',
    width: 10,
    height: 10,
    borderRadius: 5
  }
});
