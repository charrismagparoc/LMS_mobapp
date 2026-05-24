import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator, Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { getBorrows, getDashboard } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';


function StatCard({ iconName, label, value, color, theme }: any) {
  return (
    <View style={{
      width: '30%', backgroundColor: theme.surface, borderRadius: 14, padding: 12,
      alignItems: 'center', borderTopWidth: 3, borderTopColor: color,
      borderWidth: 1, borderColor: theme.borderAccent,
    }}>
      <Ionicons name={iconName} size={22} color={color} style={{ marginBottom: 4 }} />
      <Text style={{ fontSize: 22, fontWeight: '800', color }}>{value ?? '0'}</Text>
      <Text style={{ fontSize: 10, color: theme.textMuted, textAlign: 'center', marginTop: 2 }}>{label}</Text>
    </View>
  );
}

const STATUS_COLORS: any = {
  pending: '#f59e0b', borrowed: '#10b981',
  returned: '#64748b', overdue: '#ef4444', rejected: '#94a3b8',
};

const QUICK_ACTIONS = [
  { iconName: 'book-outline',             label: 'Browse Books', tab: 'Books' },
  { iconName: 'list-outline',             label: 'My Borrows',   tab: 'MyBorrows' },
  { iconName: 'person-circle-outline',    label: 'Profile',      tab: 'Profile' },
];

export default function DashboardScreen({ navigation }: any) {
  const { user, logout }       = useAuth();
  const { theme, isDark, toggleTheme } = useTheme();
  const [stats,     setStats]     = useState<any>(null);
  const [recent,    setRecent]    = useState<any[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [d, b] = await Promise.all([getDashboard(), getBorrows()]);
      setStats(d.data);
      setRecent(Array.isArray(b.data) ? b.data.slice(0, 4) : []);
    } catch {} finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const s = useMemo(() => makeStyles(theme), [theme]);

  if (loading) return (
    <View style={s.center}>
      <StatusBar style={isDark ? 'light' : 'dark'} backgroundColor={theme.bg} />
      <ActivityIndicator size="large" color={theme.indigo} />
    </View>
  );

  const isAdmin = user?.is_staff;

  return (
    <ScrollView
      style={s.container}
      contentContainerStyle={s.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData(); }} tintColor={theme.indigo} />}
    >
      <StatusBar style={isDark ? 'light' : 'dark'} backgroundColor={theme.bg} />

      {/* Header */}
      <View style={s.header}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <Image source={require('../../assets/icon.png')} style={{ width: 40, height: 40, borderRadius: 10 }} resizeMode="contain" />
          <View>
            <Text style={s.greeting}>Good day,</Text>
            <Text style={s.name}>{user?.first_name || 'User'}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 3 }}>
              <Ionicons name={isAdmin ? 'shield-checkmark-outline' : 'book-outline'} size={12} color={theme.indigoLight} />
              <Text style={s.role}>{isAdmin ? 'Administrator' : 'Member'}</Text>
            </View>
          </View>
        </View>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <TouchableOpacity style={s.themeBtn} onPress={toggleTheme}>
            <Ionicons name={isDark ? 'sunny-outline' : 'moon-outline'} size={18} color={theme.text} />
          </TouchableOpacity>
          <TouchableOpacity style={s.logoutBtn} onPress={logout}>
            <Text style={s.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Stats */}
      <Text style={s.sectionTitle}>Overview</Text>
      <View style={s.grid}>
        {isAdmin ? (
          <>
            <StatCard iconName="library-outline"          label="Total Books"  value={stats?.total_books}    color={theme.indigo}    theme={theme} />
            <StatCard iconName="checkmark-circle-outline" label="Available"    value={stats?.available_books} color={theme.emerald}  theme={theme} />
            <StatCard iconName="people-outline"           label="Members"      value={stats?.total_members}  color="#3b82f6"         theme={theme} />
            <StatCard iconName="book-outline"             label="Active"       value={stats?.active_borrows} color={theme.amber}     theme={theme} />
            <StatCard iconName="alert-circle-outline"     label="Overdue"      value={stats?.overdue_count}  color={theme.red}       theme={theme} />
            <StatCard iconName="time-outline"             label="Pending"      value={stats?.pending_count}  color={theme.violet}    theme={theme} />
          </>
        ) : (
          <>
            <StatCard iconName="book-outline"             label="Active"       value={stats?.my_active}       color={theme.emerald}  theme={theme} />
            <StatCard iconName="alert-circle-outline"     label="Overdue"      value={stats?.my_overdue}      color={theme.red}      theme={theme} />
            <StatCard iconName="time-outline"             label="Pending"      value={stats?.my_pending}      color={theme.amber}    theme={theme} />
            <StatCard iconName="checkmark-circle-outline" label="Returned"     value={stats?.my_returned}     color={theme.textMuted} theme={theme} />
            <StatCard iconName="library-outline"          label="All Books"    value={stats?.total_books}     color={theme.indigo}   theme={theme} />
            <StatCard iconName="albums-outline"           label="Available"    value={stats?.available_books} color="#3b82f6"        theme={theme} />
          </>
        )}
      </View>

      {/* Quick Actions */}
      <Text style={s.sectionTitle}>Quick Actions</Text>
      <View style={s.actions}>
        {QUICK_ACTIONS.map(a => (
          <TouchableOpacity key={a.tab} style={s.actionBtn} onPress={() => navigation.navigate(a.tab)}>
            <Ionicons name={a.iconName as any} size={26} color={theme.indigoLight} style={{ marginBottom: 6 }} />
            <Text style={s.actionLabel}>{a.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Recent Activity */}
      {recent.length > 0 && (
        <>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <Text style={s.sectionTitle}>Recent Activity</Text>
            <TouchableOpacity onPress={() => navigation.navigate('MyBorrows')}>
              <Text style={{ color: theme.indigoLight, fontSize: 13 }}>See all →</Text>
            </TouchableOpacity>
          </View>
          {recent.map((r: any) => (
            <View key={r.id} style={s.borrowCard}>
              <View style={{ flex: 1 }}>
                <Text style={s.bookTitle} numberOfLines={1}>{r.book?.title}</Text>
                <Text style={s.bookAuthor}>{r.book?.author}</Text>
                {r.status === 'overdue' && (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }}>
                    <Ionicons name="alert-circle" size={12} color={theme.red} />
                    <Text style={{ color: theme.red, fontSize: 11 }}>{r.overdue_days} days overdue</Text>
                  </View>
                )}
              </View>
              <View style={[s.badge, { backgroundColor: (STATUS_COLORS[r.status] || '#64748b') + '20' }]}>
                <Text style={[s.badgeText, { color: STATUS_COLORS[r.status] || '#64748b' }]}>
                  {r.status?.toUpperCase()}
                </Text>
              </View>
            </View>
          ))}
        </>
      )}
    </ScrollView>
  );
}

function makeStyles(t: any) {
  return StyleSheet.create({
    container:   { flex: 1, backgroundColor: t.bg },
    content:     { padding: 16, paddingBottom: 40 },
    center:      { flex: 1, backgroundColor: t.bg, justifyContent: 'center', alignItems: 'center' },
    header:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 },
    greeting:    { fontSize: 13, color: t.textMuted },
    name:        { fontSize: 22, fontWeight: '800', color: t.text },
    role:        { fontSize: 12, color: t.indigoLight },
    themeBtn:    { backgroundColor: t.surface2, borderRadius: 10, padding: 8, borderWidth: 1, borderColor: t.border },
    logoutBtn:   { backgroundColor: 'rgba(239,68,68,0.1)', borderWidth: 1, borderColor: 'rgba(239,68,68,0.3)', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 7 },
    logoutText:  { color: t.red, fontSize: 13, fontWeight: '700' },
    sectionTitle:{ fontSize: 15, fontWeight: '800', color: t.text, marginBottom: 12, letterSpacing: 0.2 },
    grid:        { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 24 },
    actions:     { flexDirection: 'row', gap: 10, marginBottom: 24 },
    actionBtn:   { flex: 1, backgroundColor: t.surface, borderRadius: 14, padding: 14, alignItems: 'center', borderWidth: 1, borderColor: t.borderAccent },
    actionLabel: { fontSize: 10, color: t.textMuted, textAlign: 'center' },
    borrowCard:  { backgroundColor: t.surface, borderRadius: 14, padding: 14, marginBottom: 10, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: t.borderAccent },
    bookTitle:   { fontSize: 14, fontWeight: '700', color: t.text, opacity: 1 },
    bookAuthor:  { fontSize: 12, color: t.text, opacity: 0.7, marginTop: 2 },
    badge:       { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
    badgeText:   { fontSize: 10, fontWeight: '700' },
  });
}