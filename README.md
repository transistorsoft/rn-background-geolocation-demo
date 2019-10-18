# [Demo App]
## [react-native-background-geolocation](http://transistorsoft.github.io/react-native-background-geolocation/)

Fully-featured, React Native demo application for [React Native Background Geolocation Module](http://transistorsoft.github.io/react-native-background-geolocation/)

![Home](https://dl.dropboxusercontent.com/s/byaayezphkwn36h/home-framed-350.png?dl=1)
![Settings](https://dl.dropboxusercontent.com/s/8lvnpp0gowitagq/settings-framed-350.png?dl=1)

## Installation

```bash
  git clone https://github.com/transistorsoft/rn-background-geolocation-demo.git
  cd rn-background-geolocation-demo
  yarn install
// <or with npm>
  npm install
```

Now run it:
```bash
  react-native run-android
  react-native run-ios
```

:warning: If you get an iOS build error, this usually fixes it:
```bash
  cd ios
  rm Podfile.lock
  pod install
```

The quickest way to see the plugin in-action is to boot the **iOS** simulator and *simulate location* with *Freeway Drive*.

The demo is composed of three separate and independent sub-applications:

- [Hello World](./src/hello-world/HelloWorld.js)
- [Simple Map](./src/simple-map/SimpleMap.js)
- [Advanced](./src/advanced/) with complex settings screen and geofencing.

![](https://dl.dropboxusercontent.com/s/w87uylrgij9kd7r/ionic-demo-home.png?dl=1)

## :large_blue_diamond: Tracking Server

The demo app is configured to post locations to Transistor Software's demo server, which hosts a web-application for visualizing and filtering your tracking on a map.

- After booting the app the first time, you'll be asked to enter a **unique** "Tracking Server Username" (eg: Github username) so the plugin can post locations to `tracker.transistorsoft.com`.

:warning: Make your username **unique** and known only to *you* &mdash; if every one uses *"test"*, you'll never find your device!)

![](https://dl.dropboxusercontent.com/s/yhb311q5shxri36/ionic-demo-username.png?dl=1)

- You can view the plugin's tracking history by visiting [http://tracker.transistorsoft.com/username](http://tracker.transistorsoft.com/username).

![](https://dl.dropboxusercontent.com/s/1a4far51w70rjvj/Screenshot%202017-08-16%2011.34.43.png?dl=1)

## Adding Geofences

The app implements a **longtap** event on the map.  Simply **tap & hold** the map to initiate adding a geofence.

![Tap-hold to add geofence](https://dl.dropboxusercontent.com/s/9qif3rvznwkbphd/Screenshot%202015-06-06%2017.12.41.png?dl=1)

Enter an `identifier`, `radius`, `notifyOnExit`, `notifyOnEntry`.



