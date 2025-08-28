// src/services/bannerImagesService.ts
import { getFirestore, doc, getDoc, updateDoc } from "firebase/firestore";
import { getStorage, ref, uploadBytes, deleteObject, getDownloadURL } from "firebase/storage";

const firestore = getFirestore();
const storage = getStorage();

// Fetch bannerImages array from Firestore document for branch
export const fetchBannerImages = async (branchId: string): Promise<string[]> => {
  const docRef = doc(firestore, "branch", branchId);
  const docSnap = await getDoc(docRef);
  if (!docSnap.exists()) {
    return [];
  }
  const data = docSnap.data();
  return data.bannerImages || [];
};

// Upload image to Firebase Storage and update Firestore document
export const uploadBannerImage = async (branchId: string, file: File): Promise<string> => {
  const storageRef = ref(storage, `bannerImages/${branchId}/${Date.now()}_${file.name}`);

  await uploadBytes(storageRef, file);
  const downloadUrl = await getDownloadURL(storageRef);

  // Update bannerImages array in Firestore doc
  const docRef = doc(firestore, "branch", branchId);
  const currentData = await getDoc(docRef);
  const currentImages: string[] = currentData.exists() ? (currentData.data().bannerImages || []) : [];

  await updateDoc(docRef, {
    bannerImages: [...currentImages, downloadUrl],
  });

  return downloadUrl;
};

// Delete image both from Firebase Storage and Firestore document
export const deleteBannerImage = async (branchId: string, imageUrl: string): Promise<void> => {
  // Extract storage path from URL
  const pathStart = imageUrl.indexOf("/o/") + 3;
  const pathEnd = imageUrl.indexOf("?");
  const encodedPath = imageUrl.substring(pathStart, pathEnd);
  const storagePath = decodeURIComponent(encodedPath);

  // Delete from Storage
  const storageRef = ref(storage, storagePath);
  await deleteObject(storageRef);

  // Update Firestore doc array
  const docRef = doc(firestore, "branch", branchId);
  const docSnap = await getDoc(docRef);
  if (!docSnap.exists()) return;

  const data = docSnap.data();
  const images: string[] = data.bannerImages || [];
  const updatedImages = images.filter((img) => img !== imageUrl);

  await updateDoc(docRef, { bannerImages: updatedImages });
};
