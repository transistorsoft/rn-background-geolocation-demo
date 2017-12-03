import BackgroundGeolocation from "react-native-background-geolocation";

module.exports = async (event) => {
  console.log('[js] BackgroundGeolocationHeadlessService: ', event.name, event.params);
}