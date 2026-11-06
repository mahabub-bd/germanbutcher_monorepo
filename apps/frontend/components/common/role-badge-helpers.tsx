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

// Role identity → badge look, shared by the user list, the profile strips of the
// user / customer / CRM detail pages, the role detail page and anywhere else a
// role is rendered, so the same role always reads with the same icon and colour.
const ROLE_ICONS: Record<string, typeof UserIcon> = {
    admin: ShieldCheck,
    superadmin: Shield,
    modaretor: Shield,
    manager: Briefcase,
    storemanager: Store,
    staff: Users,
    customer: UserIcon,
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

/** Raw icon component, for callers that need their own size/colour classes. */
export const getRoleIconComponent = (roleName: string | undefined) =>
    ROLE_ICONS[roleKey(roleName)] ?? UserCircle;

/** Ready-to-render 12px icon node for inline pill use. */
export const getRoleIcon = (roleName: string | undefined) => {
    const Icon = getRoleIconComponent(roleName);
    return <Icon className="h-3 w-3" />;
};

export const getRoleTone = (roleName: string | undefined): PillTone =>
    ROLE_TONE[roleKey(roleName)] ?? "neutral";
