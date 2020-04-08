import { AppRegistry } from 'react-native';
import App from './src/App';
import ENV from './src/ENV';

import BackgroundGeolocation from "./src/react-native-background-geolocation";


// Make BackgroundGeolocation API global for handy access in Javascript Debugger console
global.BackgroundGeolocation = BackgroundGeolocation;

import BackgroundFetch from "react-native-background-fetch";

AppRegistry.registerComponent('BGGeolocation', () => App);

/**
* BackgroundGeolocation Headless JS task.
* For more information, see:  https://github.com/transistorsoft/react-native-background-geolocation/wiki/Android-Headless-Mode
*/
let BackgroundGeolocationHeadlessTask = async (event) => {
  let params = event.params;
  console.log('[BackgroundGeolocation HeadlessTask] -', event.name, params);

  switch (event.name) {
    case 'heartbeat':
      /**
      * Enable this block to execute #getCurrentPosition in headless heartbeat event (will consume more power)
      *
      // Use await for async tasks
      let location = await BackgroundGeolocation.getCurrentPosition({
        samples: 1,
        persist: false
      });
      console.log('[BackgroundGeolocation HeadlessTask] - getCurrentPosition:', location);
      *
      */
      break;
    case 'authorization':
      BackgroundGeolocation.setConfig({
        url: ENV.TRACKER_HOST + '/api/locations'
      });
      break;
  }
}


BackgroundGeolocation.registerHeadlessTask(BackgroundGeolocationHeadlessTask);

/**
* BackgroundFetch Headless JS Task.
* For more information, see:  https://github.com/transistorsoft/react-native-background-fetch#config-boolean-enableheadless-false
*/
let BackgroundFetchHeadlessTask = async (event) => {
  console.log('[BackgroundFetch HeadlessTask] start', event.taskId);

  if (event.taskId == 'react-native-background-fetch') {
    /*
    await BackgroundFetch.scheduleTask({
      taskId: 'com.transistorsoft.customtask',
      delay: 5000,
      stopOnTerminate: false,
      enableHeadless: true,
      forceAlarmManager: true
    });
    */
  }
  // Important:  await asychronous tasks when using HeadlessJS.
  /* DISABLED
  let location = await BackgroundGeolocation.getCurrentPosition({persist: false, samples: 1});
  console.log('- current position: ', location);
  // Required:  Signal to native code that your task is complete.
  // If you don't do this, your app could be terminated and/or assigned
  // battery-blame for consuming too much time in background.
  */
  console.log('[BackgroundFetch HeadlessTask] finished');

  BackgroundFetch.finish(event.taskId);
}


// Register your BackgroundFetch HeadlessTask
BackgroundFetch.registerHeadlessTask(BackgroundFetchHeadlessTask);
