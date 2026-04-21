/**
 * ItemDetailModal.tsx
 * -------------------
 * Full-screen bottom-sheet modal showing food item details.
 * Triggered by tapping anywhere on a menu card (not just the ADD button).
 *
 * HOW TO USE (already wired in menu.tsx):
 *   import ItemDetailModal from '../components/ItemDetailModal';
 *   <ItemDetailModal item={selectedItem} rating={ratings[selectedItem._id]}
 *                   visible={!!selectedItem} onClose={() => setSelectedItem(null)}
 *                   onAdd={addToCart} onRemove={removeFromCart} count={getItemCount} />
 */

import React, { useEffect, useRef, useState } from 'react';
import {
    Modal, View, Text, Image, TouchableOpacity,
    StyleSheet, Animated, Dimensions, ScrollView, TextInput,
} from 'react-native';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import MenuImage from './MenuImage';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

type Rating = { average: number; count: number } | undefined;

interface Props {
    item: any;
    rating: Rating;
    visible: boolean;
    onClose: () => void;
    onAdd: (item: any, note: string) => void;
    onRemove: (item: any) => void;
    count: (itemId: string) => number;
}

// Render filled/half/empty star string
function buildStars(average: number) {
    const full = Math.floor(average);
    const half = average - full >= 0.5;
    const empty = 5 - full - (half ? 1 : 0);
    return '★'.repeat(full) + (half ? '⯨' : '') + '☆'.repeat(empty);
}

export default function ItemDetailModal({ item, rating, visible, onClose, onAdd, onRemove, count }: Props) {
    const [note, setNote] = useState('');
    const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
    const backdropOpacity = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (visible) {
            setNote(''); // Clear note when opening
            Animated.parallel([
                Animated.spring(slideAnim, { toValue: 0, friction: 7, tension: 60, useNativeDriver: true }),
                Animated.timing(backdropOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
            ]).start();
        } else {
            Animated.parallel([
                Animated.timing(slideAnim, { toValue: SCREEN_HEIGHT, duration: 250, useNativeDriver: true }),
                Animated.timing(backdropOpacity, { toValue: 0, duration: 200, useNativeDriver: true }),
            ]).start();
        }
    }, [visible]);

    if (!item) return null;

    const qty = count(item._id);
    const hasImage = item.image && item.image.startsWith('http');
    const stars = rating ? buildStars(rating.average) : null;

    const handleAdd = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        onAdd(item, note);
        setNote(''); // Clear after adding 
    };

    const handleRemove = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onRemove(item);
    };

    return (
        <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
            {/* 💎 Premium Glass Backdrop */}
            <Animated.View style={[StyleSheet.absoluteFillObject, { opacity: backdropOpacity }]}>
                <BlurView intensity={30} style={StyleSheet.absoluteFill} tint="dark">
                    <TouchableOpacity style={StyleSheet.absoluteFillObject} onPress={onClose} />
                </BlurView>
            </Animated.View>

            {/* Sliding Glass Card */}
            <Animated.View style={[styles.sheet, { transform: [{ translateY: slideAnim }] }]}>
                <BlurView intensity={95} style={StyleSheet.absoluteFill} tint="light" />
                {/* Drag handle */}
                <View style={styles.handle} />

                <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
                    {/* Food image */}
                    {hasImage ? (
                        <MenuImage uri={item.image} style={styles.heroImage} resizeMode="cover" />
                    ) : (
                        <View style={styles.imagePlaceholder}>
                            <Text style={styles.imagePlaceholderEmoji}>🍽️</Text>
                        </View>
                    )}

                    <View style={styles.content}>
                        {/* Tags row */}
                        <View style={styles.tagsRow}>
                            {item.category && (
                                <View style={styles.tag}>
                                    <Text style={styles.tagText}>{item.category}</Text>
                                </View>
                            )}
                            {item.isSpicy && (
                                <View style={[styles.tag, { backgroundColor: '#FEE2E2' }]}>
                                    <Text style={[styles.tagText, { color: '#991B1B' }]}>🌶️ Spicy</Text>
                                </View>
                            )}
                            {!item.inStock && (
                                <View style={[styles.tag, styles.tagOOS]}>
                                    <Text style={[styles.tagText, { color: '#E65100' }]}>Out of Stock</Text>
                                </View>
                            )}
                        </View>

                        {/* Name + Price */}
                        <Text style={[styles.itemName, item.isCellar && styles.cellarItemNameDetail]}>{item.name}</Text>

                        {item.isCellar && (
                            <View style={styles.cellarMetaRow}>
                                <Text style={styles.cellarMetaText}>{item.vintage} Edition</Text>
                                <View style={styles.metaDivider} />
                                <Text style={styles.cellarMetaText}>{item.origin}</Text>
                            </View>
                        )}

                        <Text style={[styles.itemPrice, item.isCellar && styles.cellarItemPriceDetail]}>₹{item.price}</Text>

                        {/* Star rating */}
                        {!item.isCellar && rating && rating.count > 0 && (
                            <View style={styles.ratingRow}>
                                <Text style={styles.starsFilled}>{stars}</Text>
                                <Text style={styles.ratingText}>
                                    {rating.average} / 5  ·  {rating.count} {rating.count === 1 ? 'review' : 'reviews'}
                                </Text>
                            </View>
                        )}

                        {/* Description / Sommelier Note */}
                        {item.isCellar ? (
                            <View style={styles.cellarNoteContainer}>
                                <View style={styles.noteHeader}>
                                    <Text style={styles.noteIcon}>🍷</Text>
                                    <Text style={styles.noteTitle}>Sommelier's Insight</Text>
                                </View>
                                <Text style={styles.cellarNoteText}>{item.sommelierNote}</Text>
                                <Text style={styles.description}>{item.description}</Text>
                            </View>
                        ) : (
                            item.description ? (
                                <Text style={styles.description}>{item.description}</Text>
                            ) : (
                                <Text style={styles.descriptionPlaceholder}>
                                    Fresh, made-to-order — crafted with love by our kitchen team.
                                </Text>
                            )
                        )}

                        {/* Divider */}
                        <View style={styles.divider} />

                        {/* Special Instructions (Customization) */}
                        {item.inStock && (
                            <View style={styles.instructionsContainer}>
                                <View style={styles.instructionsHeader}>
                                    <Text style={styles.instructionsTitle}>Special Instructions</Text>
                                    <View style={styles.optionalBadge}>
                                        <Text style={styles.optionalText}>Optional</Text>
                                    </View>
                                </View>
                                <TextInput
                                    style={styles.instructionInput}
                                    placeholder="e.g. No onions, extra spicy, etc."
                                    placeholderTextColor="#9CA3AF"
                                    value={note}
                                    onChangeText={setNote}
                                    multiline
                                    maxLength={200}
                                />
                            </View>
                        )}

                        {/* Add / Counter CTA */}
                        {item.inStock ? (
                            qty > 0 ? (
                                <View style={styles.counterRow}>
                                    <TouchableOpacity style={styles.counterBtn} onPress={handleRemove}>
                                        <Text style={styles.counterBtnText}>−</Text>
                                    </TouchableOpacity>
                                    <View style={styles.counterDisplay}>
                                        <Text style={styles.counterCount}>{qty}</Text>
                                        <Text style={styles.counterTotal}>₹{item.price * qty}</Text>
                                    </View>
                                    <TouchableOpacity style={[styles.counterBtn, styles.counterBtnAdd]} onPress={handleAdd}>
                                        <Text style={[styles.counterBtnText, { color: '#FFF' }]}>+</Text>
                                    </TouchableOpacity>
                                </View>
                            ) : (
                                <TouchableOpacity style={[styles.addBtn, item.isCellar && styles.cellarAddBtn]} onPress={handleAdd}>
                                    <Text style={[styles.addBtnText, item.isCellar && styles.cellarAddBtnText]}>Add to Cart  +</Text>
                                </TouchableOpacity>
                            )
                        ) : (
                            <View style={styles.oosBtn}>
                                <Text style={styles.oosBtnText}>Currently Unavailable</Text>
                            </View>
                        )}
                    </View>
                </ScrollView>
            </Animated.View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    backdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    sheet: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'rgba(255,255,255,0.7)', // Semi-transparent for glass effect
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
        maxHeight: SCREEN_HEIGHT * 0.88,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.4)', // Subtle white edge
    },
    handle: {
        width: 40,
        height: 4,
        borderRadius: 2,
        backgroundColor: '#D1D5DB',
        alignSelf: 'center',
        marginTop: 12,
        marginBottom: 6,
    },

    // Image
    heroImage: { width: '100%', height: 240 },
    imagePlaceholder: { width: '100%', height: 160, backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center' },
    imagePlaceholderEmoji: { fontSize: 60 },

    // Content
    content: { padding: 22, paddingBottom: 40 },
    tagsRow: { flexDirection: 'row', marginBottom: 10 },
    tag: { backgroundColor: '#F0F0F8', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20, marginRight: 8 },
    tagOOS: { backgroundColor: '#FFF3E0' },
    tagText: { fontSize: 12, fontWeight: '700', color: '#6C5CE7' },

    itemName: { fontSize: 26, fontWeight: '900', color: '#1A1A1A', marginBottom: 6 },
    itemPrice: { fontSize: 22, fontWeight: '800', color: '#2E7D32', marginBottom: 12 },

    ratingRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
    starsFilled: { fontSize: 16, color: '#F59E0B', marginRight: 8 },
    ratingText: { fontSize: 13, color: '#6B7280', fontWeight: '600' },

    description: { fontSize: 15, color: '#4B5563', lineHeight: 22, marginBottom: 20 },
    descriptionPlaceholder: { fontSize: 14, color: '#9CA3AF', lineHeight: 21, fontStyle: 'italic', marginBottom: 20 },

    divider: { height: 1, backgroundColor: '#F3F4F6', marginBottom: 20 },

    // Add button
    addBtn: { backgroundColor: '#1A1A1A', paddingVertical: 18, borderRadius: 16, alignItems: 'center' },
    addBtnText: { color: '#FFF', fontSize: 17, fontWeight: '800', letterSpacing: 0.5 },

    // Instructions
    instructionsContainer: { marginBottom: 25 },
    instructionsHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 8 },
    instructionsTitle: { fontSize: 16, fontWeight: '700', color: '#1A1A1A' },
    optionalBadge: { backgroundColor: '#F3F4F6', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
    optionalText: { fontSize: 10, fontWeight: '700', color: '#9CA3AF', textTransform: 'uppercase' },
    instructionInput: {
        backgroundColor: '#F9F9F9',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 12,
        padding: 12,
        fontSize: 15,
        color: '#1A1A1A',
        minHeight: 80,
        textAlignVertical: 'top',
    },

    // Counter
    counterRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    counterBtn: { width: 52, height: 52, borderRadius: 14, backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center' },
    counterBtnAdd: { backgroundColor: '#1A1A1A' },
    counterBtnText: { fontSize: 24, fontWeight: '800', color: '#1A1A1A' },
    counterDisplay: { alignItems: 'center' },
    counterCount: { fontSize: 28, fontWeight: '900', color: '#1A1A1A' },
    counterTotal: { fontSize: 14, color: '#6B7280', fontWeight: '600', marginTop: 2 },

    // OOS
    oosBtn: { backgroundColor: '#F9F9F9', paddingVertical: 18, borderRadius: 16, alignItems: 'center', borderWidth: 1, borderColor: '#E5E7EB' },
    oosBtnText: { color: '#9CA3AF', fontSize: 16, fontWeight: '700' },

    // Cellar Premium Styles
    cellarItemNameDetail: { color: '#1E293B', fontFamily: 'serif' },
    cellarItemPriceDetail: { color: '#D4AF37', fontSize: 24 },
    cellarMetaRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 10 },
    cellarMetaText: { fontSize: 13, color: '#64748B', fontWeight: '600', letterSpacing: 0.5 },
    metaDivider: { width: 4, height: 4, borderRadius: 2, backgroundColor: '#CBD5E1' },
    cellarNoteContainer: {
        backgroundColor: '#F8FAFC',
        padding: 16,
        borderRadius: 16,
        borderLeftWidth: 4,
        borderLeftColor: '#D4AF37',
        marginBottom: 20
    },
    noteHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 8 },
    noteIcon: { fontSize: 18 },
    noteTitle: { fontSize: 14, fontWeight: '800', color: '#D4AF37', textTransform: 'uppercase', letterSpacing: 1 },
    cellarNoteText: { fontSize: 15, color: '#334155', fontStyle: 'italic', lineHeight: 22, marginBottom: 12 },
    cellarAddBtn: { backgroundColor: '#0F172A', borderColor: '#D4AF37', borderWidth: 1 },
    cellarAddBtnText: { color: '#D4AF37' },
});
