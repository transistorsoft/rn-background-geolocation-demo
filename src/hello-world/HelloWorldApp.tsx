import React from 'react';

import { createNativeStackNavigator } from '@react-navigation/native-stack';

import {Button, Icon} from "react-native-elements";

import HelloWorldView from './HelloWorldView';

const Stack = createNativeStackNavigator();

const HelloWorldApp = ({route, navigation}) => {
  return (
    <Stack.Navigator
      initialRouteName="HelloWorld"
      screenOptions={{
        title: 'Hello World Demo',
        headerStyle: {
          backgroundColor: '#fedd1e'
        },
        headerLeft: () => (
          <Button
            type="clear"
            onPress={() => {
              navigation.goBack()
            }}
            icon={<Icon name='home-sharp' type='ionicon' /> }
          />
        ),
      }}>
      <Stack.Screen
        name="HelloWorld"
        component={HelloWorldView}
        initialParams={route.params}
      />
    </Stack.Navigator>
  )
}

export default HelloWorldApp;