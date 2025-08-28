import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  Image,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Switch,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { auth, db, storage } from './firebase';
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  setDoc,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

interface CategoryType {
  id: string;
  tittle: string;
}
interface SubCategoryType {
  id: string;
  tittle: string;
  catname: string;
}
interface ValidationErrors {
  productName?: string;
  stock?: string;
  mrp?: string;
  price?: string;
  quantity?: string;
  unit?: string;
  description?: string;
  category?: string;
  subcategory?: string;
  singleImage?: string;
  featureImages?: string;
}
interface InputFieldProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  error?: string;
  placeholder?: string;
  keyboardType?: 'default' | 'numeric' | 'email-address' | 'phone-pad';
  multiline?: boolean;
  numberOfLines?: number;
}
interface PickerFieldProps {
  label: string;
  selectedValue: string;
  onValueChange: (itemValue: string) => void;
  items: (CategoryType | SubCategoryType | string)[];
  error?: string;
  enabled?: boolean;
}
const units = ['pcs', 'kg', 'liter', 'box', 'pack'];

interface Product {
  available: boolean;
  branch: string;
  category: string;
  description: string;
  discount: string;
  featureImages: string[];
  id: string;
  image: string;
  itemcategory: string;
  latest: boolean;
  option: boolean;
  price: string;
  show: boolean;
  sponsored: boolean;
  stock: string;
  subcategory: string;
  timestamp: Date | string;
  tittle: string;
}

const generateRandom9DigitId = (): string => {
  return Math.floor(100000000 + Math.random() * 900000000).toString();
};

const Product = () => {
  const currentUser = auth.currentUser;

  const [categories, setCategories] = useState<CategoryType[]>([]);
  const [subcategories, setSubcategories] = useState<SubCategoryType[]>([]);

  const [productName, setProductName] = useState('');
  const [stock, setStock] = useState('');
  const [mrp, setMrp] = useState('');
  const [price, setPrice] = useState('');
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [subcategory, setSubcategory] = useState('');

  // Single main image (string URL after upload)
  const [singleImagePreview, setSingleImagePreview] = useState<string | null>(null);
  const [singleImageFile, setSingleImageFile] = useState<File | null>(null);

  // Multiple images for featureImages array
  const [featureImagePreviews, setFeatureImagePreviews] = useState<string[]>([]);
  const [featureImageFiles, setFeatureImageFiles] = useState<File[]>([]);

  // Boolean fields UI states
  const [latest, setLatest] = useState(false);
  const [option, setOption] = useState(false);
  const [show, setShow] = useState(true);
  const [sponsored, setSponsored] = useState(false);

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<ValidationErrors>({});

  useEffect(() => {
    if (!currentUser) return;
    const fetchCategories = async () => {
      try {
        const q = query(
          collection(db, 'category'),
          where('branch', '==', currentUser.uid),
          where('show', '==', true)
        );
        const snap = await getDocs(q);
        setCategories(snap.docs.map(doc => ({ id: doc.id, tittle: doc.data().tittle })));
      } catch (e) {
        Alert.alert('Error', 'Failed to load categories');
        console.error(e);
      }
    };
    fetchCategories();
  }, [currentUser]);

  useEffect(() => {
    if (!currentUser || !category) return;
    const fetchSubcategories = async () => {
      try {
        const q = query(collection(db, 'subcategory'), where('catname', '==', category));
        const snap = await getDocs(q);
        setSubcategories(snap.docs.map(doc => ({
          id: doc.id,
          tittle: doc.data().tittle,
          catname: doc.data().catname,
        })));
      } catch (e) {
        Alert.alert('Error', 'Failed to load subcategories');
        setSubcategories([]);
        console.error(e);
      }
    };
    fetchSubcategories();
  }, [category, currentUser]);

  const validate = (): boolean => {
    const errs: ValidationErrors = {};
    if (!productName.trim()) errs.productName = 'Product Name is required';
    if (stock === '' || parseFloat(stock) < 0) errs.stock = 'Stock must be >= 0';
    if (mrp === '' || parseFloat(mrp) < 0) errs.mrp = 'MRP must be >= 0';
    if (price === '' || parseFloat(price) < 0) errs.price = 'Price must be >= 0';
    if (quantity === '' || parseFloat(quantity) <= 0) errs.quantity = 'Quantity must be > 0';
    if (!unit) errs.unit = 'Unit is required';
    if (!description.trim()) errs.description = 'Description is required';
    if (!category) errs.category = 'Category is required';
    if (!subcategory) errs.subcategory = 'Subcategory is required';

    if (!singleImagePreview) errs.singleImage = 'Main product image is required';

    if (featureImageFiles.length === 0) {
      errs.featureImages = 'At least one feature image is required';
    } else if (featureImageFiles.length > 6) {
      errs.featureImages = 'Maximum 6 feature images allowed';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // Single image picker (for main image)
  const pickSingleImage = async () => {
    if (Platform.OS !== 'web') {
      Alert.alert('Info', 'Single image picker not implemented for mobile yet');
      return;
    }
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.multiple = false;
    input.onchange = (e: Event) => {
      const target = e.target as HTMLInputElement;
      if (target.files && target.files.length > 0) {
        const file = target.files[0];
        setSingleImageFile(file);
        setSingleImagePreview(URL.createObjectURL(file));
        setErrors(prev => ({ ...prev, singleImage: undefined }));
      }
    };
    input.click();
  };

  // Multiple image picker (for featureImages)
  const pickFeatureImages = async () => {
    if (Platform.OS !== 'web') {
      Alert.alert('Info', 'Feature images picker not implemented for mobile yet');
      return;
    }
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.multiple = true;
    input.onchange = (e: Event) => {
      const target = e.target as HTMLInputElement;
      if (target.files && target.files.length > 0) {
        let files = Array.from(target.files);
        // Limit to 6 images total (existing + new)
        if (files.length + featureImageFiles.length > 6) {
          Alert.alert('Limit Exceeded', 'You can upload up to 6 feature images.');
          files = files.slice(0, 6 - featureImageFiles.length);
        }
        setFeatureImageFiles(prev => [...prev, ...files]);
        const newPreviews = files.map(f => URL.createObjectURL(f));
        setFeatureImagePreviews(prev => [...prev, ...newPreviews]);
        setErrors(prev => ({ ...prev, featureImages: undefined }));
      }
    };
    input.click();
  };

  const removeFeatureImage = (index: number) => {
    setFeatureImageFiles(files => {
      const newFiles = [...files];
      newFiles.splice(index, 1);
      return newFiles;
    });
    setFeatureImagePreviews(previews => {
      const newPreviews = [...previews];
      newPreviews.splice(index, 1);
      return newPreviews;
    });
  };

  const handleSubmit = async () => {
    if (!currentUser) {
      Alert.alert('Error', 'You must be logged in');
      return;
    }
    if (!validate()) return;

    setLoading(true);
    try {
      if (Platform.OS !== 'web') throw new Error('Mobile upload not implemented yet');

      // Upload single main image
      if (!singleImageFile) throw new Error('No main image file');
      const mainImageRef = ref(storage, `products/${currentUser.uid}/${Date.now()}_${singleImageFile.name}`);
      await uploadBytes(mainImageRef, singleImageFile);
      const mainImageUrl = await getDownloadURL(mainImageRef);

      // Upload featureImages
      const featureImageUrls: string[] = [];
      for (let i = 0; i < featureImageFiles.length; i++) {
        const file = featureImageFiles[i];
        const storageRef = ref(storage, `products/${currentUser.uid}/${Date.now()}_${file.name}`);
        await uploadBytes(storageRef, file);
        const url = await getDownloadURL(storageRef);
        featureImageUrls.push(url);
      }

      const newId = generateRandom9DigitId();

      const newProduct: Product = {
        id: newId,
        branch: currentUser.uid,
        tittle: productName.trim(),
        description: description.trim(),
        stock: stock.trim(),
        price: price.trim(),
        category,
        subcategory,
        image: mainImageUrl,
        featureImages: featureImageUrls,
        itemcategory: quantity.trim() + ' ' + unit,
        available: true,
        latest,
        option,
        show,
        sponsored,
        discount: '0',
        timestamp: new Date().toISOString(),
      };

      const newProductRef = doc(collection(db, 'products'), newId);
      await setDoc(newProductRef, newProduct);

      Alert.alert('Success', 'Product Created Successfully!');
      resetForm();
    } catch (error) {
      Alert.alert('Error', 'Failed to create product');
      console.error(error);
    }
    setLoading(false);
  };

  const resetForm = () => {
    setProductName('');
    setStock('');
    setMrp('');
    setPrice('');
    setQuantity('');
    setUnit('');
    setDescription('');
    setCategory('');
    setSubcategory('');
    setSingleImagePreview(null);
    setSingleImageFile(null);
    setFeatureImagePreviews([]);
    setFeatureImageFiles([]);
    setLatest(false);
    setOption(false);
    setShow(true);
    setSponsored(false);
    setErrors({});
  };

  const renderInputField = ({
    label,
    value,
    onChangeText,
    error,
    placeholder,
    keyboardType = 'default',
    multiline = false,
    numberOfLines = 1,
  }: InputFieldProps) => (
    <View style={styles.inputContainer}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        keyboardType={keyboardType}
        multiline={multiline}
        numberOfLines={numberOfLines}
        textAlignVertical={multiline ? 'top' : 'center'}
        style={[multiline ? styles.textArea : styles.input, error && styles.inputError]}
        placeholderTextColor="#999"
      />
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );

  const renderPicker = ({ label, selectedValue, onValueChange, items, error, enabled = true }: PickerFieldProps) => (
    <View style={styles.inputContainer}>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.pickerContainer, error && styles.inputError, !enabled && styles.disabledPicker]}>
        <Picker selectedValue={selectedValue} onValueChange={onValueChange} enabled={enabled} style={styles.picker}>
          <Picker.Item label={`Select ${label.toLowerCase().replace(' *', '')}`} value="" />
          {items.map((item) => {
            const key = typeof item === 'string' ? item : item.id;
            const labelText = typeof item === 'string' ? item : item.tittle;
            const value = typeof item === 'string' ? item : item.id;
            return <Picker.Item key={key} label={labelText} value={value} />;
          })}
        </Picker>
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );

  const renderSwitch = (label: string, value: boolean, setValue: (val: boolean) => void) => (
    <View style={styles.switchContainer}>
      <Text style={styles.label}>{label}</Text>
      <Switch value={value} onValueChange={setValue} />
    </View>
  );

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.headerContainer}>
          <Text style={styles.title}>Create Product</Text>
          <View style={styles.divider} />
        </View>

        <View style={styles.formContainer}>
          {renderInputField({
            label: 'Product Name *',
            value: productName,
            onChangeText: setProductName,
            placeholder: 'Enter product name',
            error: errors.productName,
          })}

          <View style={styles.row}>
            <View style={styles.halfWidth}>
              {renderInputField({
                label: 'Stock *',
                value: stock,
                onChangeText: setStock,
                placeholder: '0',
                keyboardType: 'numeric',
                error: errors.stock,
              })}
            </View>
            <View style={styles.halfWidth}>
              {renderInputField({
                label: 'MRP (₹) *',
                value: mrp,
                onChangeText: setMrp,
                placeholder: '0.00',
                keyboardType: 'numeric',
                error: errors.mrp,
              })}
            </View>
          </View>

          <View style={styles.row}>
            <View style={styles.halfWidth}>
              {renderInputField({
                label: 'Price (₹) *',
                value: price,
                onChangeText: setPrice,
                placeholder: '0.00',
                keyboardType: 'numeric',
                error: errors.price,
              })}
            </View>
            <View style={styles.halfWidth}>
              {renderInputField({
                label: 'Quantity *',
                value: quantity,
                onChangeText: setQuantity,
                placeholder: '1',
                keyboardType: 'numeric',
                error: errors.quantity,
              })}
            </View>
          </View>

          {renderPicker({
            label: 'Unit *',
            selectedValue: unit,
            onValueChange: setUnit,
            items: units,
            error: errors.unit,
          })}

          {renderPicker({
            label: 'Category *',
            selectedValue: category,
            onValueChange: (val) => {
              setCategory(val);
              setSubcategory('');
            },
            items: categories,
            error: errors.category,
          })}

          {renderPicker({
            label: 'Subcategory *',
            selectedValue: subcategory,
            onValueChange: setSubcategory,
            items: subcategories,
            error: errors.subcategory,
            enabled: !!category,
          })}

          {renderInputField({
            label: 'Description *',
            value: description,
            onChangeText: setDescription,
            placeholder: 'Enter product description',
            error: errors.description,
            multiline: true,
            numberOfLines: 4,
          })}

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Main Product Image *</Text>
            <TouchableOpacity
              style={[styles.imagePickerButton, errors.singleImage && styles.inputError]}
              onPress={pickSingleImage}
            >
              {singleImagePreview ? (
                <Image source={{ uri: singleImagePreview }} style={styles.singleImagePreview} />
              ) : (
                <Text style={styles.imagePickerButtonText}>Tap to select main image</Text>
              )}
            </TouchableOpacity>
            {errors.singleImage && <Text style={styles.errorText}>{errors.singleImage}</Text>}
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Feature Images (max 6) *</Text>
            <TouchableOpacity
              style={[styles.imagePickerButton, errors.featureImages && styles.inputError]}
              onPress={pickFeatureImages}
            >
              <Text style={styles.imagePickerButtonText}>Tap to select feature images</Text>
            </TouchableOpacity>
            {errors.featureImages && <Text style={styles.errorText}>{errors.featureImages}</Text>}

            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imagePreviewContainer}>
              {featureImagePreviews.map((uri, idx) => (
                <View key={idx} style={styles.imagePreviewWrapper}>
                  <Image source={{ uri }} style={styles.imagePreview} />
                  <TouchableOpacity style={styles.removeImageButton} onPress={() => removeFeatureImage(idx)}>
                    <Text style={styles.removeImageText}>×</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
          </View>

          {renderSwitch('Latest', latest, setLatest)}
          {renderSwitch('Option', option, setOption)}
          {renderSwitch('Show', show, setShow)}
          {renderSwitch('Sponsored', sponsored, setSponsored)}

          <TouchableOpacity
            style={[styles.submitButton, loading && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitButtonText}>Create Product</Text>}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  scrollContainer: { padding: 20 },
  headerContainer: { alignItems: 'center', marginBottom: 30 },
  title: { fontSize: 28, fontWeight: '700', color: '#1a1a1a', marginBottom: 10 },
  divider: { height: 3, width: 60, backgroundColor: '#007AFF', borderRadius: 2 },
  formContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  inputContainer: { marginBottom: 20 },
  label: { fontSize: 16, fontWeight: '600', color: '#333', marginBottom: 8 },
  input: {
    borderWidth: 1,
    borderColor: '#e1e5e9',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    backgroundColor: '#fafbfc',
    color: '#333',
  },
  inputError: { borderColor: '#dc3545', backgroundColor: '#fff5f5' },
  textArea: {
    borderWidth: 1,
    borderColor: '#e1e5e9',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    backgroundColor: '#fafbfc',
    color: '#333',
    minHeight: 100,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#e1e5e9',
    borderRadius: 12,
    backgroundColor: '#fafbfc',
    overflow: 'hidden',
  },
  picker: { height: 50 },
  disabledPicker: { backgroundColor: '#f5f5f5', opacity: 0.6 },
  errorText: { color: '#dc3545', fontSize: 14, marginTop: 6, fontWeight: '500' },
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: 15 },
  halfWidth: { flex: 1 },
  imagePickerButton: {
    borderWidth: 2,
    borderColor: '#e1e5e9',
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fafbfc',
    minHeight: 60,
  },
  imagePickerButtonText: { fontSize: 16, color: '#666', fontWeight: '500' },
  singleImagePreview: { width: '100%', height: 200, borderRadius: 8, resizeMode: 'cover' },
  imagePreviewContainer: { marginTop: 12 },
  imagePreviewWrapper: { position: 'relative', marginRight: 12 },
  imagePreview: { width: 80, height: 80, borderRadius: 8, resizeMode: 'cover' },
  removeImageButton: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: '#dc3545',
    borderRadius: 10,
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeImageText: { color: '#fff', fontWeight: '700', fontSize: 16, lineHeight: 16 },
  submitButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  submitButtonDisabled: { backgroundColor: '#ccc', shadowOpacity: 0, elevation: 0 },
  submitButtonText: { color: '#fff', fontSize: 18, fontWeight: '600' },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
});

export default Product;
