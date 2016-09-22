# [Demo App]
##[react-native-background-geolocation](http://transistorsoft.github.io/react-native-background-geolocation/)

Fully-featured, React Native demo application for [React Native Background Geolocation Module](http://transistorsoft.github.io/react-native-background-geolocation/)

![Home](https://dl.dropboxusercontent.com/u/2319755/cordova-background-geolocaiton/screenshot-iphone5-geofences-framed-README.png)
![Settings](https://dl.dropboxusercontent.com/u/2319755/cordova-background-geolocaiton/screenshot-iphone5-settings-framed-README.png)

## Installation

```
$ git clone https://github.com/transistorsoft/rn-background-geolocation-demo.git
$ cd rn-background-geolocation-demo
$ npm install
```

**Android users**: Install plugin from private repo ([requires license](http://shop.transistorsoft.com/pages/react-native-background-geolocation))

```
$ npm install git+https://git@github.com:transistorsoft/react-native-background-geolocation-android.git
```

- Now open as an XCode project

- Simulate location 

![](https://dl.dropboxusercontent.com/u/2319755/react-native-background-geolocation-demo/simulate-location.png)

## Adding Geofences

The app implements a **longtap** event on the map.  Simply **tap & hold** the map to initiate adding a geofence.

![Tap-hold to add geofence](https://www.dropbox.com/s/9qif3rvznwkbphd/Screenshot%202015-06-06%2017.12.41.png?dl=1)

Enter an `identifier`, `radius`, `notifyOnExit`, `notifyOnEntry`.



