import type { PillTone } from "@/components/common/pill-badge";
import {
    Briefcase,
    Shield,
    ShieldCheck,
    Store,
    UserCircle,
    User as UserIcon,
    Users,
} from "lucide-react";
import type React from "react";

// Role identity → badge look, shared by the user list, the profile strips of the
// user / customer / CRM detail pages and anywhere else a role is rendered, so
// the same role always reads with the same icon and colour.
const roleIcons: Record<string, React.ReactNode> = {
    admin: <ShieldCheck className="h-3 w-3" />,
    superadmin: <Shield className="h-3 w-3" />,
    modaretor: <Shield className="h-3 w-3" />,
    manager: <Briefcase className="h-3 w-3" />,
    storemanager: <Store className="h-3 w-3" />,
    staff: <Users className="h-3 w-3" />,
    customer: <UserIcon className="h-3 w-3" />,
};

const ROLE_TONE: Record<string, PillTone> = {
    superadmin: "violet",
    admin: "violet",
    modaretor: "sky",
    manager: "blue",
    storemanager: "blue",
    staff: "neutral",
    customer: "emerald",
};

const roleKey = (roleName: string | undefined) =>
    (roleName ?? "").trim().toLowerCase();

export const getRoleIcon = (roleName: string | undefined) =>
    roleIcons[roleKey(roleName)] ?? <UserCircle className="h-3 w-3" />;

export const getRoleTone = (roleName: string | undefined): PillTone =>
    ROLE_TONE[roleKey(roleName)] ?? "neutral";
