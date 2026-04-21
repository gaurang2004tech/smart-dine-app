/**
 * OrderStatusTimeline.tsx
 * -----------------------
 * A beautiful animated step tracker for order status.
 * Steps: Pending → Preparing → Ready → Served
 *
 * HOW TO USE:
 *   import OrderStatusTimeline from '../components/OrderStatusTimeline';
 *
 *   // Inside your tracking screen's JSX:
 *   <OrderStatusTimeline status={order.status} />
 */

import React, { useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Animated,
} from 'react-native';

type OrderStatus = 'pending' | 'preparing' | 'ready' | 'served' | string;

interface OrderStatusTimelineProps {
    status: OrderStatus;
}

const STEPS = [
    { key: 'pending', label: 'Order\nReceived', emoji: '📋' },
    { key: 'preparing', label: 'Being\nPrepared', emoji: '🍳' },
    { key: 'ready', label: 'Ready to\nServe', emoji: '✅' },
    { key: 'served', label: 'Enjoy your\nMeal', emoji: '🛎️' },
];

const STATUS_ORDER = ['pending', 'preparing', 'ready', 'served'];

function getStepIndex(status: OrderStatus): number {
    const normalized = status ? status.toLowerCase() : 'pending';
    const idx = STATUS_ORDER.indexOf(normalized);
    return idx >= 0 ? idx : 0;
}

// Config for each step's accent color
const STEP_COLORS: Record<string, string> = {
    pending: '#F97316', // orange
    preparing: '#3B82F6', // blue
    ready: '#10B981', // green
    served: '#8B5CF6', // purple
};

export default function OrderStatusTimeline({ status }: OrderStatusTimelineProps) {
    const activeIndex = getStepIndex(status);
    const activeColor = STEP_COLORS[STATUS_ORDER[activeIndex]] ?? '#F97316';

    // Pulse animation for the active dot
    const pulseAnim = useRef(new Animated.Value(1)).current;
    const pulseOpacity = useRef(new Animated.Value(0.6)).current;

    useEffect(() => {
        const loop = Animated.loop(
            Animated.sequence([
                Animated.parallel([
                    Animated.timing(pulseAnim, { toValue: 1.6, duration: 700, useNativeDriver: true }),
                    Animated.timing(pulseOpacity, { toValue: 0, duration: 700, useNativeDriver: true }),
                ]),
                Animated.parallel([
                    Animated.timing(pulseAnim, { toValue: 1, duration: 0, useNativeDriver: true }),
                    Animated.timing(pulseOpacity, { toValue: 0.6, duration: 0, useNativeDriver: true }),
                ]),
            ])
        );
        loop.start();
        return () => loop.stop();
    }, [status]);

    return (
        <View style={styles.wrapper}>
            {/* Progress strip (the connecting lines + dots row) */}
            <View style={styles.row}>
                {STEPS.map((step, i) => {
                    const isDone = i < activeIndex;
                    const isActive = i === activeIndex;
                    const isPending = i > activeIndex;

                    const dotColor = isDone ? activeColor : isActive ? activeColor : '#D1D5DB';
                    const lineColor = i < activeIndex ? activeColor : '#D1D5DB';

                    return (
                        <React.Fragment key={step.key}>
                            {/* Step dot */}
                            <View style={styles.dotWrapper}>
                                {/* Animated pulse ring behind active dot */}
                                {isActive && (
                                    <Animated.View
                                        style={[
                                            styles.pulseRing,
                                            {
                                                backgroundColor: activeColor,
                                                opacity: pulseOpacity,
                                                transform: [{ scale: pulseAnim }],
                                            },
                                        ]}
                                    />
                                )}
                                <View
                                    style={[
                                        styles.dot,
                                        {
                                            backgroundColor: dotColor,
                                            borderColor: isPending ? '#D1D5DB' : activeColor,
                                            shadowColor: isActive ? activeColor : 'transparent',
                                            shadowOpacity: isActive ? 0.5 : 0,
                                            shadowRadius: 8,
                                            shadowOffset: { width: 0, height: 0 },
                                            elevation: isActive ? 8 : 0,
                                        },
                                    ]}
                                >
                                    <Text style={[styles.dotEmoji, { opacity: isPending ? 0.35 : 1 }]}>
                                        {step.emoji}
                                    </Text>
                                </View>
                            </View>

                            {/* Connector line (not after last step) */}
                            {i < STEPS.length - 1 && (
                                <View style={styles.lineContainer}>
                                    {/* Background line */}
                                    <View style={[styles.line, { backgroundColor: '#E5E7EB' }]} />
                                    {/* Filled portion */}
                                    {(isDone || isActive) && (
                                        <View
                                            style={[
                                                styles.line,
                                                styles.lineFilled,
                                                {
                                                    backgroundColor: lineColor,
                                                    width: isDone ? '100%' : '50%',
                                                },
                                            ]}
                                        />
                                    )}
                                </View>
                            )}
                        </React.Fragment>
                    );
                })}
            </View>

            {/* Labels row */}
            <View style={styles.labelsRow}>
                {STEPS.map((step, i) => {
                    const isActive = i === activeIndex;
                    const isDone = i < activeIndex;
                    return (
                        <View key={step.key} style={styles.labelBox}>
                            <Text
                                style={[
                                    styles.labelText,
                                    isDone && styles.labelDone,
                                    isActive && { color: activeColor, fontWeight: '800' },
                                ]}
                            >
                                {step.label}
                            </Text>
                        </View>
                    );
                })}
            </View>

            {/* Active status banner */}
            <View style={[styles.statusBanner, { backgroundColor: `${activeColor}18`, borderColor: `${activeColor}40` }]}>
                <Text style={[styles.statusBannerText, { color: activeColor }]}>
                    {STEPS[activeIndex].emoji}  {status ? status.charAt(0).toUpperCase() + status.slice(1).toLowerCase() : 'Pending'}
                </Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    wrapper: {
        paddingHorizontal: 20,
        paddingVertical: 24,
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        marginHorizontal: 20,
        marginVertical: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.06,
        shadowRadius: 12,
        elevation: 3,
    },

    // Dots & lines row
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    dotWrapper: {
        alignItems: 'center',
        justifyContent: 'center',
        width: 52,
        height: 52,
    },
    pulseRing: {
        position: 'absolute',
        width: 52,
        height: 52,
        borderRadius: 26,
    },
    dot: {
        width: 48,
        height: 48,
        borderRadius: 24,
        borderWidth: 2,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#F9FAFB',
    },
    dotEmoji: {
        fontSize: 20,
    },
    lineContainer: {
        flex: 1,
        height: 4,
        position: 'relative',
        overflow: 'hidden',
        borderRadius: 2,
    },
    line: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        borderRadius: 2,
    },
    lineFilled: {
        position: 'absolute',
        top: 0,
        left: 0,
        bottom: 0,
    },

    // Labels
    labelsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    labelBox: {
        width: 60,
        alignItems: 'center',
    },
    labelText: {
        fontSize: 10,
        color: '#9CA3AF',
        textAlign: 'center',
        fontWeight: '600',
        lineHeight: 14,
    },
    labelDone: {
        color: '#6B7280',
    },

    // Status banner
    statusBanner: {
        marginTop: 16,
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 12,
        borderWidth: 1,
        alignItems: 'center',
    },
    statusBannerText: {
        fontSize: 16,
        fontWeight: '700',
        letterSpacing: 0.5,
    },
});
