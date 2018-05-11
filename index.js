import { AppRegistry } from 'react-native';
import App from './src/App';

import BackgroundGeolocation from "./src/react-native-background-geolocation";
import BackgroundFetch from "react-native-background-fetch";

AppRegistry.registerComponent('BGGeolocation', () => App);

let HeadlessTask = async (event) => {
  let params = event.params;
  console.log('[BackgroundGeolocation HeadlessTask] -', event.name, params);

  switch (event.name) {
    case 'heartbeat':
      // Use await for async tasks
      let location = await BackgroundGeolocation.getCurrentPosition({
        samples: 1,
        persist: false
      });
      console.log('[BackgroundGeolocation HeadlessTask] - getCurrentPosition:', location);
      break;
  }
}

global.BackgroundGeolocation = BackgroundGeolocation;

BackgroundGeolocation.registerHeadlessTask(HeadlessTask);


let BackgroundFetchHeadlessTask = async (event) => {
  console.log('- BackgroundFetch HeadlessTask start');  
  // Important:  await asychronous tasks when using HeadlessJS.
  let location = await BackgroundGeolocation.getCurrentPosition({persist: false, samples: 1});
  console.log('- current position: ', location);
  // Required:  Signal to native code that your task is complete.
  // If you don't do this, your app could be terminated and/or assigned
  // battery-blame for consuming too much time in background.
  console.log('- BackgroundFetch HeadlessTask finished');
  BackgroundFetch.finish();  
}


// Register your BackgroundFetch HeadlessTask
AppRegistry.registerHeadlessTask('BackgroundFetch', () => BackgroundFetchHeadlessTask)
