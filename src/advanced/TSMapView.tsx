/////
/// TSMapView Component
/// Renders a MapView from react-native-maps.
/// - renders a marker for each recorded location
/// - renders currently monitored geofences
/// - renders markers showing geofence events (enter, exit, dwell)
/// - renders a PolyLine where the plugin has tracked the device.
///
import React from 'react';
import {
  StyleSheet,
  View
} from 'react-native';

import MapView, {Marker, Polyline, Circle} from 'react-native-maps';

import BackgroundGeolocation, {
  State,
  Location,
  MotionChangeEvent,
  Geofence,
  GeofencesChangeEvent,
  GeofenceEvent
} from "../react-native-background-geolocation";

import SettingsService from "./lib/SettingsService";
import ENV from "../ENV";
import {COLORS, SOUNDS} from './lib/config';

import {
  toRad,
  toDeg,
  getBearing,
  computeOffsetCoordinate
} from "./lib/GeoMath"

/// A default empty location object for the MapView.
const UNDEFINED_LOCATION = {
  timestamp: '',
  latitude:0,
  longitude:0
}

/// Zoom values for the MapView
const LATITUDE_DELTA = 0.00922;
const LONGITUDE_DELTA = 0.00421;

/// Color consts for MapView markers.
const STATIONARY_REGION_FILL_COLOR = "rgba(200,0,0,0.2)"
const STATIONARY_REGION_STROKE_COLOR = "rgba(200,0,0,0.2)"
const GEOFENCE_STROKE_COLOR = "rgba(17,183,0,0.5)"
const GEOFENCE_FILL_COLOR   ="rgba(17,183,0,0.2)"
const GEOFENCE_STROKE_COLOR_ACTIVATED = "rgba(127,127,127,0.5)";
const GEOFENCE_FILL_COLOR_ACTIVATED = "rgba(127,127,127, 0.2)";
const POLYLINE_STROKE_COLOR = "rgba(32,64,255,0.6)";

const TSMapView = (props) => {
  const navigation = props.navigation;

  /// MapView State.
  const [markers, setMarkers] = React.useState<any[]>([]);
  const [showsUserLocation, setShowsUserLocation] = React.useState(false);
  const [tracksViewChanges, setTracksViewChanges] = React.useState(false);
  const [followsUserLocation, setFollowUserLocation] = React.useState(false);
  const [mapScrollEnabled, setMapScrollEnabled] = React.useState(false);
  const [stationaryLocation, setStationaryLocation] = React.useState(UNDEFINED_LOCATION);
  const [mapCenter, setMapCenter] = React.useState({
    latitude: 45.518853,
    longitude: -73.60055,
    latitudeDelta: LATITUDE_DELTA,
    longitudeDelta: LONGITUDE_DELTA
  });
  const [stationaryRadius, setStationaryRadius] = React.useState(200);
  const [geofencesHit, setGeofencesHit] = React.useState<any[]>([]);
  const [geofencesHitEvents, setGeofenceHitEvents] = React.useState<any[]>([]);
  const [coordinates, setCoordinates] = React.useState<any[]>([]);
  const [stopZones, setStopZones] = React.useState<any[]>([]);

  /// BackgroundGeolocation Events.
  const [location, setLocation] = React.useState<Location>(null);
  const [motionChangeEvent, setMotionChangeEvent] = React.useState<MotionChangeEvent>(null);
  const [lastMotionChangeEvent, setLastMotionChangeEvent] = React.useState<MotionChangeEvent>(null);
  const [geofences, setGeofences] = React.useState<any[]>([]);
  const [geofenceEvent, setGeofenceEvent] = React.useState<GeofenceEvent>(null);
  const [geofencesChangeEvent, setGeofencesChangeEvent] = React.useState<GeofencesChangeEvent>(null);
  const [enabled, setEnabled] = React.useState(false);

  /// Handy Util class.
  const settingsService = SettingsService.getInstance();

  /// Collection of BackgroundGeolocation event-subscriptions.
  const subscriptions:any[] = [];

  /// [Helper] Add a BackgroundGeolocation event subscription to collection
  const subscribe = (subscription:any) => {
    subscriptions.push(subscription);
  }
  /// [Helper] Iterate BackgroundGeolocation subscriptions and .remove() each.
  const unsubscribe = () => {
    subscriptions.forEach((subscription:any) => subscription.remove());
    subscriptions.splice(0, subscriptions.length);
  }

  /// Register BackgroundGeolocation event-listeners.
  React.useEffect(() => {

    BackgroundGeolocation.getState().then((state:State) => {
      setEnabled(state.enabled);
    });

    // All BackgroundGeolocation event-listeners use React.useState setters.
    subscribe(BackgroundGeolocation.onLocation(setLocation, (error) => {
      console.warn('[onLocation] ERROR: ', error);
    }));
    subscribe(BackgroundGeolocation.onMotionChange(setMotionChangeEvent));
    subscribe(BackgroundGeolocation.onGeofence(setGeofenceEvent));
    subscribe(BackgroundGeolocation.onGeofencesChange(setGeofencesChangeEvent));
    subscribe(BackgroundGeolocation.onEnabledChange(setEnabled));

    return () => {
      // Important for with live-reload to remove BackgroundGeolocation event subscriptions.
      unsubscribe();
      clearMarkers();
    }
  }, []);

  /// onEnabledChange effect.
  ///
  React.useEffect(() => {
    onEnabledChange();
  }, [enabled]);

  /// onLocation effect.
  ///
  React.useEffect(() => {
    if (!location) return;
    onLocation();
  }, [location]);

  /// onMotionChange effect
  ///
  React.useEffect(() => {
    if (!motionChangeEvent) return;
    onMotionChange();
  }, [motionChangeEvent]);

  /// onGeofence effect.
  ///
  React.useEffect(() => {
    if (!geofenceEvent) return;
    onGeofence();
  }, [geofenceEvent]);

  /// onGeofencesChange effect
  ///
  React.useEffect(() => {
    if (!geofencesChangeEvent) return;
    onGeofencesChange();
  }, [geofencesChangeEvent]);

  /// onLocation effect-handler
  /// Adds a location Marker to MapView
  ///
  const onLocation = () => {
    console.log('[location] - ', location);
    if (!location.sample) {
      addMarker(location);
    }
    setCenter(location);
  }

  /// GeofenceEvent effect-handler
  /// Renders geofence event markers to MapView.
  ///
  const onGeofence = () => {
    const location:Location = geofenceEvent.location;
    const marker = geofences.find((m:any) => {
      return m.identifier === geofenceEvent.identifier;
    });

    if (!marker) { return; }

    marker.fillColor = GEOFENCE_STROKE_COLOR_ACTIVATED;
    marker.strokeColor = GEOFENCE_STROKE_COLOR_ACTIVATED;

    const coords = location.coords;

    let hit = geofencesHit.find((hit:any) => {
      return hit.identifier === geofenceEvent.identifier;
    });

    if (!hit) {
      hit = {
        identifier: geofenceEvent.identifier,
        radius: marker.radius,
        center: {
          latitude: marker.center.latitude,
          longitude: marker.center.longitude
        },
        events: []
      };
      setGeofencesHit(previous => [...previous, hit]);
    }
    // Get bearing of location relative to geofence center.
    const bearing = getBearing(marker.center, location.coords);
    const edgeCoordinate = computeOffsetCoordinate(marker.center, marker.radius, bearing);
    const record = {
      coordinates: [
        edgeCoordinate,
        {latitude: coords.latitude, longitude: coords.longitude},
      ],
      action: geofenceEvent.action,
      key: geofenceEvent.identifier + ":" + geofenceEvent.action + ":" + location.timestamp
    };
    setGeofenceHitEvents(previous => [...previous, record]);
  }

  /// GeofencesChangeEvent effect-handler
  /// Renders/removes geofence markers to/from MapView
  ///
  const onGeofencesChange = () => {
    let on  = geofencesChangeEvent.on;
    let off = geofencesChangeEvent.off;

    // Filter out all "off" geofences.
    let geofencesOn = geofences.filter((geofence:Geofence) => {
      return off.indexOf(geofence.identifier) < 0;
    });

    console.log('[geofenceschange] - ', geofencesChangeEvent);

    // Add new "on" geofences.
    on.forEach((geofence:Geofence) => {
      let marker = geofencesOn.find((m:Geofence) => { return m.identifier === geofence.identifier;});
      if (marker) { return; }
      geofencesOn.push(createGeofenceMarker(geofence));
    });

    setGeofences(geofencesOn);
  }

  /// EnabledChange effect-handler.
  /// Removes all MapView Markers when plugin is disabled.
  ///
  const onEnabledChange = () => {
    console.log('[onEnabledChange]', enabled);
    setShowsUserLocation(enabled);
    if (!enabled) {
      clearMarkers();
    }
  }

  /// onMotionChangeEvent effect-handler.
  /// show/hide the red stationary-geofence according isMoving
  ///
  const onMotionChange = async () => {
    console.log('[onMotionChange] - ', motionChangeEvent.isMoving, motionChangeEvent.location);
    let location = motionChangeEvent.location;

    let state:any = {
      isMoving: motionChangeEvent.isMoving
    };
    if (motionChangeEvent.isMoving) {
      if (lastMotionChangeEvent) {
        setStopZones(previous => [...previous, {
          coordinate: {
            latitude: lastMotionChangeEvent.location.coords.latitude,
            longitude: lastMotionChangeEvent.location.coords.longitude
          },
          key: lastMotionChangeEvent.location.timestamp
        }]);
      }
      setStationaryRadius(0);
      setStationaryLocation(UNDEFINED_LOCATION);
    } else {
      let state = await BackgroundGeolocation.getState();
      let geofenceProximityRadius = state.geofenceProximityRadius || 1000;
      setStationaryRadius((state.trackingMode == 1) ? 200 : (geofenceProximityRadius/2));
      setStationaryLocation({
        timestamp: location.timestamp,
        latitude: location.coords.latitude,
        longitude: location.coords.longitude
      });
    }
    setLastMotionChangeEvent(motionChangeEvent);
  }

  /// MapView Location marker-renderer.
  const renderMarkers = () => {
    let rs:any = [];
    markers.map((marker:any) => {
      rs.push((
        <Marker
          key={marker.key}
          tracksViewChanges={tracksViewChanges}
          coordinate={marker.coordinate}
          anchor={{x:0, y:0.1}}
          title={marker.title}>
          <View style={[styles.markerIcon]}></View>
        </Marker>
      ));
    });
    return rs;
  }

  /// Render stop-zone markers -- small red circles where the plugin previously entered
  /// the stationary state.
  const renderStopZoneMarkers = () => {
    return stopZones.map((stopZone:any) => (
      <Marker
        key={stopZone.key}
        tracksViewChanges={tracksViewChanges}
        coordinate={stopZone.coordinate}
        anchor={{x:0, y:0}}>
        <View style={[styles.stopZoneMarker]}></View>
      </Marker>
    ));
  }

  /// Render the list of current active geofences that BackgroundGeolocation is monitoring.
  const renderActiveGeofences = () => {
    return geofences.map((geofence:any) => {
      return (
        <Circle
          key={geofence.identifier}
          radius={geofence.radius}
          center={geofence.center}
          strokeWidth={1}
          strokeColor={geofence.strokeColor}
          fillColor={geofence.fillColor}
          onPress={onPressGeofence}
        />
      )
    });
  }

  /// Render the list of geofences which have fired.
  const renderGeofencesHit = () => {
    let rs = [];
    return geofencesHit.map((hit:any) => {
      return (
        <Circle
          key={"hit:" + hit.identifier}
          radius={hit.radius+1}
          center={hit.center}
          strokeWidth={1}
          strokeColor={COLORS.black}>
        </Circle>
      );
    });
  }

  /// Render the series of markers showing where a geofence hit event occurred.
  const renderGeofencesHitEvents = () => {
    return geofencesHitEvents.map((event:any) => {
      let isEnter = (event.action === 'ENTER');
      let color = undefined;
      switch(event.action) {
        case 'ENTER':
          color = COLORS.green;
          break;
        case 'EXIT':
          color = COLORS.red;
          break;
        case 'DWELL':
          color = COLORS.gold;
          break;
      }
      let markerStyle = {
        backgroundColor: color
      };
      return (
        <View key={event.key}>
          <Polyline
            key="polyline"
            coordinates={event.coordinates}
            geodesic={true}
            strokeColor={COLORS.black}
            strokeWidth={1}
            zIndex={1}
            lineCap="square" />
          <Marker
            key="edge_marker"
            coordinate={event.coordinates[0]}
            anchor={{x:0, y:0.1}}>
            <View style={[styles.geofenceHitMarker, markerStyle]}></View>
          </Marker>
          <Marker
            key="location_marker"
            coordinate={event.coordinates[1]}
            anchor={{x:0, y:0.1}}>
            <View style={styles.markerIcon}></View>
          </Marker>
        </View>
      );
    });
  }

  /// Center the map.
  const setCenter = (location:Location) => {
    setMapCenter({
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      latitudeDelta: LATITUDE_DELTA,
      longitudeDelta: LONGITUDE_DELTA
    });
  }

  /// Add a location Marker to map.
  const addMarker = (location:Location) => {
    const timestamp = new Date();
    const marker = {
      key: `${location.uuid}:${timestamp.getTime()}`,
      title: location.timestamp,
      heading: location.coords.heading,
      coordinate: {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude
      }
    };

    setMarkers(previous => [...previous, marker]);
    setCoordinates(previous => [...previous, {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude
    }]);
  }

  /// Returns a geofence marker for MapView
  const createGeofenceMarker = (geofence:Geofence) => {
    return {
      radius: geofence.radius,
      center: {
        latitude: geofence.latitude,
        longitude: geofence.longitude
      },
      identifier: geofence.identifier,
      strokeColor:GEOFENCE_STROKE_COLOR,
      fillColor: GEOFENCE_FILL_COLOR
    }
  }

  /// Map pan/drag handler.
  const onMapPanDrag = () => {
    setFollowUserLocation(false);
    setMapScrollEnabled(true);
  }

  /// Map long-press handler for adding a geofence.
  const onLongPress = (params:any) => {
    const coordinate = params.nativeEvent.coordinate;
    settingsService.playSound('LONG_PRESS_ACTIVATE');
    navigation.navigate('Geofence', {coordinate:coordinate});
  }

  /// Geofence press-handler.
  const onPressGeofence = () => {
    console.log('[onPressGeofence] NO IMPLEMENTATION');
  }

  /// Clear all markers from the map when plugin is toggled off.
  const clearMarkers = () => {
    setCoordinates([]);
    setMarkers([]);
    setStopZones([]);
    setGeofences([]);
    setGeofencesHit([]);
    setGeofenceHitEvents([]);
    setStationaryRadius(0);
    setGeofenceEvent(null);
  }

  return (
    <MapView
      showsUserLocation={showsUserLocation}
      region={mapCenter}
      followsUserLocation={false}
      onLongPress={onLongPress}
      onPanDrag={onMapPanDrag}
      scrollEnabled={mapScrollEnabled}
      showsMyLocationButton={false}
      showsPointsOfInterest={false}
      showsScale={false}
      showsTraffic={false}
      style={styles.map}
      toolbarEnabled={false}>
      <Circle
        key={"stationary-location:" + stationaryLocation.timestamp}
        radius={stationaryRadius}
        fillColor={STATIONARY_REGION_FILL_COLOR}
        strokeColor={STATIONARY_REGION_STROKE_COLOR}
        strokeWidth={1}
        center={{
          latitude: stationaryLocation.latitude,
          longitude: stationaryLocation.longitude
        }}
      />
      <Polyline
        key="polyline"
        coordinates={coordinates}
        geodesic={true}
        strokeColor='rgba(0,179,253, 0.6)'
        strokeWidth={6}
        zIndex={0}
      />
      {renderMarkers()}
      {renderStopZoneMarkers()}
      {renderActiveGeofences()}
      {renderGeofencesHit()}
      {renderGeofencesHitEvents()}
    </MapView>
  )
}

export default TSMapView;

var styles = StyleSheet.create({
  container: {
    backgroundColor: '#272727'
  },
  map: {
    flex: 1
  },
  stopZoneMarker: {
    borderWidth:1,
    borderColor: 'red',
    backgroundColor: COLORS.red,
    opacity: 0.2,
    borderRadius: 15,
    zIndex: 0,
    width: 30,
    height: 30
  },
  geofenceHitMarker: {
    borderWidth: 1,
    borderColor:'black',
    borderRadius: 6,
    zIndex: 10,
    width: 12,
    height:12
  },
  markerIcon: {
    borderWidth:1,
    borderColor:'#000000',
    backgroundColor: COLORS.polyline_color,
    //backgroundColor: 'rgba(0,179,253, 0.6)',
    width: 10,
    height: 10,
    borderRadius: 5
  }
});

