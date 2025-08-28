import {
  collection,
  getDocs,
  query,
  where,
  addDoc,
  updateDoc,
  doc,
  deleteDoc,
  Timestamp
} from "firebase/firestore";
import { db } from "../firebase";

export interface Partner {
  id?: string;
  Partnerdl: string;
  Partnerid: string;
  active: boolean;
  createdTimestamp: Timestamp;
  partnerLat: string;
  partnerLon: string;
  phone: string;
  pincode: string;
  storeid: string;
  storename: string;
}

const PARTNER_COLLECTION = "deliveryPartner";

export async function fetchPartners(): Promise<Partner[]> {
  const colRef = collection(db, PARTNER_COLLECTION);
  const snapshot = await getDocs(colRef);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...(doc.data() as Partner)
  }));
}

export async function addPartner(data: Omit<Partner, "id" | "createdTimestamp">): Promise<void> {
  const colRef = collection(db, PARTNER_COLLECTION);
  await addDoc(colRef, { ...data, createdTimestamp: Timestamp.now() });
}

export async function updatePartner(id: string, data: Partial<Omit<Partner, "id" | "createdTimestamp">>): Promise<void> {
  const docRef = doc(db, PARTNER_COLLECTION, id);
  await updateDoc(docRef, data);
}

export async function togglePartnerStatus(id: string, active: boolean): Promise<void> {
  const docRef = doc(db, PARTNER_COLLECTION, id);
  await updateDoc(docRef, { active });
}

export async function deletePartner(id: string): Promise<void> {
  const docRef = doc(db, PARTNER_COLLECTION, id);
  await deleteDoc(docRef);
}

export async function searchPartners(searchText: string): Promise<Partner[]> {
  const colRef = collection(db, PARTNER_COLLECTION);
  // You can enhance this with firestore queries for better performance
  const allPartners = await fetchPartners();
  const lowercaseSearch = searchText.toLowerCase();
  return allPartners.filter(p =>
    p.storename.toLowerCase().includes(lowercaseSearch) ||
    p.Partnerid.toLowerCase().includes(lowercaseSearch) ||
    p.phone.includes(searchText) ||
    p.pincode.includes(searchText)
  );
}
