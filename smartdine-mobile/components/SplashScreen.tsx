/**
 * SplashScreen.tsx
 * ----------------
 * A premium animated splash screen for SmartDine.
 * Uses React Native's built-in Animated API — no extra libraries needed.
 *
 * HOW TO USE:
 *   import SplashScreen from '../components/SplashScreen';
 *
 *   // In your root component:
 *   const [showSplash, setShowSplash] = useState(true);
 *   if (showSplash) return <SplashScreen onFinish={() => setShowSplash(false)} />;
 */

import React, { useEffect, useRef } from 'react';
import {
    View,
    Text,
    Animated,
    StyleSheet,
    Dimensions,
    StatusBar,
} from 'react-native';

const { width, height } = Dimensions.get('window');

interface SplashScreenProps {
    /** Called when the splash animation finishes and app should proceed */
    onFinish: () => void;
    /** Duration of the full animation in ms (default 2400) */
    duration?: number;
}

export default function SplashScreen({ onFinish, duration = 2400 }: SplashScreenProps) {
    // Animation values
    const bgOpacity = useRef(new Animated.Value(0)).current;
    const logoScale = useRef(new Animated.Value(0.6)).current;
    const logoOpacity = useRef(new Animated.Value(0)).current;
    const textSlide = useRef(new Animated.Value(30)).current;
    const textOpacity = useRef(new Animated.Value(0)).current;
    const dotScale1 = useRef(new Animated.Value(0)).current;
    const dotScale2 = useRef(new Animated.Value(0)).current;
    const dotScale3 = useRef(new Animated.Value(0)).current;
    const exitOpacity = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        // Phase 1: Background fades in
        Animated.timing(bgOpacity, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
        }).start();

        // Phase 2: Logo bounces in
        Animated.parallel([
            Animated.spring(logoScale, {
                toValue: 1,
                friction: 5,
                tension: 80,
                useNativeDriver: true,
            }),
            Animated.timing(logoOpacity, {
                toValue: 1,
                duration: 500,
                useNativeDriver: true,
            }),
        ]).start();

        // Phase 3: Tagline slides up (delayed)
        const textTimer = setTimeout(() => {
            Animated.parallel([
                Animated.timing(textSlide, {
                    toValue: 0,
                    duration: 400,
                    useNativeDriver: true,
                }),
                Animated.timing(textOpacity, {
                    toValue: 1,
                    duration: 400,
                    useNativeDriver: true,
                }),
            ]).start();
        }, 500);

        // Phase 4: Loading dots pulse in sequence
        const dotTimer = setTimeout(() => {
            const dotAnim = (ref: Animated.Value, delay: number) =>
                Animated.loop(
                    Animated.sequence([
                        Animated.delay(delay),
                        Animated.spring(ref, { toValue: 1, friction: 3, useNativeDriver: true }),
                        Animated.delay(400),
                        Animated.timing(ref, { toValue: 0, duration: 200, useNativeDriver: true }),
                    ])
                );

            dotAnim(dotScale1, 0).start();
            dotAnim(dotScale2, 150).start();
            dotAnim(dotScale3, 300).start();
        }, 900);

        // Phase 5: Fade out entire splash
        const exitTimer = setTimeout(() => {
            Animated.timing(exitOpacity, {
                toValue: 0,
                duration: 400,
                useNativeDriver: true,
            }).start(() => onFinish());
        }, duration);

        return () => {
            clearTimeout(textTimer);
            clearTimeout(dotTimer);
            clearTimeout(exitTimer);
        };
    }, []);

    return (
        <Animated.View style={[styles.container, { opacity: exitOpacity }]}>
            <StatusBar barStyle="light-content" backgroundColor="#1A1A1A" />

            {/* Dark background */}
            <Animated.View style={[StyleSheet.absoluteFillObject, styles.bg, { opacity: bgOpacity }]} />

            {/* Decorative circles */}
            <View style={[styles.circle, styles.circleTopRight]} />
            <View style={[styles.circle, styles.circleBottomLeft]} />

            {/* Logo block */}
            <Animated.View
                style={[
                    styles.logoContainer,
                    { opacity: logoOpacity, transform: [{ scale: logoScale }] },
                ]}
            >
                {/* Icon emoji as logo placeholder — swap with an <Image> when you have a real logo */}
                <View style={styles.iconBox}>
                    <Text style={styles.iconEmoji}>🍽️</Text>
                </View>
                <Text style={styles.brandName}>
                    <Text style={styles.brandHighlight}>Smart</Text>Dine
                </Text>
            </Animated.View>

            {/* Tagline */}
            <Animated.View
                style={[
                    styles.taglineContainer,
                    { opacity: textOpacity, transform: [{ translateY: textSlide }] },
                ]}
            >
                <Text style={styles.tagline}>Scan. Order. Enjoy.</Text>
            </Animated.View>

            {/* Loading dots */}
            <View style={styles.dotsContainer}>
                {[dotScale1, dotScale2, dotScale3].map((dot, i) => (
                    <Animated.View
                        key={i}
                        style={[styles.dot, { transform: [{ scale: dot }] }]}
                    />
                ))}
            </View>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    container: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 9999,
    },
    bg: {
        backgroundColor: '#1A1A1A',
    },

    // Decorative blobs
    circle: {
        position: 'absolute',
        width: 300,
        height: 300,
        borderRadius: 150,
        backgroundColor: 'rgba(255,255,255,0.03)',
    },
    circleTopRight: { top: -80, right: -80 },
    circleBottomLeft: { bottom: -100, left: -100 },

    // Logo
    logoContainer: {
        alignItems: 'center',
        marginBottom: 16,
    },
    iconBox: {
        width: 90,
        height: 90,
        backgroundColor: 'rgba(255,255,255,0.08)',
        borderRadius: 26,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 18,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.12)',
    },
    iconEmoji: {
        fontSize: 44,
    },
    brandName: {
        fontSize: 42,
        fontWeight: '900',
        color: '#FFFFFF',
        letterSpacing: -1,
    },
    brandHighlight: {
        color: '#F97316', // warm orange accent
    },

    // Tagline
    taglineContainer: {
        alignItems: 'center',
        marginTop: 8,
    },
    tagline: {
        fontSize: 16,
        color: 'rgba(255,255,255,0.5)',
        fontWeight: '500',
        letterSpacing: 2,
        textTransform: 'uppercase',
    },

    // Loading dots
    dotsContainer: {
        position: 'absolute',
        bottom: height * 0.12,
        flexDirection: 'row',
        gap: 10,
        alignItems: 'center',
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#F97316',
    },
});
