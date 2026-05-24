// LOCATION: src/components/FloatingChatbot.tsx
import React, { useState, useRef, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, FlatList,
  KeyboardAvoidingView, Platform, ActivityIndicator,
  Modal, ScrollView, Keyboard,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { chatbot } from '../api/client';
import { useTheme } from '../context/ThemeContext';

interface Message { id: string; role: 'user' | 'bot'; text: string; }
interface HistItem { role: string; content: string; }

const QUICK = [
  { icon: 'book-outline',             label: 'How to borrow?',  q: 'How do I borrow a book?' },
  { icon: 'time-outline',             label: 'Borrow period?',  q: 'What is the borrow period?' },
  { icon: 'return-down-back-outline', label: 'How to return?',  q: 'How do I return a book?' },
  { icon: 'alert-circle-outline',     label: 'Overdue?',        q: 'What happens when a book is overdue?' },
  { icon: 'list-outline',             label: 'My borrows?',     q: 'How do I check my borrow status?' },
  { icon: 'person-add-outline',       label: 'Register?',       q: 'How do I register an account?' },
];

export default function FloatingChatbot() {
  const { theme } = useTheme();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [hist, setHist] = useState<HistItem[]>([]);
  const [msgs, setMsgs] = useState<Message[]>([{
    id: '0', role: 'bot',
    text: "Hi! I'm LibraBot. Ask me anything about the library!",
  }]);
  const listRef = useRef<FlatList>(null);

  const scrollDown = useCallback(() => {
    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
  }, []);

  const send = useCallback(async (text: string) => {
    const t = text.trim();
    if (!t || loading) return;
    setInput('');
    Keyboard.dismiss();
    const userMsg: Message = { id: Date.now().toString(), role: 'user', text: t };
    setMsgs(prev => [...prev, userMsg]);
    setLoading(true);
    scrollDown();
    const newHist = [...hist, { role: 'user', content: t }];
    setHist(newHist);
    try {
      const res = await chatbot(t, hist);
      const reply: string = res.data.assistant.message;
      setMsgs(prev => [...prev, { id: (Date.now() + 1).toString(), role: 'bot', text: reply }]);
      setHist([...newHist, { role: 'assistant', content: reply }]);
    } catch {
      setMsgs(prev => [...prev, {
        id: (Date.now() + 1).toString(), role: 'bot',
        text: 'Could not reach the AI. Make sure Ollama is running.',
      }]);
    } finally { setLoading(false); scrollDown(); }
  }, [loading, hist, scrollDown]);

  const renderMsg = ({ item }: { item: Message }) => {
    const isUser = item.role === 'user';
    return (
      <View style={{ flexDirection: 'row', justifyContent: isUser ? 'flex-end' : 'flex-start', marginBottom: 8, paddingHorizontal: 12 }}>
        {!isUser && (
          <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: theme.indigo + '30', justifyContent: 'center', alignItems: 'center', marginRight: 6, flexShrink: 0, marginTop: 2 }}>
            <Ionicons name="chatbubble-ellipses" size={14} color={theme.indigoLight} />
          </View>
        )}
        <View style={{
          maxWidth: '75%', padding: 10, borderRadius: 14,
          backgroundColor: isUser ? theme.indigo : theme.surface2,
          borderBottomRightRadius: isUser ? 4 : 14,
          borderBottomLeftRadius: isUser ? 14 : 4,
          borderWidth: isUser ? 0 : 1,
          borderColor: theme.borderAccent,
        }}>
          <Text style={{ fontSize: 13, lineHeight: 20, color: isUser ? '#fff' : theme.text }}>{item.text}</Text>
        </View>
      </View>
    );
  };

  return (
    <>
      <TouchableOpacity
        onPress={() => setOpen(true)}
        activeOpacity={0.85}
        style={{
          position: 'absolute', bottom: 80, right: 16, zIndex: 9999,
          width: 52, height: 52, borderRadius: 26,
          backgroundColor: theme.indigo,
          justifyContent: 'center', alignItems: 'center',
          shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.35, shadowRadius: 8, elevation: 8,
          borderWidth: 2, borderColor: theme.indigoLight + '60',
        }}
      >
        <Ionicons name="chatbubble-ellipses" size={24} color="#fff" />
      </TouchableOpacity>

      <Modal visible={open} animationType="slide" transparent presentationStyle="overFullScreen">
        <KeyboardAvoidingView
          style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={{ height: '80%', backgroundColor: theme.bg, borderTopLeftRadius: 22, borderTopRightRadius: 22, overflow: 'hidden' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: theme.borderAccent, backgroundColor: theme.surface }}>
              <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: theme.indigo + '30', justifyContent: 'center', alignItems: 'center', marginRight: 10 }}>
                <Ionicons name="chatbubble-ellipses" size={20} color={theme.indigoLight} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 16, fontWeight: '800', color: theme.text }}>LibraBot</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                  <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#4ade80' }} />
                  <Text style={{ fontSize: 11, color: theme.textMuted }}>Library AI Assistant</Text>
                </View>
              </View>
              <TouchableOpacity onPress={() => setOpen(false)} style={{ padding: 6 }}>
                <Ionicons name="close" size={22} color={theme.text} />
              </TouchableOpacity>
            </View>

            <FlatList
              ref={listRef}
              data={msgs}
              keyExtractor={m => m.id}
              renderItem={renderMsg}
              contentContainerStyle={{ paddingVertical: 12 }}
              onContentSizeChange={scrollDown}
              ListFooterComponent={loading ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, marginBottom: 8 }}>
                  <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: theme.indigo + '30', justifyContent: 'center', alignItems: 'center' }}>
                    <Ionicons name="chatbubble-ellipses" size={14} color={theme.indigoLight} />
                  </View>
                  <View style={{ backgroundColor: theme.surface2, padding: 10, borderRadius: 14, borderWidth: 1, borderColor: theme.borderAccent }}>
                    <ActivityIndicator size="small" color={theme.indigoLight} />
                  </View>
                </View>
              ) : null}
            />

            {msgs.length === 1 && (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 12, gap: 7, paddingBottom: 6 }}>
                {QUICK.map(q => (
                  <TouchableOpacity
                    key={q.q}
                    onPress={() => send(q.q)}
                    style={{ flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: theme.indigo + '15', borderWidth: 1, borderColor: theme.indigo + '40', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 7 }}
                  >
                    <Ionicons name={q.icon as any} size={12} color={theme.indigoLight} />
                    <Text style={{ color: theme.indigoLight, fontSize: 12, fontWeight: '600' }}>{q.label}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}

            <View style={{ flexDirection: 'row', alignItems: 'center', padding: 12, gap: 8, borderTopWidth: 1, borderTopColor: theme.borderAccent, backgroundColor: theme.surface }}>
              <TextInput
                style={{ flex: 1, backgroundColor: theme.surface2, borderRadius: 22, paddingHorizontal: 16, paddingVertical: 10, color: theme.text, fontSize: 14, borderWidth: 1, borderColor: theme.borderAccent }}
                value={input}
                onChangeText={setInput}
                placeholder="Ask about the library..."
                placeholderTextColor={theme.textMuted}
                onSubmitEditing={() => send(input)}
                returnKeyType="send"
              />
              <TouchableOpacity
                onPress={() => send(input)}
                disabled={!input.trim() || loading}
                style={{ width: 42, height: 42, borderRadius: 21, backgroundColor: input.trim() && !loading ? theme.indigo : theme.surface2, justifyContent: 'center', alignItems: 'center' }}
              >
                <Ionicons name="send" size={18} color={input.trim() && !loading ? '#fff' : theme.textMuted} />
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
}
