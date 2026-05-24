import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, ActivityIndicator,
  RefreshControl, Alert, ScrollView,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { getBorrows, approveBorrow, rejectBorrow, returnBook } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

const TABS = ['All', 'pending', 'borrowed', 'overdue', 'returned', 'rejected'];

// Status config — icon is now an Ionicons name, not emoji
const SC: Record<string, { c: string; bg: string; icon: string }> = {
  pending:  { c: '#f59e0b', bg: '#f59e0b15', icon: 'time-outline' },
  borrowed: { c: '#10b981', bg: '#10b98115', icon: 'book-outline' },
  returned: { c: '#64748b', bg: '#64748b15', icon: 'checkmark-circle-outline' },
  overdue:  { c: '#ef4444', bg: '#ef444415', icon: 'alert-circle-outline' },
  rejected: { c: '#94a3b8', bg: '#94a3b815', icon: 'close-circle-outline' },
};

export default function MyBorrowsScreen() {
  const { user }    = useAuth();
  const { theme, isDark } = useTheme();
  const [borrows,    setBorrows]    = useState<any[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [tab,        setTab]        = useState('All');

  const fetchBorrows = useCallback(async () => {
    try {
      const p = tab !== 'All' ? { status: tab } : {};
      const res = await getBorrows(p);
      setBorrows(res.data);
    } catch {} finally { setLoading(false); setRefreshing(false); }
  }, [tab]);

  useEffect(() => { fetchBorrows(); }, [fetchBorrows]);

  const confirm = (title: string, msg: string, fn: () => void) =>
    Alert.alert(title, msg, [{ text: 'Cancel', style: 'cancel' }, { text: 'Confirm', onPress: fn }]);

  const doApprove = (r: any) =>
    confirm('Approve Borrow?', `Approve borrow for "${r.book?.title}"?`, async () => {
      try { await approveBorrow(r.id); fetchBorrows(); Alert.alert('Approved', 'Borrow request approved!'); }
      catch { Alert.alert('Error', 'Failed to approve.'); }
    });

  const doReject = (r: any) =>
    confirm('Reject Borrow?', `Reject borrow for "${r.book?.title}"?`, async () => {
      try { await rejectBorrow(r.id, { admin_notes: 'Rejected by admin' }); fetchBorrows(); }
      catch { Alert.alert('Error', 'Failed to reject.'); }
    });

  const doReturn = (r: any) =>
    confirm('Mark as Returned?', `Mark "${r.book?.title}" as returned?`, async () => {
      try { await returnBook(r.id); fetchBorrows(); Alert.alert('Returned', 'Book marked as returned!'); }
      catch { Alert.alert('Error', 'Failed to mark returned.'); }
    });

  const renderItem = ({ item: r }: any) => {
    const cfg = SC[r.status] || SC.pending;
    return (
      <View style={{ backgroundColor: theme.surface, borderRadius: 14, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: theme.borderAccent }}>

        {/* Title + status badge */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
          <View style={{ flex: 1, marginRight: 10 }}>
            <Text style={{ fontSize: 15, fontWeight: '700', color: theme.text }} numberOfLines={1}>{r.book?.title}</Text>
            <Text style={{ fontSize: 12, color: theme.textMuted, marginTop: 2 }}>{r.book?.author}</Text>
            {user?.is_staff && (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 }}>
                <Ionicons name="person-outline" size={12} color={theme.indigoLight} />
                <Text style={{ fontSize: 12, color: theme.indigoLight }}>
                  {r.member?.name || r.member?.email || 'Unknown'}
                </Text>
              </View>
            )}
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, backgroundColor: cfg.bg }}>
            <Ionicons name={cfg.icon as any} size={11} color={cfg.c} />
            <Text style={{ fontSize: 10, fontWeight: '700', color: cfg.c }}>{r.status?.toUpperCase()}</Text>
          </View>
        </View>

        {/* Dates */}
        <View style={{ flexDirection: 'row', gap: 20, marginBottom: 6 }}>
          <View>
            <Text style={{ fontSize: 10, color: theme.textMuted }}>Borrowed</Text>
            <Text style={{ fontSize: 12, fontWeight: '700', color: theme.textMuted }}>{r.borrow_date}</Text>
          </View>
          <View>
            <Text style={{ fontSize: 10, color: theme.textMuted }}>Due Date</Text>
            <Text style={{ fontSize: 12, fontWeight: '700', color: r.status === 'overdue' ? '#ef4444' : theme.textMuted }}>{r.due_date}</Text>
          </View>
          {r.return_date && (
            <View>
              <Text style={{ fontSize: 10, color: theme.textMuted }}>Returned</Text>
              <Text style={{ fontSize: 12, fontWeight: '700', color: theme.textMuted }}>{r.return_date}</Text>
            </View>
          )}
        </View>

        {/* Overdue warning */}
        {r.status === 'overdue' && (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#ef444410', padding: 8, borderRadius: 8, marginBottom: 6 }}>
            <Ionicons name="alert-circle" size={14} color="#ef4444" />
            <Text style={{ fontSize: 12, color: '#ef4444' }}>
              {r.overdue_days} days overdue — ₱{r.overdue_days * 5} fine
            </Text>
          </View>
        )}

        {r.notes      ? <Text style={{ fontSize: 12, color: theme.textMuted, fontStyle: 'italic', marginTop: 4 }}>Note: {r.notes}</Text> : null}
        {r.admin_notes ? <Text style={{ fontSize: 12, color: theme.indigoLight, fontStyle: 'italic', marginTop: 2 }}>Admin: {r.admin_notes}</Text> : null}

        {/* Admin action buttons */}
        {user?.is_staff && (
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
            {r.status === 'pending' && (
              <>
                <TouchableOpacity
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, backgroundColor: '#10b98120' }}
                  onPress={() => doApprove(r)}
                >
                  <Ionicons name="checkmark-circle-outline" size={15} color="#10b981" />
                  <Text style={{ color: '#10b981', fontWeight: '700', fontSize: 13 }}>Approve</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, backgroundColor: '#ef444420' }}
                  onPress={() => doReject(r)}
                >
                  <Ionicons name="close-circle-outline" size={15} color="#ef4444" />
                  <Text style={{ color: '#ef4444', fontWeight: '700', fontSize: 13 }}>Reject</Text>
                </TouchableOpacity>
              </>
            )}
            {(r.status === 'borrowed' || r.status === 'overdue') && (
              <TouchableOpacity
                style={{ flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, backgroundColor: theme.indigo + '20' }}
                onPress={() => doReturn(r)}
              >
                <Ionicons name="refresh-circle-outline" size={15} color={theme.indigoLight} />
                <Text style={{ color: theme.indigoLight, fontWeight: '700', fontSize: 13 }}>Mark Returned</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
    );
  };

  if (loading) return (
    <View style={{ flex: 1, backgroundColor: theme.bg, justifyContent: 'center', alignItems: 'center' }}>
      <ActivityIndicator size="large" color={theme.indigo} />
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg }}>
      <StatusBar style={isDark ? 'light' : 'dark'} backgroundColor={theme.bg} />

      {/* Status filter tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ maxHeight: 58, backgroundColor: theme.bg }}
        contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 10, gap: 8 }}
      >
        {TABS.map(t => (
          <TouchableOpacity
            key={t}
            style={{ paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: tab === t ? theme.indigo : theme.surface, borderWidth: 1, borderColor: tab === t ? theme.indigo : theme.borderAccent }}
            onPress={() => setTab(t)}
          >
            <Text style={{ color: tab === t ? '#fff' : theme.textMuted, fontSize: 12, fontWeight: '600' }}>
              {t === 'All' ? 'All' : t.charAt(0).toUpperCase() + t.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <FlatList
        data={borrows}
        keyExtractor={r => String(r.id)}
        renderItem={renderItem}
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchBorrows(); }} tintColor={theme.indigo} />}
        ListEmptyComponent={<Text style={{ color: theme.textMuted, textAlign: 'center', marginTop: 40, fontSize: 15 }}>No records found.</Text>}
      />
    </View>
  );
}
