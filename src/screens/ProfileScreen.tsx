import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { complexes } from '../data/complexes';
import { AVATAR_COLORS, DEFAULT_AVATAR_COLOR } from '../utils/avatarColors';
import { colors, fontSize, fontWeight, spacing, borderRadius } from '../theme';

interface Profile {
  display_name: string | null;
  saved_complexes: string[];
  avatar_color: string | null;
}

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [selectedColor, setSelectedColor] = useState(DEFAULT_AVATAR_COLOR);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase
      .from('profiles')
      .select('display_name, saved_complexes, avatar_color')
      .eq('id', user.id)
      .single()
      .then(({ data }) => {
        if (data) {
          setProfile(data);
          setSelectedColor(data.avatar_color ?? DEFAULT_AVATAR_COLOR);
        }
      });
  }, [user]);

  async function handleColorSelect(color: string) {
    setSelectedColor(color);
    if (!user) return;
    setSaving(true);
    await supabase.from('profiles').update({ avatar_color: color }).eq('id', user.id);
    setSaving(false);
  }

  const displayName = profile?.display_name ?? user?.email?.split('@')[0] ?? 'User';
  const savedIds = profile?.saved_complexes ?? [];
  const savedComplexes = complexes.filter((c) => savedIds.includes(c.id));

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <View style={[styles.avatar, { backgroundColor: selectedColor }]}>
          <Text style={styles.avatarText}>{displayName.charAt(0).toUpperCase()}</Text>
        </View>
        <Text style={styles.name}>{displayName}</Text>
        <Text style={styles.email}>{user?.email}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Avatar Color</Text>
        <View style={styles.colorGrid}>
          {AVATAR_COLORS.map((c) => (
            <Pressable key={c} onPress={() => handleColorSelect(c)} style={styles.colorOption}>
              <View style={[styles.colorSwatch, { backgroundColor: c }]}>
                {c === selectedColor && (
                  <Ionicons name="checkmark" size={18} color="#fff" />
                )}
              </View>
            </Pressable>
          ))}
        </View>
        {saving && <Text style={styles.savingText}>Saving...</Text>}
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
            {savedComplexes.map((cx) => (
              <View key={cx.id} style={styles.savedItem}>
                <Ionicons name="location" size={18} color={colors.primary} />
                <Text style={styles.savedItemText}>{cx.name}</Text>
                <Text style={styles.savedItemMeta}>{cx.visitorTimeLimitMinutes ?? '?'} min</Text>
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
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
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
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  colorOption: {
    padding: 2,
  },
  colorSwatch: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  savingText: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    textAlign: 'center',
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
    marginTop: spacing.lg,
    paddingBottom: spacing.md,
  },
});
