import {
  collection,
  query,
  where,
  getDocs,
  Timestamp,
  orderBy,
  doc,
  getDoc,
  updateDoc,
} from "firebase/firestore";
import { db } from "../firebase";

export interface Order {
  id?: string;
  orderPlaceDate: Timestamp;
  orderNumber: string;
  uid: string;
  customerName: string;
  customerNumber: string;
  customerAddress: string;
  customerStore: string;
  customerStoreUid: string;
  lattitude: string;
  longitude: string;
  storeLat: string;
  storeLon: string;
  partner: string;
  dpId: string;
  totalPrice: string;
  deliveryCharge: string;
  tax: string;
  service: string;
  packing: string;
  distance: number;
  status: string;
  payment: string;
  paymentStatus: string;
  xone: string;
  active: boolean;
}

// Fetch orders filtered by date and xone UID, ordered descending by orderPlaceDate
export async function fetchOrdersByDate(xoneUid: string, date: Date): Promise<Order[]> {
  const ordersCol = collection(db, "orders");

  // Get date range for selected day
  const start = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const end = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1);

  const startTimestamp = Timestamp.fromDate(start);
  const endTimestamp = Timestamp.fromDate(end);

  const q = query(
    ordersCol,
    where("xone", "==", xoneUid),
    where("orderPlaceDate", ">=", startTimestamp),
    where("orderPlaceDate", "<", endTimestamp),
    orderBy("orderPlaceDate", "desc")
  );

  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map((doc) => ({
    id: doc.id,
    ...(doc.data() as Order),
  }));
}

// Search order by ID and xone UID
export async function searchOrderById(orderId: string, xoneUid: string): Promise<Order | null> {
  try {
    const orderDoc = doc(db, "orders", orderId);
    const orderSnap = await getDoc(orderDoc);
    if (!orderSnap.exists()) return null;
    const orderData = orderSnap.data() as Order;
    if (orderData.xone !== xoneUid) return null;
    return { id: orderSnap.id, ...orderData };
  } catch {
    return null;
  }
}

// View items of an order (assuming items are stored in subcollection 'items' under the order document)
export async function viewOrderItems(orderId: string): Promise<any[]> {
  const itemsCol = collection(db, `orders/${orderId}/orderProduct`);
  const querySnapshot = await getDocs(itemsCol);
  return querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
}


/**
 * Updates the status of an order to "Cancelled"
 * @param orderId - Firestore document ID of the order
 */
export async function cancelOrderById(orderId: string): Promise<void> {
  if (!orderId) throw new Error("Order ID is required");
  const orderRef = doc(db, "orders", orderId);
  await updateDoc(orderRef, { status: "Cancelled" });
}
