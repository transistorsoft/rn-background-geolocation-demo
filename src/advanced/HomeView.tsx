/// Renders the main view of the AdvancedApp.useState
///
/// - Calls BackgroundGeolocation.ready.
/// - Handles ON/OFF <Switch /> with BackgroundGeolocation.start / .stop()
/// - [^] getCurrentPosition button.
/// - [>] / [||] changePace button.
///
import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  Switch,
  TouchableHighlight
} from 'react-native';

import {
  Button,
  Icon
} from 'react-native-elements'

import BackgroundGeolocation, {
  State,
  MotionActivityEvent
} from "../react-native-background-geolocation";

import SettingsService from './lib/SettingsService';
import FABMenu from './FABMenu';
import TSMapView from './TSMapView';

import ENV from '../ENV';
import {COLORS, SOUNDS} from './lib/config';
import {registerTransistorAuthorizationListener} from '../lib/Authorization';

const HomeView = ({route, navigation}) => {
  const {org, username} = route.params;

  const [enabled, setEnabled] = React.useState(false);
  const [isMoving, setIsMoving] = React.useState(false);
  const [location, setLocation] = React.useState<Location>(null);
  const [odometer, setOdometer] = React.useState(0);
  const [motionActivityEvent, setMotionActivityEvent] = React.useState<MotionActivityEvent>(null);
  const [testClicks, setTestClicks] = React.useState(0);
  const [clickBufferTimeout, setClickBufferTimeout] = React.useState<any>(0);

  // Handy Util class for managing app/plugin Settings.
  const settingsService = SettingsService.getInstance();

  /// Init BackgroundGeolocation when view renders.
  React.useEffect(() => {
    initBackgroundGeolocation();
    registerTransistorAuthorizationListener(navigation);
    return () => {
      // View-destroyed handler
    }
  }, []);

  /// Add a toggle <Switch> to top-right toolbar.
  React.useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <Switch onValueChange={onClickEnable} value={enabled} />
      )
    });
  }, [enabled]);

  /// Location effect-handler
  React.useEffect(() => {
    if (!location) return;
    setOdometer(location.odometer);
  }, [location]);

  /// Handles test-mode clicks on bottom toolbar, ie: [activity:123km]
  /// Reloads test-config.
  React.useEffect(() => {
    // Swallow the zero event.
    if (testClicks === 0) return;

    console.log('[TEST CLICK]:', testClicks);
    settingsService.playSound('TEST_MODE_CLICK');
    if (testClicks >= 10) {
      // Hit it!
      setTestClicks(0);
      settingsService.playSound('TEST_MODE_SUCCESS');
      settingsService.applyTestConfig();
    } else if (testClicks <= 10) {
      // Keep going...
      if (clickBufferTimeout > 0) {
        clearTimeout(clickBufferTimeout);
      }
      setClickBufferTimeout(setTimeout(() => {
        setTestClicks(0);
      }, 2000));
    }
  }, [testClicks]);

  /// Configure BackgroundGeolocation.ready
  const initBackgroundGeolocation = async () => {
    // Listen to events, providing ref to React.useState setters.
    BackgroundGeolocation.onLocation(setLocation, (error) => {
      console.warn('[onLocation] ERROR: ', error);
    });

    BackgroundGeolocation.onMotionChange((location) => {
      // Auto-toggle [ > ] / [ || ] button in bottom toolbar.
      setIsMoving(location.isMoving);
    });

    BackgroundGeolocation.onActivityChange(setMotionActivityEvent);

    // Get an authorization token from transistorsoft demo server.
    const token = await BackgroundGeolocation.findOrCreateTransistorAuthorizationToken(
      org,
      username,
      ENV.TRACKER_HOST
    );

    // Ready the SDK and fetch the current state.
    const state:State = await BackgroundGeolocation.ready({
      // Debug
      reset: false,
      debug: true,
      logLevel: BackgroundGeolocation.LOG_LEVEL_VERBOSE,
      transistorAuthorizationToken: token,
      // Geolocation
      desiredAccuracy: BackgroundGeolocation.DESIRED_ACCURACY_NAVIGATION,
      distanceFilter: 10,
      stopTimeout: 5,
      // Permissions
      locationAuthorizationRequest: 'Always',
      backgroundPermissionRationale: {
        title: "Allow {applicationName} to access this device's location even when closed or not in use.",
        message: "This app collects location data to enable recording your trips to work and calculate distance-travelled.",
        positiveAction: 'Change to "{backgroundPermissionOptionLabel}"',
        negativeAction: 'Cancel'
      },
      // HTTP & Persistence
      autoSync: true,
      maxDaysToPersist: 14,
      // Application
      stopOnTerminate: false,
      startOnBoot: true,
      enableHeadless: true
    });

    setOdometer(state.odometer);
    setEnabled(state.enabled);
    setIsMoving(state.isMoving||false);  // <-- TODO re-define @prop isMoving? as REQUIRED in State
  };

  /// <Switch> handler to toggle the plugin on/off.
  const onClickEnable = (value:boolean) => {
    setEnabled(value);
    if (value) {
      BackgroundGeolocation.start();
    } else {
      BackgroundGeolocation.stop();
      // Toggle the [ > ] / [ || ] button in bottom-toolbar back to [ > ]
      setIsMoving(false);
    }
  }

  /// getCurrentPosition handler
  const onClickGetCurrentPosition = () => {
    settingsService.playSound('BUTTON_CLICK');

    BackgroundGeolocation.getCurrentPosition({
      persist: true,
      samples: 1,
      timeout: 30,
      extras: {
        getCurrentPosition: true
      }
    }).then((location:Location) => {
      console.log('[getCurrentPosition] success: ', location);
    }).catch((error:LocationError) => {
      console.warn('[getCurrentPosition] error: ', error);
    });
  }

  /// changePace handler.
  const onClickChangePace = () => {
    BackgroundGeolocation.changePace(!isMoving);
    setIsMoving(!isMoving);
  }

  return (
    <View style={{flexDirection: 'column', flex: 1}}>
      <TSMapView style={styles.map} navigation={navigation} />
      <View style={{backgroundColor: COLORS.gold, height: 56, flexDirection: 'row'}}>
        <View style={{justifyContent:'center'}}>
          <Button
            type="clear"
            onPress={onClickGetCurrentPosition}
            containerStyle={{width: 60}}
            icon={<Icon name='navigate-sharp' type='ionicon' /> }
          />
        </View>
        <View style={{flex: 1, justifyContent: 'center'}}>
          <TouchableHighlight onPress={() => setTestClicks(testClicks + 1)} underlayColor="transparent">
            <View style={{flexDirection: 'row', justifyContent: 'center'}}>
              <Text style={styles.statusBar}>{(motionActivityEvent) ? motionActivityEvent.activity : 'unknown'}</Text>
              <Text>&nbsp;•&nbsp;</Text>
              <Text style={styles.statusBar}>{(odometer/1000).toFixed(1)}km</Text>
            </View>
          </TouchableHighlight>
        </View>
        <View style={{justifyContent: 'center', padding: 5}}>
          <Button
            containerStyle={{width: 60}}
            buttonStyle={{backgroundColor: (isMoving) ? COLORS.red : COLORS.green}}
            onPress={onClickChangePace}
            icon={<Icon name={(isMoving) ? 'pause-sharp' : 'play-sharp'} type='ionicon' color={COLORS.white}/> }
          />
        </View>
      </View>

      <FABMenu navigation={navigation} />

    </View>
  );
}

export default HomeView;

var styles = StyleSheet.create({
  container: {
    backgroundColor: '#272727'
  },
  map: {
    flex: 1,
  },
  statusBar: {
    fontSize: 16
  }
});
