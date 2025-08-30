import { getAuth } from "firebase/auth";
import { getFirestore, doc, getDoc, updateDoc } from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { storage } from "../firebase/firebase"; // Adjust import

const firestore = getFirestore();
const auth = getAuth();

const getCurrentBranchId = (): string | null => {
  const user = auth.currentUser;
  return user ? user.uid : null;
};

export const fetchBannerImages = async (): Promise<string[]> => {
  const branchId = getCurrentBranchId();
  if (!branchId) throw new Error("User not authenticated");

  const branchDoc = await getDoc(doc(firestore, "branch", branchId));
  if (branchDoc.exists()) {
    const banners = branchDoc.data()?.bannerImages || [];
    return banners;
  }
  return [];
};

export const uploadBannerImage = async (file: File): Promise<string> => {
  const branchId = getCurrentBranchId();
  if (!branchId) throw new Error("User not authenticated");

  const imageRef = ref(storage, `branch/${branchId}/banners/${Date.now()}_${file.name}`);
  await uploadBytes(imageRef, file);
  const downloadURL = await getDownloadURL(imageRef);

  const banners = await fetchBannerImages();
  const updatedList = [...banners, downloadURL];
  await updateDoc(doc(firestore, "branch", branchId), { bannerImages: updatedList });
  return downloadURL;
};

export const deleteBannerImage = async (imageUrl: string): Promise<void> => {
  const branchId = getCurrentBranchId();
  if (!branchId) throw new Error("User not authenticated");

  const imageRef = ref(storage, imageUrl);
  await deleteObject(imageRef);

  const banners = await fetchBannerImages();
  const updatedList = banners.filter((url) => url !== imageUrl);
  await updateDoc(doc(firestore, "branch", branchId), { bannerImages: updatedList });
};
