# [Demo App]
## [react-native-background-geolocation](http://transistorsoft.github.io/react-native-background-geolocation/)

Fully-featured, React Native demo application for [React Native Background Geolocation Module](http://transistorsoft.github.io/react-native-background-geolocation/)

![Home](https://www.dropbox.com/s/byaayezphkwn36h/home-framed-350.png?dl=1)
![Settings](https://www.dropbox.com/s/8lvnpp0gowitagq/settings-framed-350.png?dl=1)

## Installation

```
$ git clone https://github.com/transistorsoft/rn-background-geolocation-demo.git
$ cd rn-background-geolocation-demo
$ npm install
$
$ react-native run-android
$ react-native run-ios
// opens a console which receives all your locations
$ npm run open  
```

- Simulate location 

![](https://dl.dropboxusercontent.com/u/2319755/react-native-background-geolocation-demo/simulate-location.png)

## Testing Server

By default, the sample app posts locations to Transistor Software's test server (sandboxed to your MAC address).  You can view these locations by running:

```bash
$ npm run open
```

This will launch a browser window to view the test server:

![](https://dl.dropboxusercontent.com/u/2319755/react-native-background-geolocation-demo/Testing%20Server.png)

## Adding Geofences

The app implements a **longtap** event on the map.  Simply **tap & hold** the map to initiate adding a geofence.

![Tap-hold to add geofence](https://dl.dropboxusercontent.com/u/2319755/react-native-background-geolocation-demo/Add%20Geofence.png)

Enter an `identifier`, `radius`, `notifyOnExit`, `notifyOnEntry`.



