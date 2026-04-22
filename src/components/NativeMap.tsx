import { forwardRef } from 'react';
import { StyleSheet, View } from 'react-native';
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

// Force Google Maps on both iOS and Android so coordinates + tile imagery are
// identical across platforms (Apple Maps on iOS drifts slightly from Google's).
const NativeMap = forwardRef<MapView, Props>(({ complexes, onMarkerPress, colorOverrides }, ref) => (
  <MapView
    ref={ref}
    provider={PROVIDER_GOOGLE}
    style={styles.map}
    initialRegion={REXBURG_CENTER}
    showsUserLocation
  >
    {complexes.map((complex) => {
      const color =
        colorOverrides?.get(complex.id) ?? getVisitorLimitMarkerColor(complex.visitorTimeLimitMinutes);
      return (
        <Marker
          key={complex.id}
          coordinate={{ latitude: complex.latitude, longitude: complex.longitude }}
          title={complex.name}
          onPress={() => onMarkerPress(complex)}
          anchor={{ x: 0.5, y: 0.5 }}
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
