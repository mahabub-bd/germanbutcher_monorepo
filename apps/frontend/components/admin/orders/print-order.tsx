"use client";

import { formatCurrencyEnglish, formatDateTime } from "@/lib/utils";
import type { Order } from "@/utils/types";
import {
  Document,
  Image,
  Page,
  PDFDownloadLink,
  StyleSheet,
  Text,
  View,
} from "@react-pdf/renderer";

interface PrintOrderProps {
  order: Order;
}

// PDF Styles
const styles = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 10,
    padding: 30,
    lineHeight: 1.4,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 20,
    paddingBottom: 15,
    borderBottom: "1 solid #ddd",
  },
  logo: {
    width: 80,
    height: 80,
  },
  companyInfo: {
    flex: 1,
    paddingHorizontal: 20,
  },
  companyName: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 10,
    color: "#666",
  },
  orderInfo: {
    alignItems: "flex-end",
  },
  orderNumber: {
    fontSize: 12,
    fontWeight: "bold",
    marginBottom: 2,
  },
  orderDate: {
    fontSize: 9,
    color: "#666",
    marginBottom: 4,
  },
  orderStatus: {
    fontSize: 10,
    fontWeight: "bold",
    textTransform: "uppercase",
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "bold",
    marginBottom: 6,
    color: "#333",
  },
  twoColumns: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  column: {
    flex: 1,
    paddingRight: 20,
  },
  customerInfo: {
    fontSize: 10,
    lineHeight: 1.4,
  },
  customerName: {
    fontWeight: "bold",
    marginBottom: 2,
  },
  table: {
    display: "flex",
    width: "100%",
    borderStyle: "solid",
    borderWidth: 1,
    borderColor: "#ddd",
    marginBottom: 12,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
    borderBottomStyle: "solid",
    alignItems: "center",
    minHeight: 24,
  },
  tableHeader: {
    backgroundColor: "#f5f5f5",
    fontWeight: "bold",
  },
  tableCol1: {
    width: "40%",
    padding: 6,
    borderRightWidth: 1,
    borderRightColor: "#ddd",
    borderRightStyle: "solid",
  },
  tableCol2: {
    width: "15%",
    padding: 6,
    textAlign: "center",
    borderRightWidth: 1,
    borderRightColor: "#ddd",
    borderRightStyle: "solid",
  },
  tableCol3: {
    width: "20%",
    padding: 6,
    textAlign: "right",
    borderRightWidth: 1,
    borderRightColor: "#ddd",
    borderRightStyle: "solid",
  },
  tableCol4: {
    width: "25%",
    padding: 6,
    textAlign: "right",
  },
  productName: {
    fontWeight: "bold",
    marginBottom: 2,
  },
  productSku: {
    fontSize: 8,
    color: "#666",
  },
  summaryContainer: {
    alignSelf: "flex-end",
    width: 250,
    marginTop: 10,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 3,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    borderBottomStyle: "solid",
  },
  summaryTotal: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
    borderTopWidth: 2,
    borderTopColor: "#333",
    borderTopStyle: "solid",
    fontWeight: "bold",
  },
  discountText: {
    color: "#dc2626",
  },
  dueAmount: {
    fontWeight: "bold",
  },
  footer: {
    position: "absolute",
    bottom: 30,
    left: 30,
    right: 30,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#ddd",
    borderTopStyle: "solid",
    fontSize: 8,
    color: "#666",
  },
});

// PDF Document Component
const OrderPDF = ({ order }: { order: Order }) => {
  const calculateSubtotal = () => {
    return order.items.reduce((total, item) => {
      return total + item.product.sellingPrice * item.quantity;
    }, 0);
  };

  const subtotal = calculateSubtotal();
  const shippingCost = Number(order.shippingMethod?.cost || 0);
  const total = order.totalValue;
  const paidAmount = order.paidAmount || 0;

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "pending":
        return "#d97706";
      case "processing":
        return "#2563eb";
      case "shipped":
        return "#7c3aed";
      case "delivered":
        return "#16a34a";
      case "cancelled":
        return "#dc2626";
      default:
        return "#4b5563";
    }
  };

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Image style={styles.logo} src="../../../public/images/logo.webp" />
          </View>
          <View style={styles.companyInfo}>
            <Text style={styles.companyName}>German Butcher</Text>
            <Text style={styles.subtitle}>Order Invoice</Text>
          </View>
          <View style={styles.orderInfo}>
            <Text style={styles.orderNumber}>Order #{order.orderNo}</Text>
            <Text style={styles.orderDate}>
              {formatDateTime(order.createdAt)}
            </Text>
            <Text
              style={[
                styles.orderStatus,
                { color: getStatusColor(order.orderStatus) },
              ]}
            >
              {order.orderStatus.toUpperCase()}
            </Text>
          </View>
        </View>

        {/* Customer & Shipping Info */}
        <View style={styles.twoColumns}>
          <View style={styles.column}>
            <Text style={styles.sectionTitle}>Customer Information</Text>
            <View style={styles.customerInfo}>
              <Text style={styles.customerName}>{order.user.name}</Text>
              <Text>{order.user.email}</Text>
              <Text>{order.user.mobileNumber}</Text>
            </View>
          </View>
          <View style={styles.column}>
            <Text style={styles.sectionTitle}>Shipping Address</Text>
            <View style={styles.customerInfo}>
              <Text>{order.address.address}</Text>
              <Text>
                {order.address.area}, {order.address.city}
              </Text>
              <Text>{order.address.division}</Text>
            </View>
          </View>
        </View>

        {/* Order Items */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Order Items</Text>
          <View style={styles.table}>
            {/* Table Header */}
            <View style={[styles.tableRow, styles.tableHeader]}>
              <View style={styles.tableCol1}>
                <Text>Product</Text>
              </View>
              <View style={styles.tableCol2}>
                <Text>Qty</Text>
              </View>
              <View style={styles.tableCol3}>
                <Text>Price</Text>
              </View>
              <View style={styles.tableCol4}>
                <Text>Total</Text>
              </View>
            </View>

            {/* Table Rows */}
            {order.items.map((item) => (
              <View style={styles.tableRow} key={item.id}>
                <View style={styles.tableCol1}>
                  <Text style={styles.productName}>{item.product.name}</Text>
                  <Text style={styles.productSku}>
                    SKU: {item.product.productSku}
                  </Text>
                </View>
                <View style={styles.tableCol2}>
                  <Text>{item.quantity}</Text>
                </View>
                <View style={styles.tableCol3}>
                  <Text>
                    {formatCurrencyEnglish(item.product.sellingPrice)}
                  </Text>
                </View>
                <View style={styles.tableCol4}>
                  <Text style={{ fontWeight: "bold" }}>
                    {formatCurrencyEnglish(
                      item.product.sellingPrice * item.quantity
                    )}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Order Summary */}
        <View style={styles.summaryContainer}>
          <View style={styles.summaryRow}>
            <Text>Subtotal:</Text>
            <Text>{formatCurrencyEnglish(subtotal)}</Text>
          </View>

          {order.totalDiscount > 0 && (
            <View style={styles.summaryRow}>
              <Text style={styles.discountText}>Discount:</Text>
              <Text style={styles.discountText}>
                -{formatCurrencyEnglish(order.totalDiscount)}
              </Text>
            </View>
          )}

          <View style={styles.summaryRow}>
            <Text>Shipping ({order.shippingMethod?.name}):</Text>
            <Text>{formatCurrencyEnglish(shippingCost)}</Text>
          </View>

          <View style={styles.summaryTotal}>
            <Text>Total:</Text>
            <Text>{formatCurrencyEnglish(total)}</Text>
          </View>

          <View style={styles.summaryRow}>
            <Text>Paid Amount:</Text>
            <Text>{formatCurrencyEnglish(paidAmount)}</Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.dueAmount}>Due Amount:</Text>
            <Text
              style={[
                styles.dueAmount,
                { color: paidAmount >= total ? "#16a34a" : "#dc2626" },
              ]}
            >
              {formatCurrencyEnglish(Math.max(0, total - paidAmount))}
            </Text>
          </View>
        </View>

        {/* Payment Information */}
        <View style={styles.twoColumns}>
          <View style={styles.column}>
            <Text style={styles.sectionTitle}>Payment Details</Text>
            <View style={styles.customerInfo}>
              <Text>Method: {order.paymentMethod?.name || "N/A"}</Text>
              <Text>
                Status:{" "}
                <Text style={{ color: getStatusColor(order.paymentStatus) }}>
                  {order.paymentStatus}
                </Text>
              </Text>
            </View>
          </View>
          <View style={styles.column}>
            <Text style={styles.sectionTitle}>Order Summary</Text>
            <View style={styles.customerInfo}>
              <Text>
                Items: {order.items.length} product
                {order.items.length !== 1 ? "s" : ""}
              </Text>
              <Text>
                Total Quantity:{" "}
                {order.items.reduce((sum, item) => sum + item.quantity, 0)}
              </Text>
            </View>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text>
            Printed on: {new Date().toLocaleDateString()} at{" "}
            {new Date().toLocaleTimeString()}
          </Text>
          <Text>German Butcher - Premium Quality Meats</Text>
        </View>
      </Page>
    </Document>
  );
};

// Main Component with Download Button
export function PrintOrder({ order }: PrintOrderProps) {
  return (
    <div className="print-order-container">
      <div className="max-w-4xl mx-auto p-6 bg-white">
        {/* Preview Section */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            Order Invoice Preview
          </h2>
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="font-semibold">Order #:</span> {order.orderNo}
              </div>
              <div>
                <span className="font-semibold">Customer:</span>{" "}
                {order.user.name}
              </div>
              <div>
                <span className="font-semibold">Total:</span>{" "}
                {formatCurrencyEnglish(order.totalValue)}
              </div>
            </div>
          </div>
        </div>

        {/* Download Button */}
        <div className="flex justify-center space-x-4">
          <PDFDownloadLink
            document={<OrderPDF order={order} />}
            fileName={`order-${order.orderNo}.pdf`}
          >
            {({ loading }) => (
              <button
                className={`px-6 py-3 rounded-lg font-medium text-white transition-colors ${
                  loading
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-blue-600 hover:bg-blue-700"
                }`}
                disabled={loading}
              >
                {loading ? "Generating PDF..." : "Download PDF"}
              </button>
            )}
          </PDFDownloadLink>

          {/* Alternative: View in Browser */}
          <PDFDownloadLink
            document={<OrderPDF order={order} />}
            fileName={`order-${order.orderNo}.pdf`}
          >
            {({ url, loading }) => (
              <button
                className={`px-6 py-3 rounded-lg font-medium border transition-colors ${
                  loading
                    ? "border-gray-300 text-gray-400 cursor-not-allowed"
                    : "border-gray-300 text-gray-700 hover:bg-gray-50"
                }`}
                disabled={loading}
                onClick={(e) => {
                  if (url) {
                    e.preventDefault();
                    window.open(url, "_blank");
                  }
                }}
              >
                {loading ? "Generating..." : "View PDF"}
              </button>
            )}
          </PDFDownloadLink>
        </div>

        {/* Order Details Summary */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold text-gray-800 mb-3">
              Customer Information
            </h3>
            <div className="space-y-1 text-sm">
              <p>
                <span className="font-medium">Name:</span> {order.user.name}
              </p>
              <p>
                <span className="font-medium">Email:</span> {order.user.email}
              </p>
              <p>
                <span className="font-medium">Phone:</span>{" "}
                {order.user.mobileNumber}
              </p>
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold text-gray-800 mb-3">Order Status</h3>
            <div className="space-y-1 text-sm">
              <p>
                <span className="font-medium">Order Status:</span>
                <span
                  className={`ml-2 px-2 py-1 rounded text-xs font-medium ${
                    order.orderStatus.toLowerCase() === "delivered"
                      ? "bg-green-100 text-green-800"
                      : order.orderStatus.toLowerCase() === "pending"
                        ? "bg-yellow-100 text-yellow-800"
                        : order.orderStatus.toLowerCase() === "cancelled"
                          ? "bg-red-100 text-red-800"
                          : "bg-blue-100 text-blue-800"
                  }`}
                >
                  {order.orderStatus}
                </span>
              </p>
              <p>
                <span className="font-medium">Payment Status:</span>{" "}
                {order.paymentStatus}
              </p>
              <p>
                <span className="font-medium">Date:</span>{" "}
                {formatDateTime(order.createdAt)}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
