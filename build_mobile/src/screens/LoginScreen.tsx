import React, { useState, useMemo } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, Alert, ActivityIndicator, ScrollView, Image,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { loginApi } from '../api/client';

export default function LoginScreen({ navigation }: any) {
  const { login } = useAuth();
  const { theme, isDark, toggleTheme } = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<any>({});
  const s = useMemo(() => makeStyles(theme), [theme]);

  const validate = () => {
    const e: any = {};
    if (!email.trim()) e.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(email)) e.email = 'Invalid email format';
    if (!password) e.password = 'Password is required';
    setErrors(e);
    return !Object.keys(e).length;
  };

  const handleLogin = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      const res = await loginApi(email.trim().toLowerCase(), password);
      await login(res.data.user, res.data.access, res.data.refresh);
    } catch (err: any) {
      if (!err.response) {
        Alert.alert('Connection Error', 'Cannot reach the server. Make sure:\n• Django backend is running on port 8000\n• Your phone and PC are on the same Wi-Fi');
        return;
      }
      const data = err.response?.data;
      if (data?.not_activated) {
        Alert.alert(
          'Account Not Activated',
          'Your account email has not been verified yet. Would you like to verify it now?',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Verify Now', onPress: () => navigation.navigate('VerifyPin', { email: data.email || email.trim().toLowerCase() }) },
          ]
        );
      } else {
        const msg = data?.error || data?.detail || JSON.stringify(data) || 'Login failed.';
        Alert.alert('Login Failed', msg);
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

        <View style={s.logo}>
          <Image source={require('../../assets/icon.png')} style={s.logoImage} resizeMode="contain" />
          <Text style={s.logoName}>Librarium</Text>
          <Text style={s.logoSub}>Library Management System</Text>
        </View>

        <View style={s.card}>
          <Text style={s.title}>Welcome Back</Text>
          <Text style={s.sub}>Sign in to continue</Text>

          <Text style={s.label}>Email Address</Text>
          <View style={s.inputWrap}>
            <Ionicons name="mail-outline" size={18} color={theme.textMuted} style={s.inputIcon} />
            <TextInput
              style={[s.input, errors.email && s.inputErr]}
              value={email}
              onChangeText={setEmail}
              placeholder="you@email.com"
              placeholderTextColor={theme.textMuted}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>
          {errors.email ? <Text style={s.err}>{errors.email}</Text> : null}

          <Text style={s.label}>Password</Text>
          <View style={s.inputWrap}>
            <Ionicons name="lock-closed-outline" size={18} color={theme.textMuted} style={s.inputIcon} />
            <TextInput
              style={[s.input, s.passInput, errors.password && s.inputErr]}
              value={password}
              onChangeText={setPassword}
              placeholder="Your password"
              placeholderTextColor={theme.textMuted}
              secureTextEntry={!showPass}
            />
            <TouchableOpacity style={s.eye} onPress={() => setShowPass(v => !v)}>
              <Ionicons name={showPass ? 'eye-off-outline' : 'eye-outline'} size={20} color={theme.textMuted} />
            </TouchableOpacity>
          </View>
          {errors.password ? <Text style={s.err}>{errors.password}</Text> : null}

          <TouchableOpacity style={[s.btn, loading && s.btnOff]} onPress={handleLogin} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.btnText}>Sign In</Text>}
          </TouchableOpacity>

          <View style={s.row}>
            <Text style={s.mutedText}>Don't have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
              <Text style={s.link}>Register here</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={s.note}>
          <Ionicons name="information-circle-outline" size={13} color={theme.indigoLight} />
          <Text style={s.noteText}> New accounts may need staff approval before borrowing is enabled</Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function makeStyles(t: any) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: t.bg },
    scroll: { flexGrow: 1, justifyContent: 'center', padding: 20 },
    themeBtn: { flexDirection: 'row', alignSelf: 'flex-end', alignItems: 'center', backgroundColor: t.surface2, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 7, borderWidth: 1, borderColor: t.border, marginBottom: 12 },
    themeBtnText: { color: t.text, fontSize: 13, fontWeight: '700' },
    logo: { alignItems: 'center', marginBottom: 32 },
    logoImage: { width: 100, height: 100, borderRadius: 22 },
    logoName: { fontSize: 28, fontWeight: '800', color: t.text, marginTop: 12 },
    logoSub: { fontSize: 13, color: t.textMuted, marginTop: 4 },
    card: { backgroundColor: t.surface, borderRadius: 20, padding: 24, borderWidth: 1, borderColor: t.borderAccent },
    title: { fontSize: 22, fontWeight: '800', color: t.text, marginBottom: 4 },
    sub: { fontSize: 14, color: t.textMuted, marginBottom: 24 },
    label: { fontSize: 12, fontWeight: '700', color: t.textMuted, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 },
    inputWrap: { position: 'relative', marginBottom: 4 },
    inputIcon: { position: 'absolute', left: 13, top: 13, zIndex: 1 },
    input: { backgroundColor: t.surface2, borderWidth: 1, borderColor: t.borderAccent, borderRadius: 12, paddingVertical: 13, paddingLeft: 42, paddingRight: 14, fontSize: 15, color: t.text },
    inputErr: { borderColor: t.red },
    passInput: { paddingRight: 48 },
    eye: { position: 'absolute', right: 14, top: 13 },
    err: { fontSize: 12, color: t.red, marginBottom: 8, marginTop: 2 },
    btn: { backgroundColor: t.indigo, borderRadius: 12, padding: 15, alignItems: 'center', marginTop: 12, marginBottom: 18 },
    btnOff: { opacity: 0.6 },
    btnText: { color: '#fff', fontSize: 16, fontWeight: '800' },
    row: { flexDirection: 'row', justifyContent: 'center' },
    mutedText: { color: t.textMuted, fontSize: 14 },
    link: { color: t.indigoLight, fontSize: 14, fontWeight: '700' },
    note: { flexDirection: 'row', alignItems: 'center', marginTop: 20, padding: 12, backgroundColor: t.surface2, borderRadius: 12, borderWidth: 1, borderColor: t.borderAccent },
    noteText: { color: t.indigoLight, fontSize: 12 },
  });
}
