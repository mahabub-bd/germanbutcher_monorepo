"use client";

import {
  Document,
  Image,
  Page,
  StyleSheet,
  Text,
  View,
} from "@react-pdf/renderer";

interface Customer {
  name: string;
  mobileNumber: string;
  email: string;
}
interface ShippingAddress {
  address: string;
  area: string;
  city: string;
  division: string;
}
interface OrderItem {
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}
interface Order {
  orderNo: string;
  orderStatus: string;
  paymentStatus: string;
  totalValue: number;
  totalDiscount: number;
  paidAmount: number;
  orderDate: string;
  customer: Customer;
  shippingAddress: ShippingAddress;
  shippingMethod: string;
  paymentMethod: string;
  items: OrderItem[];
}

interface Props {
  orders: Order[];
}

const styles = StyleSheet.create({
  page: { padding: 30, fontSize: 10, fontFamily: "Helvetica", color: "#111" },

  // ----- Header -----
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottom: 1,
    borderColor: "#8B0000",
    paddingBottom: 10,
    marginBottom: 10,
  },
  logo: { width: 55, height: 55 },
  companyInfo: { flexDirection: "column" },
  companyName: { fontSize: 14, fontWeight: "bold", color: "#8B0000" },
  companyAddress: { fontSize: 9, marginTop: 2 },
  reportTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#8B0000",
    textAlign: "center",
    marginBottom: 8,
  },

  // ----- Table -----
  table: {
    width: "100%",
    marginTop: 10,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#8B0000",
    color: "#fff",
    paddingVertical: 6,
    paddingHorizontal: 4,
  },
  tableHeaderText: {
    flex: 1,
    fontWeight: "bold",
    fontSize: 9,
    textAlign: "left",
  },
  row: {
    flexDirection: "row",
    borderBottom: 1,
    borderColor: "#f3f4f6",
    paddingVertical: 5,
    paddingHorizontal: 4,
  },
  altRow: { backgroundColor: "#f9fafb" },
  cell: {
    flex: 1,
    textAlign: "left",
    fontSize: 8.5,
    textTransform: "capitalize",
  },

  // ----- Summary -----
  summarySection: {
    marginTop: 15,
    paddingTop: 10,
    borderTop: 1,
    borderColor: "#e5e7eb",
    flexDirection: "row",
    justifyContent: "space-around",
  },
  summaryBox: { textAlign: "center" },
  summaryLabel: { fontSize: 9, color: "#555" },
  summaryValue: { fontSize: 12, fontWeight: "bold", color: "#8B0000" },

  // ----- Footer -----
  footer: {
    position: "absolute",
    bottom: 20,
    left: 30,
    right: 30,
    borderTop: 1,
    borderColor: "#e5e7eb",
    paddingTop: 5,
    textAlign: "center",
    fontSize: 8,
    color: "#6b7280",
  },
  footerHighlight: { color: "#8B0000", fontWeight: "bold" },
});

const formatCurrency = (num: number) =>
  num?.toLocaleString("en-BD", {
    style: "currency",
    currency: "BDT",
    minimumFractionDigits: 2,
  });

export function OrderReportPDF({ orders }: Props) {
  const totalValue = orders.reduce((a, b) => a + b.totalValue, 0);
  const totalDiscount = orders.reduce((a, b) => a + b.totalDiscount, 0);
  const totalPaid = orders.reduce((a, b) => a + b.paidAmount, 0);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.companyInfo}>
            <Text style={styles.companyName}>German Butcher</Text>
            <Text style={styles.companyAddress}>
              House-56/B, Road-132, Gulshan-1, Dhaka
            </Text>
            <Text style={styles.companyAddress}>Mobile: 01404-009000</Text>
            <Text style={styles.companyAddress}>www.germanbutcherbd.com</Text>
          </View>
          <Image style={styles.logo} src="/images/logo3.png" />
        </View>

        {/* Title */}
        <Text style={styles.reportTitle}>Order Summary Report</Text>

        {/* Table Header */}
        <View style={styles.tableHeader}>
          <Text style={[styles.tableHeaderText, { flex: 0.5 }]}>#</Text>
          <Text style={styles.tableHeaderText}>Order No</Text>
          <Text style={styles.tableHeaderText}>Status</Text>
          <Text style={styles.tableHeaderText}>Payment</Text>
          <Text style={styles.tableHeaderText}>Total</Text>
          <Text style={styles.tableHeaderText}>Discount</Text>
          <Text style={styles.tableHeaderText}>Paid</Text>
        </View>

        {/* Table Rows */}
        {orders.map((o, i) => (
          <View
            key={o.orderNo}
            style={[styles.row, i % 2 === 0 ? styles.altRow : {}]}
          >
            <Text style={[styles.cell, { flex: 0.5 }]}>{i + 1}</Text>
            <Text style={styles.cell}>{o.orderNo}</Text>
            <Text style={styles.cell}>{o.orderStatus}</Text>
            <Text style={styles.cell}>{o.paymentStatus}</Text>
            <Text style={styles.cell}>{formatCurrency(o.totalValue)}</Text>
            <Text style={styles.cell}>{formatCurrency(o.totalDiscount)}</Text>
            <Text style={styles.cell}>{formatCurrency(o.paidAmount)}</Text>
          </View>
        ))}

        {/* Summary */}
        <View style={styles.summarySection}>
          <View style={styles.summaryBox}>
            <Text style={styles.summaryLabel}>Total Orders</Text>
            <Text style={styles.summaryValue}>{orders.length}</Text>
          </View>
          <View style={styles.summaryBox}>
            <Text style={styles.summaryLabel}>Total Value</Text>
            <Text style={styles.summaryValue}>
              {formatCurrency(totalValue)}
            </Text>
          </View>
          <View style={styles.summaryBox}>
            <Text style={styles.summaryLabel}>Total Discount</Text>
            <Text style={styles.summaryValue}>
              {formatCurrency(totalDiscount)}
            </Text>
          </View>
          <View style={styles.summaryBox}>
            <Text style={styles.summaryLabel}>Total Paid</Text>
            <Text style={styles.summaryValue}>{formatCurrency(totalPaid)}</Text>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text>
            Generated on{" "}
            {new Date().toLocaleString("en-BD", {
              dateStyle: "medium",
              timeStyle: "short",
            })}{" "}
            | © {new Date().getFullYear()}{" "}
            <Text style={styles.footerHighlight}>German Butcher</Text> — All
            Rights Reserved
          </Text>
        </View>
      </Page>
    </Document>
  );
}
