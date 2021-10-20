/// An advanced Settings screen for modifying plugin state at runtime.
///
import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
} from 'react-native';

import {
  Button,
  Icon,
  Input,
  Switch,
  ListItem
} from 'react-native-elements'

import DropDownPicker from 'react-native-dropdown-picker';

import AsyncStorage from '@react-native-async-storage/async-storage';

import ENV from "../ENV";
import SettingsService from './lib/SettingsService';
import {SOUNDS, COLORS} from './lib/config';

import BackgroundGeolocation, {
  State
} from "../react-native-background-geolocation";

/// Local cache of plugin State.
let pluginState:State = {
  enabled: false,
  isMoving: false,
  schedulerEnabled: false,
  trackingMode: 1,
  odometer: 0,
  didDeviceReboot: false,
  didLaunchInBackground: false
};

/// Field-change buffer
/// We buffer calls to BackgroundGeolocation.setConfig when editing TEXT fields so that we don't
/// call setConfig for each key-press.
let fieldChangeBuffer:any = 0;

const SettingsView = ({route, navigation}) => {
  const settingsService = SettingsService.getInstance();

  /// Set screen title.
  React.useLayoutEffect(() => {
    DropDownPicker.setListMode("MODAL");
    navigation.setOptions({
      title: "Settings"
    });
  }, [navigation]);

  /// Configure state.
  ///
  const [isDestroyingLog, setIsDestroyingLog] = React.useState(false);
  const [isAddingGeofences, setIsAddingGeofences] = React.useState(false);

  const [state, setState] = React.useState(() => {  // <-- callback form for initalState
    // Build default state.
    const settings = settingsService.getPluginSettings();

    let defaultState:any = {};

    const initSettingState = (setting:any) => {
      const record:any = {value: setting.defaultValue};

      if (setting.inputType === 'select') {
        record.open = false;
        record.items = setting.values.map((value:any) => {
          return (typeof(value) === 'object') ? value : {label: value.toString(), value: value};
        })
      }
      defaultState[setting.name] = record;
    }

    // First collect all the BGGeo settings and initialize default state object without values.
    settings.forEach(initSettingState);
    // Now initialize demo app settings state.
    settingsService.getApplicationSettings().forEach(initSettingState);

    // [TRICKY BUSINESS] getState fetches the current plugin values for all settings.
    // This is ASYNCHRONOUS and will complete only AFTER the initial defaultState has already
    // been returned to React.useState and the view already rendered the first time.
    BackgroundGeolocation.getState().then((state:any) => {
      pluginState = state;

      settings.forEach((setting:any) => {
        switch (setting.name) {
          case 'notificationPriority':
            defaultState[setting.name].value = state.notification.priority;
            break;
          case 'desiredAccuracy':
            defaultState[setting.name].value = (state.desiredAccuracy === 0) ? BackgroundGeolocation.DESIRED_ACCURACY_HIGH : state.desiredAccuracy;
            break;
          default:
            defaultState[setting.name].value = state[setting.name];
        }
      });

      // Now update the React State with current plugin State.
      setState((prevState:any) => ({...prevState, defaultState}));
    });

    return defaultState;
  });

  /// field-change handler for every setting.  Calls BackgroundGeolocation.setConfig.
  const onFieldChange = (setting:any, value:any) => {
    if (state[setting.name].value === value) { return; }

    // Update state.
    setState((prevState:any) => ({
      ...prevState,
      [setting.name]: {
        ...prevState[setting.name],
        value: value
      }
    }));

    const config:any = {};

    switch(setting.name) {
      case 'notificationPriority':
        let notification:any = pluginState['notification'];
        notification.priority = value;
        config['notification'] = notification;
        break;
      default:
        config[setting.name] = value;
    }

    if (setting.name === 'trackingMode') {
      // Special case for trackingMode which is toggled via .start() / .startGeofences()
      // Does not use setConfig.
      console.log(`[onFieldChange] trackingMode: (${typeof(value)})`);
      if (value === 1) {
        BackgroundGeolocation.start();
      } else {
        BackgroundGeolocation.startGeofences();
      }
    } else {
      if (setting.inputType === 'text') {
        // Special case for text fields:  Buffer field-changes by 1000ms
        if (fieldChangeBuffer > 0) {
          clearTimeout(fieldChangeBuffer);
          fieldChangeBuffer = 0;
        }
        fieldChangeBuffer = setTimeout(() => doSetConfig(config), 1000);
      } else {
        // typical case:  setConfig immediately.
        doSetConfig(config);
      }
    }
  }

  const doSetConfig = (config:any) => {
    console.log(`[doSetConfig] ${JSON.stringify(config)}`);
    settingsService.playSound('TEST_MODE_CLICK');
    BackgroundGeolocation.setConfig(config).then((state:State) => {
      pluginState = state;
    });
  }

  /// Render a category of settings fields.
  /// - geolocation
  /// - activity recognition
  /// - http & persistence
  /// - application
  /// - debug
  ///
  const renderPluginSettings = (category:string) => {
    return settingsService.getPluginSettings(category).map((setting:any, i) => {
      return buildField(setting, i, onFieldChange);
    });
  }

  const buildField = (setting:any, i:number, callback:Function) => {
    switch (setting.inputType) {
      case 'select':
        return buildSelectField(setting, i, callback);
        break;
      case 'toggle':
        return buildSwitchField(setting, i, callback);
        break;
      case 'text':
        return buildInputField(setting, i, callback);
        break;
    }
  }
  /// Render <Input /> Field
  const buildInputField = (setting:any, i:number, onChangeCallback:Function) => {
    return (
      <ListItem key={setting.name} containerStyle={[styles.listItemContainer, styles.inlineField]} bottomDivider>
        <Input
          label={setting.name}
          value={state[setting.name].value}
          onChangeText={(value) => onChangeCallback(setting, value)}
          keyboardType="default"
          autoCapitalize="none"
          autoCompleteType="username"
          autoCorrect={false}
          autoFocus={false}
          labelStyle={styles.formLabel}
          inputStyle={styles.input}
          containerStyle={styles.inputContainer}
        />
      </ListItem>
    );
  }

  /// Render <Switch /> Field
  const buildSwitchField = (setting:any, i:number, onChangeCallback:Function) => {
    return (
      <ListItem key={setting.name} containerStyle={[styles.listItemContainer, styles.inlineField]} bottomDivider>
        <ListItem.Content style={{flexDirection: 'row', alignItems: 'center', paddingTop: 5, paddingBottom:5}}>
          <ListItem.Title style={styles.formLabel}>{setting.name}</ListItem.Title>
          <Switch onValueChange={(value) => onChangeCallback(setting, value)} value={state[setting.name].value} />
        </ListItem.Content>
      </ListItem>
    );
  }

  /// Render <DropDownPicker /> field.
  const buildSelectField = (setting:any, i:number, onChangeCallback:Function) => {

    const setOpen = (value:any) => {
      if (value) {
        settingsService.playSound('TEST_MODE_CLICK');
      }
      setState((prevState:any) => ({
        ...prevState,
        [setting.name]: {
          ...prevState[setting.name],
          open: value
        }
      }));
    }

    const setValue = (callback:Function) => {
      onChangeCallback(setting, callback(state[setting.name].value));
    }

    const setItems = (callback:any) => {
      setState((prevState:any) => ({
        ...prevState,
        [setting.name]: {
          ...prevState[setting.name],
          items: callback(prevState.items)
        }
      }))
    }

    return (
      <ListItem key={setting.name} containerStyle={styles.listItemContainer} bottomDivider>
        <ListItem.Content>
          <ListItem.Title style={styles.formLabel}>{setting.name}</ListItem.Title>
          <DropDownPicker
            open={state[setting.name].open}
            value={state[setting.name].value}
            items={state[setting.name].items}
            setOpen={(value) => setOpen(value)}
            setValue={(value) => setValue(value)}
            setItems={(items) => setItems(items)}
            listItemLabelStyle={{
              fontSize: 18
            }}
            style={{
              borderColor: '#ccc'
            }}
          />
        </ListItem.Content>
      </ListItem>
    )
  };

  const onChangeGeofence = () => {

  }

  const getGeofenceTestSettings = () => {

    return settingsService.getApplicationSettings('geofence').map((setting:any, i:number) => {
      return buildField(setting, i, onChangeGeofence);
    });

    return (<Text>getGeofenceTestSettings</Text>);

  }

  const onClickDestroyLog = () => {
    setIsDestroyingLog(true);
    BackgroundGeolocation.logger.destroyLog().then(() => {
      setIsDestroyingLog(false);
      settingsService.playSound('MESSAGE_SENT');
    }).catch((error) => {
      setIsDestroyingLog(false);
      settingsService.alert("Destroy Log Error", error);
    })
  }

  const onClickRemoveGeofences = () => {
    BackgroundGeolocation.removeGeofences().then(() => {
      settingsService.playSound('MESSAGE_SENT');
    }).catch((error) => {
      settingsService.alert('Remove Geofences Error', error);
    });
  }

  const onClickAddGeofences = () => {
    if (isAddingGeofences) { return false; }
    setIsAddingGeofences(true);

    settingsService.getApplicationState((state:any) => {
      const geofences = settingsService.getTestGeofences('freeway_drive', state);

      BackgroundGeolocation.addGeofences(geofences).then(() => {
        settingsService.playSound('ADD_GEOFENCE');
        setIsAddingGeofences(false);
      }).catch((error) => {
        settingsService.alert('Add Geofenes Error', error);
        setIsAddingGeofences(false);
      });
    });
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Geolocation</Text>
      <View style={styles.section}>
        {renderPluginSettings('geolocation')}
      </View>

      <Text style={styles.title}>Activity Recognition</Text>
      <View style={styles.section}>
        {renderPluginSettings('activity recognition')}
      </View>

      <Text style={styles.title}>HTTP &amp; Persistence</Text>
      <View style={styles.section}>
        {renderPluginSettings('http')}
      </View>

      <Text style={styles.title}>Application</Text>
      <View style={styles.section}>
        {renderPluginSettings('application')}
      </View>

      <Text style={styles.title}>Debug</Text>
      <View style={styles.section}>
        {renderPluginSettings('debug')}

        <ListItem containerStyle={{flexDirection: 'column', alignItems: 'stretch'}} bottomDivider>
          <Button
            buttonStyle={{backgroundColor: COLORS.red, width:'100%'}}
            titleStyle={styles.buttonTitleStyle}
            title="Destroy logs"
            loading={isDestroyingLog}
            onPress={onClickDestroyLog}
          />
        </ListItem>
      </View>

      <Text style={styles.title}>Geofence Testing</Text>
      <View style={styles.section}>
        <View style={{flexDirection: 'row', justifyContent:'space-around'}}>
          <View style={{width:170}}>
            <Button
              buttonStyle={{backgroundColor: COLORS.red}}
              titleStyle={styles.buttonTitleStyle}
              title='Remove Geofences'
              onPress={onClickRemoveGeofences}
            />
          </View>
          <View style={{width:170}}>
            <Button
              title='Add Geofences'
              onPress={onClickAddGeofences}
              loading={isAddingGeofences}
              titleStyle={styles.buttonTitleStyle}
            />
          </View>
        </View>

        {getGeofenceTestSettings()}
      </View>
    </ScrollView>
  )
}

export default SettingsView;

const styles = StyleSheet.create({
  container: {

  },
  buttonTitleStyle: {
    fontSize: 14
  },
  header: {
    backgroundColor: '#fedd1e'
  },
  title: {
    color: '#000',
    marginTop: 10,
    marginBottom: 10,
    fontSize: 18,
    textAlign:'center',
    fontWeight: 'bold'
  },
  section: {
    paddingBottom: 10,
    paddingTop: 5,
    marginBottom: 10,
    backgroundColor: '#fff'
  },
  listItem: {
    padding: 0,
    margin: 0
  },
  inlineField: {
    marginTop: 5,
    marginBottom: 5,
  },
  input: {
    padding: 0,
    fontSize: 14,
    margin: 0,
    minHeight: 20
  },
  inputContainer: {
    margin: 0,
    padding: 0,

  },
  listItemContainer: {
    paddingLeft: 10,
    paddingRight: 10,
    paddingBottom:10,
    paddingTop:10,
  },
  formLabel: {
    color: COLORS.light_blue,
    flex: 1,
    paddingLeft: 3,
    paddingBottom: 3
  }
});
