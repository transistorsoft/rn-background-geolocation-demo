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
  Platform,
  StyleSheet,
  View,
  Text,
  Image,
  ImageSource
} from 'react-native';

import * as MarkerImages from '../../images/markers';

import {
  Button,
  Icon
} from 'react-native-elements'

import {trigger as hapticFeedback} from "react-native-haptic-feedback";

import MapView, {Marker, Polyline, Circle, Polygon} from 'react-native-maps';
import { useActionSheet } from '@expo/react-native-action-sheet';

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
const GEOFENCE_STROKE_COLOR = "rgba(17,183,0,0.8)"
const GEOFENCE_FILL_COLOR   ="rgba(17,183,0, 0.2)"
const POLYGON_GEOFENCE_FILL_COLOR = "rgba(38, 118, 255, 0.3)";
const GEOFENCE_STROKE_COLOR_ACTIVATED = "rgba(127,127,127,0.5)";
const GEOFENCE_FILL_COLOR_ACTIVATED = "rgba(127,127,127, 0.2)";
const POLYGON_FILL_COLOR = "rgba(33,150,243, 0.4)";
const POLYGON_STROKE_COLOR = "rgba(33,150,243, 1.0)";


const TSMapView = (props) => {
  const { showActionSheetWithOptions } = useActionSheet();

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
  const [polygonGeofences, setPolygonGeofences] = React.useState<any[]>([]);
  const [geofenceEvent, setGeofenceEvent] = React.useState<GeofenceEvent>(null);
  const [geofencesChangeEvent, setGeofencesChangeEvent] = React.useState<GeofencesChangeEvent>(null);
  const [enabled, setEnabled] = React.useState(false);
  /// Creating a polygon geofence
  const [isCreatingPolygon, setIsCreatingPolygon] = React.useState(false);
  const [createPolygonGeofenceCoordinates, setCreatePolygonGeofenceCoordinates] = React.useState<any[]>([]);

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
    // Push our geofence event coordinate onto the Polyline -- BGGeo deosn't fire onLocation for geofence events.
    setCoordinates(previous => [...previous, {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude
    }]);

    const marker = geofences.find((m:any) => {
      return m.identifier === geofenceEvent.identifier;
    });

    if (!marker) { return; }

    //marker.fillColor = GEOFENCE_STROKE_COLOR_ACTIVATED;
    //marker.strokeColor = GEOFENCE_STROKE_COLOR_ACTIVATED;

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
      heading: location.coords.heading,
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
    let polygonsOn = polygonGeofences.filter((geofence:Geofence) => {
      return (off.indexOf(geofence.identifier) < 0);
    });

    // Add new "on" geofences.
    on.forEach((geofence:Geofence) => {
      const circularGeofenceMarker = geofencesOn.find((m:Geofence) => { return m.identifier === geofence.identifier;});
      if (!circularGeofenceMarker) {
        geofencesOn.push(createGeofenceMarker(geofence));        
      }
      if (geofence.vertices.length > 0) {
        const polygonGeofenceMarker = polygonsOn.find((m:Geofence) => { 
          return m.identifier === geofence.identifier; 
        });
        if (!polygonGeofenceMarker) {
          polygonsOn.push(createPolygonGeofenceMarker(geofence));
        }
      }
    });
    setGeofences(geofencesOn);
    setPolygonGeofences(polygonsOn);    
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
  /// <Image source={MarkerImages.locationArrowBlue} style={[styles.markerIcon, {transform: [{rotate: `${heading}deg`}]}]}/>
  const renderLocationMarkers = () => {
    let rs:any = [];
    markers.map((marker:any) => {
      const heading = (marker.heading >= 0) ? Math.round(marker.heading) : 0;      
      rs.push((
        <Marker
          key={marker.key}
          flat={true}
          zIndex={10}
          image={(Platform.OS === 'android') ? MarkerImages.locationArrowBlue : undefined}
          rotation={heading}
          tracksViewChanges={tracksViewChanges}
          coordinate={marker.coordinate}
          anchor={{x:0.5, y:0.5}}
          title={marker.title}>
          {Platform.OS === 'ios' ? <Image source={MarkerImages.locationArrowBlue} style={{transform: [{rotate: `${heading}deg`}] }}/> : null}
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
        //tracksViewChanges={tracksViewChanges}
        coordinate={stopZone.coordinate}
        anchor={{x:0.5, y:0.5}}>
        <View style={[styles.stopZoneMarker]}></View>
      </Marker>
    ));
  }

  /// Render the list of current active geofences that BackgroundGeolocation is monitoring.
  const renderActiveGeofences = () => {
    return geofences.map((geofence:any) => {
      return (
        <Circle
          zIndex={1}
          key={geofence.identifier}
          identifier={geofence.identifier}
          radius={geofence.radius}
          center={geofence.center}
          strokeWidth={1}
          strokeColor={GEOFENCE_STROKE_COLOR}          
          fillColor={GEOFENCE_FILL_COLOR}
          onPress={onPressGeofence}
        />
      )
    });
  }

  const renderActivePolygonGeofences = () => {
    return polygonGeofences.map((polygon) => {      
      const key = "polygon-" + polygon.identifier;
      return (<Polygon
        key={key}
        zIndex={2}
        identifier={polygon.identifier}
        coordinates={polygon.coordinates}
        strokeWidth={2}
        lineDashPhase={0}
        lineDashPattern={[2]}
        strokeColor={POLYGON_STROKE_COLOR}
        fillColor={POLYGON_FILL_COLOR}
        tappable={true}
        onPress={() => { console.log('[Geofence ', polygon.identifier, '] onPress -- NO IMPLEMENTATION')}}
        geodesic={true}
      />);
    });    
  }

  /// Render the list of geofences which have fired.
  const renderGeofencesHit = () => {
    let rs = [];
    return geofencesHit.map((hit:any) => {
      return (
        <Circle
          key={"hit:" + hit.identifier}
          zIndex={100}
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
      let color, edgeMarkerImage, locationMarkerImage;
      const heading = (event.heading >= 0) ? Math.round(event.heading) : 0;
      switch(event.action) {
        case 'ENTER':
          color = COLORS.green;
          edgeMarkerImage = MarkerImages.geofenceEventEdgeCircleEnter;
          locationMarkerImage = MarkerImages.locationArrowGreen;
          break;
        case 'EXIT':
          color = COLORS.geofence_red;
          edgeMarkerImage = MarkerImages.geofenceEventEdgeCircleExit;
          locationMarkerImage = MarkerImages.locationArrowRed;
          break;
        case 'DWELL':
          color = COLORS.gold;
          edgeMarkerImage = MarkerImages.geofenceEventEdgeCircleDwell;
          locationMarkerImage = MarkerImages.locationArrowAmber;
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
            strokeWidth={2}
            zIndex={99}
            lineCap="square" />
          <Marker
            key="edge_marker"
            zIndex={100}
            coordinate={event.coordinates[0]}
            image={(Platform.OS === 'ios') ? null : edgeMarkerImage}
            anchor={{x:0.5, y:0.5}}>
              {Platform.OS === 'ios' ? <Image source={edgeMarkerImage} /> : null}
          </Marker>
          <Marker
            key="location_marker"
            coordinate={event.coordinates[1]}
            zIndex={100}
            image={(Platform.OS === 'ios') ? null : locationMarkerImage}
            rotation={heading}
            flat={true}
            anchor={{x:0.5, y:0.5}}>
              {Platform.OS === 'ios' ? <Image source={locationMarkerImage} style={{transform: [{rotate: `${heading}deg`}] }}/> : null}
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
    let iconIndex = (location.coords.heading >= 0) ? Math.round(location.coords.heading / 10) : 0;
    if (iconIndex > 36) iconIndex = 0;
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
      vertices: geofence.vertices      
    }
  }

  const createPolygonGeofenceMarker = (geofence:Geofence) => {
    return {      
      identifier: geofence.identifier,
      coordinates: geofence.vertices.map((vertex) => {
        return {
          latitude: vertex[0],
          longitude: vertex[1]
        }
      })      
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
    hapticFeedback("impactHeavy", {});
    const options = ['Circular', 'Polygon', 'Cancel'];
    
    const cancelButtonIndex = 2;

    showActionSheetWithOptions({
      options,
      cancelButtonIndex,
    }, (selectedIndex: number) => {
      settingsService.playSound('TEST_MODE_CLICK');
      hapticFeedback("impactHeavy", {});
      switch (selectedIndex) {
        case 0:          
          navigation.navigate('Geofence', {coordinate:coordinate});
          break;
        case 1:
          setIsCreatingPolygon(true);
          break;        
        case cancelButtonIndex:
          setIsCreatingPolygon(false);
          break;          
      }});

    //
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
    setPolygonGeofences([]);
    setGeofencesHit([]);
    setGeofenceHitEvents([]);
    setStationaryRadius(0);
    setGeofenceEvent(null);
  }

  const renderCreatePolygonGeofenceMenu = () => {
    return (isCreatingPolygon) ? (<View style={styles.polygonGeofenceMenu}>
      <View style={styles.polygonGeofenceMenuRow}>
        <View style={{justifyContent:'center'}}>
          <Button title={"Cancel"} type="clear" onPress={() => {
            hapticFeedback("impactHeavy", {});
            setIsCreatingPolygon(false);
            setCreatePolygonGeofenceCoordinates([]);
          }}/>
        </View>
        <View style={{justifyContent:'center', flex: 1}}><Text>&nbsp;</Text></View>
        <View style={{justifyContent:'center'}}>
          <Button title={"Next"} type="clear" onPress={(e) => {
            const vertices = createPolygonGeofenceCoordinates.map((coordinate) => {
              return [coordinate.latitude, coordinate.longitude];
            });
            hapticFeedback("impactHeavy", {});
            setIsCreatingPolygon(false);
            setCreatePolygonGeofenceCoordinates([]);            
            navigation.navigate('Geofence', {vertices: vertices});
          }}/>
        </View>
      </View>
      <View style={styles.polygonGeofenceMenuRow}>
        <View style={{justifyContent:'center'}}>
          <Button type="clear" icon={<Icon name='arrow-undo-outline' type='ionicon' />} onPress={(event) => {
            hapticFeedback("impactHeavy", {});
            setCreatePolygonGeofenceCoordinates((previous) => (previous.slice(0, -1)));
            return false;
          }} />
        </View>
        <View style={{justifyContent:'center', flex: 1, paddingLeft: 55}}>
          <Text style={{color: COLORS.black}}>Click map to add polygon points</Text>
        </View>
      </View>
    </View>) : null
  }

  const renderCreatePolygonGeofenceVertices = () => {
    var index = 0;
    return createPolygonGeofenceCoordinates.map((coordinate:any) => {    
      return (<Marker
        key={"polygon-vertex-" + Math.random()}
        flat={true}
        title={"" + ++index}
        anchor={{x:0.5, y:0.5}}
        coordinate={coordinate}>
        <View style={styles.polygonGeofenceCursorVertex}>
          <Text style={{color: COLORS.white, fontSize: 12}}>{index}</Text>
        </View>          
      </Marker>);
    });
  }

  const renderCreatePolygonGeofence = () => {
    return (createPolygonGeofenceCoordinates.length > 0) ? (
      <Polygon 
        coordinates={createPolygonGeofenceCoordinates}
        strokeWidth={2}        
        zIndex={1}
        lineDashPattern={[2]}
        strokeColor={POLYGON_STROKE_COLOR}
        fillColor={POLYGON_FILL_COLOR}
        geodesic={true}
      />
    ) : (null);
  }

  const onMapClick = (params) => {        
    const coordinate = params.nativeEvent.coordinate;    
    if (isCreatingPolygon) {
      settingsService.playSound('TEST_MODE_CLICK');
      hapticFeedback("impactHeavy", {});
      setCreatePolygonGeofenceCoordinates(previous => [...previous, {
        latitude: coordinate.latitude,
        longitude: coordinate.longitude
      }]);
    }
  }

  const longPressOnMapPrompt = () => {
    if (!isCreatingPolygon) {      
      return (<View style={styles.longPressMapPrompt}><Text style={styles.longPressMapPromptText}>Long-press map to add geofences</Text></View>);
    } else {      
      return (<View />);
    }
  }

  return (
    <View style={{flexDirection: 'column', flex: 1}}>
      {renderCreatePolygonGeofenceMenu()}
      {longPressOnMapPrompt()}
      <MapView
        showsUserLocation={showsUserLocation}
        rotateEnabled={Platform.os === 'android'}
        region={mapCenter}
        followsUserLocation={false}
        onLongPress={onLongPress}
        onPress={onMapClick}
        onPanDrag={onMapPanDrag}
        scrollEnabled={mapScrollEnabled}
        showsCompass={false}
        showsMyLocationButton={false}
        showsPointsOfInterest={false}
        showsScale={false}
        showsTraffic={false}
        style={styles.map}
        userInterfaceStyle={"light"}
        toolbarEnabled={false}>        
        {renderCreatePolygonGeofence()}
        {renderCreatePolygonGeofenceVertices()}      
        <Circle
          key={"stationary-location:" + stationaryLocation.timestamp}
          zIndex={3}
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
          strokeColor={'rgba(0,179,253, 0.6)'}
          strokeWidth={10}
          zIndex={9}
        />
        {renderLocationMarkers()}
        {renderStopZoneMarkers()}
        {renderActiveGeofences()}
        {renderActivePolygonGeofences()}        
        {renderGeofencesHitEvents()}        
      </MapView>
    </View>
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
    width: 16,
    height: 16
  },
  polygonGeofenceMenu: {
    flexDirection: 'column',
    backgroundColor: '#fff1a5',
    borderBottomWidth: 1,
    borderTopWidth: 0,
    borderTopColor: COLORS.black,
    borderBottomColor: '#aaa'
  },
  polygonGeofenceCursorVertex: {
    width: 24, 
    height: 24, 
    borderRadius: 12, 
    backgroundColor: '#000000', 
    flexDirection: 'column', 
    display: 'flex', 
    alignItems: 'center', 
    justifyContent: 'center'
  },
  polygonGeofenceMenuRow: {
    height: 50, 
    flexDirection: 'row', 
    paddingLeft:5, 
    paddingRight:5
  },  
  longPressMapPrompt: {
    backgroundColor: '#fff1a5',    
    color: COLORS.black,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
    opacity: 0.8,
    width: '100%',
    textAlign: 'center',
    
  },
  longPressMapPromptText: {
    color: COLORS.black,
    color: '#000',
    textAlign: 'center'
  }
});

