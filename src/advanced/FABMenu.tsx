/// Floating Action Button component.
/// The main-menu
///
import React from 'react';
import {
  Alert,
  StyleSheet,
} from 'react-native';

import {
  Icon,
  Button,
} from 'react-native-elements'

import { NavigationContext } from '@react-navigation/native';

import ActionButton from 'react-native-action-button';

import BackgroundGeolocation from "../react-native-background-geolocation";

import ENV from "../ENV";
import {COLORS, SOUNDS} from './lib/config';
import SettingsService from './lib/SettingsService';

const ACTION_BUTTON_OFFSET_Y = 70;

const FABMenu = (props:any) => {

	const [isOpen, setIsOpen] = React.useState(false);
	const [isEmailingLog, setIsEmailingLog] = React.useState(false);
	const [isResettingOdometer, setIsResettingOdometer] = React.useState(false);
  const [isSyncing, setIsSyncing] = React.useState(false);
  const [isDestroyingLocations, setIsDestroyingLocations] = React.useState(false);

  const navigation = props.navigation;

  const settingsService = SettingsService.getInstance();

  /// FAB Menu handler.
	const onClickMainMenu = () => {
    const value = !isOpen;
		setIsOpen(value);

    settingsService.playSound((value) ? 'OPEN' : 'CLOSE');
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
    BackgroundGeolocation.setOdometer(123123).then(location => {
      setIsResettingOdometer(false);
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
		<ActionButton
      position="right"
      hideShadow={false}
      autoInactive={false}
      active={isOpen}
      backgroundTappable={true}
      onPress={onClickMainMenu}
      verticalOrientation="up"
      buttonColor="rgba(254,221,30,1)"
      buttonTextStyle={styles.actionButton}
      spacing={15}
      offsetX={10}
      offsetY={ACTION_BUTTON_OFFSET_Y}>

      <ActionButton.Item size={40} buttonColor={COLORS.gold} onPress={() => onClickAction('destroyLocations')}>
        <Icon name="trash-sharp" type='ionicon' style={styles.itemIcon} />
      </ActionButton.Item>
      <ActionButton.Item size={40} buttonColor={COLORS.gold} onPress={() => onClickAction('sync')}>
        <Icon name="cloud-upload-sharp" type='ionicon' style={styles.itemIcon} />
      </ActionButton.Item>
      <ActionButton.Item size={40} buttonColor={COLORS.gold} onPress={() => onClickAction('emailLog')}>
        {!isEmailingLog ? (<Icon name="mail-sharp" type='ionicon' style={styles.actionButtonIcon} />) : (<Button type="clear" loading="true" />)}
      </ActionButton.Item>
      <ActionButton.Item size={40} buttonColor={COLORS.gold} onPress={() => onClickAction('resetOdometer')}>
        {!isResettingOdometer ? (<Icon name="speedometer-sharp" type='ionicon' style={styles.itemIcon} />) : (<Button type="clear" loading="true" />)}
      </ActionButton.Item>
      <ActionButton.Item size={40} buttonColor={COLORS.gold} onPress={() => onClickAction('requestPermission')}>
        <Icon name="lock-open-sharp" type='ionicon' style={styles.itemIcon} />
      </ActionButton.Item>
      <ActionButton.Item size={40} buttonColor={COLORS.gold} onPress={() => onClickAction('settings')}>
        <Icon name="cog-sharp" type='ionicon' style={styles.itemIcon} />
      </ActionButton.Item>
    </ActionButton>
	)
}

export default FABMenu;

var styles = StyleSheet.create({
	actionButton: {
		color: COLORS.black
	},
  itemIcon: {
    fontSize: 24
  }
});
