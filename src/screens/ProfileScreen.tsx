import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { complexes } from '../data/complexes';
import { useSavedComplexes } from '../hooks/useSavedComplexes';
import { AVATAR_COLORS, DEFAULT_AVATAR_COLOR } from '../utils/avatarColors';
import { fontSize, spacing, borderRadius, shadowCard, fonts, type AppColors } from '../theme';
import { useTheme } from '../context/ThemeContext';

interface Profile {
  display_name: string | null;
  saved_complexes: string[];
  avatar_color: string | null;
}

export default function ProfileScreen() {
  const { colors, mode, setMode } = useTheme();
  const { user, signOut } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [selectedColor, setSelectedColor] = useState<string>(DEFAULT_AVATAR_COLOR);
  const [saving, setSaving] = useState(false);
  const [nearbyAlerts, setNearbyAlerts] = useState(true);
  const { savedIds, toggle: toggleComplex } = useSavedComplexes();

  useEffect(() => {
    if (!user) return;
    supabase
      .from('profiles')
      .select('display_name, saved_complexes, avatar_color, nearby_sighting_alerts')
      .eq('id', user.id)
      .single()
      .then(({ data }) => {
        if (data) {
          setProfile(data);
          setSelectedColor(data.avatar_color ?? DEFAULT_AVATAR_COLOR);
          setNearbyAlerts(data.nearby_sighting_alerts !== false);
        }
      });
  }, [user]);

  async function handleNearbyAlertsChange(value: boolean) {
    setNearbyAlerts(value);
    if (!user) return;
    await supabase.from('profiles').update({ nearby_sighting_alerts: value }).eq('id', user.id);
  }

  async function handleColorSelect(color: string) {
    setSelectedColor(color);
    if (!user) return;
    setSaving(true);
    await supabase.from('profiles').update({ avatar_color: color }).eq('id', user.id);
    setSaving(false);
  }

  const displayName = profile?.display_name ?? user?.email?.split('@')[0] ?? 'User';
  const savedComplexes = complexes.filter((c) => savedIds.includes(c.id));

  const styles = createStyles(colors);

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
        <Text style={styles.sectionTitle}>Color</Text>
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
        <Text style={styles.sectionTitle}>Appearance</Text>
        <View style={styles.themeToggle}>
          {(['light', 'dark', 'system'] as const).map((opt) => (
            <Pressable
              key={opt}
              style={[styles.themeOption, mode === opt && styles.themeOptionActive]}
              onPress={() => setMode(opt)}
            >
              <Ionicons
                name={opt === 'light' ? 'sunny-outline' : opt === 'dark' ? 'moon-outline' : 'phone-portrait-outline'}
                size={18}
                color={mode === opt ? colors.accent : colors.textSecondary}
              />
              <Text style={[styles.themeOptionText, mode === opt && styles.themeOptionTextActive]}>
                {opt.charAt(0).toUpperCase() + opt.slice(1)}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Notifications</Text>
        <View style={styles.switchRow}>
          <View style={styles.switchLabels}>
            <Text style={styles.switchTitle}>Nearby sighting alerts</Text>
            <Text style={styles.switchHint}>
              Push when a booter is reported within about two blocks of a complex you follow or where you have an
              active parking timer.
            </Text>
          </View>
          <Switch
            value={nearbyAlerts}
            onValueChange={handleNearbyAlertsChange}
            trackColor={{ false: colors.border, true: colors.primary }}
            thumbColor={colors.background}
            ios_backgroundColor={colors.border}
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Followed Complexes</Text>
        <Text style={styles.sectionSubtitle}>
          Complexes you follow (used when nearby alerts are on). Tap the bell on the map to add or remove.
        </Text>
        {savedComplexes.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="notifications-off-outline" size={24} color={colors.textSecondary} />
            <Text style={styles.emptyText}>No followed complexes</Text>
            <Text style={styles.emptySubtext}>
              Tap the bell icon on any complex from the Map tab to follow it and get boot spotter alerts.
            </Text>
          </View>
        ) : (
          <View style={styles.savedList}>
            {savedComplexes.map((cx) => (
              <View key={cx.id} style={styles.savedItem}>
                <Ionicons name="notifications" size={18} color={colors.accent} />
                <Text style={styles.savedItemText}>{cx.name}</Text>
                <Pressable onPress={() => toggleComplex(cx.id)} hitSlop={8}>
                  <Ionicons name="close-circle" size={20} color={colors.textSecondary} />
                </Pressable>
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

function createStyles(colors: AppColors) {
  return StyleSheet.create({
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
    fontFamily: fonts.displayBold,
    color: colors.textInverse,
  },
  name: {
    fontSize: fontSize.xl,
    fontFamily: fonts.displayBold,
    color: colors.text,
  },
  email: {
    fontSize: fontSize.sm,
    fontFamily: fonts.body,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  section: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadowCard,
  },
  sectionTitle: {
    fontSize: fontSize.sm,
    fontFamily: fonts.bodyMedium,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 2,
  },
  themeToggle: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  themeOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  themeOptionActive: {
    borderColor: colors.accent,
    backgroundColor: colors.accentSoft,
  },
  themeOptionText: {
    fontSize: fontSize.sm,
    fontFamily: fonts.body,
    color: colors.textSecondary,
  },
  themeOptionTextActive: {
    color: colors.text,
    fontFamily: fonts.bodyMedium,
  },
  sectionSubtitle: {
    fontSize: fontSize.xs,
    fontFamily: fonts.body,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    lineHeight: 18,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  switchLabels: {
    flex: 1,
  },
  switchTitle: {
    fontSize: fontSize.md,
    fontFamily: fonts.bodyMedium,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  switchHint: {
    fontSize: fontSize.xs,
    fontFamily: fonts.body,
    color: colors.textSecondary,
    lineHeight: 18,
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
    fontFamily: fonts.body,
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
    fontFamily: fonts.bodyMedium,
    color: colors.text,
  },
  emptySubtext: {
    fontSize: fontSize.sm,
    fontFamily: fonts.body,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  savedList: {
    gap: spacing.sm,
  },
  savedItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  savedItemText: {
    fontSize: fontSize.md,
    fontFamily: fonts.bodyMedium,
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
    fontFamily: fonts.bodyMedium,
    color: colors.danger,
  },
  version: {
    fontSize: fontSize.xs,
    fontFamily: fonts.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.lg,
    paddingBottom: spacing.md,
  },
});
}
