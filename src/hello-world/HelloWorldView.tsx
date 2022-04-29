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

import BackgroundGeolocation, {Subscription} from "../react-native-background-geolocation";
import {registerTransistorAuthorizationListener} from '../lib/Authorization';

import BackgroundFetch from "react-native-background-fetch";

//////
/// A simple implementation of the BackgroundGeolocation plugin.
///
///
const HelloWorldView = ({route, navigation}) => {
  // Keep a list of BackgroundGeolocation event-subscriptions so we can later remove them
  // when the View is destroyed or refreshed during development live-reload.
  const bgGeoEventSubscriptions:Subscription[] = [];

  const {org, username} = route.params;

  /// State.
  const [events, setEvents] = React.useState<any[]>([]);
  const [enabled, setEnabled] = React.useState(false);

  /// Init BackgroundGeolocation when view renders.
  /// Return a function to .removeListeners() When view is removed.
  React.useEffect(() => {
    initBackgroundFetch();  // <-- optional
    initBackgroundGeolocation();
    registerTransistorAuthorizationListener(navigation);
    return () => {
      // Remove BackgroundGeolocation event-subscribers when the View is removed or refreshed
      // during development live-reload.  Without this, event-listeners will accumulate with
      // each refresh during live-reload.
      unsubscribe();
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

  /// Helper method to push a BackgroundGeolocation subscription onto our list of subscribers.
  const subscribe = (subscription:Subscription) => {
    bgGeoEventSubscriptions.push(subscription);
  }

  /// Helper method to unsubscribe from all registered BackgroundGeolocation event-listeners.
  const unsubscribe = () => {
    bgGeoEventSubscriptions.forEach((subscription:Subscription) => subscription.remove() );
  }

  /// Configure the BackgroundGeolocation plugin.
  const initBackgroundGeolocation = async () => {
    // Listen to events.  Each BackgroundGeolocation event-listener returns a subscription instance
    // with a .remove() method for removing the event-listener.  You should collect a list of these
    // subcribers and .remove() them all when the View is destroyed or refreshed during dev live-reload.
    subscribe(BackgroundGeolocation.onProviderChange((event) => {
      console.log('[onProviderChange]', event);
      addEvent('onProviderChange', event);
    }));

    subscribe(BackgroundGeolocation.onLocation((location) => {
      console.log('[onLocation]', location);
      addEvent('onLocation', location);
    }, (error) => {
      console.warn('[onLocation] ERROR: ', error);
    }));

    subscribe(BackgroundGeolocation.onMotionChange((location) => {
      console.log('[onMotionChange]', location);
      addEvent('onMotionChange', location);
    }));

    subscribe(BackgroundGeolocation.onGeofence((event) => {
      console.log('[onGeofence]', event);
      addEvent('onGeofence', event);
    }));

    subscribe(BackgroundGeolocation.onConnectivityChange((event) => {
      console.log('[onConnectivityChange]', event);
      addEvent('onConnectivityChange', event);
    }));

    subscribe(BackgroundGeolocation.onEnabledChange((enabled) => {
      console.log('[onEnabledChange]', enabled);
      addEvent('onEnabledChange', {enabled: enabled});
    }));

    subscribe(BackgroundGeolocation.onHttp((event) => {
      console.log('[onHttp]', event);
      addEvent('onHttp', event);
    }));

    subscribe(BackgroundGeolocation.onActivityChange((event) => {
      console.log('[onActivityChange]', event);
      addEvent('onActivityChange', event);
    }));

    subscribe(BackgroundGeolocation.onPowerSaveChange((enabled) => {
      console.log('[onPowerSaveChange]', enabled);
      addEvent('onPowerSaveChange', {isPowerSaveMode: enabled});
    }));

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

  const initBackgroundFetch = async () => {
    await BackgroundFetch.configure({
      minimumFetchInterval: 15,
      stopOnTerminate: true
    }, (taskId) => {
      console.log('[BackgroundFetch] ', taskId);
      BackgroundFetch.finish(taskId);
    }, (taskId) => {
      console.log('[BackgroundFetch] TIMEOUT: ', taskId);
      BackgroundFetch.finish(taskId);
    });
  }

  /// Adds events to List
  const addEvent = (name:string, params:any) => {
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
