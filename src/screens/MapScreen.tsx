import { useCallback, useMemo, useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { complexes } from '../data/complexes';
import { Complex } from '../types/complex';
import { useSightings } from '../hooks/useSightings';
import { useSavedComplexes } from '../hooks/useSavedComplexes';
import ComplexDetailSheet from '../components/ComplexDetailSheet';
import RiskBadge from '../components/RiskBadge';
import { colors, fontSize, fontWeight, spacing, borderRadius } from '../theme';

let NativeMap: any = null;
let WebMap: any = null;
if (Platform.OS === 'web') {
  WebMap = require('../components/WebMap').default;
} else {
  NativeMap = require('../components/NativeMap').default;
}

export default function MapScreen() {
  const [search, setSearch] = useState('');
  const [selectedComplex, setSelectedComplex] = useState<Complex | null>(null);
  const [sheetVisible, setSheetVisible] = useState(false);
  const [panelExpanded, setPanelExpanded] = useState(false);
  const navigation = useNavigation<any>();
  const { getLatestSighting } = useSightings();
  const { isSaved, toggle: toggleSave } = useSavedComplexes();

  const filtered = useMemo(
    () => complexes.filter((c) => c.name.toLowerCase().includes(search.toLowerCase())),
    [search],
  );

  const handleMarkerPress = useCallback((complex: Complex) => {
    setSelectedComplex(complex);
    setSheetVisible(true);
    setPanelExpanded(false);
  }, []);

  const handleParkHere = useCallback(
    (complex: Complex) => {
      setSheetVisible(false);
      navigation.navigate('Timer', { complexId: complex.id });
    },
    [navigation],
  );

  return (
    <View style={styles.container}>
      {/* Map fills the screen */}
      <View style={styles.mapWrapper}>
        {Platform.OS === 'web' && WebMap ? (
          <WebMap complexes={filtered} onMarkerPress={handleMarkerPress} />
        ) : NativeMap ? (
          <NativeMap complexes={filtered} onMarkerPress={handleMarkerPress} />
        ) : null}
      </View>

      {/* Search bar floating over map */}
      <View style={styles.searchOverlay}>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={18} color={colors.textSecondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search complexes..."
            placeholderTextColor={colors.textSecondary}
            value={search}
            onChangeText={(text) => { setSearch(text); if (text) setPanelExpanded(true); }}
            returnKeyType="search"
          />
          {search.length > 0 && (
            <Ionicons name="close-circle" size={18} color={colors.textSecondary} onPress={() => setSearch('')} />
          )}
        </View>
      </View>

      {/* Collapsible bottom panel */}
      <View style={[styles.panel, panelExpanded && styles.panelExpanded]}>
        <Pressable style={styles.panelHandle} onPress={() => setPanelExpanded(!panelExpanded)}>
          <View style={styles.handleBar} />
          <View style={styles.panelHeaderRow}>
            <Text style={styles.panelTitle}>
              {filtered.length} Complex{filtered.length !== 1 ? 'es' : ''}
            </Text>
            <Ionicons
              name={panelExpanded ? 'chevron-down' : 'chevron-up'}
              size={20}
              color={colors.textSecondary}
            />
          </View>
        </Pressable>

        {panelExpanded && (
          <ScrollView style={styles.panelList} contentContainerStyle={styles.panelListContent}>
            {filtered.map((c) => (
              <Pressable key={c.id} style={styles.card} onPress={() => handleMarkerPress(c)}>
                <View style={styles.cardHeader}>
                  <Text style={styles.cardName}>{c.name}</Text>
                  <RiskBadge level={c.riskLevel} />
                </View>
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
        )}
      </View>

      <ComplexDetailSheet
        complex={selectedComplex}
        visible={sheetVisible}
        onClose={() => setSheetVisible(false)}
        onParkHere={handleParkHere}
        lastSightingAt={
          selectedComplex
            ? (() => {
                const s = getLatestSighting(selectedComplex.id);
                return s ? new Date(s.created_at) : null;
              })()
            : null
        }
        isSaved={selectedComplex ? isSaved(selectedComplex.id) : false}
        onToggleSave={(c) => toggleSave(c.id)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  mapWrapper: {
    flex: 1,
  },

  // Search overlay
  searchOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    padding: spacing.md,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  searchInput: {
    flex: 1,
    fontSize: fontSize.md,
    color: colors.text,
    paddingVertical: 0,
  },

  // Bottom panel
  panel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    backgroundColor: colors.background,
    borderTopLeftRadius: borderRadius.lg,
    borderTopRightRadius: borderRadius.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
    maxHeight: 80,
  },
  panelExpanded: {
    maxHeight: '55%',
  },
  panelHandle: {
    alignItems: 'center',
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  handleBar: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    marginBottom: spacing.sm,
  },
  panelHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  panelTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.text,
  },
  panelList: {
    flex: 1,
  },
  panelListContent: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.lg,
    gap: spacing.sm,
  },

  // Complex cards
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
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.text,
    flex: 1,
    marginRight: spacing.sm,
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
