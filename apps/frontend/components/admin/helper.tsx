import { Switch } from "@radix-ui/react-switch";
import { Info } from "lucide-react";

// Helper Components
const Section = ({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) => (
  <div className="space-y-4">
    <h3 className="text-lg font-medium">{title}</h3>
    <div className="space-y-4">{children}</div>
  </div>
);

const InfoBox = ({
  title,
  description,
}: {
  title: string;
  description: string;
}) => (
  <div className="bg-muted/30 p-4 rounded-lg border border-muted flex items-start gap-3">
    <Info className="h-5 w-5 text-muted-foreground mt-0.5" />
    <div className="text-sm text-muted-foreground">
      <p className="font-medium text-foreground">{title}</p>
      <p>{description}</p>
    </div>
  </div>
);

const SwitchCard = ({
  label,
  description,
  checked,
  onCheckedChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}) => (
  <div className="flex items-center justify-between rounded-lg border p-4">
    <div className="space-y-0.5">
      <p className="text-base font-medium">{label}</p>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
    <Switch checked={checked} onCheckedChange={onCheckedChange} />
  </div>
);

export { InfoBox, Section, SwitchCard };
