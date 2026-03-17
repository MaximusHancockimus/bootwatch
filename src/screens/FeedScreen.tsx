import { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, Image, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSightings } from '../hooks/useSightings';
import { Sighting } from '../types/sighting';
import { timeAgo, isWithinHours } from '../utils/time';
import ReportSightingModal from '../components/ReportSightingModal';
import { DEFAULT_AVATAR_COLOR } from '../utils/avatarColors';
import { colors, fontSize, fontWeight, spacing, borderRadius } from '../theme';

export default function FeedScreen() {
  const { sightings, loading, refresh } = useSightings();
  const [reportVisible, setReportVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  }, [refresh]);

  function renderSighting({ item }: { item: Sighting }) {
    const isActive = isWithinHours(item.created_at, 0.5);
    const isRecent = !isActive && isWithinHours(item.created_at, 2);
    const isStale = !isActive && !isRecent;
    const name = item.display_name ?? 'Anonymous';
    const initial = name.charAt(0).toUpperCase();

    const cardStyle = isActive ? styles.cardActive : isRecent ? styles.cardRecent : undefined;
    const tsStyle = isActive ? styles.timestampActive : isRecent ? styles.timestampRecent : undefined;
    const userColor = item.avatar_color ?? DEFAULT_AVATAR_COLOR;
    const isAnon = item.is_anonymous;

    const avatarBg = item.report_type === 'booted' ? colors.danger
      : isAnon ? '#6B7280'
      : userColor;

    const avatarIcon = item.report_type === 'booted' ? 'lock-closed'
      : isAnon ? 'shield-checkmark'
      : null;

    return (
      <View style={[styles.card, cardStyle]}>
        <View style={styles.cardHeader}>
          <View style={[styles.avatar, { backgroundColor: avatarBg }]}>
            {avatarIcon ? (
              <Ionicons name={avatarIcon} size={16} color={colors.textInverse} />
            ) : (
              <Text style={styles.avatarText}>{initial}</Text>
            )}
          </View>
          <View style={styles.cardHeaderText}>
            <Text style={[styles.narrative, isStale && styles.narrativeStale]}>
              <Text style={styles.narrativeName}>{name}</Text>
              {item.report_type === 'booted' ? ' got booted at ' : ' spotted a booter at '}
              <Text style={[styles.narrativeComplex, isStale && styles.narrativeComplexStale]}>{item.complex_name}</Text>
            </Text>
            <Text style={[styles.timestamp, tsStyle]}>
              {timeAgo(item.created_at)}
            </Text>
          </View>
          {isActive && (
            <View style={styles.activeBadge}>
              <Text style={styles.activeBadgeText}>ACTIVE</Text>
            </View>
          )}
          {isRecent && (
            <View style={styles.recentBadge}>
              <Text style={styles.recentBadgeText}>RECENT</Text>
            </View>
          )}
        </View>
        {item.photo_url && (
          <Image source={{ uri: item.photo_url }} style={styles.photo} />
        )}
      </View>
    );
  }

  if (loading && sightings.length === 0) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={sightings}
        keyExtractor={(item) => item.id}
        renderItem={renderSighting}
        contentContainerStyle={sightings.length === 0 ? styles.emptyContainer : styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        ListHeaderComponent={sightings.length > 0 ? (
          <View style={styles.privacyBanner}>
            <Ionicons name="shield-checkmark" size={16} color={colors.primary} />
            <Text style={styles.privacyText}>
              Your reports help the community. Anonymous posting is always available. We never share your identity with property managers or booting companies.
            </Text>
          </View>
        ) : null}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="eye-off-outline" size={48} color={colors.textSecondary} />
            <Text style={styles.emptyTitle}>No sightings yet</Text>
            <Text style={styles.emptySubtitle}>
              Be the first to report a boot truck! Tap the button below to help your community.
            </Text>
          </View>
        }
      />

      {/* FAB */}
      <Pressable style={styles.fab} onPress={() => setReportVisible(true)}>
        <Ionicons name="add" size={28} color={colors.textInverse} />
      </Pressable>

      <ReportSightingModal
        visible={reportVisible}
        onClose={() => setReportVisible(false)}
        onSuccess={refresh}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.surface,
  },
  listContent: {
    padding: spacing.md,
    gap: spacing.sm,
  },
  privacyBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    backgroundColor: '#EFF6FF',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.xs,
  },
  privacyText: {
    flex: 1,
    fontSize: fontSize.xs,
    color: colors.primary,
    lineHeight: 18,
  },
  card: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardActive: {
    borderColor: colors.danger,
    borderLeftWidth: 3,
  },
  cardRecent: {
    borderColor: colors.warning,
    borderLeftWidth: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.neutral,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    color: colors.textInverse,
  },
  cardHeaderText: {
    flex: 1,
  },
  narrative: {
    fontSize: fontSize.md,
    color: colors.text,
    lineHeight: 20,
  },
  narrativeName: {
    fontWeight: fontWeight.bold,
  },
  narrativeComplex: {
    fontWeight: fontWeight.semibold,
    color: colors.primary,
  },
  narrativeStale: {
    opacity: 0.6,
  },
  narrativeComplexStale: {
    color: colors.textSecondary,
  },
  timestamp: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
  },
  timestampActive: {
    color: colors.danger,
    fontWeight: fontWeight.medium,
  },
  timestampRecent: {
    color: colors.warning,
    fontWeight: fontWeight.medium,
  },
  activeBadge: {
    backgroundColor: colors.dangerLight,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
  },
  activeBadgeText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    color: colors.danger,
    letterSpacing: 0.5,
  },
  recentBadge: {
    backgroundColor: colors.warningLight,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
  },
  recentBadgeText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    color: colors.warning,
    letterSpacing: 0.5,
  },
  photo: {
    width: '100%',
    height: 160,
    borderRadius: borderRadius.sm,
    marginTop: spacing.sm,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    alignItems: 'center',
    padding: spacing.xl,
    gap: spacing.sm,
  },
  emptyTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.text,
  },
  emptySubtitle: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  fab: {
    position: 'absolute',
    bottom: spacing.lg,
    right: spacing.lg,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
});
