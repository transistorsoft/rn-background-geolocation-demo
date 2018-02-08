import { AppRegistry } from 'react-native';
import App from './src/App';

import BackgroundGeolocation from "./src/react-native-background-geolocation";

AppRegistry.registerComponent('BGGeolocation', () => App);

let HeadlessTask = async (event) => {
  let params = event.params;
  console.log('[BackgroundGeolocation HeadlessTask] -', event.name, params);

  switch (event.name) {
    case 'heartbeat':
      // Use await for async tasks
      let location = await getCurrentPosition();
      console.log('[BackgroundGeolocation HeadlessTask] - getCurrentPosition:', location);
      break;
  }
}

global.BackgroundGeolocation = BackgroundGeolocation;

let getCurrentPosition = () => {
  return new Promise((resolve) => {
    BackgroundGeolocation.getCurrentPosition((location) => {
      resolve(location);
    }, (error) => {
      resolve(error);
    }, {
      samples: 1,
      persist: false
    });
  });
};

BackgroundGeolocation.registerHeadlessTask(HeadlessTask);
