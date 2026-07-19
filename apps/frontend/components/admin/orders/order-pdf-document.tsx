import { formatDateTime } from "@/lib/utils";
import type { Order, OrderItem } from "@/utils/types";
import {
  Document,
  Image,
  Page,
  StyleSheet,
  Text,
  View,
} from "@react-pdf/renderer";

const formatCurrency = (amount: number): string => {
  return `BDT ${amount.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

const styles = StyleSheet.create({
  page: {
    flexDirection: "column",
    backgroundColor: "#ffffff",
    padding: 32,
    fontSize: 9,
    lineHeight: 1.25,
    color: "#333333",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
    paddingBottom: 10,
    borderBottomWidth: 2,
    borderBottomColor: "#8B0000",
  },
  logoSection: {
    flexDirection: "row",
    alignItems: "center",
  },
  logo: {
    width: 60,
    height: 60,
    marginRight: 10,
    objectFit: "contain",
  },
  companyInfo: {
    flexDirection: "column",
  },
  companyName: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#8B0000",
    marginBottom: 2,
  },
  companyAddress: {
    fontSize: 8,
    color: "#374151",
    marginTop: 2,
  },
  companyContact: {
    fontSize: 8,
    color: "#374151",
  },
  invoiceHeader: {
    alignItems: "flex-end",
  },
  invoiceTitle: {
    fontSize: 19,
    fontWeight: "bold",
    color: "#8B0000",
    marginBottom: 4,
  },
  orderDetails: {
    marginTop: 10,
    alignItems: "flex-end",
  },
  orderNumber: {
    fontSize: 10,
    color: "#333333",
    fontWeight: "bold",
    marginBottom: 2,
  },
  orderDate: {
    fontSize: 8,
    marginTop: 10,
    color: "#666666",
  },

  // Info Grid
  infoGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
    gap: 10,
  },
  infoCard: {
    flex: 1,
    backgroundColor: "#fafafa",
    padding: 9,
    borderRadius: 3,
    borderLeftWidth: 2,
    borderLeftColor: "#8B0000",
  },
  cardTitle: {
    fontSize: 9,
    fontWeight: "bold",
    color: "#8B0000",
    marginBottom: 5,
    textTransform: "uppercase",
  },
  infoRow: {
    flexDirection: "row",
    marginBottom: 2.5,
  },
  label: {
    fontSize: 7.5,
    color: "#666666",
    width: 65,
    fontWeight: "bold",
  },
  value: {
    fontSize: 8,
    color: "#333333",
    flex: 1,
  },
  // Order Status Section
  statusSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
    padding: 8,
    backgroundColor: "#f8fafc",
    borderRadius: 3,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  statusItem: {
    alignItems: "center",
    flex: 1,
  },
  statusLabel: {
    fontSize: 6.5,
    color: "#64748b",
    textTransform: "uppercase",
    marginBottom: 2.5,
    letterSpacing: 0.3,
  },
  statusValue: {
    fontSize: 8.5,
    fontWeight: "bold",
    color: "#1e293b",
  },
  // Table Section
  tableSection: {
    marginBottom: 12,
  },
  tableTitle: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#8B0000",
    marginBottom: 7,
    paddingBottom: 3,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
    textTransform: "uppercase",
  },
  table: {
    borderWidth: 1,
    borderColor: "#d1d5db",
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#8B0000",
    padding: 6,
  },
  tableHeaderText: {
    fontSize: 8,
    fontWeight: "bold",
    color: "#ffffff",
    textTransform: "uppercase",
  },
  tableRow: {
    flexDirection: "row",
    padding: 6,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
    minHeight: 30,
    alignItems: "center",
  },
  tableRowAlt: {
    backgroundColor: "#f9fafb",
  },
  tableCell: {
    fontSize: 8,
    color: "#374151",
  },
  productCell: {
    flex: 3,
    paddingRight: 6,
  },
  quantityCell: {
    flex: 0.8,
    textAlign: "center",
  },
  priceCell: {
    flex: 1.2,
    textAlign: "right",
  },
  totalCell: {
    flex: 1.2,
    textAlign: "right",
  },
  productName: {
    fontSize: 9,
    fontWeight: "bold",
    color: "#1f2937",
    marginBottom: 2,
  },
  productSku: {
    fontSize: 7,
    color: "#6b7280",
  },
  strikethrough: {
    fontSize: 7,
    color: "#9ca3af",
    textDecoration: "line-through",
  },
  // Summary Section
  summaryContainer: {
    alignSelf: "flex-end",
    width: "45%",
    marginTop: 10,
    marginBottom: 20,
  },
  summaryCard: {
    backgroundColor: "#f8fafc",
    padding: 10,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 2,
  },
  summaryLabel: {
    fontSize: 9,
    color: "#64748b",
  },
  summaryValue: {
    fontSize: 9,
    color: "#1e293b",
    fontWeight: "500",
  },
  discountValue: {
    color: "#059669",
    fontWeight: "bold",
  },
  summaryDivider: {
    height: 1,
    backgroundColor: "#cbd5e1",
    marginVertical: 6,
  },
  summaryTotal: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    paddingHorizontal: 10,
    marginTop: 5,
    backgroundColor: "#8B0000",
    borderRadius: 4,
  },
  totalLabel: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#ffffff",
  },
  totalValue: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#ffffff",
  },
  dueAmount: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
    paddingHorizontal: 10,
    marginTop: 4,
    backgroundColor: "#fef2f2",
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "#fecaca",
  },
  dueLabel: {
    fontSize: 9,
    fontWeight: "bold",
    color: "#dc2626",
  },
  dueValue: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#dc2626",
  },
  // Footer
  footer: {
    marginTop: "auto",
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
  },
  footerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  footerLeft: {
    flex: 1,
  },
  footerRight: {
    alignItems: "flex-end",
  },
  thankYou: {
    fontSize: 9,
    fontWeight: "bold",
    color: "#8B0000",
    marginBottom: 4,
  },
  contact: {
    fontSize: 7,
    color: "#6b7280",
    marginBottom: 1,
  },
  printDate: {
    fontSize: 7,
    color: "#9ca3af",
    fontStyle: "italic",
  },
});

interface OrderPDFDocumentProps {
  order: Order;
}

export const OrderPDFDocument = ({ order }: OrderPDFDocumentProps) => {
  // Calculate order summary using stored prices from OrderItem
  const calculateOrderSummary = () => {
    // Calculate subtotal from stored item prices
    const itemsSubtotal = order.items.reduce((sum, item) => {
      // Use stored totalPrice if available, otherwise fallback to calculation
      const itemTotal =
        item.totalPrice || (item.unitPrice || 0) * item.quantity;
      return sum + Number(itemTotal);
    }, 0);

    // Calculate product discount total from stored unitDiscount
    const productDiscountTotal = order.items.reduce((sum, item) => {
      const discountTotal = (item.unitDiscount || 0) * item.quantity;
      return sum + Number(discountTotal);
    }, 0);

    // Original subtotal (before product discounts)
    const originalSubtotal = itemsSubtotal + productDiscountTotal;

    // Coupon discount is total discount minus product discounts
    const couponDiscount = Number(order.totalDiscount) - productDiscountTotal;

    return {
      originalSubtotal,
      productDiscountTotal,
      couponDiscount,
      shippingCost: Number(order.shippingMethod?.cost || 0),
      total: Number(order.totalValue || 0),
      dueAmount: Math.max(
        0,
        Number(order.totalValue || 0) - Number(order.paidAmount || 0)
      ),
    };
  };

  const getStatusColor = (status: string | undefined): string => {
    if (!status) return "#4b5563";

    const colors: Record<string, string> = {
      pending: "#b45309",
      processing: "#1d4ed8",
      shipped: "#7c3aed",
      delivered: "#059669",
      cancelled: "#dc2626",
      paid: "#059669",
      unpaid: "#dc2626",
    };

    return colors[status.toLowerCase()] || "#4b5563";
  };

  const orderSummary = calculateOrderSummary();

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header with Logo */}
        <View style={styles.header}>
          <View style={styles.logoSection}>
            <Image style={styles.logo} src="/images/logo3.png" />
            <View style={styles.companyInfo}>
              <Text style={styles.companyName}>German Butcher</Text>
              <Text style={styles.companyAddress}>
                House-56/B, Road-132, Gulshan-1, Dhaka
              </Text>
              <Text style={styles.companyContact}>Mobile: 01404-009000</Text>
            </View>
          </View>
          <View style={styles.invoiceHeader}>
            <Text style={styles.invoiceTitle}>INVOICE</Text>
            <View style={styles.orderDetails}>
              <Text style={styles.orderNumber}>Order #{order.orderNo}</Text>
              <Text style={styles.orderDate}>
                {formatDateTime(order.createdAt)}
              </Text>
            </View>
          </View>
        </View>

        {/* Customer & Shipping Info Cards */}
        <View style={styles.infoGrid}>
          <View style={styles.infoCard}>
            <Text style={styles.cardTitle}>Customer Information</Text>
            <View style={styles.infoRow}>
              <Text style={styles.label}>Name:</Text>
              <Text style={styles.value}>{order.user?.name || "N/A"}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.label}>Email:</Text>
              <Text style={styles.value}>{order.user?.email || "N/A"}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.label}>Phone:</Text>
              <Text style={styles.value}>
                {order.user?.mobileNumber || "N/A"}
              </Text>
            </View>
          </View>
          <View style={styles.infoCard}>
            <Text style={styles.cardTitle}>Shipping Address</Text>
            <View style={styles.infoRow}>
              <Text style={styles.label}>Address:</Text>
              <Text style={styles.value}>
                {order.address?.address || "N/A"}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.label}>Area/City:</Text>
              <Text style={styles.value}>
                {order.address?.area || "N/A"}, {order.address?.city || "N/A"}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.label}>Division:</Text>
              <Text style={styles.value}>
                {order.address?.division || "N/A"}
              </Text>
            </View>
          </View>
        </View>

        {/* Status Overview */}
        <View style={styles.statusSection}>
          <View style={styles.statusItem}>
            <Text style={styles.statusLabel}>Order Status</Text>
            <Text
              style={[
                styles.statusValue,
                { color: getStatusColor(order.orderStatus) },
              ]}
            >
              {(order.orderStatus || "PENDING").toUpperCase()}
            </Text>
          </View>
          <View style={styles.statusItem}>
            <Text style={styles.statusLabel}>Payment Status</Text>
            <Text
              style={[
                styles.statusValue,
                { color: getStatusColor(order.paymentStatus) },
              ]}
            >
              {(order.paymentStatus || "UNPAID").toUpperCase()}
            </Text>
          </View>
          <View style={styles.statusItem}>
            <Text style={styles.statusLabel}>Payment Method</Text>
            <Text style={styles.statusValue}>
              {order.paymentMethod?.name || "N/A"}
            </Text>
          </View>
          <View style={styles.statusItem}>
            <Text style={styles.statusLabel}>Total Items</Text>
            <Text style={styles.statusValue}>
              {order.items?.reduce(
                (sum, item) => sum + (item.quantity || 0),
                0
              ) || 0}
            </Text>
          </View>
        </View>

        {/* Items Table */}
        <View style={styles.tableSection}>
          <Text style={styles.tableTitle}>Order Items</Text>
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderText, styles.productCell]}>
                Product Details
              </Text>
              <Text style={[styles.tableHeaderText, styles.quantityCell]}>
                Qty
              </Text>
              <Text style={[styles.tableHeaderText, styles.priceCell]}>
                Unit Price
              </Text>
              <Text style={[styles.tableHeaderText, styles.totalCell]}>
                Total
              </Text>
            </View>
            {order.items?.map((item: OrderItem, index: number) => {
              // Use stored prices from OrderItem
              const unitPrice =
                Number(item.unitPrice) ||
                Number(item.product?.sellingPrice) ||
                0;
              const totalPrice =
                Number(item.totalPrice) ||
                unitPrice * (Number(item.quantity) || 0);
              const unitDiscount = Number(item.unitDiscount) || 0;
              const hasDiscount = unitDiscount > 0;
              const originalPrice = unitPrice + unitDiscount;

              return (
                <View key={item.id || index} style={[styles.tableRow]}>
                  <View style={[styles.tableCell, styles.productCell]}>
                    <Text style={styles.productName}>
                      {item.product?.name || "N/A"}
                    </Text>
                    {item.product?.weight && (
                      <Text style={styles.productSku}>
                        {Number(item.product.weight) % 1 === 0
                          ? Math.floor(Number(item.product.weight))
                          : item.product.weight}{" "}
                        {item.product.unit?.name?.toLowerCase() || ""}
                      </Text>
                    )}

                    <Text style={styles.productSku}>
                      SKU: {item.product?.productSku || "N/A"}
                    </Text>
                  </View>
                  <Text style={[styles.tableCell, styles.quantityCell]}>
                    {item.quantity || 0}
                  </Text>
                  <View style={[styles.tableCell, styles.priceCell]}>
                    {hasDiscount && (
                      <Text style={styles.strikethrough}>
                        {formatCurrency(originalPrice)}
                      </Text>
                    )}
                    <Text>{formatCurrency(unitPrice)}</Text>
                  </View>
                  <Text
                    style={[
                      styles.tableCell,
                      styles.totalCell,
                      { fontWeight: "bold" },
                    ]}
                  >
                    {formatCurrency(totalPrice)}
                  </Text>
                </View>
              );
            }) || []}
          </View>
        </View>

        {/* Order Summary */}
        <View style={styles.summaryContainer}>
          <View style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Subtotal:</Text>
              <Text style={styles.summaryValue}>
                {formatCurrency(orderSummary.originalSubtotal)}
              </Text>
            </View>
            {orderSummary.productDiscountTotal > 0 && (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Product Discounts:</Text>
                <Text style={[styles.summaryValue, styles.discountValue]}>
                  -{formatCurrency(orderSummary.productDiscountTotal)}
                </Text>
              </View>
            )}
            {order.coupon && orderSummary.couponDiscount > 0 && (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>
                  Coupon ({order.coupon.code}):
                </Text>
                <Text style={[styles.summaryValue, styles.discountValue]}>
                  -{formatCurrency(orderSummary.couponDiscount)}
                </Text>
              </View>
            )}
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>
                Shipping ({order.shippingMethod?.name || "Standard"}):
              </Text>
              <Text style={styles.summaryValue}>
                {formatCurrency(orderSummary.shippingCost)}
              </Text>
            </View>
            <View style={styles.summaryDivider} />
          </View>
          <View style={styles.summaryTotal}>
            <Text style={styles.totalLabel}>TOTAL AMOUNT</Text>
            <Text style={styles.totalValue}>
              {formatCurrency(orderSummary.total)}
            </Text>
          </View>
          {orderSummary.dueAmount > 0 && (
            <View style={styles.dueAmount}>
              <Text style={styles.dueLabel}>AMOUNT DUE</Text>
              <Text style={styles.dueValue}>
                {formatCurrency(orderSummary.dueAmount)}
              </Text>
            </View>
          )}
        </View>

        {/* Footer - Now flows naturally with content */}
        <View style={styles.footer}>
          <View style={styles.footerContent}>
            <View style={styles.footerLeft}>
              <Text style={styles.thankYou}>
                Thank you for choosing German Butcher
              </Text>
              <Text style={styles.contact}>
                Email: support@germanbutcherbd.com
              </Text>
              <Text style={styles.contact}>Phone: +8809666791991</Text>
              <Text style={styles.contact}>Web: www.germanbutcherbd.com</Text>
            </View>
            <View style={styles.footerRight}>
              <Text style={styles.printDate}>
                Generated: {new Date().toLocaleDateString()}{" "}
                {new Date().toLocaleTimeString()}
              </Text>
            </View>
          </View>
        </View>
      </Page>
    </Document>
  );
};
