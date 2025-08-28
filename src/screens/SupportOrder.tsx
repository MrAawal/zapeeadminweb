import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  Modal,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Dimensions,
  Switch,
} from "react-native";
import { fetchRestaurants, addRestaurant, updateRestaurant, searchRestaurants, toggleRestaurantActive, Restaurant } from "../components/RestaurantModel";

const windowWidth = Dimensions.get("window").width;
const cardWidth = (windowWidth - 40) / 3; // Adjust 40 based on your padding/margin

const emptyRestaurant: Omit<Restaurant, "id" | "timestamp"> = {
  details: "",
  active: true,
  address: "",
  announcement: "",
  bannerImages: [],
  branchId: "",
  category: "",
  createdTimestamp: null as any, // will be set by firestore
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

const RestaurantDashboard: React.FC = () => {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [error, setError] = useState<string | null>(null);

  const [addModalVisible, setAddModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [newRestaurant, setNewRestaurant] = useState(emptyRestaurant);
  const [editingRestaurant, setEditingRestaurant] = useState<Restaurant | null>(null);

  useEffect(() => {
    loadRestaurants();
  }, []);

  async function loadRestaurants() {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchRestaurants();
      setRestaurants(data);
    } catch {
      setError("Failed to load restaurants.");
    }
    setLoading(false);
  }

  async function handleSearch() {
    if (!searchText.trim()) {
      loadRestaurants();
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const results = await searchRestaurants(searchText.trim());
      setRestaurants(results);
      if (results.length === 0) {
        setError("No restaurants found.");
      }
    } catch {
      setError("Search failed.");
    }
    setLoading(false);
  }

  async function handleToggleActive(id: string, currentActive: boolean) {
    try {
      await toggleRestaurantActive(id, !currentActive);
      loadRestaurants();
    } catch {
      Alert.alert("Error", "Failed to update active status");
    }
  }

  function handleChange(field: keyof typeof newRestaurant, value: any) {
    setNewRestaurant((prev) => ({ ...prev, [field]: value }));
  }

  function handleEditChange(field: keyof Restaurant, value: any) {
    if (editingRestaurant) {
      setEditingRestaurant((prev) => ({ ...prev!, [field]: value }));
    }
  }

  async function handleAddRestaurant() {
    if (!newRestaurant.storename.trim() || !newRestaurant.phone.trim()) {
      Alert.alert("Validation", "Store name and Phone are required");
      return;
    }
    setLoading(true);
    try {
      await addRestaurant("",newRestaurant);
      setAddModalVisible(false);
      setNewRestaurant(emptyRestaurant);
      loadRestaurants();
    } catch {
      Alert.alert("Error", "Failed to add restaurant");
    }
    setLoading(false);
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
    
    setLoading(true);
    try {
      await updateRestaurant(editingRestaurant.id, editingRestaurant);
      setEditModalVisible(false);
      setEditingRestaurant(null);
      loadRestaurants();
      Alert.alert("Success", "Restaurant updated successfully");
    } catch (error) {
      Alert.alert("Error", "Failed to update restaurant");
      console.error("Update error:", error);
    }
    setLoading(false);
  }

  function openEditModal(restaurant: Restaurant) {
    setEditingRestaurant({ ...restaurant });
    setEditModalVisible(true);
  }

  function closeEditModal() {
    setEditModalVisible(false);
    setEditingRestaurant(null);
  }

  const renderRestaurant = ({ item }: { item: Restaurant }) => (
    <View style={[styles.card, { width: cardWidth }]}>
      <Text style={styles.cardTitle}>{item.storename}{item.active ? "" : " (Inactive)"}</Text>
      <Text>{item.address}</Text>
      <Text>Phone: {item.phone}</Text>
      <Text>Category: {item.category}</Text>
      <View style={styles.cardButtons}>
        <TouchableOpacity
          onPress={() => openEditModal(item)}
          style={[styles.button, { backgroundColor: "#007bff", marginBottom: 4 }]}
        >
          <Text style={styles.buttonText}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => handleToggleActive(item.id!, item.active)}
          style={[styles.button, { backgroundColor: item.active ? "#dc3545" : "#28a745" }]}
        >
          <Text style={styles.buttonText}>{item.active ? "Deactivate" : "Activate"}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderFormFields = (restaurant: any, isEdit: boolean) => (
    <>
      <View style={{ flexDirection: "row", marginBottom: 12 }}>
        <TextInput 
          placeholder="Store Name" 
          style={[styles.input, { flex: 1, marginHorizontal: 4 }]} 
          value={restaurant.storename} 
          onChangeText={t => isEdit ? handleEditChange("storename", t) : handleChange("storename", t)} 
        />
        <TextInput 
          placeholder="Phone" 
          style={[styles.input, { flex: 1, marginHorizontal: 4 }]} 
          value={restaurant.phone} 
          onChangeText={t => isEdit ? handleEditChange("phone", t) : handleChange("phone", t)} 
          keyboardType="phone-pad" 
        />
        <TextInput 
          placeholder="Address" 
          style={[styles.input, { flex: 1, marginHorizontal: 4 }]} 
          value={restaurant.address} 
          onChangeText={t => isEdit ? handleEditChange("address", t) : handleChange("address", t)} 
        />
        <TextInput 
          placeholder="Details" 
          style={[styles.input, { flex: 1, marginHorizontal: 4 }]} 
          value={restaurant.details} 
          onChangeText={t => isEdit ? handleEditChange("details", t) : handleChange("details", t)} 
          multiline 
        />
      </View>

      <View style={{ flexDirection: "row", marginBottom: 12 }}>
        <TextInput 
          placeholder="Category" 
          style={[styles.input, { flex: 1, marginHorizontal: 4 }]} 
          value={restaurant.category} 
          onChangeText={t => isEdit ? handleEditChange("category", t) : handleChange("category", t)} 
        />
        <TextInput 
          placeholder="Announcement" 
          style={[styles.input, { flex: 1, marginHorizontal: 4 }]} 
          value={restaurant.announcement} 
          onChangeText={t => isEdit ? handleEditChange("announcement", t) : handleChange("announcement", t)} 
          multiline 
        />
        <TextInput 
          placeholder="Banner Images (comma separated)" 
          style={[styles.input, { flex: 1, marginHorizontal: 4 }]} 
          value={Array.isArray(restaurant.bannerImages) ? restaurant.bannerImages.join(",") : restaurant.bannerImages} 
          onChangeText={t => isEdit ? handleEditChange("bannerImages", t.split(",").map(s => s.trim())) : handleChange("bannerImages", t.split(",").map(s => s.trim()))} 
        />
        <TextInput 
          placeholder="Branch Id" 
          style={[styles.input, { flex: 1, marginHorizontal: 4 }]} 
          value={restaurant.branchId} 
          onChangeText={t => isEdit ? handleEditChange("branchId", t) : handleChange("branchId", t)} 
        />
      </View>

      <View style={{ flexDirection: "row", marginBottom: 12 }}>
        <TextInput 
          placeholder="Delivery Charge" 
          style={[styles.input, { flex: 1, marginHorizontal: 4 }]} 
          keyboardType="numeric" 
          value={restaurant.delivery.toString()} 
          onChangeText={t => isEdit ? handleEditChange("delivery", Number(t)) : handleChange("delivery", Number(t))} 
        />
        <TextInput 
          placeholder="Feature" 
          style={[styles.input, { flex: 1, marginHorizontal: 4 }]} 
          value={restaurant.feature} 
          onChangeText={t => isEdit ? handleEditChange("feature", t) : handleChange("feature", t)} 
        />
        <TextInput 
          placeholder="Image URL" 
          style={[styles.input, { flex: 1, marginHorizontal: 4 }]} 
          value={restaurant.image} 
          onChangeText={t => isEdit ? handleEditChange("image", t) : handleChange("image", t)} 
        />
        <TextInput 
          placeholder="Km Charge" 
          style={[styles.input, { flex: 1, marginHorizontal: 4 }]} 
          keyboardType="numeric" 
          value={restaurant.kmcharge.toString()} 
          onChangeText={t => isEdit ? handleEditChange("kmcharge", Number(t)) : handleChange("kmcharge", Number(t))} 
        />
      </View>

      <View style={{ flexDirection: "row", marginBottom: 12 }}>
        <TextInput 
          placeholder="Map Address" 
          style={[styles.input, { flex: 1, marginHorizontal: 4 }]} 
          value={restaurant.mapaddress} 
          onChangeText={t => isEdit ? handleEditChange("mapaddress", t) : handleChange("mapaddress", t)} 
        />
        <TextInput 
          placeholder="Map Pin" 
          style={[styles.input, { flex: 1, marginHorizontal: 4 }]} 
          value={restaurant.mappin} 
          onChangeText={t => isEdit ? handleEditChange("mappin", t) : handleChange("mappin", t)} 
        />
        <TextInput 
          placeholder="Minimum Order Amount" 
          style={[styles.input, { flex: 1, marginHorizontal: 4 }]} 
          keyboardType="numeric" 
          value={restaurant.minAmount.toString()} 
          onChangeText={t => isEdit ? handleEditChange("minAmount", Number(t)) : handleChange("minAmount", Number(t))} 
        />
        <TextInput 
          placeholder="Packing Charge" 
          style={[styles.input, { flex: 1, marginHorizontal: 4 }]} 
          keyboardType="numeric" 
          value={restaurant.packing.toString()} 
          onChangeText={t => isEdit ? handleEditChange("packing", Number(t)) : handleChange("packing", Number(t))} 
        />
      </View>

      <View style={{ flexDirection: "row", marginBottom: 12 }}>
        <TextInput 
          placeholder="Pin Code" 
          style={[styles.input, { flex: 1, marginHorizontal: 4 }]} 
          value={restaurant.pincode} 
          onChangeText={t => isEdit ? handleEditChange("pincode", t) : handleChange("pincode", t)} 
        />
        <TextInput 
          placeholder="Policy" 
          style={[styles.input, { flex: 1, marginHorizontal: 4 }]} 
          value={restaurant.policy} 
          onChangeText={t => isEdit ? handleEditChange("policy", t) : handleChange("policy", t)} 
          multiline 
        />
        <TextInput 
          placeholder="Range" 
          style={[styles.input, { flex: 1, marginHorizontal: 4 }]} 
          keyboardType="numeric" 
          value={restaurant.range.toString()} 
          onChangeText={t => isEdit ? handleEditChange("range", Number(t)) : handleChange("range", Number(t))} 
        />
        <TextInput 
          placeholder="Rating" 
          style={[styles.input, { flex: 1, marginHorizontal: 4 }]} 
          keyboardType="numeric" 
          value={restaurant.rating.toString()} 
          onChangeText={t => isEdit ? handleEditChange("rating", Number(t)) : handleChange("rating", Number(t))} 
        />
      </View>

      <View style={{ flexDirection: "row", marginBottom: 12 }}>
        <TextInput 
          placeholder="Service" 
          style={[styles.input, { flex: 1, marginHorizontal: 4 }]} 
          keyboardType="numeric" 
          value={restaurant.service.toString()} 
          onChangeText={t => isEdit ? handleEditChange("service", Number(t)) : handleChange("service", Number(t))} 
        />
        <TextInput 
          placeholder="Store Latitude" 
          style={[styles.input, { flex: 1, marginHorizontal: 4 }]} 
          value={restaurant.storeLat} 
          onChangeText={t => isEdit ? handleEditChange("storeLat", t) : handleChange("storeLat", t)} 
        />
        <TextInput 
          placeholder="Store Longitude" 
          style={[styles.input, { flex: 1, marginHorizontal: 4 }]} 
          value={restaurant.storeLon} 
          onChangeText={t => isEdit ? handleEditChange("storeLon", t) : handleChange("storeLon", t)} 
        />
        <TextInput 
          placeholder="Store UID" 
          style={[styles.input, { flex: 1, marginHorizontal: 4 }]} 
          value={restaurant.storeuid} 
          onChangeText={t => isEdit ? handleEditChange("storeuid", t) : handleChange("storeuid", t)} 
        />
      </View>

      <View style={{ flexDirection: "row", marginBottom: 12 }}>
        <TextInput 
          placeholder="Sub Locality" 
          style={[styles.input, { flex: 1, marginHorizontal: 4 }]} 
          value={restaurant.sublocality} 
          onChangeText={t => isEdit ? handleEditChange("sublocality", t) : handleChange("sublocality", t)} 
        />
        <TextInput 
          placeholder="Tax" 
          style={[styles.input, { flex: 1, marginHorizontal: 4 }]} 
          keyboardType="numeric" 
          value={restaurant.tax.toString()} 
          onChangeText={t => isEdit ? handleEditChange("tax", Number(t)) : handleChange("tax", Number(t))} 
        />
        <TextInput 
          placeholder="UID" 
          style={[styles.input, { flex: 1, marginHorizontal: 4 }]} 
          value={restaurant.uid} 
          onChangeText={t => isEdit ? handleEditChange("uid", t) : handleChange("uid", t)} 
        />
      </View>

      <View style={styles.checkboxRow}>
        <Text>Active</Text>
        <Switch
          value={restaurant.active}
          onValueChange={(val) => isEdit ? handleEditChange("active", val) : handleChange("active", val)}
        />
      </View>

      <View style={styles.checkboxRow}>
        <Text>Online</Text>
        <Switch
          value={restaurant.online}
          onValueChange={(val) => isEdit ? handleEditChange("online", val) : handleChange("online", val)}
        />
      </View>

      <View style={styles.checkboxRow}>
        <Text>Premium</Text>
        <Switch
          value={restaurant.premium}
          onValueChange={(val) => isEdit ? handleEditChange("premium", val) : handleChange("premium", val)}
        />
      </View>

      <View style={styles.checkboxRow}>
        <Text>Show</Text>
        <Switch
          value={restaurant.show}
          onValueChange={(val) => isEdit ? handleEditChange("show", val) : handleChange("show", val)}
        />
      </View>
    </>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Restaurants Dashboard</Text>

      <View style={styles.searchAddRow}>
        <TextInput
          placeholder="Search by name or ID"
          value={searchText}
          onChangeText={setSearchText}
          onSubmitEditing={handleSearch}
          style={styles.searchInput}
        />
        <TouchableOpacity style={styles.addButton} onPress={() => setAddModalVisible(true)}>
          <Text style={styles.addButtonText}>Add New</Text>
        </TouchableOpacity>
      </View>

      {loading && <ActivityIndicator size="large" color="#0000ff" />}

      {error && <Text style={styles.errorText}>{error}</Text>}

      <FlatList
        data={restaurants}
        keyExtractor={(item) => item.id!}
        renderItem={renderRestaurant}
        numColumns={3}
        columnWrapperStyle={styles.columnWrapper}
        contentContainerStyle={{ paddingBottom: 100 }}
      />

      {/* Add Restaurant Modal */}
      <Modal
        visible={addModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setAddModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <ScrollView contentContainerStyle={styles.modalContent} keyboardShouldPersistTaps="handled">
            <Text style={styles.modalTitle}>Add New Restaurant</Text>
            
            {renderFormFields(newRestaurant, false)}

            <View style={styles.buttonRow}>
              <TouchableOpacity onPress={handleAddRestaurant} style={styles.saveButton}>
                <Text style={styles.saveButtonText}>Save</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setAddModalVisible(false)} style={styles.cancelButton}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* Edit Restaurant Modal */}
      <Modal
        visible={editModalVisible}
        transparent
        animationType="slide"
        onRequestClose={closeEditModal}
      >
        <View style={styles.modalBackdrop}>
          <ScrollView contentContainerStyle={styles.modalContent} keyboardShouldPersistTaps="handled">
            <Text style={styles.modalTitle}>Edit Restaurant</Text>
            
            {editingRestaurant && renderFormFields(editingRestaurant, true)}

            <View style={styles.buttonRow}>
              <TouchableOpacity onPress={handleUpdateRestaurant} style={styles.saveButton}>
                <Text style={styles.saveButtonText}>Update</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={closeEditModal} style={styles.cancelButton}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#f7f7f7" },
  heading: { fontSize: 28, fontWeight: "bold", marginBottom: 20, textAlign: "center" },
  searchAddRow: { flexDirection: "row", marginBottom: 12 },
  searchInput: { flex: 1, borderColor: "#ccc", borderWidth: 1, borderRadius: 8, padding: 8, marginRight: 8 },
  addButton: { backgroundColor: "#28a745", padding: 12, borderRadius: 8, justifyContent: "center" },
  addButtonText: { color: "#fff", fontWeight: "bold" },
  errorText: { color: "red", textAlign: "center", marginBottom: 8 },
  columnWrapper: { justifyContent: "space-between" },

  card: {
    backgroundColor: "white",
    borderRadius: 10,
    padding: 12,
    margin: 4,
    width: cardWidth,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1,
    elevation: 2,
  },
  cardTitle: { fontWeight: "bold", fontSize: 16, marginBottom: 4 },
  cardButtons: { marginTop: 8 },
  button: { paddingVertical: 8, borderRadius: 6 },
  buttonText: { color: "white", textAlign: "center", fontWeight: "bold" },

  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    padding: 16,
  },
  modalContent: {
    backgroundColor: "white",
    borderRadius: 10,
    padding: 20,
    maxHeight: "90%",
  },
  modalTitle: { fontSize: 22, fontWeight: "bold", marginBottom: 12, textAlign: "center" },
  input: {
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 6,
    padding: 8,
    marginBottom: 12,
  },
  checkboxRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 16,
  },
  saveButton: {
    backgroundColor: "#28a745",
    padding: 14,
    borderRadius: 8,
    minWidth: 120,
  },
  saveButtonText: {
    color: "white",
    fontWeight: "bold",
    textAlign: "center",
  },
  cancelButton: {
    backgroundColor: "#dc3545",
    padding: 14,
    borderRadius: 8,
    minWidth: 120,
  },
  cancelButtonText: {
    color: "white",
    fontWeight: "bold",
    textAlign: "center",
  },
});

export default RestaurantDashboard;