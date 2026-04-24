import { forwardRef } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { Complex } from '../types/complex';
import { getVisitorLimitMarkerColor } from '../utils/visitorLimitColors';
import { REXBURG_CENTER } from '../data/complexes';

interface Props {
  complexes: Complex[];
  onMarkerPress: (complex: Complex) => void;
  colorOverrides?: Map<string, string>;
}

function PinMarker({ color }: { color: string }) {
  return (
    <View style={styles.pinWrap} accessibilityLabel="Complex marker">
      <View style={[styles.pinOuter, { borderColor: color }]}>
        <View style={[styles.pinInner, { backgroundColor: color }]} />
      </View>
    </View>
  );
}

// Google Maps on Android (required; Android has no built-in map) and Apple Maps
// on iOS. iOS Google Maps support via react-native-maps is currently broken on
// RN 0.83 / New Architecture (missing react-native-google-maps podspec); Apple
// Maps gives a near-identical visual experience for marker-based displays.
const NativeMap = forwardRef<MapView, Props>(({ complexes, onMarkerPress, colorOverrides }, ref) => (
  <MapView
    ref={ref}
    provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
    style={styles.map}
    initialRegion={REXBURG_CENTER}
    showsUserLocation
  >
    {complexes.map((complex) => {
      const color =
        colorOverrides?.get(complex.id) ??
          getVisitorLimitMarkerColor(complex.visitorTimeLimitMinutes, complex.visitorLimitSignageKnown);
      return (
        <Marker
          key={`${complex.id}:${complex.latitude}:${complex.longitude}`}
          coordinate={{ latitude: complex.latitude, longitude: complex.longitude }}
          title={complex.name}
          onPress={() => onMarkerPress(complex)}
          anchor={{ x: 0.5, y: 0.5 }}
          tracksViewChanges={false}
        >
          <PinMarker color={color} />
        </Marker>
      );
    })}
  </MapView>
));

NativeMap.displayName = 'NativeMap';
export default NativeMap;

const styles = StyleSheet.create({
  map: { flex: 1 },
  pinWrap: {
    alignItems: 'center',
  },
  pinOuter: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 3,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.28,
    shadowRadius: 4,
    elevation: 5,
  },
  pinInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
});
