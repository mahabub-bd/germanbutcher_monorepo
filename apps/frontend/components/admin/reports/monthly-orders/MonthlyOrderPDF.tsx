"use client";

import {
  Document,
  Image,
  Page,
  StyleSheet,
  Text,
  View,
} from "@react-pdf/renderer";

interface MonthlyData {
  year: number;
  month: string;
  allOrderCount: number;
  allOrderValue: number;
  orderCount: number;
  totalValue: number;
  cancelOrderCount: number;
  cancelValue: number;
}

interface Props {
  monthlyData: MonthlyData[];
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
  subtitle: {
    fontSize: 10,
    color: "#666",
    textAlign: "center",
    marginBottom: 15,
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
    textTransform: "capitalize",
  },
  cellRight: {
    flex: 1,
    textAlign: "right",
    fontSize: 8,
  },

  // ----- Summary -----
  summarySection: {
    marginTop: 15,
    paddingTop: 10,
    borderTop: 1,
    borderColor: "#e5e7eb",
  },
  summaryTitle: {
    fontSize: 11,
    fontWeight: "bold",
    marginBottom: 8,
    color: "#8B0000",
  },
  summaryGrid: {
    flexDirection: "row",
    justifyContent: "space-around",
    flexWrap: "wrap",
  },
  summaryBox: { textAlign: "center", marginBottom: 10 },
  summaryLabel: { fontSize: 8, color: "#555" },
  summaryValue: { fontSize: 11, fontWeight: "bold", color: "#8B0000" },

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
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

export function MonthlyOrderPDF({ monthlyData }: Props) {
  const totalAllOrders = monthlyData.reduce((sum, item) => sum + item.allOrderCount, 0);
  const totalAllOrderValue = monthlyData.reduce((sum, item) => sum + item.allOrderValue, 0);
  const totalOrders = monthlyData.reduce((sum, item) => sum + item.orderCount, 0);
  const totalValue = monthlyData.reduce((sum, item) => sum + item.totalValue, 0);
  const totalCancelled = monthlyData.reduce(
    (sum, item) => sum + item.cancelOrderCount,
    0
  );
  const totalCancelValue = monthlyData.reduce(
    (sum, item) => sum + item.cancelValue,
    0
  );

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
        <Text style={styles.reportTitle}>Monthly Order Summary Report</Text>
        <Text style={styles.subtitle}>
          Order Statistics and Cancellation Analysis
        </Text>

        {/* Table Header */}
        <View style={styles.tableHeader}>
          <Text style={styles.tableHeaderText}>Year</Text>
          <Text style={styles.tableHeaderText}>Month</Text>
          <Text style={styles.headerTextRight}>All Orders</Text>
          <Text style={styles.headerTextRight}>Amount</Text>
          <Text style={styles.headerTextRight}>Delivered</Text>
          <Text style={styles.headerTextRight}>Amount</Text>
          <Text style={styles.headerTextRight}>Cancelled</Text>
          <Text style={styles.headerTextRight}>Amount</Text>
          <Text style={styles.headerTextRight}>Cancel Rate</Text>
        </View>

        {/* Table Rows */}
        {monthlyData.map((item, index) => {
          const cancelRate =
            item.allOrderCount > 0
              ? ((item.cancelOrderCount / item.allOrderCount) * 100).toFixed(1)
              : "0.0";
          return (
            <View
              key={`${item.year}-${item.month}-${index}`}
              style={[styles.row, index % 2 === 0 ? styles.altRow : {}]}
            >
              <Text style={styles.cell}>{item.year}</Text>
              <Text style={styles.cell}>{item.month}</Text>
              <Text style={styles.cellRight}>{item.allOrderCount}</Text>
              <Text style={styles.cellRight}>
                {formatCurrency(item.allOrderValue)}
              </Text>
              <Text style={styles.cellRight}>{item.orderCount}</Text>
              <Text style={styles.cellRight}>
                {formatCurrency(item.totalValue)}
              </Text>
              <Text style={styles.cellRight}>{item.cancelOrderCount}</Text>
              <Text style={styles.cellRight}>
                {formatCurrency(item.cancelValue)}
              </Text>
              <Text style={styles.cellRight}>{cancelRate}%</Text>
            </View>
          );
        })}

        {/* Summary */}
        <View style={styles.summarySection}>
          <Text style={styles.summaryTitle}>Overall Summary</Text>
          <View style={styles.summaryGrid}>
            <View style={styles.summaryBox}>
              <Text style={styles.summaryLabel}>Total Months</Text>
              <Text style={styles.summaryValue}>{monthlyData.length}</Text>
            </View>
            <View style={styles.summaryBox}>
              <Text style={styles.summaryLabel}>All Orders</Text>
              <Text style={styles.summaryValue}>{totalAllOrders}</Text>
            </View>
            <View style={styles.summaryBox}>
              <Text style={styles.summaryLabel}>Amount</Text>
              <Text style={styles.summaryValue}>
                {formatCurrency(totalAllOrderValue)}
              </Text>
            </View>
            <View style={styles.summaryBox}>
              <Text style={styles.summaryLabel}>Delivered Orders</Text>
              <Text style={styles.summaryValue}>{totalOrders}</Text>
            </View>
            <View style={styles.summaryBox}>
              <Text style={styles.summaryLabel}>Amount</Text>
              <Text style={styles.summaryValue}>
                {formatCurrency(totalValue)}
              </Text>
            </View>
            <View style={styles.summaryBox}>
              <Text style={styles.summaryLabel}>Cancelled Orders</Text>
              <Text style={styles.summaryValue}>{totalCancelled}</Text>
            </View>
            <View style={styles.summaryBox}>
              <Text style={styles.summaryLabel}>Amount</Text>
              <Text style={styles.summaryValue}>
                {formatCurrency(totalCancelValue)}
              </Text>
            </View>
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
