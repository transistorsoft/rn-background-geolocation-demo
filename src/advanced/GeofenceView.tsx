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
  ListItem,
  Card
} from 'react-native-elements'

import DropDownPicker from 'react-native-dropdown-picker';

import AsyncStorage from '@react-native-async-storage/async-storage';

import ENV from "../ENV";
import SettingsService from './lib/SettingsService';
import {SOUNDS, COLORS} from './lib/config';

import BackgroundGeolocation, {
  Geofence
} from "../react-native-background-geolocation";

const IDENTIFIER_ERROR = "Please enter a unique identifier";

/// Validator fn for identifier
const validate = (value:string) => {
  return (value.length > 0);
}

const GeofenceView = ({route, navigation}) => {
  const settingsService = SettingsService.getInstance();

  const [identifier, setIdentifier] = React.useState('');
  const [identifierError, setIdentifierError] = React.useState('');

  const [isPolygon, setIsPolygon] = React.useState(false);
  const [radiusOpen, setRadiusOpen] = React.useState(false);
  const [radius, setRadius] = React.useState(200);

  const [notifyOnEntry, setNotifyOnEntry] = React.useState(true);
  const [notifyOnExit, setNotifyOnExit] = React.useState(true);
  const [notifyOnDwell, setNotifyOnDwell] = React.useState(false);

  const [loiteringDelay, setLoiteringDelay] = React.useState('10000');
  const [loiteringDelayError, setLoiteringDelayError] = React.useState('');

  /// - react-navigation Screen title: Add Geofence.
  /// - [Add] button on Header.
  React.useLayoutEffect(() => {
    navigation.setOptions({
      title: 'Add Geofence',
      headerRight: () => (
        <Button onPress={onClickAdd} title="Add" containerStyle={{width: 75}}/>
      ),
    });
  }, [navigation, identifier, identifierError]);

  React.useEffect(() => {
    DropDownPicker.setListMode("SCROLLVIEW");
    setIsPolygon(typeof (route.params.vertices) == 'object');
  }, []);

  /// [Add] button-handler.  Creates the geofence.
  const onClickAdd = () => {
    if (!validate(identifier)) {
      setIdentifierError(IDENTIFIER_ERROR);
      return;
    }

    const geofence = (!isPolygon) ? {
      identifier: identifier,
      radius: radius,
      latitude: route.params.coordinate.latitude,
      longitude: route.params.coordinate.longitude,
      notifyOnEntry: notifyOnEntry,
      notifyOnExit: notifyOnExit,
      notifyOnDwell: notifyOnDwell,
      loiteringDelay: parseInt(loiteringDelay, 10)
    } : {
      identifier: identifier,
      vertices: route.params.vertices,
      notifyOnEntry: notifyOnEntry,
      notifyOnExit: notifyOnExit,
    };
    
    BackgroundGeolocation.addGeofence(geofence).then((result) => {
      settingsService.playSound('ADD_GEOFENCE');
      navigation.goBack();
    }).catch((error) => {
      settingsService.alert('Add Geofence Error', error);
    });
  }

  const renderRadiusPicker = () => {
    return !isPolygon ? (
      <View style={{paddingLeft: 20, paddingRight: 20, marginBottom: 20, zIndex: 1000}}>
        <ListItem.Title style={styles.formLabel}>radius</ListItem.Title>
        <DropDownPicker
          open={radiusOpen}
          value={radius}
          items={[
            {label: '150', value: 150},
            {label: '200', value: 200},
            {label: '500', value: 500},
            {label: '1000', value: 1000},
            {label: '2000', value: 2000},
            {label: '5000', value: 5000}
          ]}
          setOpen={setRadiusOpen}
          setValue={setRadius}
          style={{
            borderColor: '#ccc'
          }}
          dropDownContainerStyle={{
            backgroundColor: '#fafafa',
            borderColor: '#ccc'
          }}
        />
      </View>
    ) : <View />;

  }
  return (
    <View style={styles.form}>

      <Input
        placeholder='Geofence identifier'
        label="Identifier"
        value={identifier}
        onChangeText={(value) => {
          setIdentifierError(validate(value) ? '' : IDENTIFIER_ERROR);
          setIdentifier(value);
        }}
        errorMessage={identifierError}
        keyboardType="default"
        autoCapitalize="none"
        autoCompleteType="username"
        autoCorrect={false}
        autoFocus={false}
        labelStyle={styles.formLabel}
        inputStyle={styles.input}
        containerStyle={styles.containerStyle}
      />

      {renderRadiusPicker()}

      <View style={styles.inlineField}>
        <View style={{flex: 1}}>
          <ListItem.Title style={styles.formLabel}>notifyOnEntry</ListItem.Title>
        </View>
        <View>
          <Switch value={notifyOnEntry} onValueChange={setNotifyOnEntry} />
        </View>
      </View>

      <View style={styles.inlineField}>
        <View style={{flex: 1}}>
          <ListItem.Title style={styles.formLabel}>notifyOnExit</ListItem.Title>
        </View>
        <View>
          <Switch value={notifyOnExit} onValueChange={setNotifyOnExit}/>
        </View>
      </View>

      <View style={styles.inlineField}>
        <View style={{flex: 1}}>
          <ListItem.Title style={styles.formLabel}>notifyOnDwell</ListItem.Title>
        </View>
        <View>
          <Switch value={notifyOnDwell} onValueChange={setNotifyOnDwell}/>
        </View>
      </View>

      <Input
        placeholder='Delay to fire DWELL transistion in milliseconds'
        label="Loitering Delay (milliseconds)"
        value={loiteringDelay}
        onChangeText={setLoiteringDelay}
        errorMessage={loiteringDelayError}
        keyboardType="default"
        autoCapitalize="none"

        autoCorrect={false}
        autoFocus={false}
        labelStyle={styles.formLabel}
        inputStyle={styles.input}
        containerStyle={styles.containerStyle}
      />

    </View>
  )
}

export default GeofenceView;

const styles = StyleSheet.create({
  form: {
    paddingTop: 10,
    backgroundColor: COLORS.white,
    flexDirection: 'column',
    flex: 1
  },
  formLabel: {
    color: COLORS.light_blue,
    fontWeight: 'normal',
  },
  inlineField: {
    paddingLeft: 20,
    paddingRight: 15,
    paddingTop: 10,
    paddingBottom: 10,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center'
  },
  input: {
    padding: 0,
    fontSize: 14,
    margin: 0,
    minHeight: 20
  },
  containerStyle: {
    backgroundColor: COLORS.white,
    paddingLeft: 20,
    paddingTop: 10
  },
});

