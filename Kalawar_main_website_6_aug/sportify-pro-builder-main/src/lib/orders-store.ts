import fs from "fs/promises";
import path from "path";
import { connectToDatabase } from "./mongodb";
import {
  OrderModel,
  IOrder,
  IOrderItem,
  ICustomerInfo,
  IPaymentInfo,
  IOrderStatusHistory,
} from "@/models/Order";
import { updateProduct, getProductByIdOrCode } from "./products-store";

export interface OrderRecord {
  id: string;
  orderId: string;
  invoiceNumber: string;
  userId?: string;
  customer: ICustomerInfo;
  items: IOrderItem[];
  subtotal: number;
  shippingFee: number;
  tax: number;
  total: number;
  payment: IPaymentInfo;
  orderStatus:
    | "Order Placed"
    | "Payment Confirmed"
    | "Processing"
    | "Shipped"
    | "Delivered"
    | "Cancelled";
  statusHistory: IOrderStatusHistory[];
  notes?: string;
  trackingNumber?: string;
  courierName?: string;
  createdAt: string;
  updatedAt: string;
}

// Fallback file storage
async function getStorageFilePath(filename: string): Promise<string> {
  const primary = path.join(process.cwd(), "src", "data", "storage", filename);
  const nested = path.join(
    process.cwd(),
    "sportify-pro-builder-main",
    "src",
    "data",
    "storage",
    filename
  );

  try {
    await fs.access(primary);
    return primary;
  } catch {
    try {
      await fs.access(nested);
      return nested;
    } catch {
      try {
        await fs.mkdir(path.dirname(primary), { recursive: true });
      } catch {
        // Read-only filesystem
      }
      return primary;
    }
  }
}

async function readFileOrders(): Promise<OrderRecord[]> {
  try {
    const file = await getStorageFilePath("orders.json");
    const content = await fs.readFile(file, "utf-8");
    return content.trim() ? JSON.parse(content) : [];
  } catch {
    return [];
  }
}

async function writeFileOrders(data: OrderRecord[]): Promise<void> {
  try {
    const file = await getStorageFilePath("orders.json");
    const tempFile = `${file}.tmp.${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    await fs.writeFile(tempFile, JSON.stringify(data, null, 2), "utf-8");
    try {
      await fs.rename(tempFile, file);
    } catch {
      await fs.writeFile(file, JSON.stringify(data, null, 2), "utf-8");
      try { await fs.unlink(tempFile); } catch {}
    }
  } catch (err) {
    console.warn("Notice: Could not write fallback orders file (read-only filesystem):", err instanceof Error ? err.message : "");
  }
}

export async function generateUniqueOrderId(): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `ORD-${year}-`;
  try {
    await connectToDatabase();
    const count = await OrderModel.countDocuments();
    let num = count + 1;
    let candidate = `${prefix}${String(num).padStart(4, "0")}`;
    let exists = await OrderModel.findOne({ orderId: candidate });
    while (exists) {
      num++;
      candidate = `${prefix}${String(num).padStart(4, "0")}`;
      exists = await OrderModel.findOne({ orderId: candidate });
    }
    return candidate;
  } catch {
    const orders = await readFileOrders();
    const num = orders.length + 1;
    return `${prefix}${String(num).padStart(4, "0")}`;
  }
}

export async function generateUniqueInvoiceNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `INV-${year}-`;
  try {
    await connectToDatabase();
    const count = await OrderModel.countDocuments();
    let num = count + 1;
    let candidate = `${prefix}${String(num).padStart(4, "0")}`;
    let exists = await OrderModel.findOne({ invoiceNumber: candidate });
    while (exists) {
      num++;
      candidate = `${prefix}${String(num).padStart(4, "0")}`;
      exists = await OrderModel.findOne({ invoiceNumber: candidate });
    }
    return candidate;
  } catch {
    const orders = await readFileOrders();
    const num = orders.length + 1;
    return `${prefix}${String(num).padStart(4, "0")}`;
  }
}

export async function getOrders(options?: {
  userId?: string;
  email?: string;
  status?: string;
  search?: string;
}): Promise<OrderRecord[]> {
  try {
    await connectToDatabase();
    const query: Record<string, any> = {};

    if (options?.userId) {
      query.userId = options.userId;
    }
    if (options?.email) {
      query["customer.email"] = options.email.toLowerCase();
    }
    if (options?.status && options.status !== "All") {
      query.orderStatus = options.status;
    }
    if (options?.search && options.search.trim()) {
      const searchRegex = new RegExp(options.search.trim(), "i");
      query.$or = [
        { orderId: searchRegex },
        { invoiceNumber: searchRegex },
        { "customer.name": searchRegex },
        { "customer.email": searchRegex },
        { "customer.phone": searchRegex },
        { "items.name": searchRegex },
        { "items.code": searchRegex },
      ];
    }

    const docs = await OrderModel.find(query).sort({ createdAt: -1 }).lean();
    return docs.map(formatOrderDoc);
  } catch (err) {
    console.warn("DB error loading orders, using fallback file:", err);
    let orders = await readFileOrders();
    if (options?.userId) {
      orders = orders.filter((o) => o.userId === options.userId);
    }
    if (options?.email) {
      orders = orders.filter(
        (o) => o.customer.email.toLowerCase() === options.email?.toLowerCase()
      );
    }
    if (options?.status && options.status !== "All") {
      orders = orders.filter((o) => o.orderStatus === options.status);
    }
    if (options?.search && options.search.trim()) {
      const q = options.search.trim().toLowerCase();
      orders = orders.filter(
        (o) =>
          o.orderId.toLowerCase().includes(q) ||
          o.invoiceNumber.toLowerCase().includes(q) ||
          o.customer.name.toLowerCase().includes(q) ||
          o.customer.email.toLowerCase().includes(q) ||
          o.customer.phone.toLowerCase().includes(q) ||
          o.items.some(
            (it) =>
              it.name.toLowerCase().includes(q) ||
              it.code.toLowerCase().includes(q)
          )
      );
    }
    return orders;
  }
}

export async function getOrderById(
  identifier: string
): Promise<OrderRecord | null> {
  const cleanId = decodeURIComponent(identifier).trim();
  let foundOrder: OrderRecord | null = null;
  try {
    await connectToDatabase();
    const doc = await OrderModel.findOne({
      $or: [
        { orderId: cleanId.toUpperCase() },
        { invoiceNumber: cleanId.toUpperCase() },
        ...(cleanId.match(/^[0-9a-fA-F]{24}$/) ? [{ _id: cleanId }] : []),
      ],
    }).lean();

    if (doc) foundOrder = formatOrderDoc(doc);
  } catch (err) {
    console.warn("DB error finding order:", err);
  }

  if (!foundOrder) {
    const orders = await readFileOrders();
    const found = orders.find(
      (o) =>
        o.id === cleanId ||
        o.orderId.toLowerCase() === cleanId.toLowerCase() ||
        o.invoiceNumber.toLowerCase() === cleanId.toLowerCase()
    );
    foundOrder = found || null;
  }

  if (foundOrder && Array.isArray(foundOrder.items)) {
    // Enrich items with actual product originalPrice (MRP) from product catalog
    for (const item of foundOrder.items) {
      if (!item.originalPrice || item.originalPrice <= item.price) {
        try {
          const prod = await getProductByIdOrCode(item.code || item.productId);
          if (prod && prod.originalPrice && prod.originalPrice > item.price) {
            item.originalPrice = prod.originalPrice;
          } else if (prod && prod.price && prod.originalPrice) {
            item.originalPrice = prod.originalPrice;
          } else {
            // Default to ₹4000 if price is ₹2000 or (price * 2) if not specified
            item.originalPrice = item.price === 2000 ? 4000 : Math.round(item.price * 1.5);
          }
        } catch {
          item.originalPrice = item.price === 2000 ? 4000 : Math.round(item.price * 1.5);
        }
      }
    }
  }

  return foundOrder;
}

export async function createOrder(
  data: Partial<OrderRecord>
): Promise<OrderRecord> {
  const orderId = data.orderId || (await generateUniqueOrderId());
  const invoiceNumber =
    data.invoiceNumber || (await generateUniqueInvoiceNumber());

  const initialStatus =
    data.payment?.status === "Paid" ? "Payment Confirmed" : (data.orderStatus || "Order Placed");

  const initialHistory: IOrderStatusHistory[] = [
    {
      status: initialStatus,
      timestamp: new Date(),
      comment:
        data.payment?.status === "Paid"
          ? `Order placed & payment verified (${data.payment.method})`
          : "Order placed successfully",
      updatedBy: "Customer / Checkout",
    },
  ];

  const orderData = {
    orderId,
    invoiceNumber,
    userId: data.userId || "",
    customer: data.customer!,
    items: data.items || [],
    subtotal: Number(data.subtotal || 0),
    shippingFee: Number(data.shippingFee || 0),
    tax: Number(data.tax || 0),
    total: Number(data.total || 0),
    payment: {
      method: data.payment?.method || "Razorpay",
      status: data.payment?.status || "Pending",
      razorpayOrderId: data.payment?.razorpayOrderId,
      razorpayPaymentId: data.payment?.razorpayPaymentId,
      razorpaySignature: data.payment?.razorpaySignature,
      paidAt: data.payment?.paidAt || (data.payment?.status === "Paid" ? new Date() : undefined),
    },
    orderStatus: initialStatus,
    statusHistory: data.statusHistory?.length ? data.statusHistory : initialHistory,
    notes: data.notes || "",
    trackingNumber: data.trackingNumber || "",
    courierName: data.courierName || "",
  };

  // Decrement product stock if order is placed
  try {
    for (const item of orderData.items) {
      const prod = await getProductByIdOrCode(item.code || item.productId);
      if (prod && typeof prod.stock === "number") {
        const newStock = Math.max(0, prod.stock - item.quantity);
        await updateProduct(prod.code, { stock: newStock });
      }
    }
  } catch (stockErr) {
    console.warn("Stock decrement error:", stockErr);
  }

  try {
    await connectToDatabase();
    const created = await OrderModel.create(orderData);
    return formatOrderDoc(created.toObject());
  } catch (dbErr) {
    console.warn("DB order creation failed, saving to file:", dbErr);
    const orders = await readFileOrders();
    const newOrd: OrderRecord = {
      id: `ord-${Date.now()}`,
      ...orderData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    orders.unshift(newOrd);
    await writeFileOrders(orders);
    return newOrd;
  }
}

export async function updateOrderStatus(
  identifier: string,
  newStatus: OrderRecord["orderStatus"],
  comment?: string,
  updatedBy: string = "Admin",
  courierName?: string,
  trackingNumber?: string
): Promise<OrderRecord | null> {
  const cleanId = decodeURIComponent(identifier).trim();
  const historyEntry: IOrderStatusHistory = {
    status: newStatus,
    timestamp: new Date(),
    comment: comment || `Status updated to ${newStatus}`,
    updatedBy,
  };

  const setObj: Record<string, any> = { orderStatus: newStatus };
  if (courierName !== undefined) setObj.courierName = courierName;
  if (trackingNumber !== undefined) setObj.trackingNumber = trackingNumber;

  try {
    await connectToDatabase();
    const doc = await OrderModel.findOneAndUpdate(
      {
        $or: [
          { orderId: cleanId.toUpperCase() },
          { invoiceNumber: cleanId.toUpperCase() },
          ...(cleanId.match(/^[0-9a-fA-F]{24}$/) ? [{ _id: cleanId }] : []),
        ],
      },
      {
        $set: setObj,
        $push: { statusHistory: historyEntry },
      },
      { returnDocument: "after" }
    ).lean();

    if (doc) return formatOrderDoc(doc);
  } catch (err) {
    console.warn("DB updateOrderStatus error:", err);
  }

  const orders = await readFileOrders();
  const idx = orders.findIndex(
    (o) =>
      o.id === cleanId ||
      o.orderId.toLowerCase() === cleanId.toLowerCase() ||
      o.invoiceNumber.toLowerCase() === cleanId.toLowerCase()
  );
  if (idx !== -1) {
    orders[idx].orderStatus = newStatus;
    if (courierName !== undefined) orders[idx].courierName = courierName;
    if (trackingNumber !== undefined) orders[idx].trackingNumber = trackingNumber;
    orders[idx].statusHistory = orders[idx].statusHistory || [];
    orders[idx].statusHistory.push(historyEntry);
    orders[idx].updatedAt = new Date().toISOString();
    await writeFileOrders(orders);
    return orders[idx];
  }

  return null;
}

export async function updateOrderPayment(
  identifier: string,
  paymentData: Partial<IPaymentInfo>
): Promise<OrderRecord | null> {
  const cleanId = decodeURIComponent(identifier).trim();

  try {
    await connectToDatabase();
    const updateObj: Record<string, any> = {};
    if (paymentData.status) updateObj["payment.status"] = paymentData.status;
    if (paymentData.method) updateObj["payment.method"] = paymentData.method;
    if (paymentData.razorpayOrderId)
      updateObj["payment.razorpayOrderId"] = paymentData.razorpayOrderId;
    if (paymentData.razorpayPaymentId)
      updateObj["payment.razorpayPaymentId"] = paymentData.razorpayPaymentId;
    if (paymentData.razorpaySignature)
      updateObj["payment.razorpaySignature"] = paymentData.razorpaySignature;
    if (paymentData.paidAt) updateObj["payment.paidAt"] = paymentData.paidAt;

    if (paymentData.status === "Paid") {
      updateObj.orderStatus = "Payment Confirmed";
    }

    const doc = await OrderModel.findOneAndUpdate(
      {
        $or: [
          { orderId: cleanId.toUpperCase() },
          { invoiceNumber: cleanId.toUpperCase() },
          ...(cleanId.match(/^[0-9a-fA-F]{24}$/) ? [{ _id: cleanId }] : []),
        ],
      },
      {
        $set: updateObj,
        ...(paymentData.status === "Paid"
          ? {
              $push: {
                statusHistory: {
                  status: "Payment Confirmed",
                  timestamp: new Date(),
                  comment: `Payment received successfully via ${paymentData.method || "Razorpay"} (Txn: ${paymentData.razorpayPaymentId || "N/A"})`,
                  updatedBy: "Razorpay Gateway",
                },
              },
            }
          : {}),
      },
      { returnDocument: "after" }
    ).lean();

    if (doc) return formatOrderDoc(doc);
  } catch (err) {
    console.warn("DB updateOrderPayment error:", err);
  }

  const orders = await readFileOrders();
  const idx = orders.findIndex(
    (o) =>
      o.id === cleanId ||
      o.orderId.toLowerCase() === cleanId.toLowerCase() ||
      o.invoiceNumber.toLowerCase() === cleanId.toLowerCase()
  );
  if (idx !== -1) {
    orders[idx].payment = {
      ...orders[idx].payment,
      ...paymentData,
    };
    if (paymentData.status === "Paid") {
      orders[idx].orderStatus = "Payment Confirmed";
      orders[idx].statusHistory = orders[idx].statusHistory || [];
      orders[idx].statusHistory.push({
        status: "Payment Confirmed",
        timestamp: new Date(),
        comment: `Payment received successfully via ${paymentData.method || "Razorpay"}`,
        updatedBy: "Razorpay Gateway",
      });
    }
    orders[idx].updatedAt = new Date().toISOString();
    await writeFileOrders(orders);
    return orders[idx];
  }

  return null;
}

export async function deleteOrder(identifier: string): Promise<boolean> {
  const cleanId = decodeURIComponent(identifier).trim();
  let deletedFromDb = false;

  try {
    await connectToDatabase();
    const res = await OrderModel.findOneAndDelete({
      $or: [
        { orderId: cleanId.toUpperCase() },
        { invoiceNumber: cleanId.toUpperCase() },
        ...(cleanId.match(/^[0-9a-fA-F]{24}$/) ? [{ _id: cleanId }] : []),
      ],
    });
    if (res) deletedFromDb = true;
  } catch (err) {
    console.warn("DB deleteOrder error:", err);
  }

  const orders = await readFileOrders();
  const initialLength = orders.length;
  const filtered = orders.filter(
    (o) =>
      o.id !== cleanId &&
      o.orderId.toLowerCase() !== cleanId.toLowerCase() &&
      o.invoiceNumber.toLowerCase() !== cleanId.toLowerCase()
  );

  if (filtered.length !== initialLength) {
    await writeFileOrders(filtered);
    return true;
  }

  return deletedFromDb;
}

function formatOrderDoc(doc: any): OrderRecord {
  return {
    id: doc._id ? doc._id.toString() : doc.orderId,
    orderId: doc.orderId,
    invoiceNumber: doc.invoiceNumber,
    userId: doc.userId || "",
    customer: {
      name: doc.customer?.name || "",
      email: doc.customer?.email || "",
      phone: doc.customer?.phone || "",
      address: doc.customer?.address || "",
      city: doc.customer?.city || "",
      state: doc.customer?.state || "",
      pincode: doc.customer?.pincode || "",
      landmark: doc.customer?.landmark || "",
    },
    items: Array.isArray(doc.items)
      ? doc.items.map((it: any) => ({
          productId: it.productId,
          code: it.code,
          name: it.name,
          price: it.price,
          originalPrice: it.originalPrice,
          quantity: it.quantity,
          image: it.image || "",
          total: it.total,
        }))
      : [],
    subtotal: doc.subtotal || 0,
    shippingFee: doc.shippingFee || 0,
    tax: doc.tax || 0,
    total: doc.total || 0,
    payment: {
      method: doc.payment?.method || "Razorpay",
      status: doc.payment?.status || "Pending",
      razorpayOrderId: doc.payment?.razorpayOrderId,
      razorpayPaymentId: doc.payment?.razorpayPaymentId,
      razorpaySignature: doc.payment?.razorpaySignature,
      paidAt: doc.payment?.paidAt ? new Date(doc.payment.paidAt) : undefined,
    },
    orderStatus: doc.orderStatus || "Order Placed",
    statusHistory: Array.isArray(doc.statusHistory)
      ? doc.statusHistory.map((sh: any) => ({
          status: sh.status,
          timestamp: sh.timestamp ? new Date(sh.timestamp) : new Date(),
          comment: sh.comment,
          updatedBy: sh.updatedBy,
        }))
      : [],
    notes: doc.notes,
    trackingNumber: doc.trackingNumber,
    courierName: doc.courierName,
    createdAt: doc.createdAt
      ? new Date(doc.createdAt).toISOString()
      : new Date().toISOString(),
    updatedAt: doc.updatedAt
      ? new Date(doc.updatedAt).toISOString()
      : new Date().toISOString(),
  };
}
