import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Image,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { createStorefront, API_BASE, getToken } from '../api';
import type { NavigationProp } from '../types';
import { Blob } from 'expo-blob';
import * as FileSystem from 'expo-file-system/legacy';

interface Props {
  navigation: NavigationProp<'CreateStorefront'>;
}

const MAX_IMAGES = 5;
const BUSINESS_TYPES = ['PRODUCT', 'HOTEL'] as const;
type BusinessType = (typeof BUSINESS_TYPES)[number];

const createSlug = (name: string) => {
  const slug = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return slug || `business-${Date.now()}`;
};

export default function CreateStorefrontScreen({ navigation }: Props) {
  // ── Image state ──────────────────────────────────────────────────────────
  const [logoUri, setLogoUri] = useState<string | null>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [logoError, setLogoError] = useState<string | null>(null);

  const [imageUris, setImageUris] = useState<string[]>([]);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);

  // ── Form state ───────────────────────────────────────────────────────────
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [businessType, setBusinessType] = useState<BusinessType>('PRODUCT');
  const [categories, setCategories] = useState<string[]>([]);
  const [categoryInput, setCategoryInput] = useState('');

  // ── Submission state ─────────────────────────────────────────────────────
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  //to backend
  const uploadImageToBackend = async (uri: string): Promise<string> => {

    const token = await getToken();

    const filename = uri.split('/').pop() || 'image.jpg';
    const ext = /\.([^.]+)$/.exec(filename)?.[1] ?? 'jpg';
    const type = `image/${ext === 'jpg' ? 'jpeg' : ext}`;

    const response = await FileSystem.uploadAsync(`${API_BASE}/upload`, uri, {
      fieldName: 'file',
      httpMethod: 'POST',
      uploadType: FileSystem.FileSystemUploadType.MULTIPART,
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      parameters: {
        "public": "true",
      },
    });

    // const blob = await response.blob();
    // const ext = filename.split('.').pop() || 'jpg';
    // const type = `image/${ext}`;
    // formData.append('file', { uri, name: filename, type } as any);

    // const file = new File([blob], filename, { type });

    // const formData = new FormData();
    // formData.append('public', 'true');
    // formData.append('file',
    //   {
    //     uri,
    //     name: filename,
    //     type,
    //   } as any
    //   // file);
    // });

    // const res = await fetch(`${API_BASE}/upload`, {
    //   method: 'POST',
    //   headers: token ? { Authorization: `Bearer ${token}` } : {},
    //   body: formData,
    // });

    if (response.status !== 200 && response.status !== 201) {
      throw new Error('Upload failed. Please try again.');
    }

    const json = JSON.parse(response.body);
    return json.url as string;
  };

  // const uploadImageToBackend = async (uri: string): Promise<string> => {
  //   const filename = uri.split('/').pop() || `image-${Date.now()}.jpg`;
  //   const ext = /\.([^.]+)$/.exec(filename)?.[1] ?? 'jpg';
  //   const type = `image/${ext === 'jpg' ? 'jpeg' : ext}`;

  //   const formData = new FormData();
  //   formData.append('public', 'true');

  //   if (Platform.OS === 'web') {
  //     // On web, uri is usually a blob: or data: URL — fetch+blob works fine here
  //     const response = await fetch(uri);
  //     const blob = await response.blob();
  //     formData.append('file', blob, filename);
  //   } else {
  //     // iOS/Android: pass the {uri, name, type} object directly.
  //     // Do NOT fetch().blob() local URIs on native — RN's Response.blob() is unreliable.
  //     formData.append('file', {
  //       uri,
  //       name: filename,
  //       type,
  //     } as any);
  //   }

  //   const token = await getToken();
  //   const res = await fetch(`${API_BASE}/upload`, {
  //     method: 'POST',
  //     headers: {
  //       ...(token ? { Authorization: `Bearer ${token}` } : {}),
  //       // Important: do NOT manually set 'Content-Type' — let fetch set the
  //       // multipart boundary itself. Setting it yourself breaks native uploads.
  //     },
  //     body: formData,
  //   });

  //   if (!res.ok) {
  //     const errText = await res.text().catch(() => '');
  //     throw new Error(errText || 'Upload failed. Please try again.');
  //   }
  //   const json = await res.json();
  //   return json.url as string;
  // };

  // ── Permissions ──────────────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please allow photo library access to upload images.');
      }
    })();
  }, []);

  // ── Logo ─────────────────────────────────────────────────────────────────
  const handlePickLogo = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images',
      //imageTypes: ["jpg", "jpeg", "png", "gif", "webp"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.85,
    });
    if (result.canceled || !result.assets?.length) return;

    setUploadingLogo(true);
    setLogoError(null);
    try {
      const url = await uploadImageToBackend(result.assets[0].uri);
      setLogoUri(url);
    } catch (e: any) {
      setLogoError(e.message ?? 'Logo upload failed.');
    } finally {
      setUploadingLogo(false);
    }
  };

  // ── Storefront images ─────────────────────────────────────────────────────
  const handlePickImages = async () => {
    if (imageUris.length >= MAX_IMAGES) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      selectionLimit: 5,
      quality: 0.85,
    });
    if (result.canceled || !result.assets?.length) return;

    const remaining = MAX_IMAGES - imageUris.length;
    const picked = result.assets.slice(0, remaining);

    setUploadingImages(true);
    setImageError(null);
    try {
      const uploaded = await Promise.all(picked.map((a) => uploadImageToBackend(a.uri)));
      setImageUris((prev) => [...prev, ...uploaded]);
    } catch (e: any) {
      setImageError(e.message ?? 'Image upload failed. Please try again.');
    } finally {
      setUploadingImages(false);
    }
  };

  const handleRemoveImage = (idx: number) => {
    setImageUris((prev) => prev.filter((_, i) => i !== idx));
  };

  // ── Categories ────────────────────────────────────────────────────────────
  const handleAddCategory = () => {
    const trimmed = categoryInput.trim();
    if (!trimmed || categories.includes(trimmed)) return;
    setCategories((prev) => [...prev, trimmed]);
    setCategoryInput('');
  };

  const handleRemoveCategory = (cat: string) => {
    setCategories((prev) => prev.filter((c) => c !== cat));
  };

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleCreate = async () => {
    if (!logoUri) {
      setLogoError('Please upload a business logo before continuing.');
      return;
    }
    if (!name.trim()) {
      setFormError('Business name is required.');
      return;
    }
    if (!description.trim()) {
      setFormError('Please add a short business description.');
      return;
    }
    setFormError(null);
    setLoading(true);
    try {
      const categoryObjects = categories.map((cat) => ({
        id: cat.toLowerCase().replace(/\s+/g, '-'),
        name: cat,
        icon: '',
      }));
      await createStorefront({
        businessType,
        name: name.trim(),
        description: description.trim(),
        logoUrl: logoUri,
        bannerUrl: imageUris[0] ?? logoUri,
        data: {
          slug: createSlug(name),
          name: name.trim(),
          description: description.trim(),
          phone: phone.trim(),
          email: email.trim(),
          bankName: bankName.trim(),
          accountNumber: accountNumber.trim(),
          images: imageUris,
          categories: categoryObjects,
          logoUrl: logoUri,
        },
      });
      navigation.goBack();
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Failed to create storefront. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header ──────────────────────────────────────────────────────── */}
        <Text style={styles.heading}>Create Your Business Page</Text>
        <Text style={styles.subheading}>
          Set up your storefront and payment receiving details
        </Text>

        {formError && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorBannerText}>{formError}</Text>
          </View>
        )}

        {/* ── Logo ────────────────────────────────────────────────────────── */}
        <Text style={styles.label}>Business Logo <Text style={styles.required}>*</Text></Text>
        {logoError && <Text style={styles.fieldError}>{logoError}</Text>}
        <View style={styles.logoRow}>
          <TouchableOpacity style={styles.logoCircle} onPress={handlePickLogo} disabled={uploadingLogo || loading}>
            {uploadingLogo ? (
              <ActivityIndicator color="#16a34a" />
            ) : logoUri ? (
              <Image source={{ uri: logoUri }} style={styles.logoImage} />
            ) : (
              <Text style={styles.logoPlaceholder}>  </Text>
            )}
          </TouchableOpacity>
          <View style={styles.logoMeta}>
            <TouchableOpacity
              style={[styles.outlineBtn, (uploadingLogo || loading) && styles.disabledBtn]}
              onPress={handlePickLogo}
              disabled={uploadingLogo || loading}
            >
              <Text style={styles.outlineBtnText}>
                {uploadingLogo ? 'Uploading…' : logoUri ? 'Change Logo' : 'Upload Logo'}
              </Text>
            </TouchableOpacity>
            <Text style={styles.hint}>Max image size recommended: 10 MB.</Text>
          </View>
        </View>

        {/* ── Storefront Images ────────────────────────────────────────────── */}
        <Text style={styles.label}>Storefront Images <Text style={styles.optional}>(up to {MAX_IMAGES}, optional)</Text></Text>
        {imageError && <Text style={styles.fieldError}>{imageError}</Text>}
        <View style={styles.imageGrid}>
          {imageUris.map((uri, idx) => (
            <View key={idx} style={styles.imageTile}>
              <Image source={{ uri }} style={styles.imageTileImg} />
              <TouchableOpacity style={styles.removeBadge} onPress={() => handleRemoveImage(idx)}>
                <Text style={styles.removeBadgeText}>✕</Text>
              </TouchableOpacity>
            </View>
          ))}
          {imageUris.length < MAX_IMAGES && (
            <TouchableOpacity
              style={[styles.addImageTile, (uploadingImages || loading) && styles.disabledBtn]}
              onPress={handlePickImages}
              disabled={uploadingImages || loading}
            >
              {uploadingImages ? (
                <ActivityIndicator color="#9CA3AF" />
              ) : (
                <>
                  <Text style={styles.addImagePlus}>+</Text>
                  <Text style={styles.addImageLabel}>Add Image</Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </View>

        {/* ── Business Name ────────────────────────────────────────────────── */}
        <Text style={styles.label}>Business Name <Text style={styles.required}>*</Text></Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="e.g. Mama Ade's Kitchen"
          placeholderTextColor="#9CA3AF"
          editable={!loading}
          maxLength={100}
          returnKeyType="next"
        />

        {/* ── Description ─────────────────────────────────────────────────── */}
        <Text style={styles.label}>Business Description <Text style={styles.required}>*</Text></Text>
        <TextInput
          style={[styles.input, styles.textarea]}
          value={description}
          onChangeText={setDescription}
          placeholder="Describe what your business sells or offers…"
          placeholderTextColor="#9CA3AF"
          multiline
          numberOfLines={3}
          editable={!loading}
          maxLength={500}
          textAlignVertical="top"
        />

        {/* ── Contact ──────────────────────────────────────────────────────── */}
        <View style={styles.row}>
          <View style={styles.halfField}>
            <Text style={styles.label}>Phone Number</Text>
            <TextInput
              style={styles.input}
              value={phone}
              onChangeText={setPhone}
              placeholder="e.g. 08000000000"
              placeholderTextColor="#9CA3AF"
              editable={!loading}
              keyboardType="phone-pad"
            />
          </View>
          <View style={styles.halfField}>
            <Text style={styles.label}>Email Address</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="info@company.com"
              placeholderTextColor="#9CA3AF"
              editable={!loading}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>
        </View>

        {/* ── Business Type ─────────────────────────────────────────────────── */}
        <Text style={styles.label}>Business Type</Text>
        <View style={styles.typeRow}>
          {BUSINESS_TYPES.map((t) => (
            <TouchableOpacity
              key={t}
              style={[styles.typeBtn, businessType === t && styles.typeBtnActive]}
              onPress={() => setBusinessType(t)}
              disabled={loading}
              activeOpacity={0.7}
            >
              <Text style={[styles.typeBtnText, businessType === t && styles.typeBtnTextActive]}>
                {t === 'PRODUCT' ? 'Product' : 'Hotel'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── Categories ───────────────────────────────────────────────────── */}
        <Text style={styles.label}>
          {businessType === 'PRODUCT' ? 'What types of goods will you offer?' : 'Room / Service Categories'}
        </Text>
        {categories.length > 0 && (
          <View style={styles.tagRow}>
            {categories.map((cat, idx) => (
              <View key={idx} style={styles.tag}>
                <Text style={styles.tagText}>{cat}</Text>
                <TouchableOpacity onPress={() => handleRemoveCategory(cat)} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
                  <Text style={styles.tagRemove}>✕</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
        <View style={styles.categoryInputRow}>
          <TextInput
            style={styles.categoryInput}
            value={categoryInput}
            onChangeText={setCategoryInput}
            placeholder={businessType === 'PRODUCT' ? "e.g. Sneakers" : "e.g. Single Room"}
            placeholderTextColor="#9CA3AF"
            editable={!loading}
            onSubmitEditing={handleAddCategory}
            returnKeyType="done"
          />
          <TouchableOpacity style={styles.addCatBtn} onPress={handleAddCategory}>
            <Text style={styles.addCatBtnText}>Add</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.hint}>Tap Add or press Done to add multiple categories.</Text>

        {/* ── Bank Details ─────────────────────────────────────────────────── */}
        <View style={styles.bankCard}>
          <Text style={styles.bankCardTitle}>Bank Account Details</Text>
          <Text style={styles.bankCardSubtitle}>For customer transfers</Text>
          <TextInput
            style={[styles.input, styles.bankInput]}
            value={bankName}
            onChangeText={setBankName}
            placeholder="Bank Name (e.g. Access Bank)"
            placeholderTextColor="#9CA3AF"
            editable={!loading}
          />
          <TextInput
            style={[styles.input, styles.bankInput]}
            value={accountNumber}
            onChangeText={(v) => setAccountNumber(v.replace(/\D/g, ''))}
            placeholder="Account Number (10 digits)"
            placeholderTextColor="#9CA3AF"
            editable={!loading}
            keyboardType="number-pad"
            maxLength={10}
          />
        </View>

        {/* ── Info notice ──────────────────────────────────────────────────── */}
        <View style={styles.infoBox}>
          <Text style={styles.infoText}>
            ℹ️  After creating your storefront you'll need to pay ₦5,000 to activate your QR code.
          </Text>
        </View>

        {/* ── Submit ───────────────────────────────────────────────────────── */}
        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleCreate}
          disabled={loading}
          activeOpacity={0.85}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Launch Storefront 🚀</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F9FAFB' },
  scroll: { padding: 20, paddingBottom: 48 },

  heading: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 6,
  },
  subheading: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },

  // Error banner
  errorBanner: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  errorBannerText: { color: '#DC2626', fontSize: 14, lineHeight: 20 },
  fieldError: { color: '#DC2626', fontSize: 13, marginBottom: 6, marginTop: -4 },

  // Labels
  label: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 6 },
  required: { color: '#DC2626' },
  optional: { color: '#9CA3AF', fontWeight: '400', fontSize: 13 },
  hint: { fontSize: 12, color: '#9CA3AF', marginBottom: 16, marginTop: 4 },

  // Logo
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 20 },
  logoCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: '#F3F4F6',
    borderWidth: 2,
    borderColor: '#D1D5DB',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  logoImage: { width: 88, height: 88, borderRadius: 44 },
  logoPlaceholder: { fontSize: 28 },
  logoMeta: { flex: 1 },
  outlineBtn: {
    borderWidth: 1.5,
    borderColor: '#D1D5DB',
    borderRadius: 10,
    paddingVertical: 9,
    paddingHorizontal: 16,
    alignSelf: 'flex-start',
  },
  outlineBtnText: { fontSize: 14, fontWeight: '600', color: '#374151' },

  // Image grid
  imageGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 },
  imageTile: {
    width: 72,
    height: 72,
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  imageTileImg: { width: '100%', height: '100%' },
  removeBadge: {
    position: 'absolute',
    top: 3,
    right: 3,
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: 10,
    width: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeBadgeText: { color: '#fff', fontSize: 9, fontWeight: '700' },
  addImageTile: {
    width: 72,
    height: 72,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F9FAFB',
  },
  addImagePlus: { fontSize: 24, color: '#9CA3AF', lineHeight: 28 },
  addImageLabel: { fontSize: 10, color: '#9CA3AF' },

  // Inputs
  input: {
    borderWidth: 1.5,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 15,
    color: '#111827',
    backgroundColor: '#ffffff',
    marginBottom: 16,
  },
  textarea: { height: 90, textAlignVertical: 'top' },

  // Two-column row
  row: { flexDirection: 'row', gap: 12 },
  halfField: { flex: 1 },

  // Business type toggle
  typeRow: { flexDirection: 'row', gap: 10, marginBottom: 20, textTransform: 'uppercase' },
  typeBtn: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  typeBtnActive: { borderColor: '#16a34a', backgroundColor: '#f0fdf4' },
  typeBtnText: { color: '#6B7280', fontWeight: '600', fontSize: 14 },
  typeBtnTextActive: { color: '#15803d' },

  // Category tags
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 10 },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#dcfce7',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  tagText: { color: '#166534', fontSize: 13, fontWeight: '500' },
  tagRemove: { color: '#16a34a', fontSize: 12, fontWeight: '700' },

  categoryInputRow: { flexDirection: 'row', gap: 8, marginBottom: 4 },
  categoryInput: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#111827',
    backgroundColor: '#ffffff',
  },
  addCatBtn: {
    backgroundColor: '#16a34a',
    borderRadius: 12,
    paddingHorizontal: 18,
    justifyContent: 'center',
  },
  addCatBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },

  // Bank card
  bankCard: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
  },
  bankCardTitle: { fontSize: 15, fontWeight: '700', color: '#111827', marginBottom: 2 },
  bankCardSubtitle: { fontSize: 13, color: '#6B7280', marginBottom: 14 },
  bankInput: { marginBottom: 12 },

  // Info notice
  infoBox: {
    backgroundColor: '#f0fdf4',
    borderRadius: 12,
    padding: 14,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  infoText: { color: '#166534', fontSize: 13, lineHeight: 19 },

  // Submit button
  button: {
    backgroundColor: '#16a34a',
    borderRadius: 14,
    paddingVertical: 17,
    alignItems: 'center',
  },
  buttonDisabled: { opacity: 0.55 },
  buttonText: { color: '#ffffff', fontSize: 16, fontWeight: '700', letterSpacing: 0.3 },

  // Disabled state (shared)
  disabledBtn: { opacity: 0.5 },
});
