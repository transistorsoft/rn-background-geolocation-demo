import React from 'react';

import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  SafeAreaView
} from 'react-native';

import {Button, Switch, Icon} from "react-native-elements";

import ENV from "../ENV";
import {COLORS} from "../lib/config";

import BackgroundGeolocation from "../react-native-background-geolocation";
import {registerTransistorAuthorizationListener} from '../lib/Authorization';

//////
/// A simple implementation of the BackgroundGeolocation plugin.
///
///
const HelloWorldView = ({route, navigation}) => {
  const {org, username} = route.params;

  /// State.
  const [events, setEvents] = React.useState<any[]>([]);
  const [enabled, setEnabled] = React.useState(false);

  /// Init BackgroundGeolocation when view renders.
  /// Return a function to .removeListeners() When view is removed.
  React.useEffect(() => {
    initBackgroundGeolocation();

    registerTransistorAuthorizationListener(navigation);
    return () => {

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

  /// Configure the BackgroundGeolocation plugin.
  const initBackgroundGeolocation = async () => {
    BackgroundGeolocation.onProviderChange((event) => {
      console.log('[onProviderChange]', event);
      addEvent('onProviderChange', event);
    });

    BackgroundGeolocation.onLocation((location) => {
      console.log('[onLocation]', location);
      addEvent('onLocation', location);
    }, (error) => {
      console.warn('[onLocation] ERROR: ', error);
    });

    BackgroundGeolocation.onMotionChange((location) => {
      console.log('[onMotionChange]', location);
      addEvent('onMotionChange', location);
    });

    BackgroundGeolocation.onConnectivityChange((event) => {
      console.log('[onConnectivityChange]', event);
      addEvent('onConnectivityChange', event);
    });

    BackgroundGeolocation.onEnabledChange((enabled) => {
      console.log('[onEnabledChange]', enabled);
      addEvent('onEnabledChange', {enabled: enabled});
    });

    BackgroundGeolocation.onHttp((event) => {
      console.log('[onHttp]', event);
      addEvent('onHttp', event);
    });

    BackgroundGeolocation.onActivityChange((event) => {
      console.log('[onActivityChange]', event);
      addEvent('onActivityChange', event);
    });

    BackgroundGeolocation.onPowerSaveChange((enabled) => {
      console.log('[onPowerSaveChange]', enabled);
      addEvent('onPowerSaveChange', {isPowerSaveMode: enabled});
    });

    /// Get an authorization token from demo server at tracker.transistorsoft.com
    const token = await BackgroundGeolocation.findOrCreateTransistorAuthorizationToken(org, username, ENV.TRACKER_HOST);

    /// Configure the plugin.
    const state = await BackgroundGeolocation.ready({
      debug: true,
      logLevel: BackgroundGeolocation.LOG_LEVEL_VERBOSE,
      transistorAuthorizationToken: token,
      distanceFilter: 10,
      stopOnTerminate: false,
      startOnBoot: true
    });

    /// Add the current state as first item in list.
    addEvent('Current state', state);

    /// Set the default <Switch> state (disabled)
    setEnabled(state.enabled);

  };

  /// Adds events to List
  const addEvent = (name, params) => {
    let timestamp = new Date();
    const event = {
      expanded: false,
      timestamp: `${timestamp.getMonth()}-${timestamp.getDate()} ${timestamp.getHours()}:${timestamp.getMinutes()}:${timestamp.getSeconds()}`,
      name: name,
      params: JSON.stringify(params, null, 2)
    }
    setEvents(previous => [...previous, event]);
  }

  /// <Switch> handler to toggle the plugin on/off.
  const onClickEnable = (value:boolean) => {
    setEnabled(value);
    if (value) {
      BackgroundGeolocation.start();
    } else {
      BackgroundGeolocation.stop();
    }
  }

  /// Clear events list.
  const onClickClear = () => {
    setEvents([]);
  }

  /// Execute getCurrentPosition
  const onClickGetCurrentPosition = async () => {
    await BackgroundGeolocation.getCurrentPosition({
      samples: 1,
      extras: {
        getCurrentPosition: true
      }
    });
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.events}>
        {events.slice().reverse().map((event, i) => (
          <View style={styles.event} key={i}>
            <View style={styles.header}>
              <Text style={styles.title}>{event.name}</Text>
              <Text style={[styles.title, styles.timestamp]}>{event.timestamp}</Text>
            </View>
            <View key={i}>
              <Text style={styles.params}>{event.params}</Text>
            </View>
          </View>
        ))}
      </ScrollView>

      <View style={styles.bottomToolbar}>
        <View style={{justifyContent:'center'}}>
          <Button
            type="clear"
            onPress={onClickGetCurrentPosition}
            containerStyle={{width: 60}}
            icon={<Icon name='navigate-sharp' type='ionicon' /> }
          />
        </View>
        <View style={{flex: 1}}></View>
        <View style={{justifyContent:'center'}}>
          <Button
            type="clear"
            onPress={onClickClear}
            containerStyle={{width: 60}}
            icon={<Icon name='trash-sharp' type='ionicon' /> }
          />
        </View>
      </View>

    </SafeAreaView>
  );
}

export default HelloWorldView;

const styles = StyleSheet.create({
  container: {
    flexDirection: 'column',
    backgroundColor: COLORS.gold,
    flex: 1
  },
  events: {
    flex: 1,
    //backgroundColor: '#eee'
  },
  event: {
    backgroundColor: '#fff',
    color: '#fff',
    marginBottom: 5,
    borderWidth: 1,
    borderColor: '#000'

  },
  header: {
    backgroundColor: '#000',
    padding: 10,
    flexDirection:'row',
    justifyContent: 'space-between'
  },
  title: {
    flex:1,
    fontWeight: 'bold',
    color: '#fff'
  },
  timestamp: {
    textAlign: 'right',
    fontStyle: 'italic'
  },
  params: {
    fontFamily: 'Courier',
    padding: 5
  },
  bottomToolbar: {
    backgroundColor: COLORS.gold,
    height: 56,
    flexDirection: 'row'
  }
});
