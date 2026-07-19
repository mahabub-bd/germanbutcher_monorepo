"use client";

import {
  Document,
  Image,
  Page,
  StyleSheet,
  Text,
  View,
} from "@react-pdf/renderer";

interface PaymentMethod {
  name: string;
  code: string;
  description: string;
}

interface OrderSummary {
  orderNo: string;
  orderStatus: string;
  paymentStatus: string;
  totalValue: string;
  paidAmount: string;
}

interface UserInfo {
  name: string;
  email: string;
  mobileNumber: string;
}

interface PaymentRecord {
  id: number;
  paymentNumber: string;
  amount: string;
  paymentDate: string;
  sslPaymentId: string | null;
  order: OrderSummary;
  paymentMethod: PaymentMethod;
  createdBy: UserInfo | null;
  updatedBy: UserInfo | null;
}

interface Props {
  payments: PaymentRecord[];
  orderId?: string;
}

const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontFamily: "Helvetica",
    fontSize: 10,
    color: "#1f2937",
    backgroundColor: "#ffffff",
  },

  // ----- Header -----
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottom: 2,
    borderColor: "#8B0000",
    paddingBottom: 10,
    marginBottom: 10,
  },
  logoSection: {
    flexDirection: "row",
    alignItems: "center",
  },
  logo: {
    width: 55,
    height: 55,
    objectFit: "contain",
    marginRight: 10,
  },
  companyInfo: {
    flexDirection: "column",
  },
  companyName: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#8B0000",
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
  reportTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#8B0000",
    textAlign: "right",
  },

  // ----- Info Section -----
  infoSection: {
    marginTop: 10,
    marginBottom: 10,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  infoBlock: {
    fontSize: 9,
  },
  label: {
    color: "#6b7280",
  },
  value: {
    fontWeight: "bold",
    color: "#1e293b",
  },

  // ----- Table -----
  table: {
    width: "100%",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    marginTop: 10,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#8B0000",
    color: "#ffffff",
    paddingVertical: 6,
    paddingHorizontal: 4,
  },
  tableHeaderText: {
    fontSize: 9,
    fontWeight: "bold",
    flex: 1,
    textAlign: "left",
  },
  tableRow: {
    flexDirection: "row",
    borderBottom: 1,
    borderColor: "#f3f4f6",
    paddingVertical: 5,
    paddingHorizontal: 4,
  },
  altRow: {
    backgroundColor: "#f9fafb",
  },
  cell: {
    flex: 1,
    textAlign: "left",
    fontSize: 8.5,
    color: "#374151",
  },

  // ----- Summary -----
  summarySection: {
    marginTop: 20,
    borderTop: 1,
    borderColor: "#e5e7eb",
    paddingTop: 10,
    flexDirection: "row",
    justifyContent: "space-around",
  },
  summaryBox: {
    textAlign: "center",
  },
  summaryLabel: {
    color: "#6b7280",
    fontSize: 9,
  },
  summaryValue: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#8B0000",
  },

  // ----- Footer -----
  footer: {
    position: "absolute",
    bottom: 20,
    left: 30,
    right: 30,
    borderTop: 1,
    borderColor: "#e5e7eb",
    paddingTop: 6,
    textAlign: "center",
    fontSize: 8,
    color: "#6b7280",
  },
  footerHighlight: {
    color: "#8B0000",
    fontWeight: "bold",
  },
});

const formatCurrency = (num: number) =>
  num?.toLocaleString("en-BD", {
    style: "currency",
    currency: "BDT",
    minimumFractionDigits: 2,
  });

export function PaymentReportPDF({ payments, orderId }: Props) {
  const totalAmount = payments.reduce(
    (sum, p) => sum + parseFloat(p.amount || "0"),
    0
  );
  const uniqueMethods = [...new Set(payments.map((p) => p.paymentMethod.name))]
    .length;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoSection}>
            <Image style={styles.logo} src="/images/logo3.png" />
            <View style={styles.companyInfo}>
              <Text style={styles.companyName}>German Butcher</Text>
              <Text style={styles.companyAddress}>
                House-56/B, Road-132, Gulshan-1, Dhaka
              </Text>
              <Text style={styles.companyContact}>Mobile: 01404-009000</Text>
              <Text style={styles.companyContact}>
                Web: www.germanbutcherbd.com
              </Text>
            </View>
          </View>
          <Text style={styles.reportTitle}>Payment Report</Text>
        </View>

        {/* Info Section */}
        <View style={styles.infoSection}>
          <View style={styles.infoBlock}>
            <Text style={styles.label}>Generated On:</Text>
            <Text style={styles.value}>
              {new Date().toLocaleString("en-BD", {
                dateStyle: "medium",
                timeStyle: "short",
              })}
            </Text>
          </View>
          {orderId && (
            <View style={styles.infoBlock}>
              <Text style={styles.label}>Order ID:</Text>
              <Text style={styles.value}>#{orderId}</Text>
            </View>
          )}
        </View>

        {/* Table Header */}
        <View style={styles.tableHeader}>
          <Text style={[styles.tableHeaderText, { flex: 0.5 }]}>#</Text>
          <Text style={[styles.tableHeaderText, { flex: 1.5 }]}>
            Payment No
          </Text>
          <Text style={[styles.tableHeaderText, { flex: 1 }]}>Date</Text>
          <Text style={[styles.tableHeaderText, { flex: 1 }]}>Amount</Text>
          <Text style={[styles.tableHeaderText, { flex: 1 }]}>Method</Text>
          <Text style={[styles.tableHeaderText, { flex: 1 }]}>Order No</Text>
        </View>

        {/* Table Rows */}
        {payments.map((p, i) => (
          <View
            key={p.id}
            style={[styles.tableRow, i % 2 === 0 ? styles.altRow : {}]}
          >
            <Text style={[styles.cell, { flex: 0.5 }]}>{i + 1}</Text>
            <Text style={[styles.cell, { flex: 1.5 }]}>{p.paymentNumber}</Text>
            <Text style={[styles.cell, { flex: 1 }]}>{p.paymentDate}</Text>
            <Text style={[styles.cell, { flex: 1 }]}>
              {formatCurrency(parseFloat(p.amount))}
            </Text>
            <Text style={[styles.cell, { flex: 1 }]}>
              {p.paymentMethod.name}
            </Text>
            <Text style={[styles.cell, { flex: 1 }]}>{p.order.orderNo}</Text>
          </View>
        ))}

        {/* Summary Section */}
        <View style={styles.summarySection}>
          <View style={styles.summaryBox}>
            <Text style={styles.summaryLabel}>Total Payments</Text>
            <Text style={styles.summaryValue}>{payments.length}</Text>
          </View>
          <View style={styles.summaryBox}>
            <Text style={styles.summaryLabel}>Total Amount</Text>
            <Text style={styles.summaryValue}>
              {formatCurrency(totalAmount)}
            </Text>
          </View>
          <View style={styles.summaryBox}>
            <Text style={styles.summaryLabel}>Payment Methods</Text>
            <Text style={styles.summaryValue}>{uniqueMethods}</Text>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text>
            © {new Date().getFullYear()}{" "}
            <Text style={styles.footerHighlight}>German Butcher</Text> | All
            Rights Reserved
          </Text>
        </View>
      </Page>
    </Document>
  );
}
