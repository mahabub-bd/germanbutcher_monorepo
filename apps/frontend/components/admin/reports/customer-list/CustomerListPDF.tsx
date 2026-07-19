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
  email: string;
  mobileNumber: string;
  registrationDate: string;
  orderCount: number;
  totalOrderAmount: number;
}

interface Summary {
  totalCustomers: number;
  totalOrders: number;
  totalOrderValue: number;
  from?: string;
  to?: string;
}

interface Props {
  customers: Customer[];
  summary: Summary;
  dateRange: string;
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
  dateRange: {
    fontSize: 9,
    color: "#666",
    textAlign: "center",
    marginBottom: 15,
  },

  // ----- Summary -----
  summaryBox: {
    flexDirection: "row",
    justifyContent: "space-around",
    backgroundColor: "#f9fafb",
    padding: 10,
    borderRadius: 4,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  summaryItem: { textAlign: "center", flex: 1 },
  summaryLabel: { fontSize: 8, color: "#555", marginBottom: 2 },
  summaryValue: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#8B0000",
  },

  // ----- Table -----
  table: {
    width: "100%",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    marginBottom: 10,
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
    fontSize: 8,
    textAlign: "left",
  },
  headerTextEmail: {
    flex: 1.8,
    fontWeight: "bold",
    fontSize: 8,
    textAlign: "left",
  },
  headerTextOrderCount: {
    flex: 0.6,
    fontWeight: "bold",
    fontSize: 8,
    textAlign: "left",
  },
  headerTextRight: {
    flex: 1,
    fontWeight: "bold",
    fontSize: 8,
    textAlign: "right",
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
    fontSize: 8,
  },
  cellEmail: {
    flex: 1.8,
    textAlign: "left",
    fontSize: 8,
  },
  cellOrderCount: {
    flex: 0.6,
    textAlign: "left",
    fontSize: 8,
  },
  cellRight: {
    flex: 1,
    textAlign: "right",
    fontSize: 8,
  },

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

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

export function CustomerListPDF({ customers, summary, dateRange }: Props) {
  const avgPerCustomer =
    summary.totalCustomers > 0
      ? summary.totalOrderValue / summary.totalCustomers
      : 0;

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
        <Text style={styles.reportTitle}>Customer List Report</Text>
        <Text style={styles.dateRange}>{dateRange}</Text>

        {/* Summary */}
        <View style={styles.summaryBox}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Total Customers</Text>
            <Text style={styles.summaryValue}>{summary.totalCustomers}</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Total Orders</Text>
            <Text style={styles.summaryValue}>{summary.totalOrders}</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Total Order Value</Text>
            <Text style={styles.summaryValue}>
              {formatCurrency(summary.totalOrderValue)}
            </Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Avg Per Customer</Text>
            <Text style={styles.summaryValue}>
              {formatCurrency(avgPerCustomer)}
            </Text>
          </View>
        </View>

        {/* Table Header */}
        <View style={styles.tableHeader}>
          <Text style={styles.tableHeaderText}>Customer Name</Text>
          <Text style={styles.headerTextEmail}>Email</Text>
          <Text style={styles.tableHeaderText}>Mobile</Text>
          <Text style={styles.tableHeaderText}>Registration Date</Text>
          <Text style={styles.headerTextOrderCount}>Order Count</Text>
          <Text style={styles.headerTextRight}>Total Order Amount</Text>
        </View>

        {/* Table Rows */}
        {customers.map((customer, index) => (
          <View
            key={`${customer.email}-${index}`}
            style={[styles.row, index % 2 === 0 ? styles.altRow : {}]}
          >
            <Text style={styles.cell}>{customer.name}</Text>
            <Text style={styles.cellEmail}>{customer.email}</Text>
            <Text style={styles.cell}>{customer.mobileNumber}</Text>
            <Text style={styles.cell}>{formatDate(customer.registrationDate)}</Text>
            <Text style={styles.cellOrderCount}>{customer.orderCount}</Text>
            <Text style={styles.cellRight}>
              {formatCurrency(customer.totalOrderAmount)}
            </Text>
          </View>
        ))}

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
