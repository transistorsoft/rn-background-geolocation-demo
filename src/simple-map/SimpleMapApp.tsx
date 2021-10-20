import React from 'react';
import {
  StyleSheet,
  Text,
  View
} from 'react-native';

import {
  Button,
} from 'react-native-elements'

const SimpleMapApp = ({route, navigation}) => {
  const {org, username} = route.params;

  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <Text>SimpleMapApp</Text>
      <Text>Org: {org}</Text>
      <Text>Username: {username}</Text>
      <Button
        title="Go to Home"
        onPress={() => navigation.navigate('Home')}
      />
    </View>
  );
}

export default SimpleMapApp;