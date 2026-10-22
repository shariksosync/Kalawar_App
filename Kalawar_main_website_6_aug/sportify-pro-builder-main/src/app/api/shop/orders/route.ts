import { NextRequest, NextResponse } from "next/server";
import { getOrders, createOrder } from "@/lib/orders-store";
import { isAdminRequest } from "@/lib/admin-auth";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId") || undefined;
    const email = searchParams.get("email") || undefined;
    const status = searchParams.get("status") || undefined;
    const search = searchParams.get("search") || undefined;

    const isAdmin = await isAdminRequest();

    // If not admin, restrict querying to specific userId or email
    if (!isAdmin && !userId && !email) {
      return NextResponse.json(
        { error: "Authentication required to view all orders" },
        { status: 401 }
      );
    }

    const orders = await getOrders({ userId, email, status, search });
    return NextResponse.json({ success: true, orders });
  } catch (error: any) {
    console.error("Error fetching orders:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to fetch orders" },
      { status: 500 }
    );
  }
}

import { validatePhoneNumber } from "@/lib/validation";
import { sendOrderConfirmationEmail } from "@/lib/email-service";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.customer || !body.items || body.items.length === 0) {
      return NextResponse.json(
        { error: "Customer details and order items are required" },
        { status: 400 }
      );
    }

    if (body.customer.phone) {
      const phoneVal = validatePhoneNumber(body.customer.phone, {
        required: true,
        fieldName: "Delivery mobile number",
      });
      if (!phoneVal.isValid) {
        return NextResponse.json(
          { success: false, error: phoneVal.error || "Invalid mobile number" },
          { status: 400 }
        );
      }
      body.customer.phone = phoneVal.cleaned;
    }

    const order = await createOrder(body);

    // Send Order Confirmation Email to customer
    if (order.customer?.email) {
      try {
        await sendOrderConfirmationEmail(order.customer.email, order.customer.name, {
          orderId: order.orderId,
          items: order.items.map((i: any) => ({
            title: i.name || i.title || "Product",
            price: i.unitPrice || i.price || 0,
            quantity: i.quantity || 1,
            selectedSize: i.selectedSize || i.size,
          })),
          totalAmount: order.total || 0,
          paymentMethod: order.payment?.method || "Online",
          paymentStatus: order.payment?.status || "Pending",
          shippingAddress: {
            address: order.customer.address,
            city: order.customer.city,
            state: order.customer.state,
            pincode: order.customer.pincode,
          },
        });
      } catch (emailErr) {
        console.warn("Order email delivery note:", emailErr);
      }
    }

    return NextResponse.json({ success: true, order }, { status: 201 });
  } catch (error: any) {
    console.error("Error creating order:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to create order" },
      { status: 500 }
    );
  }
}
