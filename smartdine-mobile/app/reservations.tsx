import React, { useState } from 'react';
import {
    View, Text, StyleSheet, TextInput, TouchableOpacity,
    ScrollView, SafeAreaView, ActivityIndicator, Alert
} from 'react-native';
import { useRouter } from 'expo-router';
import axios from 'axios';
import { BlurView } from 'expo-blur';
import { Calendar, Clock, Users, MessageSquare, ChevronLeft } from 'lucide-react-native';
import DateTimePicker from '@react-native-community/datetimepicker';

const API_URL = 'http://192.168.1.4:3000';

export default function ReservationsScreen() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [form, setForm] = useState({
        customerName: '',
        phoneNumber: '',
        guestCount: '2',
        specialRequests: ''
    });
    const [date, setDate] = useState(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [mode, setMode] = useState<'date' | 'time'>('date');

    const onDateChange = (event: any, selectedDate?: Date) => {
        setShowDatePicker(false);
        if (selectedDate) {
            setDate(selectedDate);
        }
    };

    const showMode = (currentMode: 'date' | 'time') => {
        setMode(currentMode);
        setShowDatePicker(true);
    };

    const handleBooking = async () => {
        if (!form.customerName || !form.phoneNumber) {
            Alert.alert("Missing Info", "Please provide your name and phone number.");
            return;
        }

        setLoading(true);
        try {
            await axios.post(`${API_URL}/api/reservations`, {
                ...form,
                guestCount: parseInt(form.guestCount),
                reservationTime: date
            });

            Alert.alert(
                "Booking Successful! 🎉",
                "Your table has been requested. We will confirm it shortly.",
                [{ text: "Great!", onPress: () => router.back() }]
            );
        } catch (error) {
            console.error(error);
            Alert.alert("Error", "Failed to place reservation. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <ChevronLeft color="#000" size={28} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Reserve a Table</Text>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <Text style={styles.sectionTitle}>Your Details</Text>

                {/* Name Input */}
                <View style={styles.inputWrapper}>
                    <Text style={styles.label}>Full Name</Text>
                    <View style={styles.inputContainer}>
                        <TextInput
                            style={styles.input}
                            placeholder="Gaurang Shah"
                            value={form.customerName}
                            onChangeText={(txt) => setForm({ ...form, customerName: txt })}
                        />
                    </View>
                </View>

                {/* Phone Input */}
                <View style={styles.inputWrapper}>
                    <Text style={styles.label}>Phone Number</Text>
                    <View style={styles.inputContainer}>
                        <TextInput
                            style={styles.input}
                            placeholder="+91 99999 99999"
                            keyboardType="phone-pad"
                            value={form.phoneNumber}
                            onChangeText={(txt) => setForm({ ...form, phoneNumber: txt })}
                        />
                    </View>
                </View>

                <Text style={styles.sectionTitle}>Booking Details</Text>

                <View style={styles.row}>
                    {/* Guests */}
                    <View style={[styles.inputWrapper, { flex: 1, marginRight: 10 }]}>
                        <Text style={styles.label}>Guests</Text>
                        <View style={styles.inputContainer}>
                            <Users color="#666" size={18} style={{ marginRight: 10 }} />
                            <TextInput
                                style={styles.input}
                                keyboardType="number-pad"
                                value={form.guestCount}
                                onChangeText={(txt) => setForm({ ...form, guestCount: txt })}
                            />
                        </View>
                    </View>

                    {/* Date Picker Trigger */}
                    <TouchableOpacity
                        style={[styles.inputWrapper, { flex: 1.5 }]}
                        onPress={() => showMode('date')}
                    >
                        <Text style={styles.label}>Date</Text>
                        <View style={styles.inputContainer}>
                            <Calendar color="#666" size={18} style={{ marginRight: 10 }} />
                            <Text style={styles.inputText}>{date.toDateString()}</Text>
                        </View>
                    </TouchableOpacity>
                </View>

                {/* Time Picker Trigger */}
                <TouchableOpacity style={styles.inputWrapper} onPress={() => showMode('time')}>
                    <Text style={styles.label}>Time</Text>
                    <View style={styles.inputContainer}>
                        <Clock color="#666" size={18} style={{ marginRight: 10 }} />
                        <Text style={styles.inputText}>
                            {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </Text>
                    </View>
                </TouchableOpacity>

                {/* Special Requests */}
                <View style={styles.inputWrapper}>
                    <Text style={styles.label}>Special Requests (Optional)</Text>
                    <View style={[styles.inputContainer, { alignItems: 'flex-start', paddingTop: 12 }]}>
                        <MessageSquare color="#666" size={18} style={{ marginRight: 10, marginTop: 2 }} />
                        <TextInput
                            style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
                            placeholder="e.g. Window seat, Birthday celebration..."
                            multiline
                            value={form.specialRequests}
                            onChangeText={(txt) => setForm({ ...form, specialRequests: txt })}
                        />
                    </View>
                </View>

                {showDatePicker && (
                    <DateTimePicker
                        value={date}
                        mode={mode}
                        is24Hour={true}
                        display="default"
                        onChange={onDateChange}
                    />
                )}

                <TouchableOpacity
                    style={styles.bookButton}
                    onPress={handleBooking}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <Text style={styles.bookButtonText}>Confirm Reservation</Text>
                    )}
                </TouchableOpacity>

                <Text style={styles.disclaimer}>
                    By clicking confirm, you agree to our booking policy. Cancellations must be made 2 hours in advance.
                </Text>

            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff' },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
    },
    backButton: { marginRight: 15 },
    headerTitle: { fontSize: 20, fontWeight: 'bold' },
    scrollContent: { padding: 25 },
    sectionTitle: { fontSize: 18, fontWeight: '700', marginTop: 10, marginBottom: 15, color: '#000' },
    inputWrapper: { marginBottom: 20 },
    label: { fontSize: 14, fontWeight: '600', color: '#666', marginBottom: 8 },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F9F9F9',
        borderRadius: 12,
        paddingHorizontal: 15,
        paddingVertical: 12,
        borderWidth: 1,
        borderColor: '#F0F0F0',
    },
    input: { flex: 1, fontSize: 16, color: '#000' },
    inputText: { fontSize: 16, color: '#000' },
    row: { flexDirection: 'row', justifyContent: 'space-between' },
    bookButton: {
        backgroundColor: '#000',
        paddingVertical: 18,
        borderRadius: 14,
        alignItems: 'center',
        marginTop: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 5,
    },
    bookButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
    disclaimer: {
        textAlign: 'center',
        fontSize: 12,
        color: '#999',
        marginTop: 25,
        lineHeight: 18,
    }
});
