import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { complexes } from '../data/complexes';
import { colors, fontSize, fontWeight, spacing, borderRadius } from '../theme';

interface Profile {
  display_name: string | null;
  saved_complexes: string[];
}

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    if (!user) return;
    supabase
      .from('profiles')
      .select('display_name, saved_complexes')
      .eq('id', user.id)
      .single()
      .then(({ data }) => {
        if (data) setProfile(data);
      });
  }, [user]);

  const displayName = profile?.display_name ?? user?.email?.split('@')[0] ?? 'User';
  const savedIds = profile?.saved_complexes ?? [];
  const savedComplexes = complexes.filter((c) => savedIds.includes(c.id));

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{displayName.charAt(0).toUpperCase()}</Text>
        </View>
        <Text style={styles.name}>{displayName}</Text>
        <Text style={styles.email}>{user?.email}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Saved Complexes</Text>
        {savedComplexes.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="bookmark-outline" size={24} color={colors.textSecondary} />
            <Text style={styles.emptyText}>No saved complexes yet</Text>
            <Text style={styles.emptySubtext}>
              Save complexes from the Map tab to get boot spotter alerts for those locations.
            </Text>
          </View>
        ) : (
          <View style={styles.savedList}>
            {savedComplexes.map((c) => (
              <View key={c.id} style={styles.savedItem}>
                <Ionicons name="location" size={18} color={colors.primary} />
                <Text style={styles.savedItemText}>{c.name}</Text>
                <Text style={styles.savedItemMeta}>{c.visitorTimeLimitMinutes ?? '?'} min</Text>
              </View>
            ))}
          </View>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account</Text>
        <Pressable style={styles.menuItem} onPress={signOut}>
          <Ionicons name="log-out-outline" size={20} color={colors.danger} />
          <Text style={styles.menuItemTextDanger}>Sign Out</Text>
        </Pressable>
      </View>

      <Text style={styles.version}>BootWatch v1.0.0</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
    padding: spacing.lg,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xl,
    paddingTop: spacing.md,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  avatarText: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
    color: colors.textInverse,
  },
  name: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.text,
  },
  email: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  section: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.sm,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
    gap: spacing.xs,
  },
  emptyText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
    color: colors.text,
  },
  emptySubtext: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  savedList: {
    gap: spacing.sm,
  },
  savedItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  savedItemText: {
    fontSize: fontSize.md,
    color: colors.text,
    flex: 1,
  },
  savedItemMeta: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  menuItemTextDanger: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
    color: colors.danger,
  },
  version: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 'auto',
    paddingBottom: spacing.md,
  },
});
