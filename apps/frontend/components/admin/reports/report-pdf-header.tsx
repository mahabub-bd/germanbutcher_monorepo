import { Image, Text, View } from "@react-pdf/renderer";
import type { ComponentProps } from "react";

import { pdfImageUrl } from "@/utils/pdf-image";
import type { BusinessSettings } from "@/utils/types";

type PdfStyle = ComponentProps<typeof View>["style"];

interface ReportPDFHeaderProps {
  settings?: BusinessSettings | null;
  styles: {
    header: PdfStyle;
    companyInfo: PdfStyle;
    companyName: PdfStyle;
    companyAddress: PdfStyle;
    logo: PdfStyle;
  };
}

/** Shared company header for the admin report PDFs. Renders only the values
 * configured in Business Settings — unset lines are omitted entirely. */
export function ReportPDFHeader({ settings, styles }: ReportPDFHeaderProps) {
  const businessName = settings?.businessName?.trim() || "";
  const address = settings?.address?.trim() || "";
  const phone = settings?.phone?.trim() || "";
  const websiteUrl = settings?.websiteUrl?.trim() || "";

  return (
    <View style={styles.header} wrap={false}>
      <View style={styles.companyInfo}>
        {businessName ? (
          <Text style={styles.companyName}>{businessName}</Text>
        ) : null}
        {address ? <Text style={styles.companyAddress}>{address}</Text> : null}
        {phone ? (
          <Text style={styles.companyAddress}>Mobile: {phone}</Text>
        ) : null}
        {websiteUrl ? (
          <Text style={styles.companyAddress}>{websiteUrl}</Text>
        ) : null}
      </View>
      {/* PNG logo from Business Settings, served via our same-origin proxy
          (react-pdf cannot use WebP images or S3 URLs without CORS). */}
      <Image style={styles.logo} src={pdfImageUrl(settings?.invoiceLogo?.url)} />
    </View>
  );
}
