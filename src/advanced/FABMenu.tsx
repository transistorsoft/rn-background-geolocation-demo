/// Floating Action Button component.
/// The main-menu
///
import React from 'react';
import {
  Alert,
  StyleSheet,
  Platform
} from 'react-native';

import {
  Icon,
  Button,
  SpeedDial
} from 'react-native-elements'

import { NavigationContext } from '@react-navigation/native';

import BackgroundGeolocation from "../react-native-background-geolocation";

import ENV from "../ENV";
import {COLORS, SOUNDS} from './lib/config';
import SettingsService from './lib/SettingsService';

const ACTION_BUTTON_OFFSET_Y = (Platform.OS === 'ios') ? 90 : 60;

interface Props {
  onResetOdometer:Function
};

const FABMenu = (props:Props) => {

  const [isOpen, setIsOpen] = React.useState(false);
  const [isEmailingLog, setIsEmailingLog] = React.useState(false);
  const [isResettingOdometer, setIsResettingOdometer] = React.useState(false);
  const [isSyncing, setIsSyncing] = React.useState(false);
  const [isDestroyingLocations, setIsDestroyingLocations] = React.useState(false);

  const navigation = props.navigation;

  const settingsService = SettingsService.getInstance();

  /// FAB Menu handler.
  const onClickMainMenu = (open:boolean) => {    
    setIsOpen(open);
    settingsService.playSound((open) ? 'OPEN' : 'CLOSE');
  }

  /// FABItem handler.
  const onClickAction = (command:string) => {
    settingsService.playSound('BUTTON_CLICK');
    switch(command) {
      case 'settings':
        settingsService.playSound('OPEN');
        navigation.navigate('Settings');
        return;
      case 'resetOdometer':
        resetOdometer();
        break;
      case 'emailLog':
        emailLog();
        break;
      case 'sync':
        sync();
        break;
      case 'destroyLocations':
        destroyLocations();
        break;
      case 'requestPermission':
        requestPermission();
        break;
    }
  }

  /// Reset the odometer.
  const resetOdometer = async () => {
    setIsResettingOdometer(true);
    BackgroundGeolocation.setOdometer(0).then(location => {
      setIsResettingOdometer(false);
      if (props.onResetOdometer) {
        props.onResetOdometer(location);
      }
      settingsService.toast('Reset odometer success');
    }).catch(error => {
      setIsResettingOdometer(false);
      settingsService.toast('Reset odometer failure: ' + error);
    });
  }

  /// Email the logs.
  const emailLog = async () => {
    // First fetch the email from settingsService.
    settingsService.getEmail((email:string) => {
      if (!email) { return; }  // <-- [Cancel] returns null
      // Confirm email
      settingsService.yesNo('Email log', 'Use email address: ' + email + '?', () => {
        // Here we go...
        setIsEmailingLog(true);

        BackgroundGeolocation.logger.emailLog(email).then((succes) => {
          console.log('[emailLog] success');
          setIsEmailingLog(false);
        }).catch((error) => {
          setIsEmailingLog(false);
          settingsService.toast("Email log failure: " + error);
        });
      }, () => {
        // User said [NO]:  The want to change their email.  Clear it and recursively restart the process.
        settingsService.set('email', null);
        emailLog();
      });
    });
  }

  /// Initiate HTTP Upload.
  const sync = async () => {
    const count = await BackgroundGeolocation.getCount();
    if (!count) {
      settingsService.alert('Locations database is empty');
      return;
    }

    settingsService.confirm('Confirm Sync', 'Sync ' + count + ' records?', () => {
      setIsSyncing(true);
      BackgroundGeolocation.sync().then((rs) => {
        settingsService.playSound('MESSAGE_SENT');
        setIsSyncing(false);
      }).catch((error:string) => {
        settingsService.toast('Sync error: ' + error);
        setIsSyncing(false);
      });
    });
  }

  /// Clear all queued locations from the plugin's SQLite database.
  const destroyLocations = async () => {
    const count = await BackgroundGeolocation.getCount();
    if (!count) {
      settingsService.toast('Locations database is empty');
      return;
    }

    settingsService.confirm('Confirm Delete', 'Destroy ' + count + ' records?', () => {
      setIsDestroyingLocations(true);
      BackgroundGeolocation.destroyLocations().then(() => {
        setIsDestroyingLocations(false);
        settingsService.toast('Destroyed ' + count + ' records');
      }).catch((error:string) => {
        setIsDestroyingLocations(false);
        settingsService.toast('Destroy locations error: ' + error, 'LONG');
      });
    });
  }

  /// Initiate permission request.
  const requestPermission = async () => {
    const providerState = await BackgroundGeolocation.getProviderState();
    Alert.alert("Request Location Permission", `Current authorization status: ${providerState.status}`, [
      {text: 'When in Use', onPress: () => {doRequestPermission('WhenInUse')}},
      {text: 'Always', onPress: () => {doRequestPermission('Always')}},
    ], { cancelable: false });
  }

  const doRequestPermission = async (request) => {
    await BackgroundGeolocation.setConfig({locationAuthorizationRequest: request});
    const status = await BackgroundGeolocation.requestPermission();
    console.log(`[requestPermission] status: ${status}`);

    setTimeout(() => {
      Alert.alert("Request Permission Result", `Authorization status: ${status}`, [
        {text: 'Ok', onPress: () => {}},
      ], { cancelable: false });
    }, 10);
  }


  return (
    <SpeedDial
      isOpen={isOpen}
      color={COLORS.gold}
      style={styles.speedDial}
      icon={<Icon name="add-sharp" color={COLORS.black} type="ionicon" />}
      openIcon={<Icon name="close-sharp" color={COLORS.black} type="ionicon" />}
      onOpen={() => onClickMainMenu(true)}
      onClose={() => onClickMainMenu(false)}
      transitionDuration={0}
      overlayColor="transparent"
    >
      <SpeedDial.Action
        title="Destroy locations"
        onPress={() => onClickAction('destroyLocations')}
        icon={<Icon name="trash-sharp" type='ionicon' style={styles.itemIcon} />}
        color={COLORS.gold}

      />
      <SpeedDial.Action
        icon={(!isSyncing) ? <Icon name="cloud-upload-sharp" type='ionicon' style={styles.itemIcon} /> : <Icon name="spinner" type='font-awesome' style={styles.itemIcon} />}
        title="Sync"
        onPress={() => onClickAction('sync')}
        color={COLORS.gold}
      />
      <SpeedDial.Action
        title="Email logs"
        onPress={() => onClickAction('emailLog')}
        icon={<Icon name="mail-sharp" type='ionicon' style={styles.itemIcon} />}
        color={COLORS.gold}
      />
      <SpeedDial.Action
        icon={(!isResettingOdometer) ? <Icon name="speedometer-sharp" type='ionicon' style={styles.itemIcon} /> : <Icon name="spinner" type='font-awesome' style={styles.itemIcon} />}
        onPress={() => onClickAction('resetOdometer')}
        title="Reset odometer"
        color={COLORS.gold}
      />
      <SpeedDial.Action
        title="Request permission"
        onPress={() => onClickAction('requestPermission')}
        icon={<Icon name="lock-open-sharp" type='ionicon' style={styles.itemIcon} />}
        color={COLORS.gold}
      />
      <SpeedDial.Action
        title="Config"
        onPress={() => onClickAction('settings')}
        icon={<Icon name="cog-sharp" type='ionicon' style={styles.itemIcon} />}
        color={COLORS.gold}
      />
    </SpeedDial>
  )
}

export default FABMenu;

var styles = StyleSheet.create({
  speedDial: {
    bottom: ACTION_BUTTON_OFFSET_Y
  },
  itemIcon: {
    fontSize: 24
  }
});
