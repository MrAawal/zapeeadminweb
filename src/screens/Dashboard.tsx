import React, { useState, useEffect } from "react";
import { Picker } from '@react-native-picker/picker';
import { useNavigate, useParams } from "react-router-dom";
import { fetchMonthlyOrderTotals, OrderDataPoint } from '../components/Charts';
import { getDashboardStats, DashboardStats } from "../components/analytics"; // Adjust path
import { fetchTotalsChargesAndPrice, TotalsResult } from '../components/Charges';
import { collection, getDocs } from "firebase/firestore";
import { storage, db } from "../firebase"; // Adjust import paths
import { ref, getDownloadURL } from "firebase/storage";


const currentXoneUid = "voT4WYa4VNMQnYgFXlKVcIUeuEL2"; // Replace with actual UID
const windowHeight = Dimensions.get("window").height;
const windowWidth = Dimensions.get("window").width;




// Type for branch location
type BranchLocation = {
  branchId: string;
  geohash: string;
  lat: number;
  lng: number;
};

type ImageDoc = {
  folder: string;
  filename: string;
  storagePath: string;
};

type FolderImages = {
  [folder: string]: string[]; // Array of image URIs
};





import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  FlatList,
  Modal,
  ScrollView,
  Switch,
  Dimensions,
  ActivityIndicator,
  Alert,
  Image,
  Platform,
} from "react-native";
import { format } from "date-fns";


//Chart APIs 
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';



// User APIs
import {
  fetchUsers,
  searchUsersByPhone,
  toggleUserActiveStatus,
  deleteUser,
  User,
} from "../components/UserModel";


// Product APIs
import {
  Product,
  fetchProducts,
  addProduct,
  updateProduct,
  deleteProduct,
} from "../components/ProductModel";


// Order APIs
import {
  fetchOrdersByDate,
  searchOrderById,
  viewOrderItems,
  cancelOrderById,
  Order,
} from "../components/OrderModel";


// Restaurant APIs
import {
  fetchRestaurants,
  addRestaurant,
  updateRestaurant,
  searchRestaurants,
  toggleRestaurantActive,
  Restaurant,
} from "../components/RestaurantModel";


// Partner APIs
import {
  Partner,
  fetchPartners,
  addPartner,
  updatePartner,
  togglePartnerStatus,
  deletePartner
} from "../components/PartnerModel";

// Category APIs
import {
  fetchCategories,
  addCategory,
  updateCategory,
  deleteCategory,
  ProductCategory,
} from "../components/CategoryModel"; // Adjust this import path


//Branch APIs
import {
  fetchAllBranches,
  addNewBranch,
  updateBranch,
  Branch,
  saveBranch,
} from "../components/BranchModel"; // adjust path as needed

const statusOptions = [
  { label: "All", value: "" },
  { label: "Delivered", value: "Delivered" },
  { label: "Pending", value: "Pending" },
  { label: "Cancelled", value: "Cancelled" },
];


const sections = [
  { key: "analytics", label: "Analytics" },
  { key: "users", label: "Users" },
  { key: "products", label: "Products" },
  { key: "orders", label: "Orders" },
  { key: "restaurant", label: "Restaurant" },
  { key: "pertner", label: "Partner" },
  { key: "category", label: "Category" },
  { key: "branch", label: "Branch" },
  { key: "galary", label: "Galary" },
];

const emptyProduct: Omit<Product, "id" | "timestamp"> = {
  tittle: "",
  description: "",
  price: "",
  stock: "",
  discount: "",
  image: "",
  featureImages: [],      // Added for multiple images
  branch: "",
  category: "",
  subcategory: "",
  itemcategory: "",
  show: true,
  available: true,
  latest: false,
  sponsored: false,
  option: false,
};

const emptyRestaurant: Omit<Restaurant, "id" | "timestamp"> = {
  details: "",
  active: true,
  address: "",
  announcement: "",
  bannerImages: [],
  branchId: "",
  category: "",
  createdTimestamp: null as any,
  delivery: 15,
  feature: "",
  image: "",
  kmcharge: 7,
  mapaddress: "",
  mappin: "",
  minAmount: 499,
  online: false,
  packing: 10,
  phone: "",
  pincode: "",
  policy: "",
  premium: false,
  range: 10,
  rating: 5.0,
  service: 0,
  show: true,
  storename: "",
  storeLat: "",
  storeLon: "",
  storeuid: "",
  sublocality: "",
  tax: 0,
  uid: "",
};

const emptyPartner: Omit<Partner, "id" | "timestamp"> = {
  Partnerdl: "",
  Partnerid: "",
  active: true,
  createdTimestamp: null as any,
  partnerLat: "",
  partnerLon: "",
  phone: "",
  pincode: "",
  storeid: "",
  storename: "",
};

const emptyCategory: Omit<ProductCategory, "id" | "createdTimestamp"> = {
  tittle: "",
  description: "",
  branchId: [],
  image: "",
  tag: "",
  show: true,
};

const emptyBranch: Omit<Branch, "uid" | "timestamp"> = {
  announcement: " 🙏 Thank You for Choosing Zapee! We appreciate your trust in us. We are here to serve you better every day  ",
  bannerImages: [],
  branchId: "111111",
  delivery: 15,
  kmcharge: 7,
  minAmount: 499,
  online: false,
  packing: 5,
  phone: "1111111111",
  pincode: "111111",
  policy: "📦 Order PackedIf Your order has been packed and is ready for dispatch.Please accept the order upon delivery and cooperate with our team.Thank you for choosing us!",
  radius: "15",
  range: 10,
  service: 0,
  storeLat: "26.227913",
  storeLon: "90.230262",
  storecate: "groccery",
  storename: "TEST",
  storeuid: "111111",
  tax: 0,
};


const AdminDashboard: React.FC = () => {

  const [activeSection, setActiveSection] = useState<string>("analytics");
  const [collapsed, setCollapsed] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");


  /** Analytics*/
  const [analyticsStats, setAnalyticsStats] = useState<DashboardStats | null>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [analyticsError, setAnalyticsError] = useState('');
  const [data, setData] = useState<OrderDataPoint[]>([]);
  const [chargesTotals, setChargesTotals] = useState<TotalsResult | null>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);


  /** Users state */
  const [users, setUsers] = useState<User[]>([]);
  const [totalUsers, setTotalUsers] = useState<number>(0);
  const [searchPhone, setSearchPhone] = useState<string>("");

  /** Products state */
  const [products, setProducts] = useState<Product[]>([]);
  const [productSearch, setProductSearch] = useState<string>("");
  const [modalVisible, setModalVisible] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productForm, setProductForm] = useState(emptyProduct);
  const navigate = useNavigate();

  const [mainImageFile, setMainImageFile] = React.useState<File | null>(null);
  const [featureImageFiles, setFeatureImageFiles] = React.useState<File[]>([]);

  /** Restaurant state */
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [restaurantSearch, setRestaurantSearch] = useState<string>("");
  const [restaurantModalVisible, setRestaurantModalVisible] = useState(false);
  const [editRestaurantModalVisible, setEditRestaurantModalVisible] = useState(false);
  const [editingRestaurant, setEditingRestaurant] = useState<Restaurant | null>(null);
  const [restaurantForm, setRestaurantForm] = useState(emptyRestaurant);
  const [restaurantLoading, setRestaurantLoading] = useState(false);
  const [restaurantError, setRestaurantError] = useState<string>("");

  /** Orders state */
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [searchId, setSearchId] = useState<string>("");
  const [filterStatus, setFilterStatus] = useState<string>("");
  const [filterRestaurant, setFilterRestaurant] = useState<string>("");
  const [filterDp, setFilterDp] = useState<string>("");
  const [orderItems, setOrderItems] = useState<any[]>([]);
  const [orderModalVisible, setOrderModalVisible] = useState<boolean>(false);
  const [totalDeliveryCharge, setTotalDeliveryCharge] = useState<number>(0);
  const [totalPrice, setTotalPrice] = useState<number>(0);
  const [totalPackingCharge, setTotalPackingCharge] = useState<number>(0);
  const [totalTax, setTotalTax] = useState<number>(0);
  const [totalServiceCharge, setTotalServiceCharge] = useState<number>(0);



  /** Partner state */
  const [partners, setPartners] = useState<Partner[]>([]);
  const [partnerSearch, setPartnerSearch] = useState('');
  const [partnerLoading, setPartnerLoading] = useState(false);
  const [partnerError, setPartnerError] = useState('');
  const [partnerModalVisible, setPartnerModalVisible] = useState(false);
  const [partnerEditModalVisible, setPartnerEditModalVisible] = useState(false);
  const [editingPartner, setEditingPartner] = useState<Partner | null>(null);
  const [partnerForm, setPartnerForm] = useState<Partner>(emptyPartner);

  /** Category state */
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [categoryloading, setcategoryLoading] = useState(false);
  const [categorySearch, setcategorySearch] = useState("");
  const [categoryModalVisible, setcategoryModalVisible] = useState(false);
  const [editingCategory, setEditingCategory] = useState<ProductCategory | null>(null);
  const [categoryForm, setCategoryForm] = useState(emptyCategory);

  /** Branch state */
  const [branches, setBranches] = useState<Branch[]>([]);
  const [searchText, setSearchText] = useState("");
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [newBranch, setNewBranch] = useState(emptyBranch);
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);

  const [gallery, setGallery] = useState<FolderImages>({});






  //Counts
  useEffect(() => {
    async function loadAnalytics() {
      setAnalyticsLoading(true);
      setAnalyticsError('');
      try {
        const data = await getDashboardStats();
        setAnalyticsStats(data);


        const startDate = new Date('2025-08-01T00:00:00');
        const endDate = new Date('2025-08-31T23:59:59');
        const xoneFilter = 'voT4WYa4VNMQnYgFXlKVcIUeuEL2';

        const totals = await fetchTotalsChargesAndPrice(db, startDate, endDate, xoneFilter);
        setChargesTotals(totals);


      } catch (e) {
        setAnalyticsError('Failed to load analytics');
      }
      setAnalyticsLoading(false);
    }

    if (activeSection === 'analytics') {
      loadAnalytics();
    }
  }, [activeSection]);



  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1); // start of current month
  });

  //charges
  useEffect(() => {
    if (activeSection !== 'analytics') return;

    async function loadData() {
      setLoading(true);


      try {
        const statData = await getDashboardStats();
        setStats(statData);

        // Calculate start and end dates based on currentMonth state
        const startDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1, 0, 0, 0);
        const endDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0, 23, 59, 59);

        // Your filter value (e.g., user ID or zone)
        const xoneFilter = 'voT4WYa4VNMQnYgFXlKVcIUeuEL2';

        // Fetch totals dynamically for selected month
        const totals = await fetchTotalsChargesAndPrice(db, startDate, endDate, xoneFilter);
        setChargesTotals(totals);
      } catch (e) {
        setError('Failed to load dashboard data');
        console.error(e);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [activeSection, currentMonth]);


  //chart
  useEffect(() => {
    const startDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1, 0, 0, 0);
    const endDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0, 23, 59, 59);

    fetchMonthlyOrderTotals(db, startDate, endDate)
      .then(setData)
      .catch(console.error);
  }, [currentMonth]);

  const goToPreviousMonth = () => {
    setCurrentMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  //Users
  useEffect(() => {
    if (activeSection === "users") loadUsers();
  }, [activeSection]);

  function maskPhone(phone: string): string {
    if (phone.length <= 4) return phone; // If short, just return as is

    const last4 = phone.slice(-4);
    const masked = last4.padStart(phone.length, "x");
    return masked;
  }

  async function loadUsers() {
    const fetchedUsers = await fetchUsers();
    setUsers(fetchedUsers);
    setTotalUsers(fetchedUsers.length);
  }

  async function handleSearchUsers(text: string) {
    setSearchPhone(text);
    const results = await searchUsersByPhone(text);
    setUsers(results);
    setTotalUsers(results.length);
  }

  async function toggleUserActive(user: User) {
    const currentlyActive = !user.notActive;
    await toggleUserActiveStatus(user.userId, currentlyActive);
    loadUsers();
  }

  async function removeUser(user: User) {
    // await deleteUser(user.userId);
    loadUsers();
  }


  //Products
  useEffect(() => {
    if (activeSection === "products") loadProducts(productSearch);
  }, [activeSection, productSearch]);

  async function loadProducts(searchTerm: string) {
    let prods = await fetchProducts();
    if (searchTerm.trim()) {
      prods = prods.filter((p) =>
        p.tittle.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    setProducts(prods);
  }

  function openAddProductModal() {
    setProductForm(emptyProduct);
    setEditingProduct(null);
    setModalVisible(true);
  }

  function openEditProductModal(product: Product) {
    setProductForm(product);
    setEditingProduct(product);
    setModalVisible(true);
  }

  function handleProductFormChange(
    field: keyof Omit<Product, "id" | "timestamp">,
    value: any
  ) {
    setProductForm((prev) => ({ ...prev, [field]: value }));
  }

  async function saveProduct() {
    if (editingProduct && editingProduct.id) {
      await updateProduct(editingProduct.id, productForm);
    } else {
      await addProduct(productForm);
    }
    setModalVisible(false);
    loadProducts(productSearch);
  }

  async function deleteProd(id?: string) {
    if (!id) return;

    const confirmed = window.confirm("Are you sure you want to delete this Product?");
    if (!confirmed) return;

    try {
      await deleteProduct(id);
      loadProducts(productSearch);
      setLoading(true);
    } catch {
      alert("Failed to delete subcategory");
    }

  }



  // Restaurant Functions
  useEffect(() => {
    if (activeSection === "restaurant") loadRestaurants();
  }, [activeSection]);

  async function loadRestaurants() {
    setRestaurantLoading(true);
    setRestaurantError("");
    try {

      let data = await fetchRestaurants();
      if (restaurantSearch.trim()) {
        const results = await searchRestaurants(restaurantSearch.trim());
        setRestaurants(results);
      } else {
        setRestaurants(data);
      }
    } catch {
      setRestaurantError("Failed to load restaurants.");
    }
    setRestaurantLoading(false);
  }

  async function handleSearchRestaurants() {
    if (!restaurantSearch.trim()) {
      loadRestaurants();
      return;
    }
    setRestaurantLoading(true);
    setRestaurantError("");
    try {
      const results = await searchRestaurants(restaurantSearch.trim());
      setRestaurants(results);
      if (results.length === 0) {
        setRestaurantError("No restaurants found.");
      }
    } catch {
      setRestaurantError("Search failed.");
    }
    setRestaurantLoading(false);
  }

  async function handleToggleRestaurantActive(id: string, currentActive: boolean) {
    try {
      await toggleRestaurantActive(id, !currentActive);
      loadRestaurants();
    } catch {
      Alert.alert("Error", "Failed to update active status");
    }
  }

  function handleRestaurantFormChange(field: keyof typeof restaurantForm, value: any) {
    setRestaurantForm((prev) => ({ ...prev, [field]: value }));
  }

  function handleRestaurantEditChange(field: keyof Restaurant, value: any) {
    if (editingRestaurant) {
      setEditingRestaurant((prev) => ({ ...prev!, [field]: value }));
    }
  }

  async function handleAddRestaurant() {
    const branchId = restaurantForm.uid ? String(restaurantForm.uid) : "";

    if (!restaurantForm.storename.trim() || !restaurantForm.phone.trim()) {
      Alert.alert("Validation", "Store name and Phone are required");
      return;
    }

    if (!branchId) {
      Alert.alert("Validation", "Branch ID is required");
      return;
    }

    setRestaurantLoading(true);
    try {
      await addRestaurant(branchId, restaurantForm);
      setRestaurantModalVisible(false);
      setRestaurantForm(emptyRestaurant);
      loadRestaurants();
    } catch (error) {
      Alert.alert("Error", "Failed to add restaurant");
      console.error(error);
    }
    setRestaurantLoading(false);
  }


  async function handleUpdateRestaurant() {
    if (!editingRestaurant?.storename.trim() || !editingRestaurant?.phone.trim()) {
      Alert.alert("Validation", "Store name and Phone are required");
      return;
    }
    if (!editingRestaurant?.id) {
      Alert.alert("Error", "Restaurant ID is missing");
      return;
    }

    setRestaurantLoading(true);
    try {
      await updateRestaurant(editingRestaurant.id, editingRestaurant);
      setEditRestaurantModalVisible(false);
      setEditingRestaurant(null);
      loadRestaurants();
      Alert.alert("Success", "Restaurant updated successfully");
    } catch {
      Alert.alert("Error", "Failed to update restaurant");
    }
    setRestaurantLoading(false);
  }

  function openEditRestaurantModal(restaurant: Restaurant) {
    setEditingRestaurant({ ...restaurant });
    setEditRestaurantModalVisible(true);
  }

  function closeEditRestaurantModal() {
    setEditRestaurantModalVisible(false);
    setEditingRestaurant(null);
  }


  //Partner Function
  useEffect(() => {
    if (activeSection === 'pertner') {  // typo in 'partner' as per your sections
      loadPartners();
    }
  }, [activeSection]);

  async function loadPartners() {
    setPartnerLoading(true);
    setPartnerError('');
    try {

      const data = await fetchPartners();
      setPartners(data);

      let list = await fetchPartners();
      if (partnerSearch.trim()) {
        list = await fetchPartners(); // Or use search API
        list = list.filter(p =>
          p.storename.toLowerCase().includes(partnerSearch.toLowerCase()) ||
          p.Partnerid.toLowerCase().includes(partnerSearch.toLowerCase()) ||
          p.phone.includes(partnerSearch) ||
          p.pincode.includes(partnerSearch)
        );
      }
      setPartners(list);
    } catch {
      setPartnerError('Failed to load partners.');
    }
    setPartnerLoading(false);
  }

  async function savePartner() {
    if (!partnerForm.storename.trim() || !partnerForm.phone.trim()) {
      Alert.alert('Validation', 'Store name and Phone are required');
      return;
    }
    setPartnerLoading(true);
    try {
      if (editingPartner && editingPartner.id) {
        await updatePartner(editingPartner.id, partnerForm);
      } else {
        await addPartner(partnerForm);
      }
      setPartnerModalVisible(false);
      setPartnerEditModalVisible(false);
      setEditingPartner(null);
      setPartnerForm(emptyPartner);
      await loadPartners();
      Alert.alert('Success', editingPartner ? 'Partner updated' : 'Partner added');
    } catch {
      Alert.alert('Error', editingPartner ? 'Failed to update partner' : 'Failed to add partner');
    }
    setPartnerLoading(false);
  }

  async function togglePartner(id: string, active: boolean) {
    try {
      await togglePartnerStatus(id, active);
      await loadPartners();
    } catch {
      Alert.alert('Error', 'Failed to update partner status');
    }
  }

  async function deletePartnerById(id?: string) {
    if (!id) return;

    const confirmed = window.confirm("Are you sure you want to delete this subcategory?");
    if (!confirmed) return;

    setLoading(true);
    try {
      await deletePartner(id);
      await loadPartners();
    } catch {
      alert("Failed to delete subcategory");
    }
    setLoading(false);
  }

  function openPartnerAddModal() {
    setPartnerForm(emptyPartner);
    setEditingPartner(null);
    setPartnerModalVisible(true);
  }

  function openPartnerEditModal(partner: Partner) {
    setEditingPartner(partner);
    setPartnerForm(partner);
    setPartnerEditModalVisible(true);
  }



  //category finction//
  useEffect(() => {
    loadCategories();
  }, []);
  async function saveCategory() {
    if (!categoryForm.tittle.trim()) {
      Alert.alert("Validation", "Category Title is required");
      return;
    }
    setLoading(true);
    try {
      if (editingCategory) {
        await updateCategory(editingCategory.id!, categoryForm);
      } else {
        await addCategory(categoryForm);
      }
      setModalVisible(false);
      loadCategories();
    } catch {
      Alert.alert("Error", "Failed to save category");
    }
    setLoading(false);
  }

  async function loadCategories() {
    setLoading(true);
    try {
      const data = await fetchCategories();
      setCategories(data);
    } catch (e) {
      Alert.alert("Error", "Failed to load categories.");
      setCategories([]);
    }
    setLoading(false);
  }

  async function searchCategories(text: string) {
    setcategorySearch(text);
    if (text.trim() === "") {
      loadCategories();
      return;
    }
    setLoading(true);
    try {
      const all = await fetchCategories();
      const filtered = all.filter(cat =>
        cat.tittle.toLowerCase().includes(text.toLowerCase()) ||
        cat.tag.includes(text)
      );
      setCategories(filtered);
    } catch {
      Alert.alert("Error", "Search failed");
    }
    setLoading(false);
  }
  async function deleteItem(id?: string) {
    if (!id) return;

    const confirmed = window.confirm("Are you sure you want to delete this subcategory?");
    if (!confirmed) return;

    setLoading(true);
    try {
      await deleteCategory(id);
      loadCategories();
    } catch {
      alert("Failed to delete subcategory");
    }
    setLoading(false);
  }

  function openAddModal() {
    setEditingCategory(null);
    setCategoryForm(emptyCategory);
    setModalVisible(true);
  }

  function openEditModal(cat: ProductCategory) {
    setEditingCategory(cat);
    setCategoryForm({
      tittle: cat.tittle,
      description: cat.description,
      branchId: cat.branchId || [],
      image: cat.image || "",
      tag: cat.tag,
      show: cat.show,
    });
    setModalVisible(true);
  }

  function onFormChange(field: keyof typeof categoryForm, value: any) {
    setCategoryForm(prev => ({ ...prev, [field]: value }));
  }



  //Orders when active or date/status changes */
  useEffect(() => {
    if (activeSection === "orders") loadOrdersForDate(selectedDate, filterStatus, filterDp, filterRestaurant);
  }, [activeSection, selectedDate, filterStatus, filterDp, filterRestaurant]);

  async function loadOrdersForDate(date: Date, statusFilter: string, filterDp: string, filterRestaurant: string) {
    setLoading(true);
    setError("");
    try {
      let fetchedOrders = await fetchOrdersByDate(currentXoneUid, date);
      if (statusFilter) {
        fetchedOrders = fetchedOrders.filter((order) => order.status === statusFilter);
      }

      if (filterDp) {
        fetchedOrders = fetchedOrders.filter((order) => order.dpId === filterDp);
      }

      if (filterRestaurant) {
        fetchedOrders = fetchedOrders.filter((order) => order.customerStoreUid === filterRestaurant);
      }
      setOrders(fetchedOrders);
      calculateTotals(fetchedOrders);
    } catch {
      setError("Failed to load orders.");
      setOrders([]);
      setTotalDeliveryCharge(0);
      setTotalPrice(0);
      setTotalPackingCharge(0);
      setTotalTax(0);
      setTotalPackingCharge(0);
    }
    setLoading(false);
  }

  function calculateTotals(orders: Order[]) {
    let deliverySum = 0,
      packingSum = 0,
      taxSum = 0,
      serviceSum = 0,
      priceSum = 0;
    orders.forEach((order) => {
      deliverySum += parseFloat(order.deliveryCharge) || 0;
      packingSum += parseFloat(order.packing) || 0;
      taxSum += parseFloat(order.tax) || 0;
      serviceSum += parseFloat(order.service) || 0;
      priceSum += parseFloat(order.totalPrice) || 0;
    });
    setTotalDeliveryCharge(deliverySum);
    setTotalPrice(priceSum);
    setTotalPackingCharge(packingSum);
    setTotalServiceCharge(serviceSum);
    setTotalTax(taxSum);

  }

  async function handleSearchOrders() {
    if (!searchId.trim()) {
      loadOrdersForDate(selectedDate, filterStatus, filterDp, filterRestaurant);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const order = await searchOrderById(searchId.trim(), currentXoneUid);
      if (order) setOrders([order]);
      else {
        setOrders([]);
        setError("Order not found.");
      }
    } catch {
      setError("Search failed.");
      setOrders([]);
      setTotalDeliveryCharge(0);
      setTotalPrice(0);
    }
    setLoading(false);
  }

  function isSameDate(d1: Date, d2: Date) {
    return (
      d1.getFullYear() === d2.getFullYear() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getDate() === d2.getDate()
    );
  }

  async function openOrderItemsModal(orderId?: string) {
    if (!orderId) return;
    setLoading(true);
    try {
      const items = await viewOrderItems(orderId);
      setOrderItems(items);
      setOrderModalVisible(true);
      setError("");
    } catch {
      setError("Failed to load order items.");
      setOrderItems([]);
      setOrderModalVisible(false);
    }
    setLoading(false);
  }

  function closeModal() {
    setOrderModalVisible(false);
    setOrderItems([]);
  }

  function goToPreviousDate() {
    const prevDate = new Date(selectedDate);
    prevDate.setDate(prevDate.getDate() - 1);
    setSelectedDate(prevDate);
  }

  function goToNextDate() {
    const nextDate = new Date(selectedDate);
    nextDate.setDate(nextDate.getDate() + 1);
    setSelectedDate(nextDate);
  }


  async function handleCancelOrder(orderId?: string) {
    if (!orderId) return;

    const confirmed = window.confirm("Are you sure you want to Cancel this order?");
    if (!confirmed) return;

    setLoading(true);
    try {
      await cancelOrderById(orderId);
      await loadOrdersForDate(selectedDate, filterStatus, filterDp, filterRestaurant);
      setOrderModalVisible(false);
      setError("");
    } catch {
      alert("Failed to delete subcategory");
    }
    setLoading(false);
  }



  const handleLogout = () => {
    // Perform logout logic here (e.g., clear auth tokens, sign out user)
    // Example:
    localStorage.removeItem("userToken"); // or your auth cleaning logic

    // Navigate to home or login page
    navigate("/", { replace: true });
  };
  const numColumns = 2; // For order items modal grid

  const renderGridItem = ({ item }: { item: any }) => (
    <View style={styles.gridItem}>
      {(item.image || item.img) && (
        <Image
          source={{ uri: item.image || item.img }}
          style={styles.productImage}
          resizeMode="contain"
        />
      )}
      {Object.entries(item).map(([key, value]) => (
        <View key={key} style={styles.fieldRow}>
          <Text style={styles.fieldKey}>{key}:</Text>
          <Text style={styles.fieldValue}>{String(value)}</Text>
        </View>
      ))}
    </View>
  );

  const renderRestaurantFormFields = (restaurant: any, isEdit: boolean) => (
    <>
      <View style={{ flexDirection: "row", marginBottom: 12 }}>
        <TextInput
          placeholder="Store Name"
          style={[styles.input, { flex: 1, marginHorizontal: 4 }]}
          value={restaurant.storename}
          onChangeText={t => isEdit ? handleRestaurantEditChange("storename", t) : handleRestaurantFormChange("storename", t)}
        />
        <TextInput
          placeholder="Phone"
          style={[styles.input, { flex: 1, marginHorizontal: 4 }]}
          value={restaurant.phone}
          onChangeText={t => isEdit ? handleRestaurantEditChange("phone", t) : handleRestaurantFormChange("phone", t)}
          keyboardType="phone-pad"
        />

        <TextInput
          placeholder="Address"
          style={[styles.input, { flex: 1, marginHorizontal: 4 }]}
          value={restaurant.address}
          onChangeText={t => isEdit ? handleRestaurantEditChange("address", t) : handleRestaurantFormChange("address", t)}
        />
        <TextInput
          placeholder="Details"
          style={[styles.input, { flex: 1, marginHorizontal: 4 }]}
          value={restaurant.details}
          onChangeText={t => isEdit ? handleRestaurantEditChange("details", t) : handleRestaurantFormChange("details", t)}
          multiline
        />
      </View>

      <View style={{ flexDirection: "row", marginBottom: 12 }}>
        <TextInput
          placeholder="Category"
          style={[styles.input, { flex: 1, marginHorizontal: 4 }]}
          value={restaurant.category}
          onChangeText={t => isEdit ? handleRestaurantEditChange("category", t) : handleRestaurantFormChange("category", t)}
        />
        <TextInput
          placeholder="Announcement"
          style={[styles.input, { flex: 1, marginHorizontal: 4 }]}
          value={restaurant.announcement}
          onChangeText={t => isEdit ? handleRestaurantEditChange("announcement", t) : handleRestaurantFormChange("announcement", t)}
          multiline
        />

        <TextInput
          placeholder="Banner Images (comma separated)"
          style={[styles.input, { flex: 1, marginHorizontal: 4 }]}
          value={Array.isArray(restaurant.bannerImages) ? restaurant.bannerImages.join(",") : restaurant.bannerImages}
          onChangeText={t => isEdit ? handleRestaurantEditChange("bannerImages", t.split(",").map(s => s.trim())) : handleRestaurantFormChange("bannerImages", t.split(",").map(s => s.trim()))}
        />
        <TextInput
          placeholder="Branch Id"
          style={[styles.input, { flex: 1, marginHorizontal: 4 }]}
          value={restaurant.branchId}
          onChangeText={t => isEdit ? handleRestaurantEditChange("branchId", t) : handleRestaurantFormChange("branchId", t)}
        />
      </View>

      <View style={{ flexDirection: "row", marginBottom: 12 }}>
        <TextInput
          placeholder="Delivery Charge"
          style={[styles.input, { flex: 1, marginHorizontal: 4 }]}
          keyboardType="numeric"
          value={restaurant.delivery.toString()}
          onChangeText={t => isEdit ? handleRestaurantEditChange("delivery", Number(t)) : handleRestaurantFormChange("delivery", Number(t))}
        />
        <TextInput
          placeholder="Feature"
          style={[styles.input, { flex: 1, marginHorizontal: 4 }]}
          value={restaurant.feature}
          onChangeText={t => isEdit ? handleRestaurantEditChange("feature", t) : handleRestaurantFormChange("feature", t)}
        />

        <TextInput
          placeholder="Image URL"
          style={[styles.input, { flex: 1, marginHorizontal: 4 }]}
          value={restaurant.image}
          onChangeText={t => isEdit ? handleRestaurantEditChange("image", t) : handleRestaurantFormChange("image", t)}
        />
        <TextInput
          placeholder="Km Charge"
          style={[styles.input, { flex: 1, marginHorizontal: 4 }]}
          keyboardType="numeric"
          value={restaurant.kmcharge.toString()}
          onChangeText={t => isEdit ? handleRestaurantEditChange("kmcharge", Number(t)) : handleRestaurantFormChange("kmcharge", Number(t))}
        />
      </View>

      <View style={{ flexDirection: "row", marginBottom: 12 }}>
        <TextInput
          placeholder="Map Address"
          style={[styles.input, { flex: 1, marginHorizontal: 4 }]}
          value={restaurant.mapaddress}
          onChangeText={t => isEdit ? handleRestaurantEditChange("mapaddress", t) : handleRestaurantFormChange("mapaddress", t)}
        />
        <TextInput
          placeholder="Map Pin"
          style={[styles.input, { flex: 1, marginHorizontal: 4 }]}
          value={restaurant.mappin}
          onChangeText={t => isEdit ? handleRestaurantEditChange("mappin", t) : handleRestaurantFormChange("mappin", t)}
        />

        <TextInput
          placeholder="Minimum Order Amount"
          style={[styles.input, { flex: 1, marginHorizontal: 4 }]}
          keyboardType="numeric"
          value={restaurant.minAmount.toString()}
          onChangeText={t => isEdit ? handleRestaurantEditChange("minAmount", Number(t)) : handleRestaurantFormChange("minAmount", Number(t))}
        />
        <TextInput
          placeholder="Packing Charge"
          style={[styles.input, { flex: 1, marginHorizontal: 4 }]}
          keyboardType="numeric"
          value={restaurant.packing.toString()}
          onChangeText={t => isEdit ? handleRestaurantEditChange("packing", Number(t)) : handleRestaurantFormChange("packing", Number(t))}
        />
      </View>

      <View style={{ flexDirection: "row", marginBottom: 12 }}>
        <TextInput
          placeholder="Pin Code"
          style={[styles.input, { flex: 1, marginHorizontal: 4 }]}
          value={restaurant.pincode}
          onChangeText={t => isEdit ? handleRestaurantEditChange("pincode", t) : handleRestaurantFormChange("pincode", t)}
        />
        <TextInput
          placeholder="Policy"
          style={[styles.input, { flex: 1, marginHorizontal: 4 }]}
          value={restaurant.policy}
          onChangeText={t => isEdit ? handleRestaurantEditChange("policy", t) : handleRestaurantFormChange("policy", t)}
          multiline
        />

        <TextInput
          placeholder="Range"
          style={[styles.input, { flex: 1, marginHorizontal: 4 }]}
          keyboardType="numeric"
          value={restaurant.range.toString()}
          onChangeText={t => isEdit ? handleRestaurantEditChange("range", Number(t)) : handleRestaurantFormChange("range", Number(t))}
        />
        <TextInput
          placeholder="Rating"
          style={[styles.input, { flex: 1, marginHorizontal: 4 }]}
          keyboardType="numeric"
          value={restaurant.rating.toString()}
          onChangeText={t => isEdit ? handleRestaurantEditChange("rating", Number(t)) : handleRestaurantFormChange("rating", Number(t))}
        />
      </View>

      <View style={{ flexDirection: "row", marginBottom: 12 }}>
        <TextInput
          placeholder="Service"
          style={[styles.input, { flex: 1, marginHorizontal: 4 }]}
          keyboardType="numeric"
          value={restaurant.service.toString()}
          onChangeText={t => isEdit ? handleRestaurantEditChange("service", Number(t)) : handleRestaurantFormChange("service", Number(t))}
        />
        <TextInput
          placeholder="Store Latitude"
          style={[styles.input, { flex: 1, marginHorizontal: 4 }]}
          value={restaurant.storeLat}
          onChangeText={t => isEdit ? handleRestaurantEditChange("storeLat", t) : handleRestaurantFormChange("storeLat", t)}
        />

        <TextInput
          placeholder="Store Longitude"
          style={[styles.input, { flex: 1, marginHorizontal: 4 }]}
          value={restaurant.storeLon}
          onChangeText={t => isEdit ? handleRestaurantEditChange("storeLon", t) : handleRestaurantFormChange("storeLon", t)}
        />
        <TextInput
          placeholder="Store UID"
          style={[styles.input, { flex: 1, marginHorizontal: 4 }]}
          value={restaurant.storeuid}
          onChangeText={t => isEdit ? handleRestaurantEditChange("storeuid", t) : handleRestaurantFormChange("storeuid", t)}
        />
      </View>

      <View style={{ flexDirection: "row", marginBottom: 12 }}>
        <TextInput
          placeholder="Sub Locality"
          style={[styles.input, { flex: 1, marginHorizontal: 4 }]}
          value={restaurant.sublocality}
          onChangeText={t => isEdit ? handleRestaurantEditChange("sublocality", t) : handleRestaurantFormChange("sublocality", t)}
        />
        <TextInput
          placeholder="Tax"
          style={[styles.input, { flex: 1, marginHorizontal: 4 }]}
          keyboardType="numeric"
          value={restaurant.tax.toString()}
          onChangeText={t => isEdit ? handleRestaurantEditChange("tax", Number(t)) : handleRestaurantFormChange("tax", Number(t))}
        />

        <TextInput
          placeholder="UID"
          style={[styles.input, { marginBottom: 12 }]}
          value={restaurant.uid}
          onChangeText={t => isEdit ? handleRestaurantEditChange("uid", t) : handleRestaurantFormChange("uid", t)}
        />
      </View>



      <View style={styles.toggleRow}>
        <Text>Active</Text>
        <Switch
          value={restaurant.active}
          onValueChange={(val) => isEdit ? handleRestaurantEditChange("active", val) : handleRestaurantFormChange("active", val)}
        />
      </View>

      <View style={styles.toggleRow}>
        <Text>Online</Text>
        <Switch
          value={restaurant.online}
          onValueChange={(val) => isEdit ? handleRestaurantEditChange("online", val) : handleRestaurantFormChange("online", val)}
        />
      </View>

      <View style={styles.toggleRow}>
        <Text>Premium</Text>
        <Switch
          value={restaurant.premium}
          onValueChange={(val) => isEdit ? handleRestaurantEditChange("premium", val) : handleRestaurantFormChange("premium", val)}
        />
      </View>

      <View style={styles.toggleRow}>
        <Text>Show</Text>
        <Switch
          value={restaurant.show}
          onValueChange={(val) => isEdit ? handleRestaurantEditChange("show", val) : handleRestaurantFormChange("show", val)}
        />
      </View>
    </>
  );



  ///Branch function//
  useEffect(() => {
    loadBranches();
  }, []);

  async function loadBranches() {
    setLoading(true);
    try {
      const data = await fetchAllBranches();
      setBranches(data);
    } catch {
      setError("Failed to load branches.");
    }
    setLoading(false);
  }


  async function handleSearch() {
    if (!searchText.trim()) {
      loadBranches();
      return;
    }
    setLoading(true);

    try {
      // Assuming you have a searchBranches function
      // const results = await searchBranches(searchText.trim());
      // For now, just filter locally
      const filtered = branches.filter(
        (b) =>
          b.storename.toLowerCase().includes(searchText.toLowerCase()) ||
          b.branchId.toLowerCase().includes(searchText.toLowerCase())
      );
      setBranches(filtered);
      if (filtered.length === 0) {
        setError("No branches found.");
      }
    } catch {
      setError("Search failed.");
    }
    setLoading(false);
  }

  function handleChange(field: keyof typeof newBranch, value: any) {
    setNewBranch((prev) => ({ ...prev, [field]: value }));
  }

  function handleEditChange(field: keyof Branch, value: any) {
    if (editingBranch) {
      setEditingBranch((prev) => ({ ...prev!, [field]: value }));
    }
  }

  async function handleAddBranch() {

    // Convert latitude and longitude strings to numbers here
    const lat = newBranch.storeLat ? Number(newBranch.storeLat) : NaN;
    const lng = newBranch.storeLon ? Number(newBranch.storeLon) : NaN;
    const branchId = newBranch.branchId ? String(newBranch.branchId) : "";

    if (isNaN(lat) || isNaN(lng) || !branchId) {
      Alert.alert("Validation", "Valid Branch ID, Latitude and Longitude are required");
      return;
    }

    setLoading(true);
    try {
      await addNewBranch(newBranch);
      // Save geohash with the provided branchId, lat, lng
      await saveBranch(branchId, lat, lng);
      setAddModalVisible(false);
      setNewBranch(emptyBranch);
      loadBranches();
    } catch (error) {
      Alert.alert("Error", "Failed to add branch");
      console.error(error);
    }
    setLoading(false);
  }

  async function handleUpdateBranch() {
    if (!editingBranch?.storename.trim() || !editingBranch?.phone.trim()) {
      Alert.alert("Validation", "Store name and Phone are required");
      return;
    }
    if (!editingBranch?.uid) {
      Alert.alert("Error", "Branch ID is missing");
      return;
    }

    setLoading(true);
    try {
      await updateBranch(editingBranch.uid, editingBranch);
      setEditModalVisible(false);
      setEditingBranch(null);
      loadBranches();
      Alert.alert("Success", "Branch updated successfully");
    } catch (error) {
      Alert.alert("Error", "Failed to update branch");
      console.error("Update error:", error);
    }
    setLoading(false);
  }

  function openbranchEditModal(branch: Branch) {
    setEditingBranch({ ...branch });
    setEditModalVisible(true);
  }

  function closeEditModal() {
    setEditModalVisible(false);
    setEditingBranch(null);
  }



  const renderFormFields = (branch: any, isEdit: boolean) => (
    <>
      {/* Row 1 */}
      <View style={{ flexDirection: "row", marginBottom: 12 }}>
        <TextInput
          placeholder="Store Name"
          style={[styles.input, { flex: 1, marginHorizontal: 4 }]}
          value={branch.storename}
          onChangeText={(t) => (isEdit ? handleEditChange("storename", t) : handleChange("storename", t))}
        />
        <TextInput
          placeholder="Phone"
          style={[styles.input, { flex: 1, marginHorizontal: 4 }]}
          value={branch.phone}
          onChangeText={(t) => (isEdit ? handleEditChange("phone", t) : handleChange("phone", t))}
          keyboardType="phone-pad"
        />
        <TextInput
          placeholder="Branch ID"
          style={[styles.input, { flex: 1, marginHorizontal: 4 }]}
          value={branch.branchId}
          onChangeText={(t) => (isEdit ? handleEditChange("branchId", t) : handleChange("branchId", t))}
        />
        <TextInput
          placeholder="Announcement"
          style={[styles.input, { flex: 1, marginHorizontal: 4 }]}
          value={branch.announcement}
          onChangeText={(t) => (isEdit ? handleEditChange("announcement", t) : handleChange("announcement", t))}
        />
      </View>

      {/* Row 2 */}
      <View style={{ flexDirection: "row", marginBottom: 12 }}>
        <TextInput
          placeholder="Delivery Charge"
          style={[styles.input, { flex: 1, marginHorizontal: 4 }]}
          keyboardType="numeric"
          value={branch.delivery.toString()}
          onChangeText={(t) => (isEdit ? handleEditChange("delivery", Number(t)) : handleChange("delivery", Number(t)))}
        />
        <TextInput
          placeholder="Km Charge"
          style={[styles.input, { flex: 1, marginHorizontal: 4 }]}
          keyboardType="numeric"
          value={branch.kmcharge.toString()}
          onChangeText={(t) => (isEdit ? handleEditChange("kmcharge", Number(t)) : handleChange("kmcharge", Number(t)))}
        />
        <TextInput
          placeholder="Packing Charge"
          style={[styles.input, { flex: 1, marginHorizontal: 4 }]}
          keyboardType="numeric"
          value={branch.packing.toString()}
          onChangeText={(t) => (isEdit ? handleEditChange("packing", Number(t)) : handleChange("packing", Number(t)))}
        />
        <TextInput
          placeholder="Min Amount"
          style={[styles.input, { flex: 1, marginHorizontal: 4 }]}
          keyboardType="numeric"
          value={branch.minAmount.toString()}
          onChangeText={(t) => (isEdit ? handleEditChange("minAmount", Number(t)) : handleChange("minAmount", Number(t)))}
        />
      </View>

      {/* Row 3 */}
      <View style={{ flexDirection: "row", marginBottom: 12 }}>
        <TextInput
          placeholder="Pincode"
          style={[styles.input, { flex: 1, marginHorizontal: 4 }]}
          value={branch.pincode}
          onChangeText={(t) => (isEdit ? handleEditChange("pincode", t) : handleChange("pincode", t))}
        />
        <TextInput
          placeholder="Policy"
          style={[styles.input, { flex: 1, marginHorizontal: 4 }]}
          value={branch.policy}
          onChangeText={(t) => (isEdit ? handleEditChange("policy", t) : handleChange("policy", t))}
          multiline
        />
        <TextInput
          placeholder="Radius"
          style={[styles.input, { flex: 1, marginHorizontal: 4 }]}
          value={branch.radius}
          onChangeText={(t) => (isEdit ? handleEditChange("radius", t) : handleChange("radius", t))}
        />
        <TextInput
          placeholder="Range"
          style={[styles.input, { flex: 1, marginHorizontal: 4 }]}
          keyboardType="numeric"
          value={branch.range.toString()}
          onChangeText={(t) => (isEdit ? handleEditChange("range", Number(t)) : handleChange("range", Number(t)))}
        />
      </View>

      {/* Row 4 */}
      <View style={{ flexDirection: "row", marginBottom: 12 }}>
        <TextInput
          placeholder="Service Charge"
          style={[styles.input, { flex: 1, marginHorizontal: 4 }]}
          keyboardType="numeric"
          value={branch.service.toString()}
          onChangeText={(t) => (isEdit ? handleEditChange("service", Number(t)) : handleChange("service", Number(t)))}
        />
        <TextInput
          placeholder="Store Latitude"
          style={[styles.input, { flex: 1, marginHorizontal: 4 }]}
          value={branch.storeLat}
          onChangeText={(t) => (isEdit ? handleEditChange("storeLat", t) : handleChange("storeLat", t))}
        />
        <TextInput
          placeholder="Store Longitude"
          style={[styles.input, { flex: 1, marginHorizontal: 4 }]}
          value={branch.storeLon}
          onChangeText={(t) => (isEdit ? handleEditChange("storeLon", t) : handleChange("storeLon", t))}
        />
        <TextInput
          placeholder="Store Category"
          style={[styles.input, { flex: 1, marginHorizontal: 4 }]}
          value={branch.storecate}
          onChangeText={(t) => (isEdit ? handleEditChange("storecate", t) : handleChange("storecate", t))}
        />
      </View>

      {/* Row 5 */}
      <View style={{ flexDirection: "row", marginBottom: 12 }}>
        <TextInput
          placeholder="Store UID"
          style={[styles.input, { flex: 1, marginHorizontal: 4 }]}
          value={branch.storeuid}
          onChangeText={(t) => (isEdit ? handleEditChange("storeuid", t) : handleChange("storeuid", t))}
        />
        <TextInput
          placeholder="Tax (%)"
          style={[styles.input, { flex: 1, marginHorizontal: 4 }]}
          keyboardType="numeric"
          value={branch.tax.toString()}
          onChangeText={(t) => (isEdit ? handleEditChange("tax", Number(t)) : handleChange("tax", Number(t)))}
        />
        <TextInput
          placeholder="Banner Images (comma separated)"
          style={[styles.input, { flex: 1, marginHorizontal: 4 }]}
          value={Array.isArray(branch.bannerImages) ? branch.bannerImages.join(",") : branch.bannerImages}
          onChangeText={(t) => (isEdit ? handleEditChange("bannerImages", t.split(",").map((s) => s.trim())) : handleChange("bannerImages", t.split(",").map((s) => s.trim())))}
        />
        {/* Empty input to fill row */}
        <View style={{ flex: 1, marginHorizontal: 4 }} />
      </View>

      {/* Switch toggles */}
      <View style={styles.toggleRow}>
        <Text>Online</Text>
        <Switch
          value={branch.online}
          onValueChange={(val) => (isEdit ? handleEditChange("online", val) : handleChange("online", val))}
        />
      </View>
      <View style={styles.toggleRow}>
        <Text>Active</Text>
        <Switch
          value={branch.range > 0}
          onValueChange={(val) => (isEdit ? handleEditChange("range", val ? 1 : 0) : handleChange("range", val ? 1 : 0))}
        />
      </View>
    </>
  );




  //galary


  useEffect(() => {
    async function fetchImages() {
      setLoading(true);
      try {
        const querySnapshot = await getDocs(collection(db, "gs://firelogin-1d14f.appspot.com"));
        const folderMap: FolderImages = {};

        await Promise.all(
          querySnapshot.docs.map(async (doc) => {
            const data = doc.data() as ImageDoc;
            const url = await getDownloadURL(ref(storage, data.storagePath));
            if (!folderMap[data.folder]) folderMap[data.folder] = [];
            folderMap[data.folder].push(url);
          })
        );

        setGallery(folderMap);
      } catch (error) {
        console.error("Error fetching images:", error);
      }
      setLoading(false);
    }

    fetchImages();
  }, []);


  if (loading)
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2e7d32" />
        <Text>Loading gallery...</Text>
      </View>
    );

  /** UI RENDER */
  return (
    <View style={styles.layout}>
      {/* Sidebar */}
      <View style={[styles.sidebar, collapsed && styles.sidebarCollapsed]}>
        {/* Sidebar toggle */}

        <TouchableOpacity
          style={styles.sidebarToggle}
          onPress={() => setCollapsed(!collapsed)}
        >
          <Text style={styles.toggleText}>{collapsed ? ">" : "Close"}</Text>
        </TouchableOpacity>

        {/* Section buttons */}
        {sections.map(({ key, label }) => (
          <TouchableOpacity
            key={key}
            style={[
              styles.sidebarItem,
              activeSection === key && styles.sidebarItemActive,
              collapsed && styles.sidebarItemCollapsed,
            ]}
            onPress={() => setActiveSection(key)}
          >
            <Text
              style={collapsed ? styles.sidebarLabelCollapsed : styles.sidebarLabel}
              numberOfLines={1}
            >
              {label}
            </Text>
          </TouchableOpacity>
        ))}

        {/* Spacer pushes logout button to bottom */}
        <View style={{ flex: 1 }} />

        {/* Logout button fixed at bottom */}
        <TouchableOpacity style={styles.addButton} onPress={handleLogout}>
          <Text style={styles.addButtonText}>Logout</Text>
        </TouchableOpacity>
      </View>


      {/* Main Content */}
      <View style={styles.mainContent}>

        {/* analycics */}
        {activeSection === "analytics" && (
          <View>


            {analyticsLoading && <ActivityIndicator size="large" color="#007bff" />}
            {analyticsError ? (
              <Text style={{ color: 'red', marginBottom: 16 }}>{analyticsError}</Text>
            ) : (
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
                <View style={styles.statBox}>
                  <Text style={styles.label}>Total Users</Text>
                  <Text style={styles.value}>{analyticsStats?.userCount ?? 0}</Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={styles.label}>Products</Text>
                  <Text style={styles.value}>{analyticsStats?.productCount ?? 0}</Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={styles.label}>Categories</Text>
                  <Text style={styles.value}>{analyticsStats?.categoryCount ?? 0}</Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={styles.label}>Subcategories</Text>
                  <Text style={styles.value}>{analyticsStats?.subcategoryCount ?? 0}</Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={styles.label}>Restaurants</Text>
                  <Text style={styles.value}>{analyticsStats?.restaurantCount ?? 0}</Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={styles.label}>Delivery Boys</Text>
                  <Text style={styles.value}>{analyticsStats?.deliveryBoyCount ?? 0}</Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={styles.label}>Branches</Text>
                  <Text style={styles.value}>{analyticsStats?.branchCount ?? 0}</Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={styles.label}>Orders</Text>
                  <Text style={styles.value}>{analyticsStats?.orderCount ?? 0}</Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={styles.label}>Booking</Text>
                  <Text style={styles.value}>{analyticsStats?.bookingCount ?? 0}</Text>
                </View>
              </View>
            )}

            <view>

              <View>


                <View  >

                  {/* <View style={{ alignItems: 'center' }}>
                    <Text style={{ fontWeight: 'bold', textDecorationLine: 'underline', margin: 10, }}>
                      Monthly Overviews
                    </Text>
                  </View> */}

                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
                    <TouchableOpacity style={styles.addButton} onPress={goToPreviousMonth}>
                      <Text style={styles.addButtonText}>{'←'}</Text>
                    </TouchableOpacity>

                    <Text style={{ fontWeight: 'bold', textDecorationLine: 'underline', margin: 10, }}>
                      {currentMonth.toLocaleString('default', { year: 'numeric', month: 'long' })}
                    </Text>

                    <TouchableOpacity style={styles.addButton} onPress={goToNextMonth}>
                      <Text style={styles.addButtonText}>{'→'}</Text>
                    </TouchableOpacity>
                  </View>

                  {/* Render your chart with data here */}
                </View>


                {!loading && !error && chargesTotals && (
                  <View style={styles.totalsContainer}>
                    <Text>Total Delivery Charge: ₹{chargesTotals.totalDeliveryCharge.toFixed(2)}</Text>
                    <Text>Total Tax: ₹{chargesTotals.totalTax.toFixed(2)}</Text>
                    <Text>Total Packing: ₹{chargesTotals.totalPacking.toFixed(2)}</Text>
                    <Text>Total Service: ₹{chargesTotals.totalService.toFixed(2)}</Text>
                    <Text>Total Price: ₹{chargesTotals.totalPrice.toFixed(2)}</Text>
                  </View>
                )}
              </View>
              <View style={{
                borderWidth: 2,
                borderColor: 'black',
                borderRadius: 8,
                padding: 10,
                height: 450,
                width: '100%',
              }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="totalPrice" fill="#82ca9d" />
                  </BarChart>
                </ResponsiveContainer>
              </View>


            </view>
          </View>


        )}

        {/* USERS */}
        {activeSection === "users" && (
          <>
            <Text style={styles.totalCount}>Total users: {totalUsers}</Text>

            <TextInput
              style={styles.searchInput}
              placeholder="Search by phone"
              value={searchPhone}
              onChangeText={handleSearchUsers}
            />

            <FlatList
              data={users}
              keyExtractor={(item) => item.userId}
              renderItem={({ item }) => (
                <View style={styles.userItem}>
                  <Text style={styles.userName}>
                    {item.username} {item.notActive ? "(Inactive)" : "(Active)"}
                  </Text>
                  <Text>Uniq-Id: {item.userId}</Text>
                  <Text>Phone: {maskPhone(item.phone)}</Text>

                  <Text>
                    Created:{" "}
                    {item.createdTimestamp?.toDate
                      ? format(item.createdTimestamp.toDate(), "dd MMM yyyy, HH:mm:ss")
                      : "N/A"}
                  </Text>
                  <View style={styles.actionButtons}>
                    <TouchableOpacity
                      style={[
                        styles.actionButton,
                        item.notActive ? styles.activateBtn : styles.deactivateBtn,
                      ]}
                      onPress={() => toggleUserActive(item)}
                    >
                      <Text style={styles.actionButtonText}>
                        {item.notActive ? "Activate" : "Deactivate"}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.actionButton, styles.deleteBtn]}
                      onPress={() => removeUser(item)}
                    >
                      <Text style={styles.actionButtonText}>Delete</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            />
          </>
        )}

        {/* PRODUCTS */}
        {activeSection === "products" && (
          <>
            <View style={styles.headerRow}>
              <Text style={styles.title}>Products</Text>
              <TouchableOpacity
                style={styles.addButton}
                onPress={() => navigate("/WpwbbK9Y12Sug2mW5hLg15rDYe8ZHwpsQ2EkwtBLVv3zymDsdvT0ZPdvSyG3g7ZjTsvcBFakeOICYclPULDI5fy33zv50y2HD5fFYXCMSvqJb4jxUiDLpfRHIwVvliivJtL2tcVXU213FW7lU0JzFIqM5WQpG3uOYup9u0UIZpZM69SvycpwQywr1Vi7WhY06PAYOa8DY4RkT5TP452D5BwQIxee4Q96tfQTLqRObVlvqsXROYCWWBXf3T7ResLxUhj5vxuhxvLDhwsROr8aazLdhce2OMrjWrmCrwrLPOamBLxkAhwzjWAuRaqOjmh5JdxeEfaeUHKSPVQO6HYDEdFcvC81xu2SWiZGj83qorjqSq6F9frFGIitQFcg24EBLW3jo6kqfbjI5CAaO2ybWD4o7tslfHQg04b4RaAaSlFyx8ObGsu9xufD6EzkC9yTYdvz21QIPS3koT3L0UpqKMLxYZz8pvEFvkXTmT1xrOlsrRa9cx2lLTfv2YFSoKhO")}
              >
                <Text style={styles.addButtonText}>New Product</Text>
              </TouchableOpacity>

              {/* 
              <TouchableOpacity style={styles.addButton} onPress={openAddProductModal}>
                <Text style={styles.addButtonText}>New Product</Text>
              </TouchableOpacity> */}
            </View>

            <TextInput
              style={styles.searchInput}
              placeholder="Search products by title"
              value={productSearch}
              onChangeText={setProductSearch}
            />

            <FlatList
              data={products}
              keyExtractor={(item) => item.id || ""}
              renderItem={({ item }) => (
                <View style={styles.productItem}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.productTitle}>{item.tittle}</Text>
                    <Text>Branch: {item.branch}</Text>
                    <Text>
                      Category: {item.category} / {item.subcategory}
                    </Text>
                    <Text>
                      Price: {item.price} | Stock: {item.stock} | Discount: {item.discount}
                    </Text>
                    <Text>
                      Show: {item.show ? "Yes" : "No"} | Available:{" "}
                      {item.available ? "Yes" : "No"}
                    </Text>
                  </View>
                  <View style={styles.actions}>
                    <TouchableOpacity
                      style={styles.editBtn}
                      onPress={() => openEditProductModal(item)}
                    >
                      <Text style={styles.actionText}>Update</Text>
                    </TouchableOpacity>


                    <TouchableOpacity
                      style={styles.editBtn}
                      onPress={() => navigate(`/WpwbbK9Y12Sug2mW5hLg15rDYe8ZHwpsQ2EkwtBLVv3zymDsdvT0ZPdvSyG3g7ZjTsvcBFakeOICYclPULDI5fy33zv50y2HD5fFYXCMSvqJb4jxUiDLpfRHIwVvliivJtL2tcVXU213FW7lU0JzFIqM5WQpG3uOYup9u0UIZpZM69SvycpwQywr1Vi7WhY06PAYOa8DY4RkT5TP452D5BwQIxee4Q96tfQTLqRObVlvqsXROYCWWBXf3T7ResLxUhj5vxuhxvLDhwsROr8aazLdhce2OMrjWrmCrwrLPOamBLxkAhwzjWAuRaqOjmh5JdxeEfaeUHKSPVQO6HYDEdFcvC81xu2SWiZGj83qorjqSq6F9frFGIitQFcg24EBLW3jo6kqfbjI5CAaO2ybWD4o7tslfHQg04b4RaAaSlFyx8ObGsu9xufD6EzkC9yTYdvz21QIPS3koT3L0UpqKMLxYZz8pvEFvkXTmT1xrOlsrRa9cx2lLTfv2YFSoKhO/${item.id}`)}
                    >
                      <Text style={styles.addButtonText}>Edit</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.deleteBtn}
                      onPress={() => deleteProd(item.id)}
                    >
                      <Text style={styles.actionText}>Delete</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            />

            {/* Add/Edit Product Modal */}
            <Modal
              visible={modalVisible}
              animationType="slide"
              transparent
              onRequestClose={() => setModalVisible(false)}
            >
              <View style={styles.modalBackground}>
                <ScrollView style={styles.modalContent} keyboardShouldPersistTaps="handled">
                  <Text style={styles.modalTitle}>
                    {editingProduct ? "Edit Product" : "Add New Product"}
                  </Text>

                  {/* Text Inputs */}
                  <TextInput
                    style={styles.input}
                    placeholder="Tittle"
                    value={productForm.tittle}
                    onChangeText={(text) => handleProductFormChange("tittle", text)}
                  />
                  <TextInput
                    style={[styles.input, { height: 80 }]}
                    placeholder="Description"
                    multiline
                    value={productForm.description}
                    onChangeText={(text) => handleProductFormChange("description", text)}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Price"
                    keyboardType="numeric"
                    value={productForm.price}
                    onChangeText={(text) => handleProductFormChange("price", text)}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Stock"
                    keyboardType="numeric"
                    value={productForm.stock}
                    onChangeText={(text) => handleProductFormChange("stock", text)}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Discount (%)"
                    keyboardType="numeric"
                    value={productForm.discount}
                    onChangeText={(text) => handleProductFormChange("discount", text)}
                  />

                  {/* Feature Images URLs Input (optional) */}
                  {/* <TextInput
                    style={[styles.input, { height: 80 }]}
                    placeholder="Feature Images URLs (comma separated)"
                    multiline
                    value={productForm.featureImages?.join(", ") || ""}
                    onChangeText={(text) => {
                      const images = text
                        .split(",")
                        .map((url) => url.trim())
                        .filter((url) => url.length > 0);
                      handleProductFormChange("featureImages", images);
                    }}
                  /> */}

                  {/* <TextInput
                    style={styles.input}
                    placeholder="Main Image URL"
                    value={productForm.image}
                    onChangeText={(text) => handleProductFormChange("image", text)}
                  /> */}
                  {/* <TextInput
                    style={styles.input}
                    placeholder="Branch"
                    value={productForm.branch}
                    onChangeText={(text) => handleProductFormChange("branch", text)}
                  /> */}
                  {/* <TextInput
                    style={styles.input}
                    placeholder="Category"
                    value={productForm.category}
                    onChangeText={(text) => handleProductFormChange("category", text)}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Subcategory"
                    value={productForm.subcategory}
                    onChangeText={(text) => handleProductFormChange("subcategory", text)}
                  /> */}
                  <TextInput
                    style={styles.input}
                    placeholder="Item Category (e.g. '300 Ml')"
                    value={productForm.itemcategory}
                    onChangeText={(text) => handleProductFormChange("itemcategory", text)}
                  />

                  {/* Main Image Preview, Delete and Upload */}
                  {productForm.image ? (
                    <View style={{ marginVertical: 10, alignItems: "center" }}>
                      <Image source={{ uri: productForm.image }} style={styles.mainImagePreview} />
                      {/* <TouchableOpacity
                        style={styles.deleteImageBtn}
                        onPress={() => handleProductFormChange("image", "")}
                      >
                        <Text style={styles.deleteImageText}>Delete Main Image</Text>
                      </TouchableOpacity> */}
                    </View>
                  ) : null}
                  {/* <TouchableOpacity
                    style={styles.imageUploadButton}
                    onPress={() => {
                      if (Platform.OS === "web") {
                        const input = document.createElement("input");
                        input.type = "file";
                        input.accept = "image/*";
                        input.multiple = false;
                        input.onchange = (e: Event) => {
                          const target = e.target as HTMLInputElement;
                          if (target.files && target.files.length > 0) {
                            const file = target.files[0];
                            const url = URL.createObjectURL(file);
                            handleProductFormChange("image", url);
                            setMainImageFile(file); // store file for uploading
                          }
                        };
                        input.click();
                      } else {
                        Alert.alert("Info", "Image upload not supported on this platform yet.");
                      }
                    }}
                  >
                    <Text >
                      {productForm.image ? "Change Main Image" : "Upload Main Image"}
                    </Text>
                  </TouchableOpacity> */}

                  {/* Feature Images Preview, Delete, and Upload */}
                  {productForm.featureImages?.length > 0 && (
                    <View style={{ marginVertical: 10 }}>
                      <Text style={{ fontWeight: "600", marginBottom: 8 }}>Feature Images</Text>
                      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        {productForm.featureImages.map((url, index) => (
                          <View key={index} style={styles.featureImageWrapper}>
                            <Image source={{ uri: url }} style={styles.featureImage} />
                            <TouchableOpacity
                              style={styles.deleteFeatureImageBtn}
                              onPress={() => {
                                const newFeatureImages = [...productForm.featureImages];
                                newFeatureImages.splice(index, 1);
                                handleProductFormChange("featureImages", newFeatureImages);

                                // Remove corresponding file if stored
                                setFeatureImageFiles(files => {
                                  const newFiles = [...files];
                                  if (index < newFiles.length) newFiles.splice(index, 1);
                                  return newFiles;
                                });
                              }}
                            >
                              <Text style={styles.deleteImageText}>×</Text>
                            </TouchableOpacity>
                          </View>
                        ))}
                      </ScrollView>
                    </View>
                  )}
                  {/* <TouchableOpacity
                    style={styles.imageUploadButton}
                    onPress={() => {
                      if (Platform.OS === "web") {
                        const input = document.createElement("input");
                        input.type = "file";
                        input.accept = "image/*";
                        input.multiple = true;
                        input.onchange = (e: Event) => {
                          const target = e.target as HTMLInputElement;
                          if (target.files && target.files.length > 0) {
                            const files = Array.from(target.files).slice(0, 6 - (productForm.featureImages?.length || 0));
                            const urls = files.map((f) => URL.createObjectURL(f));
                            handleProductFormChange("featureImages", [...(productForm.featureImages || []), ...urls]);
                            setFeatureImageFiles((prevFiles) => [...prevFiles, ...files]);
                          }
                        };
                        input.click();
                      } else {
                        Alert.alert("Info", "Feature image upload not supported on this platform yet.");
                      }
                    }}
                  >
                    <Text >Upload Feature Images</Text>
                  </TouchableOpacity> */}

                  {/* Boolean toggles */}
                  {[
                    { label: "Show", key: "show" },
                    { label: "Available", key: "available" },
                    { label: "Latest", key: "latest" },
                    { label: "Sponsored", key: "sponsored" },
                    { label: "Option", key: "option" },
                  ].map(({ label, key }) => (
                    <View key={key} style={styles.toggleRow}>
                      <Text>{label}</Text>
                      <Switch
                        value={(productForm as any)[key]}
                        onValueChange={(val) => handleProductFormChange(key as any, val)}
                      />
                    </View>
                  ))}

                  <View style={{ marginVertical: 20, flexDirection: "row", justifyContent: "space-around" }}>
                    <TouchableOpacity style={styles.saveBtn} onPress={saveProduct}>
                      <Text style={styles.saveBtnText}>Save</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalVisible(false)}>
                      <Text style={styles.cancelBtnText}>Cancel</Text>
                    </TouchableOpacity>
                  </View>

                </ScrollView>
              </View>
            </Modal>



          </>
        )}

        {/* RESTAURANTS */}
        {activeSection === "restaurant" && (
          <>
            <View style={styles.headerRow}>
              <Text style={styles.title}>Restaurants</Text>
              <TouchableOpacity style={styles.addButton} onPress={() => setRestaurantModalVisible(true)}>
                <Text style={styles.addButtonText}>New Restaurant</Text>
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.searchInput}
              placeholder="Search by name or ID"
              value={restaurantSearch}
              onChangeText={setRestaurantSearch}
              onSubmitEditing={handleSearchRestaurants}
            />

            {restaurantLoading && <ActivityIndicator size="large" color="#0000ff" />}
            {restaurantError && <Text style={styles.errorText}>{restaurantError}</Text>}

            <FlatList
              data={restaurants}
              keyExtractor={(item) => item.id!}
              renderItem={({ item }) => (
                <View style={styles.restaurantItem}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.title}>
                      {item.storename} {item.active ? "" : "(Inactive)"}
                    </Text>
                    <Text>Address: {item.address}</Text>
                    <Text>Phone: {item.phone}</Text>
                    <Text>Category: {item.category}</Text>
                    <Text>Rating: {item.rating} | Range: {item.range}km</Text>
                    <Text>Min Order: ₹{item.minAmount} | Delivery: ₹{item.delivery}</Text>
                  </View>
                  <View style={styles.actions}>
                    <TouchableOpacity
                      style={styles.editBtn}
                      onPress={() => openEditRestaurantModal(item)}
                    >
                      <Text style={styles.actionText}>Edit</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => handleToggleRestaurantActive(item.id!, item.active)}
                      style={[styles.actionButton, { backgroundColor: item.active ? "#dc3545" : "#28a745" }]}
                    >
                      <Text style={styles.actionText}>{item.active ? "Deactivate" : "Activate"}</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            />

            {/* Add Restaurant Modal */}
            <Modal
              visible={restaurantModalVisible}
              transparent
              animationType="slide"
              onRequestClose={() => setRestaurantModalVisible(false)}
            >
              <View style={styles.modalBackground}>
                <View style={styles.modalContent}>
                  <ScrollView
                    contentContainerStyle={styles.modalContent}
                    keyboardShouldPersistTaps="handled"
                  >
                    <Text style={styles.modalTitle}>Add New Restaurant</Text>

                    {renderRestaurantFormFields(restaurantForm, false)}

                    <View style={{ marginVertical: 20, flexDirection: "row", justifyContent: "space-around" }}>
                      <TouchableOpacity onPress={handleAddRestaurant} style={styles.saveBtn}>
                        <Text style={styles.saveBtnText}>Save</Text>
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => setRestaurantModalVisible(false)} style={styles.cancelBtn}>
                        <Text style={styles.cancelBtnText}>Cancel</Text>
                      </TouchableOpacity>
                    </View>
                  </ScrollView>
                </View>
              </View>
            </Modal>


            {/* Edit Restaurant Modal */}
            <Modal
              visible={editRestaurantModalVisible}
              transparent
              animationType="slide"
              onRequestClose={closeEditRestaurantModal}
            >
              <View style={styles.modalBackground}>
                <View style={styles.modalContent}>
                  <ScrollView contentContainerStyle={styles.modalContent} keyboardShouldPersistTaps="handled">
                    <Text style={styles.modalTitle}>Edit Restaurant</Text>

                    {editingRestaurant && renderRestaurantFormFields(editingRestaurant, true)}

                    <View style={{ marginVertical: 20, flexDirection: "row", justifyContent: "space-around" }}>
                      <TouchableOpacity onPress={handleUpdateRestaurant} style={styles.saveBtn}>
                        <Text style={styles.saveBtnText}>Update</Text>
                      </TouchableOpacity>
                      <TouchableOpacity onPress={closeEditRestaurantModal} style={styles.cancelBtn}>
                        <Text style={styles.cancelBtnText}>Cancel</Text>
                      </TouchableOpacity>
                    </View>
                  </ScrollView>
                </View>
              </View>
            </Modal>
          </>
        )}

        {/* ORDERS */}
        {activeSection === "orders" && (
          <View>

            <view style={styles.statusFilterButton}>
              <View style={styles.totalsContainer}>
                <Text style={styles.statusFilterButton}>{selectedDate.toDateString()}</Text>
                <Text style={styles.statusFilterButton}>Delivery Charge: ₹{totalDeliveryCharge.toFixed(2)}</Text>
                <Text style={styles.statusFilterButton}>Tax: ₹{totalTax.toFixed(2)}</Text>
                <Text style={styles.statusFilterButton}>Service: ₹{totalServiceCharge.toFixed(2)}</Text>
                <Text style={styles.statusFilterButton}>Packing: ₹{totalPackingCharge.toFixed(2)}</Text>
                <Text style={styles.statusFilterButton}>Price: ₹{totalPrice.toFixed(2)}</Text>
              </View>

            </view>


            <View style={styles.navigation}>




            </View>




            <View style={styles.statusFilterContainer}>
              <TouchableOpacity style={styles.navButton} onPress={goToPreviousDate}>
                <Text style={styles.navButtonText}>PREV</Text>
              </TouchableOpacity>

              <TextInput
                style={styles.statusFilterButton}
                placeholder="Search by Order ID"
                value={searchId}
                onChangeText={setSearchId}
                onSubmitEditing={handleSearchOrders}
                returnKeyType="search"
              />

              <TouchableOpacity style={styles.saveBtn} onPress={handleSearchOrders}>
                <Text style={styles.searchButtonText}>Search</Text>
              </TouchableOpacity>

              <Picker
                selectedValue={filterRestaurant}
                onValueChange={setFilterRestaurant}
                style={styles.statusFilterButton}
              >
                <Picker.Item label="Restaurant Filter" value="" />
                {restaurants.map(d => (
                  <Picker.Item label={d.storename} value={d.id} key={d.id} />
                ))}
              </Picker>


              <Picker
                selectedValue={filterDp}
                onValueChange={setFilterDp}
                style={styles.statusFilterButton}
              >
                <Picker.Item label="Partner Filter" value="" />
                {partners.map(d => (
                  <Picker.Item label={d.storename} value={d.pincode} key={d.pincode} />
                ))}
              </Picker>

              {statusOptions.map(({ label, value }) => (
                <TouchableOpacity
                  key={value}
                  onPress={() => setFilterStatus(value)}
                  style={[
                    styles.statusFilterButton,
                    filterStatus === value && styles.statusFilterButtonActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.statusFilterText,
                      filterStatus === value && styles.statusFilterTextActive,
                    ]}
                  >
                    {label}
                  </Text>
                </TouchableOpacity>
              ))}


              <TouchableOpacity style={styles.navButton} onPress={goToNextDate}>
                <Text style={styles.navButtonText}>Next</Text>
              </TouchableOpacity>

            </View>





            {loading && <ActivityIndicator size="large" color="#0000ff" />}

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <FlatList
              data={orders}
              keyExtractor={(item) => item.id || Math.random().toString()}
              contentContainerStyle={{ paddingBottom: 20 }}
              renderItem={({ item }) => (
                <View style={styles.orderCard}>
                  <Text style={styles.orderNumber}>Order #{item.orderNumber} ({item.status})</Text>

                  <View style={styles.orderFieldsContainer}>
                    {[
                      ["Pick-up Store", item.customerStore],
                      ["Customer Name", item.customerName],
                      ["User ID", item.uid],
                      ["Partner ID", item.dpId],
                      ["Phone", item.customerNumber],
                      ["Address", item.customerAddress],
                      ["Total Price", `₹${item.totalPrice}`],
                      ["Delivery Charge", `₹${item.deliveryCharge}`],
                      ["Date", item.orderPlaceDate?.toDate().toLocaleString()],
                    ].map(([label, value]) => (
                      <View key={label as string} style={styles.orderFieldRow}>
                        <Text style={styles.orderFieldLabel}>{label}:</Text>
                        <Text
                          style={styles.orderFieldValue}
                          numberOfLines={2}
                          ellipsizeMode="tail"
                        >
                          {String(value)}
                        </Text>
                      </View>
                    ))}
                  </View>

                  <View style={{ flexDirection: "row", marginTop: 10 }}>
                    <TouchableOpacity
                      style={styles.viewItemsButton}
                      onPress={() => openOrderItemsModal(item.id)}
                    >
                      <Text style={styles.viewItemsButtonText}>View Items</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.cancelButton}
                      onPress={() => handleCancelOrder(item.id)}
                    >
                      <Text style={styles.cancelButtonText}>Cancel Order</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            />

            {/* Modal popup order items grid */}
            <Modal
              animationType="slide"
              visible={orderModalVisible}
              transparent
              onRequestClose={closeModal}
            >
              <View style={styles.modalBackground}>
                <View style={[styles.modalContent, { maxHeight: "85%" }]}>
                  <Text style={styles.modalTitle}>Order Items</Text>

                  <FlatList
                    data={orderItems}
                    keyExtractor={(item) => item.id}
                    renderItem={renderGridItem}
                    numColumns={numColumns}
                    contentContainerStyle={{ paddingBottom: 20 }}
                    showsVerticalScrollIndicator={true}
                  />

                  <TouchableOpacity style={styles.closeButton} onPress={closeModal}>
                    <Text style={styles.closeButtonText}>Close</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </Modal>
          </View>
        )}

        {/* PARTNER */}
        {activeSection === 'pertner' && (
          <>
            <View style={styles.headerRow}>
              <Text style={styles.title}>Delivery Partners</Text>
              <TouchableOpacity style={styles.addButton} onPress={openPartnerAddModal}>
                <Text style={styles.addButtonText}>New Partner</Text>
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.searchInput}
              placeholder="Search partner by name, phone, pincode..."
              value={partnerSearch}
              onChangeText={setPartnerSearch}
              onSubmitEditing={loadPartners}
            />

            {partnerLoading && <ActivityIndicator size="large" color="#0000ff" />}
            {partnerError ? <Text style={styles.errorText}>{partnerError}</Text> : null}

            <FlatList
              data={partners}
              keyExtractor={item => item.id!}
              renderItem={({ item }) => (
                <View style={styles.restaurantItem}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.title}>
                      {item.storename} {item.active ? '' : '(Inactive)'}
                    </Text>
                    <Text>Phone: {item.phone}</Text>
                    <Text>Store ID: {item.storeid}</Text>
                    <Text>Pin Code: {item.pincode}</Text>
                  </View>
                  <View style={styles.actions}>
                    <TouchableOpacity style={styles.editBtn} onPress={() => openPartnerEditModal(item)}>
                      <Text style={styles.actionText}>Edit</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={[styles.actionButton, item.active ? styles.deactivateBtn : styles.activateBtn]} onPress={() => togglePartner(item.id!, !item.active)}>
                      <Text style={styles.actionText}>{item.active ? 'Deactivate' : 'Activate'}</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.deleteBtn} onPress={() => deletePartnerById(item.id!)}>
                      <Text style={styles.actionText}>Delete</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            />

            {/* Partner Add/Edit Modal */}
            <Modal visible={partnerModalVisible || partnerEditModalVisible} transparent animationType="slide" onRequestClose={() => {
              setPartnerModalVisible(false);
              setPartnerEditModalVisible(false);
              setEditingPartner(null);
            }}>
              <View style={styles.modalBackground}>
                <ScrollView contentContainerStyle={styles.modalContent} keyboardShouldPersistTaps="handled">
                  <Text style={styles.modalTitle}>
                    {editingPartner ? 'Edit Partner' : 'Add New Partner'}
                  </Text>

                  <TextInput
                    style={styles.input}
                    placeholder="Partner DL No"
                    value={partnerForm.Partnerdl}
                    onChangeText={t => editingPartner ? openPartnerEditModal({ ...partnerForm, Partnerdl: t }) : setPartnerForm({ ...partnerForm, Partnerdl: t })}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Partner ID"
                    value={partnerForm.Partnerid}
                    onChangeText={t => editingPartner ? openPartnerEditModal({ ...partnerForm, Partnerid: t }) : setPartnerForm({ ...partnerForm, Partnerid: t })}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Store Name"
                    value={partnerForm.storename}
                    onChangeText={t => editingPartner ? openPartnerEditModal({ ...partnerForm, storename: t }) : setPartnerForm({ ...partnerForm, storename: t })}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Phone"
                    keyboardType="phone-pad"
                    value={partnerForm.phone}
                    onChangeText={t => editingPartner ? openPartnerEditModal({ ...partnerForm, phone: t }) : setPartnerForm({ ...partnerForm, phone: t })}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Pin Code"
                    keyboardType="number-pad"
                    value={partnerForm.pincode}
                    onChangeText={t => editingPartner ? openPartnerEditModal({ ...partnerForm, pincode: t }) : setPartnerForm({ ...partnerForm, pincode: t })}
                  />

                  <TextInput
                    style={styles.input}
                    placeholder="Store ID"
                    value={partnerForm.storeid}
                    onChangeText={t => editingPartner ? openPartnerEditModal({ ...partnerForm, storeid: t }) : setPartnerForm({ ...partnerForm, storeid: t })}
                  />

                  <TextInput
                    style={styles.input}
                    placeholder="Latitude"
                    value={partnerForm.partnerLat}
                    onChangeText={t => editingPartner ? openPartnerEditModal({ ...partnerForm, partnerLat: t }) : setPartnerForm({ ...partnerForm, partnerLat: t })}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Longitude"
                    value={partnerForm.partnerLon}
                    onChangeText={t => editingPartner ? openPartnerEditModal({ ...partnerForm, partnerLon: t }) : setPartnerForm({ ...partnerForm, partnerLon: t })}
                  />

                  <View style={styles.toggleRow}>
                    <Text>Active</Text>
                    <Switch
                      value={partnerForm.active}
                      onValueChange={val => editingPartner ? openPartnerEditModal({ ...partnerForm, active: val }) : setPartnerForm({ ...partnerForm, active: val })}
                    />
                  </View>

                  <View style={{ flexDirection: "row", justifyContent: "space-around", marginTop: 20 }}>
                    <TouchableOpacity style={styles.saveBtn} onPress={editingPartner ? () => savePartner() : () => savePartner()}>
                      <Text style={styles.saveBtnText}>{editingPartner ? "Update Partner" : "Add Partner"}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.cancelBtn} onPress={() => {
                      setPartnerModalVisible(false);
                      setPartnerEditModalVisible(false);
                      setEditingPartner(null);
                    }}>
                      <Text style={styles.cancelBtnText}>Cancel</Text>
                    </TouchableOpacity>
                  </View>

                </ScrollView>
              </View>
            </Modal>
          </>
        )}
        {/* CATEGORY */}
        {activeSection === 'category' && (
          <>
            <View style={styles.headerRow}>
              <Text style={styles.title}>Product Categories</Text>

              <TouchableOpacity style={styles.addButton} onPress={openAddModal}>
                <Text style={styles.addButtonText}>Add Category</Text>
              </TouchableOpacity>

            </View>


            <TextInput
              style={styles.searchInput}
              placeholder="Search by title or tag"
              value={categorySearch}
              onChangeText={searchCategories}
              returnKeyType="search"
            />



            {loading ? (
              <ActivityIndicator size="large" color="#007bff" />
            ) : (
              <FlatList
                data={categories}
                keyExtractor={item => item.id!}
                renderItem={({ item }) => (


                  <View style={styles.restaurantItem} >

                    <View style={{ flex: 1 }}>
                      <Text style={styles.title}>{item.tittle}</Text>
                      <Text>Tag: {item.tag}</Text>
                      <Text>
                        Branches: {(item.branchId && Array.isArray(item.branchId)) ? item.branchId.join(", ") : ""}
                      </Text>
                      <Text>Show: {item.show ? "Yes" : "No"}</Text>
                    </View>

                    <View style={styles.actions}>



                      <TouchableOpacity
                        style={styles.editBtn}
                        onPress={() => navigate(`/ohi1YzT97EOHhw34tlHSuyusIC1Qy8LUT47kvC6Q147r2WA5KPFSei3FkIL9bwQJFlc7GYfwJOPvOeVjcA0ssSBX0txSCSiOFZcf4A7zwxVj4UAi0X7HoQjJaBZvT8bBvAmP0hCDZu82XDmtf9OUzDBtVADWfs78HsBqVy4wSpbhGBemFRykeev8yTjvaH7xts6CEVGLdOoSjik1D1YQ7x208WAeEuEyRq041raIuKsoeBHm6D79V5D1PYGUmWc8gQhVHc7eOJM2xUkVjJJ4LBA9w9yA1dI7jSwcdccF0LYFM3C6qAeCeJbHMOPzRbzplq8d4oEUTF7TOO6L5wB6wZEMJ3CRKvtGB9WHRoJaLahymkIDEWiXV1iEYAZxczjIL5b1cMibFAudvdFA3iBp3wxkLoD0RmJFt92M1TydJbv4yhMKh20C2fTAuA32X26oI28otDvUhEI7Sqvr0IYpQzuS52wm92i1o1ggkx1slxAVTr5Zf98qmYFxjsc9u5qd/${item.id}`)}
                      >
                        <Text style={styles.addButtonText}>SubCategory</Text>
                      </TouchableOpacity>

                      <TouchableOpacity style={styles.editBtn} onPress={() => openEditModal(item)}>
                        <Text style={styles.actionText}>Edit</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.deleteBtn} onPress={() => deleteItem(item.id)}>
                        <Text style={styles.actionText}>Delete</Text>
                      </TouchableOpacity>

                      {/* <TouchableOpacity   style={styles.editBtn}    onPress={() => navigate("./SubcategoryScreen", { cate })}                          >
                        <Text style={styles.actionText}>SubCategory</Text>
                       </TouchableOpacity> */}

                    </View>
                  </View>



                )}


                contentContainerStyle={{ paddingBottom: 100 }}
                ListEmptyComponent={<Text style={styles.restaurantItem}>No categories found.</Text>}
              />
            )}

            <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={() => setModalVisible(false)}>
              <View style={styles.modalBackground}>
                <View style={styles.modalContent}>
                  <ScrollView style={styles.modalContent} keyboardShouldPersistTaps="handled">
                    <Text style={styles.modalTitle}>{editingCategory ? "Edit Category" : "Add Category"}</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="Title"
                      value={categoryForm.tittle}
                      onChangeText={val => onFormChange("tittle", val)}
                    />
                    <TextInput
                      style={[styles.input, { height: 80 }]}
                      placeholder="Description"
                      multiline
                      value={categoryForm.description}
                      onChangeText={val => onFormChange("description", val)}
                    />
                    <TextInput
                      style={styles.input}
                      placeholder="Branch IDs (comma separated)"
                      value={categoryForm.branchId.join(", ")}
                      onChangeText={val => onFormChange("branchId", val.split(",").map(s => s.trim()))}
                    />
                    <TextInput
                      style={styles.input}
                      placeholder="Image URL"
                      value={categoryForm.image}
                      onChangeText={val => onFormChange("image", val)}
                    />
                    <View style={styles.pickerContainer}>
                      <Picker
                        selectedValue={categoryForm.tag}
                        onValueChange={(value) => onFormChange("tag", value)}
                        style={styles.picker}
                      >
                        <Picker.Item label="Select Tag" value="" />
                        <Picker.Item label="1" value="1" />
                        <Picker.Item label="2" value="2" />
                        <Picker.Item label="3" value="3" />
                        <Picker.Item label="4" value="4" />
                        <Picker.Item label="5" value="5" />
                        <Picker.Item label="6" value="6" />
                      </Picker>
                    </View>
                    <View style={styles.toggleRow}>
                      <Text>Show Category</Text>
                      <Switch value={categoryForm.show} onValueChange={val => onFormChange("show", val)} />
                    </View>

                    <View style={{ flexDirection: "row", justifyContent: "space-around", marginTop: 20 }}>
                      <TouchableOpacity style={styles.saveBtn} onPress={saveCategory}>
                        <Text style={styles.saveBtnText}>{editingCategory ? "Update" : "Save"}</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalVisible(false)}>
                        <Text style={styles.cancelBtnText}>Cancel</Text>
                      </TouchableOpacity>
                    </View>

                  </ScrollView>
                </View>
              </View>
            </Modal>


          </>
        )}
        {/* BRANCH */}
        {activeSection === 'branch' && (<>

          <View style={styles.headerRow}>
            <Text style={styles.title}>Branches Dashboard</Text>
            <TouchableOpacity style={styles.addButton} onPress={() => setAddModalVisible(true)}>
              <Text style={styles.addButtonText}>Add New</Text>
            </TouchableOpacity>
          </View>


          <TextInput
            placeholder="Search by store name or ID"
            value={searchText}
            onChangeText={setSearchText}
            onSubmitEditing={handleSearch}
            style={styles.searchInput}
          />




          {loading && <ActivityIndicator size="large" color="#0000ff" />}

          {error && <Text style={styles.errorText}>{error}</Text>}

          <FlatList
            data={branches}
            keyExtractor={(item) => item.uid!}
            // renderItem={renderBranch}
            renderItem={({ item }) => (<>
              <View style={[styles.restaurantItem]}>

                <View style={{ flex: 1 }}>
                  <Text style={styles.title}>{item.storename}</Text>
                  {/* <Text>Store UID: {item.storeuid}</Text> */}
                  <Text>Branch ID: {item.branchId}</Text>
                  <Text>Phone: {item.phone}</Text>
                  <Text>Online: {item.online ? "Yes" : "No"}</Text>
                  {/* <Text>Announcement: {item.announcement}</Text> */}
                  <Text>Delivery Charge: ₹{item.delivery} || Km Charge: ₹{item.kmcharge}</Text>
                  <Text>Minimum Amount: ₹{item.minAmount} || Packing Charge: ₹{item.packing}</Text>
                  <Text>Radius: {item.radius}||Range: {item.range}</Text>
                  <Text>Tax: {item.tax}%||Service Charge: ₹{item.service}</Text>
                  {/* <Text>Pincode: {item.pincode}</Text> */}
                  {/* <Text>Policy: {item.policy}</Text> */}


                  <Text>LatLng: {item.storeLat},{item.storeLon}</Text>

                  {/* <Text>Store Category: {item.storecate}</Text> */}


                </View>



                <View style={styles.actions}>

                  <TouchableOpacity
                    onPress={() => openbranchEditModal(item)}
                    style={[styles.actionButton, { backgroundColor: "#007bff", marginBottom: 4 }]}
                  >
                    <Text style={styles.addButtonText}>Edit</Text>
                  </TouchableOpacity>


                </View>
              </View>

            </>)}
          />

          {/* Add Branch Modal */}
          <Modal visible={addModalVisible} transparent animationType="slide" onRequestClose={() => setAddModalVisible(false)}>
            <View style={styles.modalBackground}>
              <View style={styles.modalContent}>
                <ScrollView contentContainerStyle={styles.modalContent} keyboardShouldPersistTaps="handled">
                  <Text style={styles.modalTitle}>Add New Branch</Text>

                  {renderFormFields(newBranch, false)}

                  <View style={{ marginVertical: 20, flexDirection: "row", justifyContent: "space-around" }}>

                    <TouchableOpacity onPress={handleAddBranch} style={styles.saveBtn}>
                      <Text style={styles.saveBtnText}>Save</Text>
                    </TouchableOpacity>

                    <TouchableOpacity onPress={() => setAddModalVisible(false)} style={styles.cancelBtn}>
                      <Text style={styles.cancelBtnText}>Cancel</Text>
                    </TouchableOpacity>
                  </View>


                </ScrollView>
              </View>
            </View>
          </Modal>

          {/* Edit Branch Modal */}
          <Modal visible={editModalVisible} transparent animationType="slide" onRequestClose={closeEditModal}>
            <View style={styles.modalBackground}>
              <View style={styles.modalContent}>
                <ScrollView contentContainerStyle={styles.modalContent} keyboardShouldPersistTaps="handled">
                  <Text style={styles.modalTitle}>Edit Branch</Text>

                  {editingBranch && renderFormFields(editingBranch, true)}

                  <View style={{ marginVertical: 20, flexDirection: "row", justifyContent: "space-around" }}>

                    <TouchableOpacity onPress={handleUpdateBranch} style={styles.saveBtn}>
                      <Text style={styles.saveBtnText}>Update</Text>
                    </TouchableOpacity>

                    <TouchableOpacity onPress={closeEditModal} style={styles.cancelBtn}>
                      <Text style={styles.cancelBtnText}>Cancel</Text>
                    </TouchableOpacity>


                  </View>
                </ScrollView>
              </View>
            </View>
          </Modal>




        </>)}

        {activeSection === 'galary' && (<>
          <ScrollView style={styles.container}>

            <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#2e7d32" />
            <Text>Galery under developement</Text>
            </View>

           
            {Object.entries(gallery).map(([folder, urls]) => (
              <View key={folder} style={styles.folderSection}>
                <Text style={styles.folderTitle}>{folder.toUpperCase()}</Text>
                <View style={styles.imageGrid}>
                  {urls.map((uri, idx) => (
                    <Image key={idx} source={{ uri }} style={styles.imageItem} />
                  ))}
                </View>
              </View>
            ))}
          </ScrollView>




        </>



        )}

      </View>
    </View >
  );
};

const styles = StyleSheet.create({
  layout: {
    flexDirection: "row",
    height: windowHeight,
    backgroundColor: "#f6f8fb",
  },
  sidebar: {
    width: 220,
    backgroundColor: "#24292f",
    paddingVertical: 16,
    paddingHorizontal: 12,
    alignItems: "flex-start",
  },
  sidebarCollapsed: {
    width: 60,
    alignItems: "center",
  },
  sidebarToggle: {
    marginBottom: 20,
    alignSelf: "flex-end",
  },
  toggleText: {
    fontSize: 22,
    color: "#e1e4e8",
  },
  sidebarItem: {
    width: "100%",
    paddingVertical: 16,
    paddingHorizontal: 10,
    marginBottom: 4,
    borderRadius: 6,
    backgroundColor: "#24292f",
  },
  sidebarItemActive: {
    backgroundColor: "#00cc00",
  },
  sidebarLabel: {
    color: "#f6f8fb",
    fontSize: 18,
  },
  sidebarLabelCollapsed: {
    color: "#f6f8fb",
    fontSize: 14,
  },
  sidebarItemCollapsed: {
    alignItems: "center",
    justifyContent: "center",
  },
  mainContent: {
    flex: 1,
    padding: 32,
    overflow: "scroll",
  },
  totalCount: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 12,
    color: "#24292f",
  },
  searchInput: {
    padding: 10,
    fontSize: 16,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 4,
    marginBottom: 16,
  },
  userItem: {
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 6,
    marginBottom: 10,
  },
  userName: {
    fontWeight: "bold",
    fontSize: 18,
  },
  actionButtons: {
    flexDirection: "row",
    marginTop: 10,
  },
  actionButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 4,
    marginRight: 10,
  },
  activateBtn: {
    backgroundColor: "#28a745",
  },
  deactivateBtn: {
    backgroundColor: "#ffc107",
  },
  actionButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
  },
  addButton: {
    backgroundColor: "#00cc00",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 6,
  },
  addButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },
  productItem: {
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
  },
  productTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },
  restaurantItem: {
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
  },
  restaurantTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },
  actions: {
    flexDirection: "row",
  },
  editBtn: {
    backgroundColor: "#007bff",
    padding: 8,
    borderRadius: 6,
    marginRight: 8,
  },
  deleteBtn: {
    backgroundColor: "#dc3545",
    padding: 8,
    borderRadius: 6,
  },
  actionText: {
    color: "#fff",
    fontWeight: "bold",
  },
  modalBackground: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    padding: 16,
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 20,
    maxHeight: "90%",
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
    marginBottom: 12,
  },
  toggleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  saveBtn: {
    backgroundColor: "#28a745",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  saveBtnText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  cancelBtn: {
    backgroundColor: "#6c757d",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  cancelBtnText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  totalsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 15,
  },
  totalText: {
    fontSize: 16,
    fontWeight: "bold",
  },
  navigation: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  navButton: {
    backgroundColor: "#007bff",
    padding: 10,
    borderRadius: 6,
    minWidth: 100,
  },
  navButtonText: {
    color: "white",
    textAlign: "center",
    fontWeight: "bold",
  },
  statusFilterContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 15,
  },
  statusFilterButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#007bff",
    marginHorizontal: 5,
  },
  statusFilterButtonActive: {
    backgroundColor: "#007bff",
  },
  statusFilterText: {
    color: "#007bff",
    fontWeight: "bold",
  },
  statusFilterTextActive: {
    color: "#fff",
  },
  searchButton: {
    backgroundColor: "#28a745",
    padding: 10,
    borderRadius: 6,
    marginBottom: 20,
  },
  searchButtonText: {
    color: "white",
    fontWeight: "bold",
    textAlign: "center",
  },
  errorText: {
    color: "red",
    marginBottom: 10,
    textAlign: "center",
  },
  orderCard: {
    backgroundColor: "#fff",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    borderRadius: 10,
    padding: 20,
    marginBottom: 16,
  },
  orderNumber: { fontWeight: "bold", fontSize: 18, marginBottom: 12 },
  orderFieldsContainer: {
    flexWrap: "wrap",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  orderFieldRow: {
    width: "48%",
    marginBottom: 8,
  },
  orderFieldLabel: { fontWeight: "bold", fontSize: 14 },
  orderFieldValue: { flexShrink: 1, fontSize: 14 },
  viewItemsButton: {
    backgroundColor: "#007bff",
    padding: 10,
    borderRadius: 6,
    marginRight: 10,
    flex: 1,
    alignItems: "center",
  },
  viewItemsButtonText: { color: "white", fontWeight: "bold" },
  cancelButton: {
    backgroundColor: "#dc3545",
    padding: 10,
    borderRadius: 6,
    flex: 1,
    alignItems: "center",
  },
  cancelButtonText: { color: "white", fontWeight: "bold" },
  gridItem: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    margin: 6,
    borderRadius: 8,
    padding: 10,
    maxWidth: "50%",
  },
  productImage: {
    width: "95%",
    height: 300,
    marginBottom: 10,
    borderRadius: 8,
    backgroundColor: "#ccc",
  },
  fieldRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 4,
  },
  fieldKey: {
    fontWeight: "bold",
    marginRight: 4,
    fontSize: 14,
  },
  fieldValue: {
    flexShrink: 1,
    fontSize: 14,
  },

  pickerContainer: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
    marginBottom: 12,
  },
  picker: {
    height: 50,
    width: '100%',
  },
  closeButton: {
    marginTop: 15,
    backgroundColor: "#dc3545",
    padding: 12,
    borderRadius: 6,
    alignItems: "center",
  },
  closeButtonText: {
    color: "white",
    fontWeight: "bold",
  },

  mainImagePreview: {
    width: 200,
    height: 200,
    borderRadius: 12,
    resizeMode: "cover",
  },
  deleteImageBtn: {
    marginTop: 8,
    backgroundColor: "#dc3545",
    borderRadius: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  deleteImageText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 14,
  },
  featureImageWrapper: {
    position: "relative",
    marginRight: 12,
    alignItems: "center",
  },
  featureImage: {
    width: 100,
    height: 100,
    borderRadius: 12,
    resizeMode: "cover",
  },
  deleteFeatureImageBtn: {
    position: "absolute",
    top: -6,
    right: -6,
    backgroundColor: "#dc3545",
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
  },
  imageUploadButton: {
    borderWidth: 2,
    borderColor: '#007AFF',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#e6f0ff',
    marginVertical: 10,
  },

  statBox: {
    width: '30%', // Adapt according to your layout
    backgroundColor: '#f0f0f0',
    padding: 5,
    borderRadius: 8,
    marginBottom: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    borderWidth: 2,
    borderColor: 'black',


  },
  label: {
    // fontWeight: '700',
    fontSize: 15,
    color: '#333',
    marginBottom: 4,
  },
  value: {
    fontWeight: '600',
    fontSize: 15,
    color: '#000',
  },

  container: {
    flex: 1,
    padding: 10,
    backgroundColor: "#fff",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  folderSection: {
    marginBottom: 25,
  },
  folderTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 12,
    color: "#2e7d32",
  },
  imageGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  imageItem: {
    width: "30%",
    aspectRatio: 1,
    borderRadius: 8,
    marginBottom: 12,
  },

});

export default AdminDashboard;