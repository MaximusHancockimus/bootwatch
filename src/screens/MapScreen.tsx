import { useCallback, useMemo, useRef, useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { complexes, REXBURG_CENTER } from '../data/complexes';
import { Complex } from '../types/complex';
import { RISK_CONFIG } from '../utils/risk';
import ComplexDetailSheet from '../components/ComplexDetailSheet';
import RiskBadge from '../components/RiskBadge';
import { colors, fontSize, fontWeight, spacing, borderRadius } from '../theme';

let NativeMap: any = null;
if (Platform.OS !== 'web') {
  NativeMap = require('../components/NativeMap').default;
}

export default function MapScreen() {
  const [search, setSearch] = useState('');
  const [selectedComplex, setSelectedComplex] = useState<Complex | null>(null);
  const [sheetVisible, setSheetVisible] = useState(false);
  const mapRef = useRef<any>(null);
  const navigation = useNavigation<any>();

  const filtered = useMemo(
    () => complexes.filter((c) => c.name.toLowerCase().includes(search.toLowerCase())),
    [search],
  );

  const handleMarkerPress = useCallback((complex: Complex) => {
    setSelectedComplex(complex);
    setSheetVisible(true);
  }, []);

  const handleParkHere = useCallback(
    (complex: Complex) => {
      setSheetVisible(false);
      navigation.navigate('Timer', { complexId: complex.id });
    },
    [navigation],
  );

  const handleSearchSubmit = useCallback(() => {
    if (filtered.length === 1 && mapRef.current?.animateToRegion) {
      const c = filtered[0];
      mapRef.current.animateToRegion({
        latitude: c.latitude,
        longitude: c.longitude,
        latitudeDelta: 0.008,
        longitudeDelta: 0.008,
      });
    }
  }, [filtered]);

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={18} color={colors.textSecondary} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search complexes..."
          placeholderTextColor={colors.textSecondary}
          value={search}
          onChangeText={setSearch}
          onSubmitEditing={handleSearchSubmit}
          returnKeyType="search"
        />
        {search.length > 0 && (
          <Ionicons name="close-circle" size={18} color={colors.textSecondary} onPress={() => setSearch('')} />
        )}
      </View>

      {Platform.OS !== 'web' && NativeMap ? (
        <NativeMap ref={mapRef} complexes={filtered} onMarkerPress={handleMarkerPress} />
      ) : (
        <ComplexList complexes={filtered} onPress={handleMarkerPress} />
      )}

      <ComplexDetailSheet
        complex={selectedComplex}
        visible={sheetVisible}
        onClose={() => setSheetVisible(false)}
        onParkHere={handleParkHere}
      />
    </View>
  );
}

function ComplexList({ complexes, onPress }: { complexes: Complex[]; onPress: (c: Complex) => void }) {
  return (
    <ScrollView style={styles.listContainer} contentContainerStyle={styles.listContent}>
      {complexes.map((c) => (
        <Pressable key={c.id} style={styles.card} onPress={() => onPress(c)}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardName}>{c.name}</Text>
            <RiskBadge level={c.riskLevel} />
          </View>
          <Text style={styles.cardAddress}>{c.address}</Text>
          <View style={styles.cardMeta}>
            <View style={styles.cardMetaItem}>
              <Ionicons name="time-outline" size={14} color={colors.textSecondary} />
              <Text style={styles.cardMetaText}>
                {c.visitorTimeLimitMinutes ? `${c.visitorTimeLimitMinutes} min` : 'Unknown'}
              </Text>
            </View>
            {c.bootingCompany && (
              <View style={styles.cardMetaItem}>
                <Ionicons name="car-outline" size={14} color={colors.textSecondary} />
                <Text style={styles.cardMetaText}>{c.bootingCompany}</Text>
              </View>
            )}
          </View>
        </Pressable>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    margin: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: fontSize.md,
    color: colors.text,
    paddingVertical: 0,
  },
  listContainer: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.lg,
    gap: spacing.sm,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  cardName: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.text,
    flex: 1,
    marginRight: spacing.sm,
  },
  cardAddress: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  cardMeta: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  cardMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  cardMetaText: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
  },
});
