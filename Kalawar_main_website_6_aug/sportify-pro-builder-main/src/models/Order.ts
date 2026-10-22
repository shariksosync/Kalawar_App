import mongoose, { Schema, Document, Model } from "mongoose";

export interface IOrderItem {
  productId: string;
  code: string;
  name: string;
  price: number;
  originalPrice?: number;
  quantity: number;
  image?: string;
  total: number;
}

export interface ICustomerInfo {
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  landmark?: string;
}

export interface IPaymentInfo {
  method: "Razorpay" | "UPI" | "Card" | "NetBanking" | "COD" | "Test Gateway";
  status: "Pending" | "Paid" | "Failed" | "Refunded";
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  razorpaySignature?: string;
  paidAt?: Date;
}

export interface IOrderStatusHistory {
  status: string;
  timestamp: Date;
  comment?: string;
  updatedBy?: string;
}

export interface IOrder extends Document {
  orderId: string; // e.g. ORD-2026-0001
  invoiceNumber: string; // e.g. INV-2026-0001
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
  createdAt: Date;
  updatedAt: Date;
}

const OrderItemSchema = new Schema<IOrderItem>(
  {
    productId: { type: String, required: true },
    code: { type: String, required: true },
    name: { type: String, required: true },
    price: { type: Number, required: true },
    originalPrice: { type: Number },
    quantity: { type: Number, required: true, min: 1 },
    image: { type: String },
    total: { type: Number, required: true },
  },
  { _id: false }
);

const CustomerInfoSchema = new Schema<ICustomerInfo>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    address: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    pincode: { type: String, required: true },
    landmark: { type: String },
  },
  { _id: false }
);

const PaymentInfoSchema = new Schema<IPaymentInfo>(
  {
    method: { type: String, default: "Razorpay" },
    status: {
      type: String,
      enum: ["Pending", "Paid", "Failed", "Refunded"],
      default: "Pending",
    },
    razorpayOrderId: { type: String },
    razorpayPaymentId: { type: String },
    razorpaySignature: { type: String },
    paidAt: { type: Date },
  },
  { _id: false }
);

const StatusHistorySchema = new Schema<IOrderStatusHistory>(
  {
    status: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
    comment: { type: String },
    updatedBy: { type: String, default: "System" },
  },
  { _id: false }
);

const OrderSchema = new Schema<IOrder>(
  {
    orderId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    invoiceNumber: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    userId: { type: String, index: true },
    customer: { type: CustomerInfoSchema, required: true },
    items: { type: [OrderItemSchema], required: true },
    subtotal: { type: Number, required: true },
    shippingFee: { type: Number, default: 0 },
    tax: { type: Number, default: 0 },
    total: { type: Number, required: true },
    payment: { type: PaymentInfoSchema, required: true },
    orderStatus: {
      type: String,
      enum: [
        "Order Placed",
        "Payment Confirmed",
        "Processing",
        "Shipped",
        "Delivered",
        "Cancelled",
      ],
      default: "Order Placed",
      index: true,
    },
    statusHistory: { type: [StatusHistorySchema], default: [] },
    notes: { type: String },
    trackingNumber: { type: String },
    courierName: { type: String },
  },
  {
    timestamps: true,
  }
);

export const OrderModel: Model<IOrder> =
  mongoose.models.Order || mongoose.model<IOrder>("Order", OrderSchema);
