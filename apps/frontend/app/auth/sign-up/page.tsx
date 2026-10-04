import SignUpForm from "@/components/auth/sign-up-form";
import { getBusinessSettings } from "@/utils/business-settings-server";

export default async function SignUpPage() {
  const settings = await getBusinessSettings();
  return (
    <SignUpForm
      logoUrl={settings?.logo?.url}
      businessName={settings?.businessName ?? undefined}
    />
  );
}
