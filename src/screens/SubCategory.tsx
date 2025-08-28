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
  Image,
} from "react-native";
import { useParams, useNavigate } from "react-router-dom";

import {
  fetchSubcategories,
  addSubcategory,
  updateSubcategory,
  deleteSubcategory,
  searchSubcategories,
  Subcategory,
} from "../components/SubCategory"; // Adjust path

const windowWidth = Dimensions.get("window").width;
const cardWidth = windowWidth > 900 ? (windowWidth - 60) / 3 : (windowWidth - 40) / 2;

const emptySubcategory: Omit<Subcategory, "id" | "createdTimestamp"> = {
  catname: "",
  discription: "",
  image: "",
  show: true,
  tittle: "",
};

const SubcategoryDashboard: React.FC = () => {
  const { catname } = useParams<{ catname: string }>();
  const navigate = useNavigate();

  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [error, setError] = useState<string | null>(null);

  const [addModalVisible, setAddModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [newSubcategory, setNewSubcategory] = useState(emptySubcategory);
  const [editingSubcategory, setEditingSubcategory] = useState<Subcategory | null>(null);

  useEffect(() => {
    loadSubcategories();
  }, [catname]);

  async function loadSubcategories() {
    setLoading(true);
    setError(null);
    try {
      let data = await fetchSubcategories();
      if (catname) {
        const catnameStr = String(catname).trim();
        // filtering including normalization to string to avoid mismatches
        data = data.filter((sc) => String(sc.catname).trim() === catnameStr);
      }
      setSubcategories(data);
    } catch {
      setError("Failed to load subcategories.");
    }
    setLoading(false);
  }

  async function handleSearch() {
    if (!searchText.trim()) {
      loadSubcategories();
      return;
    }
    setLoading(true);
    setError(null);
    try {
      let results = await searchSubcategories(searchText.trim());
      if (catname) {
        const catnameStr = String(catname).trim();
        results = results.filter((sc) => String(sc.catname).trim() === catnameStr);
      }
      setSubcategories(results);
      if (results.length === 0) setError("No subcategories found.");
    } catch {
      setError("Search failed.");
    }
    setLoading(false);
  }

  function handleChange(field: keyof typeof emptySubcategory, value: any) {
    setNewSubcategory((prev) => ({ ...prev, [field]: value }));
  }

  function handleEditChange(field: keyof Subcategory, value: any) {
    if (editingSubcategory) {
      setEditingSubcategory((prev) => ({ ...prev!, [field]: value }));
    }
  }

  async function handleAddSubcategory() {
    if (!newSubcategory.catname.trim() || !newSubcategory.tittle.trim()) {
      Alert.alert("Validation", "Catname and Title are required");
      return;
    }
    setLoading(true);
    try {
      await addSubcategory(newSubcategory);
      setAddModalVisible(false);
      setNewSubcategory(emptySubcategory);
      loadSubcategories();
    } catch {
      Alert.alert("Error", "Failed to add subcategory");
    }
    setLoading(false);
  }

  async function handleUpdateSubcategory() {
    if (!editingSubcategory?.catname.trim() || !editingSubcategory?.tittle.trim()) {
      Alert.alert("Validation", "Catname and Title are required");
      return;
    }
    if (!editingSubcategory?.id) {
      Alert.alert("Error", "Subcategory ID is missing");
      return;
    }
    setLoading(true);
    try {
      await updateSubcategory(editingSubcategory.id, editingSubcategory);
      setEditModalVisible(false);
      setEditingSubcategory(null);
      loadSubcategories();
      Alert.alert("Success", "Subcategory updated successfully");
    } catch {
      Alert.alert("Error", "Failed to update subcategory");
    }
    setLoading(false);
  }

  async function handleDeleteSubcategory(id?: string) {
  if (!id) return;

  const confirmed = window.confirm("Are you sure you want to delete this subcategory?");
  if (!confirmed) return;

  setLoading(true);
  try {
    await deleteSubcategory(id);
    loadSubcategories();
  } catch {
    alert("Failed to delete subcategory");
  }
  setLoading(false);
}


  const navigateToSubcategory = (id?: string) => {
    if (!id) return;
    navigate(`/subcategorydetail/${id}`);
  };

  function openEditModal(subcat: Subcategory) {
    setEditingSubcategory(subcat);
    setEditModalVisible(true);
  }

  function closeEditModal() {
    setEditModalVisible(false);
    setEditingSubcategory(null);
  }

  const renderSubcategory = ({ item }: { item: Subcategory }) => (
    <View style={[styles.card, { width: cardWidth }]}>
      {item.image ? (
        <Image source={{ uri: item.image }} style={styles.image} />
      ) : null}
      <Text style={styles.cardTitle}>
        {item.tittle} {item.show ? "" : "(Hidden)"}
      </Text>
      <Text>Catname: {item.catname}</Text>
      <Text>{item.discription}</Text>
      <View style={styles.cardButtons}>
        <TouchableOpacity
          onPress={() => openEditModal(item)}
          style={[styles.button, { backgroundColor: "#007bff", marginRight:8 }]}
        >
          <Text style={styles.buttonText}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => handleDeleteSubcategory(item.id)}
          style={[styles.button, { backgroundColor: "#dc3545" }]}
        >
          <Text style={styles.buttonText}>Delete</Text>
        </TouchableOpacity>
     
      </View>
    </View>
  );

  const renderFormFields = (subcategory: any, isEdit: boolean) => (
    <>
      <TextInput
        placeholder="Catname"
        style={styles.input}
        value={subcategory.catname}
        onChangeText={t => isEdit ? handleEditChange("catname", t) : handleChange("catname", t)}
      />
      <TextInput
        placeholder="Title"
        style={styles.input}
        value={subcategory.tittle}
        onChangeText={t => isEdit ? handleEditChange("tittle", t) : handleChange("tittle", t)}
      />
      <TextInput
        placeholder="Description"
        style={styles.input}
        value={subcategory.discription}
        onChangeText={t => isEdit ? handleEditChange("discription", t) : handleChange("discription", t)}
      />
      <TextInput
        placeholder="Image URL"
        style={styles.input}
        value={subcategory.image}
        onChangeText={t => isEdit ? handleEditChange("image", t) : handleChange("image", t)}
      />
      {subcategory.image ? (
        <Image source={{ uri: subcategory.image }} style={styles.previewImage} />
      ) : null}
      <View style={styles.checkboxRow}>
        <Text>Show</Text>
        <Switch
          value={subcategory.show}
          onValueChange={val => isEdit ? handleEditChange("show", val) : handleChange("show", val)}
        />
      </View>
    </>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Subcategory Dashboard</Text>

      <View style={styles.searchAddRow}>
        <TextInput
          placeholder="Search by title or catname"
          value={searchText}
          onChangeText={setSearchText}
          onSubmitEditing={handleSearch}
          style={styles.searchInput}
        />
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setAddModalVisible(true)}
        >
          <Text style={styles.addButtonText}>Add New</Text>
        </TouchableOpacity>
      </View>

      {loading && <ActivityIndicator size="large" color="#0000ff" />}

      {error && <Text style={styles.errorText}>{error}</Text>}

      <FlatList
        data={subcategories}
        keyExtractor={item => item.id!}
        renderItem={renderSubcategory}
        numColumns={3}
        columnWrapperStyle={styles.columnWrapper}
        contentContainerStyle={{ paddingBottom: 100 }}
      />

      {/* Add Modal */}
      <Modal
        visible={addModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setAddModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <ScrollView
            contentContainerStyle={styles.modalContent}
            keyboardShouldPersistTaps="handled"
          >
            <Text style={styles.modalTitle}>Add New Subcategory</Text>
            {renderFormFields(newSubcategory, false)}
            <View style={styles.buttonRow}>
              <TouchableOpacity
                onPress={handleAddSubcategory}
                style={styles.saveButton}
              >
                <Text style={styles.buttonText}>Save</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setAddModalVisible(false)}
                style={styles.cancelButton}
              >
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* Edit Modal */}
      <Modal
        visible={editModalVisible}
        transparent
        animationType="slide"
        onRequestClose={closeEditModal}
      >
        <View style={styles.modalBackdrop}>
          <ScrollView
            contentContainerStyle={styles.modalContent}
            keyboardShouldPersistTaps="handled"
          >
            <Text style={styles.modalTitle}>Edit Subcategory</Text>
            {editingSubcategory && renderFormFields(editingSubcategory, true)}
            <View style={styles.buttonRow}>
              <TouchableOpacity
                onPress={handleUpdateSubcategory}
                style={styles.saveButton}
              >
                <Text style={styles.buttonText}>Update</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={closeEditModal}
                style={styles.cancelButton}
              >
                <Text style={styles.buttonText}>Cancel</Text>
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
  addButton: { backgroundColor: "#28a745", borderRadius: 8, paddingHorizontal: 16, justifyContent: "center" },
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
  image: {
    width: "100%",
    height: 120,
    borderRadius: 8,
    marginBottom: 8,
    resizeMode: "cover",
  },
  previewImage: {
    width: "100%",
    height: 150,
    borderRadius: 8,
    marginBottom: 12,
    resizeMode: "cover",
  },
  cardTitle: { fontWeight: "bold", fontSize: 16, marginBottom: 4 },
  cardButtons: { flexDirection: "row", justifyContent: "space-between" },
  button: { flex: 1, paddingVertical: 8, borderRadius: 6, justifyContent: "center", marginHorizontal: 4 },
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
    borderRadius: 8,
    padding: 8,
    marginBottom: 12,
  },
  checkboxRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
    alignItems: "center",
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
    alignItems: "center",
  },
  cancelButton: {
    backgroundColor: "#dc3545",
    padding: 14,
    borderRadius: 8,
    minWidth: 120,
    alignItems: "center",
  },
});

export default SubcategoryDashboard;
