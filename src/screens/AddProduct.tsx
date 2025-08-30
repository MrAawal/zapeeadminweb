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
import { useParams } from 'react-router-dom';
import { doc, getDoc, updateDoc, collection, addDoc } from 'firebase/firestore';
import { db } from '../firebase/firebase';
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import {
  fetchCategories,
  fetchSubcategories,
  createProduct,
  CategoryType,
  SubCategoryType,
} from '../components/CreateProduct';

const units = ['pcs', 'kg', 'liter', 'box', 'pack'];
const storage = getStorage();

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

const AddProduct: React.FC = () => {
  const { productId } = useParams<{ productId: string }>();

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

  const [singleImagePreview, setSingleImagePreview] = useState<string | null>(null);
  const [singleImageFile, setSingleImageFile] = useState<File | null>(null);

  const [featureImagePreviews, setFeatureImagePreviews] = useState<string[]>([]);
  const [featureImageFiles, setFeatureImageFiles] = useState<File[]>([]);

  const [latest, setLatest] = useState(false);
  const [option, setOption] = useState(false);
  const [show, setShow] = useState(true);
  const [sponsored, setSponsored] = useState(false);

  const [errors, setErrors] = useState<ValidationErrors>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchCategories()
      .then(setCategories)
      .catch(() => Alert.alert('Error', 'Failed to load categories'));
  }, []);

  useEffect(() => {
    if (!category) {
      setSubcategories([]);
      return;
    }
    fetchSubcategories(category)
      .then(setSubcategories)
      .catch(() => Alert.alert('Error', 'Failed to load subcategories'));
  }, [category]);

  useEffect(() => {
    if (!productId) return;

    const fetchProduct = async () => {
      try {
        const productRef = doc(db, 'product', productId);
        const docSnap = await getDoc(productRef);
        if (!docSnap.exists()) {
          Alert.alert('Error', 'Product not found');
          return;
        }
        const data = docSnap.data();

        setProductName(data.tittle || '');
        setStock(data.stock || '');

        // discount holds MRP
        setMrp(data.discount || '');

        setPrice(data.price || '');

        // itemcategory holds quantity + unit, e.g., "300 Ml"
        const itemcat = data.itemcategory || '';
        const parts = itemcat.split(' ');
        setQuantity(parts[0] || '');
        setUnit(parts.slice(1).join(' ') || '');

        setDescription(data.description || '');
        setCategory(data.category || '');
        setSubcategory(data.subcategory || '');
        setSingleImagePreview(data.image || null);
        setFeatureImagePreviews(data.featureImages || []);
        setSingleImageFile(null);
        setFeatureImageFiles([]);

        setLatest(!!data.latest);
        setOption(!!data.option);
        setShow(!!data.show);
        setSponsored(!!data.sponsored);

        setErrors({});
      } catch (err) {
        Alert.alert('Error', 'Failed to fetch product data');
        console.error(err);
      }
    };

    fetchProduct();
  }, [productId]);

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

    // if (featureImageFiles.length === 0 && featureImagePreviews.length === 0)
    //   errs.featureImages = 'At least one feature image required';
    if (featureImageFiles.length + featureImagePreviews.length > 6)
      errs.featureImages = 'Maximum 6 feature images allowed';

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const uploadFile = async (file: File, folder: string): Promise<string> => {
    const filename = `${Date.now()}_${file.name}`;
    const storageRef = ref(storage, `${folder}/${filename}`);
    const snapshot = await uploadBytesResumable(storageRef, file);
    return await getDownloadURL(snapshot.ref);
  };

  const uploadFeatureImages = async (files: File[]): Promise<string[]> => {
    const urls = await Promise.all(files.map((file) => uploadFile(file, 'products/features')));
    return urls;
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

  const handleSubmit = async () => {
    if (!validate()) return;

    setLoading(true);
    try {
      let mainImageUrl = singleImagePreview;
      let featureImagesUrls = [...featureImagePreviews];

      if (singleImageFile) {
        mainImageUrl = await uploadFile(singleImageFile, 'products/main');
      }

      if (featureImageFiles.length > 0) {
        const uploadedFeatureImages = await uploadFeatureImages(featureImageFiles);
        featureImagesUrls = [...featureImagesUrls, ...uploadedFeatureImages];
      }

      const productData = {
        tittle: productName.trim(),
        description: description.trim(),
        stock: stock.trim(),
        price: price.trim(),
        discount: mrp.trim(),
        category,
        subcategory,
        itemcategory: quantity.trim() + ' ' + unit,
        available: true,
        latest,
        option,
        show,
        sponsored,
        image: mainImageUrl,
        featureImages: featureImagesUrls,
      };

      if (productId) {
        // Update existing product
        const productRef = doc(db, 'product', productId);
        await updateDoc(productRef, productData);
        Alert.alert('Success', 'Product updated successfully!');
      } else {
        // Create new product
        const productCollectionRef = collection(db, 'product');
        await addDoc(productCollectionRef, productData);
        Alert.alert('Success', 'Product created successfully!');
        resetForm();
      }
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Failed to save product');
    }
    setLoading(false);
  };

  const pickSingleImage = () => {
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
        setSingleImageFile(target.files[0]);
        setSingleImagePreview(URL.createObjectURL(target.files[0]));
        setErrors(prev => ({ ...prev, singleImage: undefined }));
      }
    };
    input.click();
  };

  const pickFeatureImages = () => {
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
        if (files.length + featureImageFiles.length + featureImagePreviews.length > 6) {
          Alert.alert('Limit Exceeded', 'You can upload up to 6 feature images.');
          files = files.slice(0, 6 - featureImageFiles.length - featureImagePreviews.length);
        }
        setFeatureImageFiles(prev => [...prev, ...files]);
        setFeatureImagePreviews(prev => [...prev, ...files.map(f => URL.createObjectURL(f))]);
        setErrors(prev => ({ ...prev, featureImages: undefined }));
      }
    };
    input.click();
  };

  const removeFeatureImage = (index: number) => {
    // Remove from previews
    setFeatureImagePreviews(prev => {
      const newPreviews = [...prev];
      newPreviews.splice(index, 1);
      return newPreviews;
    });
    // Remove from files if index corresponds to files array
    setFeatureImageFiles(prev => {
      if (index < prev.length) {
        const newFiles = [...prev];
        newFiles.splice(index, 1);
        return newFiles;
      }
      return prev;
    });
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
  }: {
    label: string;
    value: string;
    onChangeText: (text: string) => void;
    error?: string;
    placeholder?: string;
    keyboardType?: 'default' | 'numeric' | 'email-address' | 'phone-pad';
    multiline?: boolean;
    numberOfLines?: number;
  }) => (
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

  const renderPicker = ({
    label,
    selectedValue,
    onValueChange,
    items,
    error,
    enabled = true,
  }: {
    label: string;
    selectedValue: string;
    onValueChange: (value: string) => void;
    items: (CategoryType | SubCategoryType | string)[];
    error?: string;
    enabled?: boolean;
  }) => (
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

  const renderSwitch = (label: string, value: boolean, onValueChange: (val: boolean) => void) => (
    <View style={styles.switchContainer}>
      <Text style={styles.label}>{label}</Text>
      <Switch value={value} onValueChange={onValueChange} />
    </View>
  );

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.headerContainer}>
          <Text style={styles.title}>{productId ? 'Edit Product' : 'Create Product'}</Text>
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
              {renderInputField({ label: 'Stock *', value: stock, onChangeText: setStock, keyboardType: 'numeric', error: errors.stock })}
            </View>

            <View style={styles.halfWidth}>
              {renderInputField({ label: 'MRP (₹) *', value: mrp, onChangeText: setMrp, keyboardType: 'numeric', error: errors.mrp })}
            </View>
          </View>

          <View style={styles.row}>
            <View style={styles.halfWidth}>
              {renderInputField({ label: 'Price (₹) *', value: price, onChangeText: setPrice, keyboardType: 'numeric', error: errors.price })}
            </View>

            <View style={styles.halfWidth}>
              {renderInputField({ label: 'Quantity *', value: quantity, onChangeText: setQuantity, keyboardType: 'numeric', error: errors.quantity })}
            </View>
          </View>

          {renderPicker({ label: 'Unit *', selectedValue: unit, onValueChange: setUnit, items: units, error: errors.unit })}
          {renderPicker({ label: 'Category *', selectedValue: category, onValueChange: (val) => { setCategory(val); setSubcategory(''); }, items: categories, error: errors.category })}
          {renderPicker({ label: 'Subcategory *', selectedValue: subcategory, onValueChange: setSubcategory, items: subcategories, error: errors.subcategory, enabled: !!category })}

          {renderInputField({
            label: 'Description *',
            value: description,
            onChangeText: setDescription,
            multiline: true,
            numberOfLines: 4,
            placeholder: 'Enter product description',
            error: errors.description,
          })}

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Main Product Image *</Text>
            <TouchableOpacity style={[styles.imagePickerButton, errors.singleImage && styles.inputError]} onPress={pickSingleImage}>
              {singleImagePreview ? (
                <Image source={{ uri: singleImagePreview }} style={styles.singleImagePreview} />
              ) : (
                <Text style={styles.imagePickerButtonText}>Tap to select main image</Text>
              )}
            </TouchableOpacity>
            {singleImagePreview && (
              <TouchableOpacity
                style={styles.deleteImageBtn}
                onPress={() => {
                  setSingleImagePreview(null);
                  setSingleImageFile(null);
                }}
              >
                <Text style={styles.deleteImageText}>Delete Main Image</Text>
              </TouchableOpacity>
            )}
            {errors.singleImage && <Text style={styles.errorText}>{errors.singleImage}</Text>}
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Feature Images (max 6) *</Text>
            <TouchableOpacity style={[styles.imagePickerButton, errors.featureImages && styles.inputError]} onPress={pickFeatureImages}>
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

          <TouchableOpacity style={[styles.submitButton, loading && styles.submitButtonDisabled]} onPress={handleSubmit} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitButtonText}>{productId ? 'Update Product' : 'Create Product'}</Text>}
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
  deleteImageBtn: {
    backgroundColor: '#dc3545',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    marginTop: 8,
    alignSelf: 'center',
  },
  deleteImageText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
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

export default AddProduct;
