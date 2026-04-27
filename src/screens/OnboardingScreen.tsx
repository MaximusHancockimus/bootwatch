import { useMemo, useRef, useState } from 'react';
import { Dimensions, FlatList, Image, Pressable, ScrollView, StyleSheet, Text, View, ViewToken } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { fontSize, spacing, borderRadius, shadowCard, fonts, type AppColors } from '../theme';

/** Opaque / white from icon.png; monochrome tints for transparent look on the slide background. */
const BOOTWATCH_LOGO = require('../../assets/android-icon-monochrome.png');

const { width } = Dimensions.get('window');

interface Slide {
  id: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  iconColor: string;
  title: string;
  subtitle: string;
  brandIcon?: boolean;
  features?: { icon: React.ComponentProps<typeof Ionicons>['name']; label: string; desc: string }[];
}

function getSlides(colors: AppColors): Slide[] {
  return [
    {
      id: '1',
      icon: 'shield-checkmark',
      iconColor: colors.accent,
      brandIcon: true,
      title: 'Welcome to BootWatch',
      subtitle:
        'The community-powered app that protects students from predatory parking enforcement in Rexburg.',
    },
    {
      id: '2',
      icon: 'bulb-outline',
      iconColor: colors.primary,
      title: 'How It Works',
      subtitle: 'Three tools built to keep your car safe:',
      features: [
        {
          icon: 'flame',
          label: 'Risk Heatmap',
          desc: 'A live, color-coded map of every Rexburg complex — visitor time limits, booting companies, and hotspots of recent boot activity at a glance.',
        },
        {
          icon: 'timer',
          label: 'Smart Parking Timer',
          desc: 'Auto-tuned to each complex\u2019s visitor limit with alerts that warn you before time runs out, so you never come back to a boot.',
        },
        {
          icon: 'analytics',
          label: 'Community Intel',
          desc: 'Real-time sightings from fellow students plus data insights on peak booter hours and trending high-risk complexes.',
        },
      ],
    },
    {
      id: '3',
      icon: 'people',
      iconColor: colors.safe,
      title: 'Stronger Together',
      subtitle:
        'Report sightings, follow your complex, and help fellow students avoid getting booted. Your reports are anonymous if you want them to be.',
    },
  ];
}

interface Props {
  onComplete: () => void;
}

export default function OnboardingScreen({ onComplete }: Props) {
  const { colors } = useTheme();
  const slides = useMemo(() => getSlides(colors), [colors]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const styles = createStyles(colors);

  const onViewableItemsChanged = useRef(({ viewableItems }: { viewableItems: ViewToken[] }) => {
    if (viewableItems.length > 0 && viewableItems[0].index != null) {
      setCurrentIndex(viewableItems[0].index);
    }
  }).current;

  const getItemLayout = (_: unknown, index: number) => ({
    length: width,
    offset: width * index,
    index,
  });

  function handleNext() {
    if (currentIndex < slides.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1, animated: true });
    } else {
      onComplete();
    }
  }

  function renderSlide({ item }: { item: Slide }) {
    return (
      <ScrollView
        style={styles.slideScroll}
        contentContainerStyle={styles.slide}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        {item.brandIcon ? (
          <Image
            source={BOOTWATCH_LOGO}
            style={[styles.brandIcon, { tintColor: colors.accent }]}
            resizeMode="contain"
            accessibilityLabel="BootWatch"
          />
        ) : (
          <View style={[styles.iconCircle, { backgroundColor: item.iconColor + '22' }]}>
            <Ionicons name={item.icon} size={56} color={item.iconColor} />
          </View>
        )}
        <Text style={styles.slideTitle}>{item.title}</Text>
        <Text style={styles.slideSubtitle}>{item.subtitle}</Text>

        {item.features && (
          <View style={styles.featureList}>
            {item.features.map((f) => (
              <View key={f.label} style={styles.featureRow}>
                <View style={styles.featureIcon}>
                  <Ionicons name={f.icon} size={22} color={colors.accent} />
                </View>
                <View style={styles.featureText}>
                  <Text style={styles.featureLabel}>{f.label}</Text>
                  <Text style={styles.featureDesc}>{f.desc}</Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    );
  }

  const isLast = currentIndex === slides.length - 1;

  return (
    <View style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={slides}
        renderItem={renderSlide}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={{ viewAreaCoveragePercentThreshold: 50 }}
        getItemLayout={getItemLayout}
      />

      <View style={styles.footer}>
        <View style={styles.dots}>
          {slides.map((_, i) => (
            <View key={i} style={[styles.dot, i === currentIndex && styles.dotActive]} />
          ))}
        </View>

        <Pressable style={styles.nextButton} onPress={handleNext}>
          <Text style={styles.nextButtonText}>{isLast ? 'Get Started' : 'Next'}</Text>
          <Ionicons name={isLast ? 'checkmark' : 'arrow-forward'} size={20} color={colors.textInverse} />
        </Pressable>

        {!isLast && (
          <Pressable style={styles.skipButton} onPress={onComplete}>
            <Text style={styles.skipText}>Skip</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

function createStyles(colors: AppColors) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    slideScroll: {
      width,
      flex: 1,
    },
    slide: {
      flexGrow: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: spacing.xl,
      paddingVertical: spacing.xl,
    },
    brandIcon: {
      width: 150,
      height: 150,
      marginBottom: spacing.lg,
    },
    iconCircle: {
      width: 100,
      height: 100,
      borderRadius: 50,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: spacing.lg,
    },
    slideTitle: {
      fontSize: fontSize.xxl,
      fontFamily: fonts.displayBold,
      color: colors.text,
      textAlign: 'center',
      marginBottom: spacing.md,
    },
    slideSubtitle: {
      fontSize: fontSize.md,
      fontFamily: fonts.body,
      color: colors.textSecondary,
      textAlign: 'center',
      lineHeight: 22,
    },
    featureList: {
      marginTop: spacing.xl,
      gap: spacing.md,
      width: '100%',
    },
    featureRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      backgroundColor: colors.surface,
      borderRadius: borderRadius.lg,
      padding: spacing.md,
      borderWidth: 1,
      borderColor: colors.border,
      ...shadowCard,
    },
    featureIcon: {
      width: 44,
      height: 44,
      borderRadius: borderRadius.md,
      backgroundColor: colors.accentSoft,
      alignItems: 'center',
      justifyContent: 'center',
    },
    featureText: {
      flex: 1,
    },
    featureLabel: {
      fontSize: fontSize.md,
      fontFamily: fonts.bodyMedium,
      color: colors.text,
    },
    featureDesc: {
      fontSize: fontSize.sm,
      fontFamily: fonts.body,
      color: colors.textSecondary,
      marginTop: 2,
      lineHeight: 18,
    },
    footer: {
      paddingHorizontal: spacing.xl,
      paddingBottom: spacing.xxl,
      alignItems: 'center',
      gap: spacing.md,
    },
    dots: {
      flexDirection: 'row',
      gap: spacing.sm,
    },
    dot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: colors.border,
    },
    dotActive: {
      backgroundColor: colors.accent,
      width: 24,
    },
    nextButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.sm,
      backgroundColor: colors.primary,
      paddingVertical: spacing.md + 2,
      paddingHorizontal: spacing.xl,
      borderRadius: borderRadius.lg,
      width: '100%',
    },
    nextButtonText: {
      color: colors.textInverse,
      fontSize: fontSize.lg,
      fontFamily: fonts.display,
    },
    skipButton: {
      paddingVertical: spacing.sm,
    },
    skipText: {
      color: colors.textSecondary,
      fontSize: fontSize.sm,
      fontFamily: fonts.bodyMedium,
    },
  });
}
