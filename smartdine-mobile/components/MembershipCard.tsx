import React from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity } from 'react-native';
import { BlurView } from 'expo-blur';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface MembershipCardProps {
    user: {
        name: string;
        points: number;
        tier: 'Silver' | 'Gold' | 'Black Card';
        memberSince: string;
        rewardProgress: number;
        unclaimedGifts: number;
    };
    onClaim?: () => void;
}

export default function MembershipCard({ user, onClaim }: MembershipCardProps) {
    const isBlackCard = user.tier === 'Black Card';
    const isGold = user.tier === 'Gold';

    const getTierColor = () => {
        if (isBlackCard) return '#D4AF37'; // Gold for Black Card text
        if (isGold) return '#FFD700';
        return '#94A3B8'; // Silver
    };

    const nextTierPoints = isBlackCard ? null : (isGold ? 2000 : 500);
    const progress = nextTierPoints ? (user.points / nextTierPoints) : 1;

    return (
        <View style={[styles.container, isBlackCard && styles.blackCardContainer]}>
            <BlurView intensity={isBlackCard ? 40 : 80} tint={isBlackCard ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />

            {/* Top Section: Tier & Name */}
            <View style={styles.cardHeader}>
                <View style={{ flex: 1 }}>
                    <Text style={[styles.tierLabel, { color: getTierColor() }]}>{user.tier.toUpperCase()}</Text>
                    <Text style={[styles.userName, isBlackCard && { color: '#F8FAFC' }]} numberOfLines={1}>{user.name}</Text>
                </View>
                <View style={styles.badge}>
                    <Text style={styles.badgeText}>SMARTDINE ELITE</Text>
                </View>
            </View>

            {/* Middle Section: Points & Claim Button */}
            <View style={styles.pointsSection}>
                <View style={styles.pointsRow}>
                    <View style={{ flex: 1 }}>
                        <Text style={[styles.pointsValue, isBlackCard && { color: '#FFF' }]}>{user.points}</Text>
                        <Text style={styles.pointsLabel}>Loyalty Points Wealth</Text>
                    </View>
                    {isBlackCard && user.unclaimedGifts > 0 && (
                        <TouchableOpacity style={styles.claimButton} onPress={onClaim} activeOpacity={0.8}>
                            <Text style={styles.claimButtonText}>Claim Gift 🎁</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            {/* Bottom Section: Progress Bar */}
            <View style={styles.progressContainer}>
                {isBlackCard ? (
                    <View style={styles.progressSection}>
                        <View style={styles.progressBarBg}>
                            <View style={[styles.progressBarFill, { width: `${(user.rewardProgress / 1000) * 100}%`, backgroundColor: '#D4AF37' }]} />
                        </View>
                        <Text style={styles.progressText}>{user.rewardProgress} / 1000 to next Gourmet Reward</Text>
                    </View>
                ) : (
                    nextTierPoints && (
                        <View style={styles.progressSection}>
                            <View style={styles.progressBarBg}>
                                <View style={[styles.progressBarFill, { width: `${progress * 100}%`, backgroundColor: getTierColor() }]} />
                            </View>
                            <Text style={styles.progressText}>{user.points} / {nextTierPoints} to next reward tier</Text>
                        </View>
                    )
                )}
            </View>

            {/* Footer */}
            <View style={styles.footer}>
                <Text style={styles.footerText}>MEMBER SINCE {new Date(user.memberSince).getFullYear()}</Text>
                {isBlackCard && <Text style={styles.exclusiveText}>PRIVATE ACCESS UNLOCKED</Text>}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        width: SCREEN_WIDTH - 40,
        alignSelf: 'center',
        height: 220, // Increased height for more breathing room
        borderRadius: 24,
        overflow: 'hidden',
        padding: 24,
        marginTop: 20,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.4)',
    },
    blackCardContainer: {
        backgroundColor: '#0F172A',
        borderColor: 'rgba(212, 175, 55, 0.6)',
        borderWidth: 2,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    tierLabel: {
        fontSize: 10, // Slightly smaller for Android safety
        fontWeight: '900',
        letterSpacing: 2.5,
        marginBottom: 2,
    },
    userName: {
        fontSize: 18, // Reduced from 20 for Android safety
        fontWeight: '700',
        color: '#1E293B',
        lineHeight: 24, // Explicit line height
    },
    badge: {
        backgroundColor: 'rgba(255,255,255,0.15)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    badgeText: {
        fontSize: 7,
        fontWeight: '900',
        color: '#64748B',
        letterSpacing: 1,
    },
    pointsSection: {
        marginTop: 12,
    },
    pointsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap', // Protection against overlap
    },
    pointsValue: {
        fontSize: 28, // Balanced for Android
        fontWeight: '800',
        color: '#1E293B',
        lineHeight: 34,
    },
    pointsLabel: {
        fontSize: 10,
        color: '#64748B',
        fontWeight: '700',
        marginTop: -2,
    },
    progressContainer: {
        marginTop: 14,
    },
    progressSection: {
        width: '100%',
    },
    progressBarBg: {
        height: 6,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        borderRadius: 3,
        overflow: 'hidden',
    },
    progressBarFill: {
        height: '100%',
        borderRadius: 3,
    },
    progressText: {
        fontSize: 10,
        color: '#94A3B8',
        marginTop: 8,
        fontWeight: '700',
        letterSpacing: 0.3,
    },
    footer: {
        position: 'absolute',
        bottom: 18,
        left: 24,
        right: 24,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    footerText: {
        fontSize: 9,
        color: '#64748B',
        fontWeight: '800',
        letterSpacing: 1.2,
    },
    exclusiveText: {
        fontSize: 9,
        color: '#D4AF37',
        fontWeight: '900',
        letterSpacing: 0.8,
    },
    claimButton: {
        backgroundColor: '#D4AF37',
        paddingVertical: 8,
        paddingHorizontal: 14,
        borderRadius: 12,
        // iOS Shadows
        shadowColor: '#D4AF37',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 8,
        // Android Shadow
        elevation: 4,
    },
    claimButtonText: {
        color: '#0F172A',
        fontSize: 11,
        fontWeight: '900',
        letterSpacing: 0.2,
    }
});
