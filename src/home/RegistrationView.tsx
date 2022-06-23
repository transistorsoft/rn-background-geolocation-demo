import React from 'react';
import {
  StyleSheet,
  Text,
  View,
} from 'react-native';

import {
  Card,
  Button,
  Input
} from 'react-native-elements'

import AsyncStorage from '@react-native-async-storage/async-storage';

import ENV from "../ENV";
import SettingsService from "../advanced/lib/SettingsService";
import BackgroundGeolocation from "../react-native-background-geolocation";
import COLORS from "../lib/config";

const USERNAME_VALIDATOR =  /^[a-zA-Z0-9_-]*$/;
const ERROR_MESSAGE = "Invalid format.  Do not use spaces or special characters";

const isValid = (value:string) => {
  return (value != null) && (value.length>0) && USERNAME_VALIDATOR.test(value);
}

const RegistrationView = ({route, navigation}) => {
  const [org, setOrg] = React.useState(route.params.org);
  const [username, setUsername] = React.useState(route.params.username);
  const [orgErrorMessage, setOrgErrorMessage] = React.useState('');
  const [usernameErrorMessage, setUsernameErrorMessage] = React.useState('');
  const [url, setUrl] = React.useState(ENV.TRACKER_HOST);
  const [device, setDevice] = React.useState('');

  const settingsService = SettingsService.getInstance();

  const getDeviceInfo = async () => {
    const deviceInfo = await BackgroundGeolocation.getDeviceInfo();
    setDevice(deviceInfo.manufacturer + ' ' + deviceInfo.model);
  }

  const onClickRegister = async () => {
    const orgIsValid = isValid(org);
    const usernameIsValid = isValid(username);

    let error = false;
    if (!orgIsValid) {
      setOrgErrorMessage(ERROR_MESSAGE);
      error = true;
    }
    if (!usernameIsValid) {
      setUsernameErrorMessage(ERROR_MESSAGE);
      error = true;
    }
    if (error) {
      return;
    }
    settingsService.playSound('CLOSE');

    // Persist org & username.
    await AsyncStorage.setItem('@transistorsoft:org', org);
    await AsyncStorage.setItem('@transistorsoft:username', username);

    // Ensure any current cached token is destroyed.
    await BackgroundGeolocation.destroyTransistorAuthorizationToken(ENV.TRACKER_HOST);
    // Register device with tracker.transistorsoft.com to receive a JSON Web Token (JWT).
    const token = await BackgroundGeolocation.findOrCreateTransistorAuthorizationToken(org, username, ENV.TRACKER_HOST);

    await BackgroundGeolocation.setConfig({
      transistorAuthorizationToken: token
    });

    navigation.navigate('Home', {
      org: org,
      username: username
    })
  };

  React.useEffect(() => {
    getDeviceInfo();
  }, []);

  React.useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <Button onPress={onClickRegister} title="Register" />
      ),
    });
  }, [navigation, org, username]);

  return (
    <View>
      <View style={styles.form}>
        <Text style={styles.device}>{device}</Text>
        <Input
          placeholder='eg. Company name'
          label="Organization"
          value={org}
          onChangeText={setOrg}
          errorMessage={orgErrorMessage}
          keyboardType="default"
          autoCapitalize="none"
          autoCompleteType="username"
          autoCorrect={false}
          autoFocus={false}
        />
        <Input
          placeholder='eg. Github username or initials'
          label="Username"
          value={username}
          onChangeText={setUsername}
          errorMessage={usernameErrorMessage}
          keyboardType="default"
          autoCapitalize="none"
          autoCompleteType="username"
          autoCorrect={false}
          autoFocus={false}
        />
      </View>
      <Card>
        <Text style={styles.bodyText}>Please provide an Organization and Username to register your device with the Demo Server.</Text>
        <Text style={styles.bodyText}>You will access your results at the url:</Text>
        <Text style={styles.url}>{url}/{org}</Text>
      </Card>
    </View>
  )
}

export default RegistrationView;

const styles = StyleSheet.create({
  device: {
    fontWeight: 'bold',
    color: '#000',
    fontStyle: 'italic',
    fontSize: 20,
    textAlign: 'center',
    padding: 20
  },
  form: {
    padding: 0
  },
  bodyText: {
    marginBottom: 10,
    color: '#000'
  },
  url: {
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#36c'
  }
});
