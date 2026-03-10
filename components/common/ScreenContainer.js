import { useEffect, useMemo, useRef } from 'react';
import { useSegments } from 'expo-router';
import { useIsFocused } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Animated, Easing, ScrollView, StyleSheet } from 'react-native';
import { colors } from '../../constants/colors';
import { useThemedStyles } from '../../hooks/useThemedStyles';

export default function ScreenContainer({ children, scroll = true }) {
  const styles = useThemedStyles(createStyles);
  const segments = useSegments();
  const isFocused = useIsFocused();
  const routeKey = segments[segments.length - 1] || 'default';
  const topX = useRef(new Animated.Value(0)).current;
  const topY = useRef(new Animated.Value(0)).current;
  const topScale = useRef(new Animated.Value(1)).current;
  const topOpacity = useRef(new Animated.Value(0.28)).current;
  const bottomX = useRef(new Animated.Value(0)).current;
  const bottomY = useRef(new Animated.Value(0)).current;
  const bottomScale = useRef(new Animated.Value(1)).current;
  const bottomOpacity = useRef(new Animated.Value(0.22)).current;
  const contentOpacity = useRef(new Animated.Value(1)).current;
  const contentY = useRef(new Animated.Value(0)).current;
  const contentScale = useRef(new Animated.Value(1)).current;

  const motion = useMemo(() => getOrbMotion(routeKey), [routeKey]);

  useEffect(() => {
    const topMotion = Animated.parallel([
      Animated.timing(topScale, {
        toValue: motion.top.travelScale,
        duration: 240,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(topOpacity, {
        toValue: motion.top.travelOpacity,
        duration: 240,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.spring(topX, {
        toValue: motion.top.x,
        damping: 13,
        stiffness: 90,
        useNativeDriver: true,
      }),
      Animated.spring(topY, {
        toValue: motion.top.y,
        damping: 13,
        stiffness: 90,
        useNativeDriver: true,
      }),
    ]);

    const bottomMotion = Animated.parallel([
      Animated.timing(bottomScale, {
        toValue: motion.bottom.travelScale,
        duration: 260,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(bottomOpacity, {
        toValue: motion.bottom.travelOpacity,
        duration: 260,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.spring(bottomX, {
        toValue: motion.bottom.x,
        damping: 12,
        stiffness: 86,
        useNativeDriver: true,
      }),
      Animated.spring(bottomY, {
        toValue: motion.bottom.y,
        damping: 12,
        stiffness: 86,
        useNativeDriver: true,
      }),
    ]);

    const settleAnimation = Animated.parallel([
      Animated.spring(topScale, {
        toValue: motion.top.scale,
        damping: 10,
        stiffness: 110,
        useNativeDriver: true,
      }),
      Animated.spring(bottomScale, {
        toValue: motion.bottom.scale,
        damping: 10,
        stiffness: 110,
        useNativeDriver: true,
      }),
      Animated.timing(topOpacity, {
        toValue: motion.top.opacity,
        duration: 420,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(bottomOpacity, {
        toValue: motion.bottom.opacity,
        duration: 420,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]);

    const transition = Animated.sequence([
      Animated.parallel([topMotion, bottomMotion]),
      settleAnimation,
    ]);

    transition.start();

    return () => {
      transition.stop();
    };
  }, [bottomOpacity, bottomScale, bottomX, bottomY, motion, topOpacity, topScale, topX, topY]);

  useEffect(() => {
    if (!isFocused) return;

    contentOpacity.setValue(0);
    contentY.setValue(24);
    contentScale.setValue(0.985);

    const contentTransition = Animated.parallel([
      Animated.timing(contentOpacity, {
        toValue: 1,
        duration: 320,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(contentY, {
        toValue: 0,
        duration: 420,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(contentScale, {
        toValue: 1,
        duration: 420,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]);

    contentTransition.start();

    return () => {
      contentTransition.stop();
    };
  }, [contentOpacity, contentScale, contentY, isFocused, routeKey]);

  const topOrbStyle = useMemo(
    () => ({
      backgroundColor: colors.glowPrimary,
      opacity: topOpacity,
      transform: [
        { perspective: 900 },
        { translateX: topX },
        { translateY: topY },
        { scale: topScale },
      ],
    }),
    [topOpacity, topScale, topX, topY]
  );

  const bottomOrbStyle = useMemo(
    () => ({
      backgroundColor: colors.glowSecondary,
      opacity: bottomOpacity,
      transform: [
        { perspective: 900 },
        { translateX: bottomX },
        { translateY: bottomY },
        { scale: bottomScale },
      ],
    }),
    [bottomOpacity, bottomScale, bottomX, bottomY]
  );

  const contentStyle = useMemo(
    () => ({
      opacity: contentOpacity,
      transform: [{ translateY: contentY }, { scale: contentScale }],
    }),
    [contentOpacity, contentScale, contentY]
  );

  if (!scroll) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
        <Animated.View style={[styles.glowTop, topOrbStyle]} />
        <Animated.View style={[styles.glowBottom, bottomOrbStyle]} />
        <Animated.View style={contentStyle}>{children}</Animated.View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <Animated.View style={[styles.glowTop, topOrbStyle]} />
      <Animated.View style={[styles.glowBottom, bottomOrbStyle]} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Animated.View style={contentStyle}>{children}</Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = () => StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 36,
  },
  glowTop: {
    position: 'absolute',
    top: -60,
    right: -30,
    width: 220,
    height: 220,
    borderRadius: 120,
  },
  glowBottom: {
    position: 'absolute',
    bottom: -100,
    left: -40,
    width: 220,
    height: 220,
    borderRadius: 120,
  },
});

function getOrbMotion(routeKey) {
  const variants = {
    dashboard: {
      top: { x: -18, y: -12, scale: 1.06, opacity: 0.32, travelScale: 1.22, travelOpacity: 0.18 },
      bottom: { x: 12, y: 10, scale: 1.02, opacity: 0.22, travelScale: 0.82, travelOpacity: 0.12 },
    },
    bills: {
      top: { x: -96, y: 6, scale: 1.18, opacity: 0.34, travelScale: 1.34, travelOpacity: 0.2 },
      bottom: { x: 132, y: -8, scale: 0.94, opacity: 0.2, travelScale: 0.72, travelOpacity: 0.1 },
    },
    'add-bill': {
      top: { x: -8, y: 82, scale: 0.92, opacity: 0.2, travelScale: 0.68, travelOpacity: 0.1 },
      bottom: { x: -84, y: -112, scale: 1.26, opacity: 0.32, travelScale: 1.42, travelOpacity: 0.18 },
    },
    'payment-history': {
      top: { x: 116, y: 18, scale: 1.12, opacity: 0.3, travelScale: 1.28, travelOpacity: 0.17 },
      bottom: { x: -118, y: -18, scale: 0.9, opacity: 0.18, travelScale: 0.7, travelOpacity: 0.08 },
    },
    profile: {
      top: { x: -118, y: 30, scale: 1.22, opacity: 0.33, travelScale: 1.4, travelOpacity: 0.18 },
      bottom: { x: 86, y: -94, scale: 0.88, opacity: 0.18, travelScale: 0.66, travelOpacity: 0.08 },
    },
    default: {
      top: { x: 0, y: 0, scale: 1.04, opacity: 0.3, travelScale: 1.2, travelOpacity: 0.16 },
      bottom: { x: 0, y: 0, scale: 1, opacity: 0.22, travelScale: 0.82, travelOpacity: 0.12 },
    },
  };

  return variants[routeKey] ?? variants.default;
}
