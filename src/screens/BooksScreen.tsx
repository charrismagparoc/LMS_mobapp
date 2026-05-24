import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  RefreshControl,
  ScrollView,
  Text,
  TextInput, TouchableOpacity,
  View
} from 'react-native';
import { createBook, createBorrow, deleteBook, getBooks, updateBook } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

const GENRES = ['All', 'fiction', 'non_fiction', 'science', 'history', 'biography', 'technology', 'philosophy', 'other'];
const G_COLOR: any = { fiction: '#a855f7', non_fiction: '#14b8a6', science: '#3b82f6', technology: '#06b6d4', history: '#f97316', biography: '#ec4899', philosophy: '#8b5cf6', other: '#64748b' };

function BookCard({ book, onBorrow, onEdit, onDelete, isAdmin, theme }: any) {
  const c = G_COLOR[book.genre] || '#64748b';
  return (
    <View style={[{
      backgroundColor: theme.surface, borderRadius: 14, padding: 14, marginBottom: 10,
      borderWidth: 1, borderColor: theme.borderAccent, borderLeftWidth: 4, borderLeftColor: c,
    }]}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <View style={{ flex: 1, marginRight: 10 }}>
          <Text style={{ fontSize: 15, fontWeight: '700', color: theme.text }} numberOfLines={2}>{book.title}</Text>
          <Text style={{ fontSize: 12, color: theme.textMuted, marginTop: 2 }}>by {book.author}</Text>
          <Text style={{ fontSize: 11, fontWeight: '700', marginTop: 4, color: c, textTransform: 'capitalize' }}>{book.genre?.replace('_', ' ')}</Text>
        </View>
        <View style={{ alignItems: 'center' }}>
          <Text style={{ fontSize: 22, fontWeight: '800', color: c }}>{book.available_copies}</Text>
          <Text style={{ fontSize: 12, color: theme.textMuted }}>/{book.total_copies}</Text>
          <Text style={{ fontSize: 10, color: theme.textMuted }}>avail</Text>
        </View>
      </View>
      {book.description ? <Text style={{ fontSize: 12, color: theme.textMuted, marginTop: 8 }} numberOfLines={2}>{book.description}</Text> : null}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 }}>
        <Text style={{ fontSize: 12, color: book.is_available ? theme.emerald : theme.red }}>
          {book.is_available ? 'Available' : 'Unavailable'}
        </Text>
        <View style={{ flexDirection: 'row', gap: 6 }}>
          {isAdmin && <>
            <TouchableOpacity style={{ paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, backgroundColor: '#3b82f620' }} onPress={() => onEdit(book)}>
              <Text style={{ color: '#3b82f6', fontSize: 12, fontWeight: '700' }}>Edit</Text>
            </TouchableOpacity>
            <TouchableOpacity style={{ paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, backgroundColor: '#ef444420' }} onPress={() => onDelete(book)}>
              <Text style={{ color: '#ef4444', fontSize: 12, fontWeight: '700' }}>Del</Text>
            </TouchableOpacity>
          </>}
          {book.is_available && (
            <TouchableOpacity style={{ backgroundColor: theme.indigo, paddingHorizontal: 14, paddingVertical: 7, borderRadius: 10 }} onPress={() => onBorrow(book)}>
              <Text style={{ color: '#fff', fontSize: 12, fontWeight: '800' }}>Borrow</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
}

export default function BooksScreen() {
  const { user } = useAuth();
  const { theme, isDark } = useTheme();
  const searchInputStyle = useMemo(() => ({ flex: 1, backgroundColor: theme.surface, borderRadius: 12, padding: 11, color: theme.text, borderWidth: 1, borderColor: theme.borderAccent, fontSize: 14 }), [theme]);
  const [books, setBooks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [genre, setGenre] = useState('All');
  const [borrowModal, setBorrowModal] = useState<any>(null);
  const [borrowNotes, setBorrowNotes] = useState('');
  const [borrowing, setBorrowing] = useState(false);
  const [formModal, setFormModal] = useState<any>(null);
  const [form, setForm] = useState<any>({});

  const fetchBooks = useCallback(async () => {
    try {
      const p: any = {};
      if (search) p.search = search;
      if (genre !== 'All') p.genre = genre;
      const res = await getBooks(p);
      setBooks(res.data);
    } catch {} finally { setLoading(false); setRefreshing(false); }
  }, [search, genre]);

  useEffect(() => { const t = setTimeout(fetchBooks, 400); return () => clearTimeout(t); }, [fetchBooks]);

  const handleBorrow = async () => {
    if (!borrowModal) return;
    setBorrowing(true);
    try {
      await createBorrow({ book: borrowModal.id, notes: borrowNotes });
      Alert.alert('Request Sent', 'Borrow request submitted! Waiting for admin approval.');
      setBorrowModal(null); setBorrowNotes(''); fetchBooks();
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.error || err.response?.data?.book?.[0] || 'Failed to submit.');
    } finally { setBorrowing(false); }
  };

  const handleDelete = (book: any) => Alert.alert('Delete Book', `Delete "${book.title}"?`, [
    { text: 'Cancel', style: 'cancel' },
    { text: 'Delete', style: 'destructive', onPress: async () => { try { await deleteBook(book.id); fetchBooks(); } catch { Alert.alert('Error', 'Failed to delete.'); } } },
  ]);

  const handleSave = async () => {
    try {
      if (formModal === 'add') await createBook(form);
      else await updateBook(formModal.id, form);
      setFormModal(null); setForm({}); fetchBooks();
    } catch (err: any) { Alert.alert('Error', err.response?.data?.isbn?.[0] || 'Failed to save.'); }
  };

  if (loading) return (
    <View style={{ flex: 1, backgroundColor: theme.bg, justifyContent: 'center', alignItems: 'center' }}>
      <ActivityIndicator size="large" color={theme.indigo} />
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg }}>
      <StatusBar style={isDark ? 'light' : 'dark'} backgroundColor={theme.bg} />
      <View style={{ flexDirection: 'row', padding: 16, gap: 10 }}>
        <TextInput
          style={searchInputStyle}
          value={search} onChangeText={setSearch} placeholder="Search books..." placeholderTextColor={theme.textMuted}
        />
        {user?.is_staff && (
          <TouchableOpacity style={{ backgroundColor: theme.indigo, borderRadius: 12, paddingHorizontal: 16, justifyContent: 'center' }} onPress={() => { setForm({}); setFormModal('add'); }}>
            <Text style={{ color: '#fff', fontWeight: '800', fontSize: 14 }}>+ Add</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexShrink: 0, marginBottom: 8 }} contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 8, gap: 8 }}>
        {GENRES.map(g => (
          <TouchableOpacity key={g}
            style={{ backgroundColor: genre === g ? theme.indigo : theme.surface, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 7, borderWidth: 1, borderColor: genre === g ? theme.indigo : theme.borderAccent }}
            onPress={() => setGenre(g)}>
            <Text style={{ color: genre === g ? '#fff' : theme.textMuted, fontSize: 12, fontWeight: genre === g ? '700' : '400' }}>{g.replace('_', ' ')}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <FlatList
        data={books} keyExtractor={b => String(b.id)}
        renderItem={({ item }) => <BookCard book={item} isAdmin={user?.is_staff} theme={theme}
          onBorrow={(b: any) => { setBorrowModal(b); setBorrowNotes(''); }}
          onEdit={(b: any) => { setForm({ title: b.title, author: b.author, isbn: b.isbn, genre: b.genre, description: b.description, total_copies: b.total_copies }); setFormModal(b); }}
          onDelete={handleDelete} />}
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchBooks(); }} tintColor={theme.indigo} />}
        ListEmptyComponent={<Text style={{ color: theme.textMuted, textAlign: 'center', marginTop: 40, fontSize: 15 }}>No books found.</Text>}
      />

      {/* Borrow Modal */}
      <Modal visible={!!borrowModal} animationType="slide" transparent>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: theme.surface, borderRadius: 24, padding: 24, margin: 16, borderWidth: 1, borderColor: theme.borderAccent }}>
            <Text style={{ fontSize: 18, fontWeight: '800', color: theme.text, marginBottom: 8 }}>Borrow Book</Text>
            <Text style={{ fontSize: 15, color: theme.text, fontWeight: '700' }}>{borrowModal?.title}</Text>
            <Text style={{ fontSize: 13, color: theme.textMuted, marginBottom: 16 }}>by {borrowModal?.author}</Text>
            <Text style={{ fontSize: 11, fontWeight: '700', color: theme.textMuted, marginBottom: 6, textTransform: 'uppercase' }}>Notes (optional)</Text>
            <TextInput style={{ backgroundColor: theme.surface2, borderRadius: 10, padding: 12, color: theme.text, borderWidth: 1, borderColor: theme.borderAccent, minHeight: 80, textAlignVertical: 'top', marginBottom: 12 }}
              value={borrowNotes} onChangeText={setBorrowNotes} placeholder="Any special notes..." placeholderTextColor={theme.textMuted} multiline numberOfLines={3} />
            <Text style={{ fontSize: 12, color: theme.indigoLight, marginBottom: 16 }}>Standard 14-day borrow period from approval</Text>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TouchableOpacity style={{ flex: 1, backgroundColor: theme.surface2, borderRadius: 12, padding: 14, alignItems: 'center' }} onPress={() => setBorrowModal(null)}>
                <Text style={{ color: theme.textMuted, fontWeight: '700' }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={{ flex: 1, backgroundColor: theme.indigo, borderRadius: 12, padding: 14, alignItems: 'center', opacity: borrowing ? 0.6 : 1 }} onPress={handleBorrow} disabled={borrowing}>
                {borrowing ? <ActivityIndicator color="#fff" size="small" /> : <Text style={{ color: '#fff', fontWeight: '800' }}>Submit</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Add/Edit Modal */}
      <Modal visible={!!formModal} animationType="slide" transparent>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' }}>
          <ScrollView contentContainerStyle={{ padding: 20 }}>
            <View style={{ backgroundColor: theme.surface, borderRadius: 24, padding: 24, borderWidth: 1, borderColor: theme.borderAccent }}>
              <Text style={{ fontSize: 18, fontWeight: '800', color: theme.text, marginBottom: 16 }}>{formModal === 'add' ? 'Add Book' : 'Edit Book'}</Text>
              {['title', 'author', 'isbn', 'description'].map(f => (
                <View key={f} style={{ marginBottom: 10 }}>
                  <Text style={{ fontSize: 11, fontWeight: '700', color: theme.textMuted, marginBottom: 6, textTransform: 'uppercase' }}>{f.charAt(0).toUpperCase() + f.slice(1)}</Text>
                  <TextInput style={{ backgroundColor: theme.surface2, borderRadius: 10, padding: 12, color: theme.text, borderWidth: 1, borderColor: theme.borderAccent, fontSize: 14 }}
                    value={String(form[f] || '')} onChangeText={t => setForm((p: any) => ({ ...p, [f]: t }))} placeholder={f} placeholderTextColor={theme.textMuted} multiline={f === 'description'} />
                </View>
              ))}
              <Text style={{ fontSize: 11, fontWeight: '700', color: theme.textMuted, marginBottom: 6, textTransform: 'uppercase' }}>Total Copies</Text>
              <TextInput style={{ backgroundColor: theme.surface2, borderRadius: 10, padding: 12, color: theme.text, borderWidth: 1, borderColor: theme.borderAccent, fontSize: 14, marginBottom: 16 }}
                value={String(form.total_copies || '')} onChangeText={t => setForm((p: any) => ({ ...p, total_copies: parseInt(t) || 1 }))} keyboardType="numeric" placeholder="1" placeholderTextColor={theme.textMuted} />
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <TouchableOpacity style={{ flex: 1, backgroundColor: theme.surface2, borderRadius: 12, padding: 14, alignItems: 'center' }} onPress={() => setFormModal(null)}>
                  <Text style={{ color: theme.textMuted, fontWeight: '700' }}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={{ flex: 1, backgroundColor: theme.indigo, borderRadius: 12, padding: 14, alignItems: 'center' }} onPress={handleSave}>
                  <Text style={{ color: '#fff', fontWeight: '800' }}>Save</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}
