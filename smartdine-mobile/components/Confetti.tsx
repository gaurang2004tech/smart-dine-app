/**
 * Confetti.tsx
 * ------------
 * A pure React Native Animated confetti burst — no external libraries.
 * Shows 40 colorful particles that burst upward and fall with gravity + rotation.
 *
 * HOW TO USE:
 *   import Confetti from '../components/Confetti';
 *   const confettiRef = useRef<{ fire: () => void }>(null);
 *   <Confetti ref={confettiRef} />
 *   // To trigger: confettiRef.current?.fire();
 */

import React, { forwardRef, useImperativeHandle, useRef, useState } from 'react';
import { View, Animated, StyleSheet, Dimensions } from 'react-native';

const { width: W, height: H } = Dimensions.get('window');

const COLORS = ['#F97316', '#6C5CE7', '#10B981', '#F59E0B', '#3B82F6', '#EC4899', '#14B8A6', '#EF4444'];
const PARTICLE_COUNT = 42;

function randomBetween(min: number, max: number) {
    return Math.random() * (max - min) + min;
}

interface ParticleConfig {
    x: number;
    color: string;
    size: number;
    shape: 'square' | 'circle' | 'rect';
    delay: number;
}

interface ConfettiHandle {
    fire: () => void;
}

const Confetti = forwardRef<ConfettiHandle>((_, ref) => {
    const [active, setActive] = useState(false);
    const particles: ParticleConfig[] = useRef(
        Array.from({ length: PARTICLE_COUNT }, () => ({
            x: randomBetween(0, W),
            color: COLORS[Math.floor(Math.random() * COLORS.length)],
            size: randomBetween(7, 14),
            shape: (['square', 'circle', 'rect'] as const)[Math.floor(Math.random() * 3)],
            delay: randomBetween(0, 300),
        }))
    ).current;

    // Each particle has its own Animated values
    const animRefs = useRef(
        particles.map(() => ({
            y: new Animated.Value(0),
            opacity: new Animated.Value(1),
            rotation: new Animated.Value(0),
            scaleX: new Animated.Value(1),
        }))
    ).current;

    useImperativeHandle(ref, () => ({
        fire() {
            // Reset all
            animRefs.forEach(({ y, opacity, rotation, scaleX }) => {
                y.setValue(0);
                opacity.setValue(1);
                rotation.setValue(0);
                scaleX.setValue(1);
            });
            setActive(true);

            // Animate each particle
            const anims = particles.map((_, i) => {
                const { y, opacity, rotation, scaleX } = animRefs[i];
                const targetY = randomBetween(H * 0.35, H * 0.85);
                const targetRot = randomBetween(-720, 720);

                return Animated.sequence([
                    Animated.delay(particles[i].delay),
                    Animated.parallel([
                        // Fall down
                        Animated.timing(y, { toValue: targetY, duration: 1600, useNativeDriver: true }),
                        // Fade out near end
                        Animated.sequence([
                            Animated.delay(900),
                            Animated.timing(opacity, { toValue: 0, duration: 700, useNativeDriver: true }),
                        ]),
                        // Spin
                        Animated.timing(rotation, { toValue: targetRot, duration: 1600, useNativeDriver: true }),
                        // Squish
                        Animated.loop(
                            Animated.sequence([
                                Animated.timing(scaleX, { toValue: 0.4, duration: 200, useNativeDriver: true }),
                                Animated.timing(scaleX, { toValue: 1, duration: 200, useNativeDriver: true }),
                            ]),
                            { iterations: 4 }
                        ),
                    ]),
                ]);
            });

            Animated.parallel(anims).start(() => setActive(false));
        },
    }));

    if (!active) return null;

    return (
        <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
            {particles.map((p, i) => {
                const { y, opacity, rotation, scaleX } = animRefs[i];
                const rotate = rotation.interpolate({ inputRange: [-720, 720], outputRange: ['-720deg', '720deg'] });
                const borderRadius = p.shape === 'circle' ? p.size : p.shape === 'rect' ? 2 : 3;
                const width = p.shape === 'rect' ? p.size * 2.5 : p.size;
                const height = p.size;

                return (
                    <Animated.View
                        key={i}
                        style={{
                            position: 'absolute',
                            top: randomBetween(-80, -20), // start above viewport
                            left: p.x,
                            width,
                            height,
                            borderRadius,
                            backgroundColor: p.color,
                            opacity,
                            transform: [
                                { translateY: y },
                                { rotate },
                                { scaleX },
                            ],
                        }}
                    />
                );
            })}
        </View>
    );
});

export default Confetti;
