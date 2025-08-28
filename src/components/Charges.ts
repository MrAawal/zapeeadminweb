import { collection, query, where, orderBy, getDocs, Firestore } from 'firebase/firestore';

export interface TotalsResult {
  totalDeliveryCharge: number;
  totalTax: number;
  totalPrice: number;
  totalPacking: number;
  totalService: number;
}

/**
 * Fetches orders filtered by date range, status, and xone filter,
 * sums the specified numeric string fields.
 */
export async function fetchTotalsChargesAndPrice(
  db: Firestore,
  startDate: Date,
  endDate: Date,
  xoneFilter: string
): Promise<TotalsResult> {
  const ordersRef = collection(db, 'orders');
  const q = query(
    ordersRef,
    where('orderPlaceDate', '>=', startDate),
    where('orderPlaceDate', '<=', endDate),
    where('status', '==', 'Delivered'),
    where('xone', '==', xoneFilter),
    orderBy('orderPlaceDate', 'desc')
  );

  const querySnapshot = await getDocs(q);

  let totalDeliveryCharge = 0;
  let totalTax = 0;
  let totalPrice = 0;
  let totalPacking = 0;
  let totalService = 0;

 querySnapshot.forEach((doc) => {
  const data = doc.data() as {
    deliveryCharge?: string;
    tax?: string;
    totalPrice?: string;
    packing?: string;
    service?: string;
  };

  const deliveryChargeNum = parseFloat(data.deliveryCharge ?? '0');
  const taxNum = parseFloat(data.tax ?? '0');
  const totalPriceNum = parseFloat(data.totalPrice ?? '0');
  const packingNum = parseFloat(data.packing ?? '0');
  const serviceNum = parseFloat(data.service ?? '0');

  if (!isNaN(deliveryChargeNum)) totalDeliveryCharge += deliveryChargeNum;
  if (!isNaN(taxNum)) totalTax += taxNum;
  if (!isNaN(totalPriceNum)) totalPrice += totalPriceNum;
  if (!isNaN(packingNum)) totalPacking += packingNum;
  if (!isNaN(serviceNum)) totalService += serviceNum;
});


  return {
    totalDeliveryCharge,
    totalTax,
    totalPrice,
    totalPacking,
    totalService,
  };
}
