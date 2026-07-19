import { HeadingPrimary } from "@/components/common/heading-primary";
import LicenseCertificationsPage from "@/components/license-certifications/LicenseCertificationsPage";

// Or customize with your own data
export default function Page() {
  return (
    <LicenseCertificationsPage>
      <HeadingPrimary title="License & Certifications" className="mb-10" />
    </LicenseCertificationsPage>
  );
}
