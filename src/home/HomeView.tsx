import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  Linking
} from 'react-native';

import {
  Card,
  Button,
  Icon,
} from 'react-native-elements'

import { createNativeStackNavigator } from '@react-navigation/native-stack';

import AsyncStorage from '@react-native-async-storage/async-storage';

import {COLORS} from '../lib/config';
import ENV from "../ENV";

import SettingsService from '../advanced/lib/SettingsService';

import BackgroundGeolocation from "../react-native-background-geolocation";

const HomeView= ({route, navigation}) => {
  const [org, setOrg] = React.useState("");
  const [username, setUsername] = React.useState("");
  const [deviceModel, setDeviceModel] = React.useState('');

  const settingsService = SettingsService.getInstance();

  React.useEffect(() => {
    if (route.params) {
      setOrg(route.params.org);
      setUsername(route.params.username);
    }
  }, [route, navigation]);

  React.useLayoutEffect(() => {
    // Restore org/username from AsyncStorage.
    AsyncStorage.getItem('@transistorsoft:org').then((value) => {
      if (value != null) {
        setOrg(value);
      }
    })

    AsyncStorage.getItem('@transistorsoft:username').then((value) => {
      if (value != null) {
        setUsername(value);
      }
    })

    // Set DeviceModel.
    BackgroundGeolocation.getDeviceInfo().then((deviceInfo) => {
      setDeviceModel(deviceInfo.model);
    });
  }, [navigation]);

  const onClickRegister = () => {
    settingsService.playSound('OPEN');
    navigation.navigate('Registration', {org: org, username: username});
  };

  const validate = (value:string) => {
    if (value == null) {
      return false;
    }
    if (value.length === 0) {
      return false;
    }
    return true;
  }

  const onClickNavigate = async (route:string) => {
    if (!validate(route) || !validate(org) || !validate(username)) {
      // Re-direct to registration screen
      onClickRegister();
      return;
    }
    settingsService.playSound('OPEN');
    navigation.navigate(route, {
      screen: route,
      params: {
        username: username,
        org: org
      }
    });
  };

  const onClickViewServer = async() => {
    if (!validate(route) || !validate(org) || !validate(username)) {
      // Re-direct to registration screen
      onClickRegister();
      return;
    }
    const url = `${ENV.TRACKER_HOST}/${org}`;
    Linking.openURL(url).catch((err) => {
      settingsService.alert('Error', `Could not open url ${url}`)
    });
  }

  return (
    <View style={{
      flexDirection: 'column',
      flex: 1,
      backgroundColor: '#111'
    }}>
      <View style={{ height:70, alignItems: 'center'}}>
        <Text style={{fontSize: 20, color: '#fff', fontWeight: 'bold', padding: 20}}>Example Applications</Text>
      </View>
      <View style={{ padding: 20, flex: 1, flexDirection: 'column', justifyContent: 'space-around' }}>
        <Button
          buttonStyle={{backgroundColor: COLORS.gold}}
          titleStyle={{color: COLORS.black}}
          title="Advanced App"
          onPress={() => onClickNavigate('AdvancedApp') }
        />
        <Button
          buttonStyle={{backgroundColor: COLORS.gold}}
          titleStyle={{color: COLORS.black}}
          title="Hello World App"
          onPress={() => onClickNavigate('HelloWorldApp')}
        />

      </View>
      <View style={{padding: 10, backgroundColor: "#fff"}}>
        <Text style={{marginBottom: 10}}>These apps will post locations to Transistor Software's demo server.  You can view your tracking in the browser by visiting:</Text>
        <Text style={{fontWeight: 'bold', textAlign: 'center', marginBottom: 10}}>{ENV.TRACKER_HOST}/{org}</Text>
        <View style={{flexDirection: 'row', marginBottom: 10, height: 50}}>
          <Icon
            name='person-circle-outline'
            type='ionicon'
            color='#517fa4'
          />
          <View style={{flex: 1, marginLeft: 10}}>
            <View style={{flexDirection: 'row'}}>
              <Text style={{fontWeight: 'bold', width: 75}}>Org:</Text>
              <Text style={{flex: 1}}>{org}</Text>
            </View>
            <View style={{flexDirection: 'row'}}>
              <Text style={{fontWeight: 'bold', width: 75}}>Device ID:</Text>
              <Text>{deviceModel}-{username}</Text>
            </View>
          </View>

        </View>
        <View style={{flexDirection: 'row', justifyContent: 'space-around'}}>
          <Button
            title="Edit"
            onPress={onClickRegister}
            buttonStyle={{width: 150, backgroundColor: '#c00'}}
          />
          <Button
            title="View Tracking"
            onPress={onClickViewServer}
            buttonStyle={{width:150}} />
        </View>
      </View>
    </View>
  );
};

export default HomeView;

const styles = StyleSheet.create({
  container: {
    padding: 20
  }
});


