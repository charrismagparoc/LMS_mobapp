import React, { useState, useMemo, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, Alert, ActivityIndicator, ScrollView,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../api/client';
import { useTheme } from '../context/ThemeContext';

export default function VerifyPinScreen({ route, navigation }: any) {
  const { theme, isDark } = useTheme();
  const { email } = route.params as { email: string };
  const s = useMemo(() => makeStyles(theme), [theme]);

  const [pin, setPin] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const inputs = useRef<any[]>([]);

  const pinString = pin.join('');

  const handleChange = (val: string, idx: number) => {
    const digit = val.replace(/[^0-9]/g, '').slice(-1);
    const next = [...pin];
    next[idx] = digit;
    setPin(next);
    if (digit && idx < 5) {
      inputs.current[idx + 1]?.focus();
    }
  };

  const handleKeyPress = (e: any, idx: number) => {
    if (e.nativeEvent.key === 'Backspace' && !pin[idx] && idx > 0) {
      inputs.current[idx - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    if (pinString.length < 6) {
      Alert.alert('Enter PIN', 'Please enter all 6 digits.');
      return;
    }
    setLoading(true);
    try {
      await api.post('/auth/verify-pin/', { email, pin: pinString });
      Alert.alert(
        'Account Activated!',
        'Your account is now active. You can log in.',
        [{ text: 'Log In', onPress: () => navigation.navigate('Login') }]
      );
    } catch (err: any) {
      const msg = err.response?.data?.error || 'Verification failed.';
      Alert.alert('Error', msg);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    try {
      await api.post('/auth/request-pin/', { email });
      Alert.alert('PIN Sent', 'A new PIN has been sent to your email.');
      setPin(['', '', '', '', '', '']);
      inputs.current[0]?.focus();
    } catch (err: any) {
      const msg = err.response?.data?.error || 'Could not resend PIN.';
      Alert.alert('Error', msg);
    } finally {
      setResending(false);
    }
  };

  return (
    <KeyboardAvoidingView style={s.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <StatusBar style={isDark ? 'light' : 'dark'} backgroundColor={theme.bg} />
      <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
        <View style={s.card}>
          <View style={s.iconWrap}>
            <Ionicons name="mail-open-outline" size={40} color={theme.indigoLight} />
          </View>
          <Text style={s.title}>Check Your Email</Text>
          <Text style={s.sub}>
            We sent a 6-digit activation PIN to:
          </Text>
          <Text style={s.email}>{email}</Text>

          <Text style={s.label}>Enter PIN</Text>
          <View style={s.pinRow}>
            {pin.map((digit, idx) => (
              <TextInput
                key={idx}
                ref={r => (inputs.current[idx] = r)}
                style={[s.pinBox, digit ? s.pinBoxFilled : null]}
                value={digit}
                onChangeText={v => handleChange(v, idx)}
                onKeyPress={e => handleKeyPress(e, idx)}
                keyboardType="number-pad"
                maxLength={1}
                selectTextOnFocus
                returnKeyType="next"
              />
            ))}
          </View>

          <TouchableOpacity
            style={[s.btn, (loading || pinString.length < 6) && s.btnOff]}
            onPress={handleVerify}
            disabled={loading || pinString.length < 6}
          >
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={s.btnText}>Verify & Activate</Text>}
          </TouchableOpacity>

          <View style={s.resendRow}>
            <Text style={s.mutedText}>Didn't receive it? </Text>
            <TouchableOpacity onPress={handleResend} disabled={resending}>
              {resending
                ? <ActivityIndicator size="small" color={theme.indigoLight} />
                : <Text style={s.link}>Resend PIN</Text>}
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={s.backBtn} onPress={() => navigation.navigate('Login')}>
            <Ionicons name="arrow-back-outline" size={15} color={theme.textMuted} />
            <Text style={s.backText}> Back to Login</Text>
          </TouchableOpacity>
        </View>

        <View style={s.note}>
          <Ionicons name="information-circle-outline" size={13} color={theme.indigoLight} />
          <Text style={s.noteText}> PIN expires in 30 minutes. Check your spam folder if not found.</Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function makeStyles(t: any) {
  return StyleSheet.create({
    container:   { flex: 1, backgroundColor: t.bg },
    scroll:      { flexGrow: 1, padding: 20, justifyContent: 'center' },
    card:        { backgroundColor: t.surface, borderRadius: 20, padding: 24, borderWidth: 1, borderColor: t.borderAccent },
    iconWrap:    { alignItems: 'center', marginBottom: 12 },
    title:       { fontSize: 22, fontWeight: '800', color: t.text, textAlign: 'center', marginBottom: 8 },
    sub:         { fontSize: 14, color: t.textMuted, textAlign: 'center' },
    email:       { fontSize: 14, fontWeight: '700', color: t.indigoLight, textAlign: 'center', marginBottom: 20, marginTop: 4 },
    label:       { fontSize: 12, fontWeight: '700', color: t.textMuted, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5, textAlign: 'center' },
    pinRow:      { flexDirection: 'row', justifyContent: 'center', gap: 10, marginBottom: 24 },
    pinBox:      { width: 44, height: 54, borderRadius: 12, borderWidth: 2, borderColor: t.borderAccent, backgroundColor: t.surface2, textAlign: 'center', fontSize: 22, fontWeight: '800', color: t.text },
    pinBoxFilled:{ borderColor: t.indigoLight },
    btn:         { backgroundColor: t.indigo, borderRadius: 12, padding: 15, alignItems: 'center', marginBottom: 16 },
    btnOff:      { opacity: 0.5 },
    btnText:     { color: '#fff', fontSize: 16, fontWeight: '800' },
    resendRow:   { flexDirection: 'row', justifyContent: 'center', marginBottom: 16 },
    mutedText:   { color: t.textMuted, fontSize: 14 },
    link:        { color: t.indigoLight, fontSize: 14, fontWeight: '700' },
    backBtn:     { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
    backText:    { color: t.textMuted, fontSize: 13 },
    note:        { flexDirection: 'row', alignItems: 'center', marginTop: 20, padding: 12, backgroundColor: t.surface2, borderRadius: 12, borderWidth: 1, borderColor: t.borderAccent },
    noteText:    { color: t.indigoLight, fontSize: 12, flex: 1 },
  });
}
