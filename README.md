# [Demo App]
##[react-native-background-geolocation](http://transistorsoft.github.io/react-native-background-geolocation/)

Fully-featured, React Native demo application for [React Native Background Geolocation Module](http://transistorsoft.github.io/react-native-background-geolocation/)

![SampleApp home](https://www.dropbox.com/s/609iibr6ofzoq7p/Screenshot%202015-06-06%2017.05.33.png?dl=1)

Edit settings and observe the behavour of **Background Geolocation** changing in **real time**.

![Settings Screen](https://www.dropbox.com/s/v6xwp6leuc5ysv9/Screenshot%202015-06-06%2019.08.58.png?dl=1)

## Installation

```
$ git clone https://github.com/transistorsoft/rn-background-geolocation-demo.git
$ cd rn-background-geolocation-demo
$ npm install
```

- Now open as an XCode project

- Simulate location 

![](https://dl.dropboxusercontent.com/u/2319755/react-native-background-geolocation-demo/simulate-location.png)

**NOTE**: There's currently a bug (probably because I'm an `react-native` noob) when you flip to the settings screen, the `Mapbox GL` map goes haywire and loses track of any annotations added to map.  After changing settings, you'll have to restart the app currently -- the settings changes will have been persisted.  

```
2015-08-13 13:51:04.298 RNBackgroundGeolocationSample[429:105061] [INFO] {Worker}[Sprite]: Can't find sprite named 'com.mapbox.sprites.'
2015-08-13 13:51:04.329 RNBackgroundGeolocationSample[429:105061] [INFO] {Worker}[Sprite]: Can't find sprite named 'com.mapbox.sprites.'
2015-08-13 13:51:04.336 RNBackgroundGeolocationSample[429:105061] [INFO] {Worker}[Sprite]: Can't find sprite named 'com.mapbox.sprites.'
2015-08-13 13:51:04.352 RNBackgroundGeolocationSample[429:105061] [INFO] {Worker}[Sprite]: Can't find sprite named 'com.mapbox.sprites.'
```

## Adding Geofences

**NOTE: NOT YET IMPLEMENTED**

The app implements a **longtap** event on the map.  Simply **tap & hold** the map to initiate adding a geofence.

![Tap-hold to add geofence](https://www.dropbox.com/s/9qif3rvznwkbphd/Screenshot%202015-06-06%2017.12.41.png?dl=1)

Enter an `identifier`, `radius`, `notifyOnExit`, `notifyOnEntry`.



