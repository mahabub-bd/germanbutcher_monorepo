import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { UserPlus } from "lucide-react";

interface AccountCreationProps {
  createAccount: boolean;
  onChange: (value: boolean) => void;
}

export function AccountCreation({
  createAccount,
  onChange,
}: AccountCreationProps) {
  return (
    <div className="flex items-start space-x-3 space-y-0 rounded-md border p-4 bg-white">
      <Checkbox
        id="createAccount"
        checked={createAccount}
        onCheckedChange={onChange}
      />
      <div className="space-y-1 leading-none">
        <Label htmlFor="createAccount" className="flex items-center gap-2">
          <UserPlus className="h-4 w-4" />
          Create an account
        </Label>
        <p className="text-xs md:text-sm text-muted-foreground">
          Save your information for faster checkout next time
        </p>
      </div>
    </div>
  );
}
