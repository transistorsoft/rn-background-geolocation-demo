import AsyncStorage from '@react-native-async-storage/async-storage';

import BackgroundGeolocation, {
  TransistorAuthorizationToken,
  HttpEvent
} from "../react-native-background-geolocation"

import ENV from "../ENV";

let onHttpSubscription:any = null;
/**
* If the app registers for a TransistorAuthorizationToken while disconnected from network, the app configures an accessToken: "DUMMY_TOKEN".
* When the server receives a DUMMY_TOKEN, it will return an HTTP status "406 Unacceptable".  This is the signal to re-register for a token.
*/
async function register(navigation:any):Promise<TransistorAuthorizationToken> {
  console.log('[TransistorAuth] this device requires reqistration');
  await BackgroundGeolocation.destroyTransistorAuthorizationToken(ENV.TRACKER_HOST);

  let orgname = await AsyncStorage.getItem("@transistorsoft:org");
  let username = await AsyncStorage.getItem("@transistorsoft:username");
  if (orgname == null || username == null) {
    // TODO
    //Util.navigateHome(navigation);
    return {
      accessToken: "DUMMY_TOKEN",
      refreshToken: "DUMMY_TOKEN",
      expires: -1,
      url: ''
    };
  }

  let token:TransistorAuthorizationToken = await BackgroundGeolocation.findOrCreateTransistorAuthorizationToken(orgname, username, ENV.TRACKER_HOST);

  await BackgroundGeolocation.setConfig({
    transistorAuthorizationToken: token
  });
  return token;
}

/**
* If a Device is destroyed from tracker.transistorsoft.com, the TransistorAuthorizationToken is invalid.
* Force the user to the Home Screen, destroy the token from client and force the user to re-register.
* We also destroy their username from AsyncStorage to force the registration popup to appear.
*
* This method sets up a BackgroundGeolocation.onHttp listener.  tracker.transistorsoft.com returns HTTP status "410 Gone"
* when a device is destroyed.
*/
async function goHome(navigation:any) {
  // Our authorization token doesn't seem to be valid anymore.  Re-register this device by removing username
  // and forcing user to the HomeScreen.
  console.log('[TransistorAuth] It seems this device has been destroyed from tracker.transistorsoft.com.  The authentication token is no longer valid.  Redirecting to Home page.');
  await AsyncStorage.removeItem('@transistorsoft:username');
  navigation.navigate('Home');
}

/**
* Global BackgroundGeolocation onHttp listener for handling edge-cases related to TransistorAuthorizationToken.
*/
export async function registerTransistorAuthorizationListener(navigation:any) {
  console.log('[Authorization registerTransistorAuthorizationHandler]');
  // If we already have a listener, remove it.
  if (onHttpSubscription !== null) {
    onHttpSubscription.remove();
  }
  onHttpSubscription = BackgroundGeolocation.onHttp(async (event:HttpEvent) => {
    switch(event.status) {
      case 403:
      case 406:
        await BackgroundGeolocation.destroyTransistorAuthorizationToken(ENV.TRACKER_HOST);
        let token = await register(navigation);
        if (token.accessToken != 'DUMMY_TOKEN') {
          BackgroundGeolocation.sync();
        }
        break;
      case 410:
        goHome(navigation);
        break;
    }
  });
}
