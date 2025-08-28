// analytics.ts
import { 
  getFirestore, 
  collection, 
  getCountFromServer, 
  query,
  where,
  getDocs,

} from 'firebase/firestore';

const db = getFirestore();

export interface DashboardStats {
  userCount: number;
  productCount: number;
  categoryCount: number;
  subcategoryCount: number;
  restaurantCount: number;
  deliveryBoyCount: number;
  branchCount: number;
  orderCount: number;
  bookingCount:number;

}

export interface OrderDataPoint {
  date: string;
  totalPrice: number;
}

export const getDashboardStats = async (): Promise<DashboardStats> => {
  // Parallel counts for collections
  const [
    usersCountSnap,
    productCountSnap,
    categoryCountSnap,
    subcategoryCountSnap,
    restaurantCountSnap,
    deliveryBoyCountSnap,
    branchCountSnap,
    orderCountSnap,
    bookingCountSnap,
  ] = await Promise.all([
    getCountFromServer(collection(db, 'users')),
    getCountFromServer(collection(db, 'product')),
    getCountFromServer(collection(db, 'category')),
    getCountFromServer(collection(db, 'subcategory')),
    getCountFromServer(collection(db, 'Restaurant')),
    getCountFromServer(collection(db, 'deliveryPartner')),
    getCountFromServer(collection(db, 'branch')),
    getCountFromServer(collection(db, 'orders')),
    getCountFromServer(collection(db, 'Ride')),
    
  ]);

  return {
    userCount: usersCountSnap.data().count,
    productCount: productCountSnap.data().count,
    categoryCount: categoryCountSnap.data().count,
    subcategoryCount: subcategoryCountSnap.data().count,
    restaurantCount: restaurantCountSnap.data().count,
    deliveryBoyCount: deliveryBoyCountSnap.data().count,
    branchCount: branchCountSnap.data().count,
    orderCount:orderCountSnap.data().count,
    bookingCount:bookingCountSnap.data().count,

  };
};


export async function fetchMonthlyOrderTotals(
  
  startDate: Date,
  endDate: Date
): Promise<OrderDataPoint[]> {
  const ordersRef = collection(db, 'orders');
  const q = query(
    ordersRef,
    
    where('orderPlaceDate', '>=', startDate),
    where('orderPlaceDate', '<=', endDate)
  );

  const querySnapshot = await getDocs(q);

  const aggregationMap: { [key: string]: number } = {};

  querySnapshot.forEach((doc) => {
    const data = doc.data();
    if (!data.orderPlaceDate || !data.totalPrice) return;

    const orderDate = data.orderPlaceDate.toDate();
    const dateStr = orderDate.toISOString().split('T')[0];

    if (!aggregationMap[dateStr]) {
      aggregationMap[dateStr] = 0;
    }
    aggregationMap[dateStr] += data.totalPrice;
  });

  const result: OrderDataPoint[] = Object.entries(aggregationMap).map(([date, totalPrice]) => ({
    date,
    totalPrice,
  }));

  // Sort by date ascending
  result.sort((a, b) => (a.date > b.date ? 1 : -1));

  return result;
}
