// services/orderService.ts
import { collection, query, where, orderBy,getDocs, Firestore } from 'firebase/firestore';

export interface OrderDataPoint {
  date: string;
  totalPrice: number;
}

export async function fetchMonthlyOrderTotals(
  db: Firestore,
  startDate: Date,
  endDate: Date
): Promise<OrderDataPoint[]> {
  const ordersRef = collection(db, 'orders');
const q = query(
  ordersRef,
  where('orderPlaceDate', '>=', startDate),
  where('orderPlaceDate', '<=', endDate),
  where('status', '==', 'Delivered'),  // filter delivered orders
  where('xone', '==', 'voT4WYa4VNMQnYgFXlKVcIUeuEL2'), // store-specific filter
  orderBy('orderPlaceDate', 'desc')  // order descending by orderPlaceDate
);

  const querySnapshot = await getDocs(q);

  const aggregationMap: { [key: string]: number } = {};

  querySnapshot.forEach((doc) => {
    const data = doc.data();
    if (!data.orderPlaceDate || !data.totalPrice) return;

    const orderDate = data.orderPlaceDate.toDate();
    const dateStr = orderDate.toISOString().split('T')[0];

    // Convert totalPrice from string to number safely
    const totalPriceNum = parseFloat(data.totalPrice);
    if (isNaN(totalPriceNum)) return;

    if (!aggregationMap[dateStr]) {
      aggregationMap[dateStr] = 0;
    }
    aggregationMap[dateStr] += totalPriceNum;
  });

  const result: OrderDataPoint[] = Object.entries(aggregationMap).map(([date, totalPrice]) => ({
    date,
    totalPrice,
  }));

  // Sort by date ascending
  result.sort((a, b) => (a.date > b.date ? 1 : -1));

  return result;
}
