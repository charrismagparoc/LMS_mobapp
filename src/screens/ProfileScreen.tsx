import { Ionicons } from '@expo/vector-icons'
import * as ImagePicker from 'expo-image-picker'
import { StatusBar } from 'expo-status-bar'
import React, { useEffect, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'
import { fetchMe, updateMember } from '../api/client'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'

export default function ProfileScreen() {
  const { user, logout } = useAuth()
  const { theme, isDark, toggleTheme } = useTheme()
  const [profile, setProfile]   = useState<any>(null)
  const [editing, setEditing]   = useState(false)
  const [form, setForm]         = useState<any>({})
  const [photoUri, setPhotoUri] = useState<string | null>(null)
  const [loading, setLoading]   = useState(true)
  const [saving, setSaving]     = useState(false)

  useEffect(() => { loadProfile() }, [])

  const loadProfile = async () => {
    try {
      const res = await fetchMe()
      const d = res.data
      setProfile(d)
      setForm({
        phone:       d.phone       || '',
        bio:         d.bio         || '',
        address:     d.address     || '',
        birthday:    d.birthday    || '',
        member_type: d.member_type || '',
      })
      if (d.photo_b64) setPhotoUri(d.photo_b64)
    } catch {
      Alert.alert('Error', 'Could not load profile.')
    } finally { setLoading(false) }
  }

  const pickPhoto = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please allow photo access in Settings.')
        return
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: (ImagePicker as any).MediaTypeOptions.Images,
        allowsEditing: true, aspect: [1, 1], quality: 0.6, base64: true,
      })
      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0]
        setPhotoUri(asset.uri)
        if (asset.base64) {
          setForm((f: any) => ({ ...f, photo_b64: `data:image/jpeg;base64,${asset.base64}` }))
        }
      }
    } catch { Alert.alert('Error', 'Could not open photo picker.') }
  }

  const handleSave = async () => {
    const memberId = profile?.member_id
    if (!memberId) {
      Alert.alert('Error', 'Could not find member ID. Please log out and log in again.')
      return
    }
    setSaving(true)
    try {
      await updateMember(memberId, form)
      Alert.alert('Saved', 'Profile updated successfully!')
      setEditing(false)
      loadProfile()
    } catch (e: any) {
      const msg = e.response?.data ? JSON.stringify(e.response.data) : 'Failed to update profile.'
      Alert.alert('Error', msg)
    } finally { setSaving(false) }
  }

  if (loading) return (
    <View style={{ flex: 1, backgroundColor: theme.bg, justifyContent: 'center', alignItems: 'center' }}>
      <ActivityIndicator size="large" color={theme.indigo} />
    </View>
  )

  const initials = (profile?.first_name?.[0] || '?').toUpperCase()

  const FIELDS = [
    { iconName: 'call-outline',     label: 'Phone',       field: 'phone',       placeholder: '+63 912 345 6789' },
    { iconName: 'location-outline', label: 'Address',     field: 'address',     placeholder: 'Your address' },
    { iconName: 'calendar-outline', label: 'Birthday',    field: 'birthday',    placeholder: 'YYYY-MM-DD' },
    { iconName: 'pricetag-outline', label: 'Member Type', field: 'member_type', placeholder: 'e.g. Student, Faculty' },
  ]

  return (
    <ScrollView style={{ flex: 1, backgroundColor: theme.bg }} contentContainerStyle={{ padding: 16, paddingBottom: 60 }}>
      <StatusBar style={isDark ? 'light' : 'dark'} backgroundColor={theme.bg} />

      {/* Theme toggle */}
      <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginBottom: 16 }}>
        <TouchableOpacity
          style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: theme.surface2, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 7, borderWidth: 1, borderColor: theme.border }}
          onPress={toggleTheme}
        >
          <Ionicons name={isDark ? 'sunny-outline' : 'moon-outline'} size={14} color={theme.text} />
          <Text style={{ color: theme.text, fontSize: 13, fontWeight: '700' }}>
            {isDark ? 'Light Mode' : 'Dark Mode'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Avatar */}
      <View style={{ alignItems: 'center', marginBottom: 24 }}>
        <TouchableOpacity onPress={editing ? pickPhoto : undefined} activeOpacity={editing ? 0.7 : 1} style={{ position: 'relative' }}>
          {photoUri
            ? <Image source={{ uri: photoUri }} style={{ width: 96, height: 96, borderRadius: 48, borderWidth: 3, borderColor: theme.indigo }} />
            : <View style={{ width: 96, height: 96, borderRadius: 48, backgroundColor: theme.indigo, justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: theme.indigoLight }}>
                <Text style={{ fontSize: 38, fontWeight: '800', color: '#fff' }}>{initials}</Text>
              </View>
          }
          {editing && (
            <View style={{ position: 'absolute', bottom: 0, right: 0, backgroundColor: theme.surface, borderRadius: 20, padding: 6, borderWidth: 2, borderColor: theme.indigo }}>
              <Ionicons name="camera-outline" size={16} color={theme.indigoLight} />
            </View>
          )}
        </TouchableOpacity>

        {editing && (
          <TouchableOpacity
            style={{ marginTop: 10, flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: theme.indigo + '20', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8, borderWidth: 1, borderColor: theme.indigo + '60' }}
            onPress={pickPhoto}
          >
            <Ionicons name="images-outline" size={14} color={theme.indigoLight} />
            <Text style={{ color: theme.indigoLight, fontSize: 13, fontWeight: '700' }}>Choose Photo</Text>
          </TouchableOpacity>
        )}

        <Text style={{ fontSize: 22, fontWeight: '800', color: theme.text, marginTop: 12 }}>
          {profile?.first_name} {profile?.last_name}
        </Text>
        <Text style={{ fontSize: 13, color: theme.textMuted, marginTop: 4 }}>{profile?.email}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 5, borderRadius: 20, marginTop: 8, backgroundColor: user?.is_staff ? theme.indigo + '20' : theme.emerald + '20' }}>
          <Ionicons name={user?.is_staff ? 'shield-checkmark-outline' : 'book-outline'} size={13} color={user?.is_staff ? theme.indigoLight : theme.emerald} />
          <Text style={{ fontSize: 12, fontWeight: '700', color: user?.is_staff ? theme.indigoLight : theme.emerald }}>
            {user?.is_staff ? 'Administrator' : 'Member'}
          </Text>
        </View>
      </View>

      {/* Stats */}
      <View style={{ flexDirection: 'row', backgroundColor: theme.surface, borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: theme.borderAccent }}>
        {[
          { label: 'Active Borrows', value: profile?.active_borrows ?? '-' },
          { label: 'Member Type',   value: profile?.member_type || 'General' },
          { label: 'Joined',        value: profile?.joined_at?.slice(0, 10) || '-' },
        ].map((stat, i) => (
          <React.Fragment key={i}>
            {i > 0 && <View style={{ width: 1, backgroundColor: theme.borderAccent }} />}
            <View style={{ flex: 1, alignItems: 'center' }}>
              <Text style={{ fontSize: 13, fontWeight: '700', color: theme.text, textAlign: 'center' }}>{String(stat.value)}</Text>
              <Text style={{ fontSize: 10, color: theme.textMuted, marginTop: 2, textAlign: 'center' }}>{stat.label}</Text>
            </View>
          </React.Fragment>
        ))}
      </View>

      {/* Profile fields card */}
      <View style={{ backgroundColor: theme.surface, borderRadius: 16, padding: 18, borderWidth: 1, borderColor: theme.borderAccent, marginBottom: 16 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <Text style={{ fontSize: 15, fontWeight: '700', color: theme.text }}>Profile Information</Text>
          {!editing
            ? <TouchableOpacity
                style={{ flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: theme.indigo + '20', paddingHorizontal: 14, paddingVertical: 7, borderRadius: 10 }}
                onPress={() => setEditing(true)}
              >
                <Ionicons name="create-outline" size={14} color={theme.indigoLight} />
                <Text style={{ color: theme.indigoLight, fontWeight: '700', fontSize: 13 }}>Edit</Text>
              </TouchableOpacity>
            : <View style={{ flexDirection: 'row', gap: 8 }}>
                <TouchableOpacity
                  style={{ backgroundColor: theme.surface2, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 10 }}
                  onPress={() => { setEditing(false); loadProfile() }}
                >
                  <Text style={{ color: theme.textMuted, fontWeight: '600', fontSize: 13 }}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: theme.indigo, paddingHorizontal: 14, paddingVertical: 7, borderRadius: 10, opacity: saving ? 0.6 : 1 }}
                  onPress={handleSave}
                  disabled={saving}
                >
                  {saving
                    ? <ActivityIndicator color="#fff" size="small" />
                    : <>
                        <Ionicons name="checkmark-outline" size={14} color="#fff" />
                        <Text style={{ color: '#fff', fontWeight: '700', fontSize: 13 }}>Save</Text>
                      </>
                  }
                </TouchableOpacity>
              </View>
          }
        </View>

        {FIELDS.map(({ iconName, label, field, placeholder }) => (
          <View key={field} style={{ flexDirection: 'row', marginBottom: 14, alignItems: 'flex-start' }}>
            <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: theme.indigo + '15', justifyContent: 'center', alignItems: 'center', marginRight: 10, marginTop: 2 }}>
              <Ionicons name={iconName as any} size={15} color={theme.indigoLight} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 10, fontWeight: '700', color: theme.textMuted, marginBottom: 4, textTransform: 'uppercase' }}>{label}</Text>
              {editing
                ? <TextInput
                    style={{ backgroundColor: theme.surface2, borderRadius: 10, padding: 10, color: theme.text, borderWidth: 1, borderColor: theme.borderAccent, fontSize: 14 }}
                    value={form[field] || ''}
                    onChangeText={(t: string) => setForm((f: any) => ({ ...f, [field]: t }))}
                    placeholder={placeholder}
                    placeholderTextColor={theme.textMuted}
                  />
                : <Text style={{ fontSize: 14, color: profile?.[field] ? theme.text : theme.textMuted }}>
                    {profile?.[field] || 'Not set'}
                  </Text>
              }
            </View>
          </View>
        ))}

        {/* Bio */}
        <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
          <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: theme.indigo + '15', justifyContent: 'center', alignItems: 'center', marginRight: 10, marginTop: 2 }}>
            <Ionicons name="document-text-outline" size={15} color={theme.indigoLight} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 10, fontWeight: '700', color: theme.textMuted, marginBottom: 4, textTransform: 'uppercase' }}>Bio</Text>
            {editing
              ? <TextInput
                  style={{ backgroundColor: theme.surface2, borderRadius: 10, padding: 10, color: theme.text, borderWidth: 1, borderColor: theme.borderAccent, fontSize: 14, minHeight: 70, textAlignVertical: 'top' }}
                  value={form.bio || ''}
                  onChangeText={(t: string) => setForm((f: any) => ({ ...f, bio: t }))}
                  placeholder="Tell us about yourself..."
                  placeholderTextColor={theme.textMuted}
                  multiline
                />
              : <Text style={{ fontSize: 14, color: profile?.bio ? theme.text : theme.textMuted }}>
                  {profile?.bio || 'Not set'}
                </Text>
            }
          </View>
        </View>
      </View>

      {/* Sign out */}
      <TouchableOpacity
        style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: 'rgba(239,68,68,0.1)', borderWidth: 1, borderColor: 'rgba(239,68,68,0.3)', borderRadius: 14, padding: 16 }}
        onPress={logout}
      >
        <Ionicons name="log-out-outline" size={18} color={theme.red} />
        <Text style={{ color: theme.red, fontWeight: '800', fontSize: 15 }}>Sign Out</Text>
      </TouchableOpacity>
    </ScrollView>
  )
}