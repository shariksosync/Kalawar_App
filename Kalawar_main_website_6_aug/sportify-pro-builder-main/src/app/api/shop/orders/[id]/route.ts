import { NextRequest, NextResponse } from "next/server";
import {
  getOrderById,
  updateOrderStatus,
  updateOrderPayment,
  deleteOrder,
} from "@/lib/orders-store";
import { isAdminRequest } from "@/lib/admin-auth";
import { sendOrderStatusUpdateEmail } from "@/lib/email-service";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const order = await getOrderById(id);
    if (!order) {
      return NextResponse.json(
        { success: false, error: "Order not found" },
        { status: 404 }
      );
    }
    return NextResponse.json({ success: true, order });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to fetch order" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const isAdmin = await isAdminRequest();

    if (body.orderStatus) {
      if (!isAdmin) {
        return NextResponse.json(
          { error: "Unauthorized: Admin access required to update order status" },
          { status: 401 }
        );
      }

      const updated = await updateOrderStatus(
        id,
        body.orderStatus,
        body.comment,
        body.updatedBy || "Admin",
        body.courierName,
        body.trackingNumber
      );
      if (!updated) {
        return NextResponse.json({ error: "Order not found" }, { status: 404 });
      }

      // Send Order Status & Courier Tracking Update Email to Customer
      if (updated.customer?.email) {
        try {
          await sendOrderStatusUpdateEmail(
            updated.customer.email,
            updated.customer.name,
            updated.orderId,
            updated.orderStatus,
            body.courierName || updated.courierName,
            body.trackingNumber || updated.trackingNumber,
            body.comment
          );
        } catch (emailErr) {
          console.warn("Order status update email note:", emailErr);
        }
      }

      return NextResponse.json({ success: true, order: updated });
    }

    if (body.payment) {
      const updated = await updateOrderPayment(id, body.payment);
      if (!updated) {
        return NextResponse.json({ error: "Order not found" }, { status: 404 });
      }
      return NextResponse.json({ success: true, order: updated });
    }

    return NextResponse.json({ error: "No valid update field provided" }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to update order" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const isAdmin = await isAdminRequest();

    if (!isAdmin) {
      return NextResponse.json(
        { success: false, error: "Unauthorized: Admin access required" },
        { status: 401 }
      );
    }

    const success = await deleteOrder(id);
    if (!success) {
      return NextResponse.json(
        { success: false, error: "Order not found or could not be deleted" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, message: `Order ${id} deleted successfully` });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to delete order" },
      { status: 500 }
    );
  }
}
