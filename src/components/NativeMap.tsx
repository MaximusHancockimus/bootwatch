import { forwardRef } from 'react';
import MapView, { Marker } from 'react-native-maps';
import { StyleSheet } from 'react-native';
import { Complex } from '../types/complex';
import { RISK_CONFIG } from '../utils/risk';
import { REXBURG_CENTER } from '../data/complexes';

interface Props {
  complexes: Complex[];
  onMarkerPress: (complex: Complex) => void;
}

const NativeMap = forwardRef<MapView, Props>(({ complexes, onMarkerPress }, ref) => (
  <MapView ref={ref} style={styles.map} initialRegion={REXBURG_CENTER} showsUserLocation>
    {complexes.map((complex) => (
      <Marker
        key={complex.id}
        coordinate={{ latitude: complex.latitude, longitude: complex.longitude }}
        title={complex.name}
        pinColor={RISK_CONFIG[complex.riskLevel].color}
        onPress={() => onMarkerPress(complex)}
      />
    ))}
  </MapView>
));

NativeMap.displayName = 'NativeMap';
export default NativeMap;

const styles = StyleSheet.create({
  map: { flex: 1 },
});
