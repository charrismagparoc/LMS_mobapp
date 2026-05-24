import React, { useState, useMemo } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, Alert, ActivityIndicator, ScrollView,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { registerApi } from '../api/client';
import { useTheme } from '../context/ThemeContext';

export default function RegisterScreen({ navigation }: any) {
  const { theme, isDark, toggleTheme } = useTheme();
  const [form, setForm] = useState({ first_name: '', last_name: '', email: '', phone: '', password: '', confirm: '' });
  const [errors, setErrors] = useState<any>({});
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const s = useMemo(() => makeStyles(theme), [theme]);

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const validate = () => {
    const e: any = {};
    if (!form.first_name.trim()) e.first_name = 'Required';
    if (!form.email.trim()) e.email = 'Required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Invalid email';
    if (!form.password) e.password = 'Required';
    else if (form.password.length < 8) e.password = 'Min 8 characters';
    if (form.password !== form.confirm) e.confirm = 'Passwords do not match';
    setErrors(e);
    return !Object.keys(e).length;
  };

  const handleRegister = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      const res = await registerApi({ first_name: form.first_name.trim(), last_name: form.last_name.trim(), email: form.email.trim().toLowerCase(), phone: form.phone.trim(), password: form.password });
      // Navigate to PIN verification screen
      navigation.navigate('VerifyPin', { email: form.email.trim().toLowerCase() });
    } catch (err: any) {
      if (!err.response) {
        Alert.alert('Connection Error', 'Cannot reach the server. Make sure:\n• Django backend is running\n• Your phone and PC are on the same Wi-Fi\n• The API URL is correct');
        return;
      }
      const data = err.response?.data;
      if (data && typeof data === 'object') {
        const e: any = {};
        Object.keys(data).forEach(k => {
          e[k] = Array.isArray(data[k]) ? data[k][0] : String(data[k]);
        });
        setErrors(e);
        // Show a top-level alert for the most important error
        const firstErr = Object.values(e)[0] as string;
        if (firstErr) Alert.alert('Registration Error', firstErr);
      } else {
        Alert.alert('Error', typeof data === 'string' ? data : 'Registration failed. Please try again.');
      }
    } finally { setLoading(false); }
  };

  return (
    <KeyboardAvoidingView style={s.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <StatusBar style={isDark ? 'light' : 'dark'} backgroundColor={theme.bg} />
      <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
        <TouchableOpacity style={s.themeBtn} onPress={toggleTheme}>
          <Ionicons name={isDark ? 'sunny-outline' : 'moon-outline'} size={15} color={theme.text} />
          <Text style={s.themeBtnText}>{isDark ? ' Light Mode' : ' Dark Mode'}</Text>
        </TouchableOpacity>

        <View style={s.card}>
          <Text style={s.title}>Create Account</Text>
          <Text style={s.sub}>Join Librarium today</Text>

          <View style={{ flexDirection: 'row', gap: 10 }}>
            <View style={{ flex: 1 }}>
              <Text style={s.label}>First Name *</Text>
              <View style={s.inputWrap}>
                <Ionicons name="person-outline" size={17} color={theme.textMuted} style={s.inputIcon} />
                <TextInput style={[s.input, errors.first_name && s.inputErr]} value={form.first_name} onChangeText={v => set('first_name', v)} placeholder="John" placeholderTextColor={theme.textMuted} />
              </View>
              {errors.first_name ? <Text style={s.err}>{errors.first_name}</Text> : null}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.label}>Last Name</Text>
              <View style={s.inputWrap}>
                <Ionicons name="person-outline" size={17} color={theme.textMuted} style={s.inputIcon} />
                <TextInput style={[s.input, errors.last_name && s.inputErr]} value={form.last_name} onChangeText={v => set('last_name', v)} placeholder="Doe" placeholderTextColor={theme.textMuted} />
              </View>
            </View>
          </View>

          <Text style={s.label}>Email Address *</Text>
          <View style={s.inputWrap}>
            <Ionicons name="mail-outline" size={17} color={theme.textMuted} style={s.inputIcon} />
            <TextInput style={[s.input, errors.email && s.inputErr]} value={form.email} onChangeText={v => set('email', v)} placeholder="you@email.com" placeholderTextColor={theme.textMuted} keyboardType="email-address" autoCapitalize="none" />
          </View>
          {errors.email ? <Text style={s.err}>{errors.email}</Text> : null}

          <Text style={s.label}>Phone</Text>
          <View style={s.inputWrap}>
            <Ionicons name="call-outline" size={17} color={theme.textMuted} style={s.inputIcon} />
            <TextInput style={s.input} value={form.phone} onChangeText={v => set('phone', v)} placeholder="+63 9XX XXX XXXX" placeholderTextColor={theme.textMuted} keyboardType="phone-pad" />
          </View>

          <Text style={s.label}>Password *</Text>
          <View style={s.inputWrap}>
            <Ionicons name="lock-closed-outline" size={17} color={theme.textMuted} style={s.inputIcon} />
            <TextInput style={[s.input, s.passInput, errors.password && s.inputErr]} value={form.password} onChangeText={v => set('password', v)} placeholder="Min 8 characters" placeholderTextColor={theme.textMuted} secureTextEntry={!showPass} />
            <TouchableOpacity style={s.eye} onPress={() => setShowPass(v => !v)}>
              <Ionicons name={showPass ? 'eye-off-outline' : 'eye-outline'} size={20} color={theme.textMuted} />
            </TouchableOpacity>
          </View>
          {errors.password ? <Text style={s.err}>{errors.password}</Text> : null}

          <Text style={s.label}>Confirm Password *</Text>
          <View style={s.inputWrap}>
            <Ionicons name="lock-closed-outline" size={17} color={theme.textMuted} style={s.inputIcon} />
            <TextInput style={[s.input, s.passInput, errors.confirm && s.inputErr]} value={form.confirm} onChangeText={v => set('confirm', v)} placeholder="Repeat password" placeholderTextColor={theme.textMuted} secureTextEntry={!showPass} />
          </View>
          {errors.confirm ? <Text style={s.err}>{errors.confirm}</Text> : null}

          <TouchableOpacity style={[s.btn, loading && s.btnOff]} onPress={handleRegister} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.btnText}>Create Account</Text>}
          </TouchableOpacity>

          <View style={s.row}>
            <Text style={s.mutedText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={s.link}>Sign in</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={s.note}>
          <Ionicons name="mail-outline" size={13} color={theme.indigoLight} />
          <Text style={s.noteText}> You'll receive a 6-digit PIN by email to activate your account</Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function makeStyles(t: any) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: t.bg },
    scroll: { flexGrow: 1, padding: 20 },
    themeBtn: { flexDirection: 'row', alignSelf: 'flex-end', alignItems: 'center', backgroundColor: t.surface2, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 7, borderWidth: 1, borderColor: t.border, marginBottom: 12 },
    themeBtnText: { color: t.text, fontSize: 13, fontWeight: '700' },
    card: { backgroundColor: t.surface, borderRadius: 20, padding: 24, borderWidth: 1, borderColor: t.borderAccent },
    title: { fontSize: 22, fontWeight: '800', color: t.text, marginBottom: 4 },
    sub: { fontSize: 14, color: t.textMuted, marginBottom: 20 },
    label: { fontSize: 12, fontWeight: '700', color: t.textMuted, marginBottom: 6, marginTop: 10, textTransform: 'uppercase', letterSpacing: 0.5 },
    inputWrap: { position: 'relative', marginBottom: 2 },
    inputIcon: { position: 'absolute', left: 13, top: 13, zIndex: 1 },
    input: { backgroundColor: t.surface2, borderWidth: 1, borderColor: t.borderAccent, borderRadius: 12, paddingVertical: 13, paddingLeft: 40, paddingRight: 14, fontSize: 15, color: t.text },
    inputErr: { borderColor: t.red },
    passInput: { paddingRight: 48 },
    eye: { position: 'absolute', right: 14, top: 13 },
    err: { fontSize: 12, color: t.red, marginBottom: 4, marginTop: 2 },
    btn: { backgroundColor: t.indigo, borderRadius: 12, padding: 15, alignItems: 'center', marginTop: 20, marginBottom: 16 },
    btnOff: { opacity: 0.6 },
    btnText: { color: '#fff', fontSize: 16, fontWeight: '800' },
    row: { flexDirection: 'row', justifyContent: 'center' },
    mutedText: { color: t.textMuted, fontSize: 14 },
    link: { color: t.indigoLight, fontSize: 14, fontWeight: '700' },
    note: { flexDirection: 'row', alignItems: 'center', marginTop: 20, padding: 12, backgroundColor: t.surface2, borderRadius: 12, borderWidth: 1, borderColor: t.borderAccent },
    noteText: { color: t.indigoLight, fontSize: 12 },
  });
}
