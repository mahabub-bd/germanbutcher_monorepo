import SignInForm from "@/components/auth/sign-in-form";
import { getBusinessSettings } from "@/utils/business-settings-server";

export default async function SignInPage() {
  const settings = await getBusinessSettings();
  return (
    <SignInForm
      logoUrl={settings?.logo?.url}
      businessName={settings?.businessName ?? undefined}
    />
  );
}
