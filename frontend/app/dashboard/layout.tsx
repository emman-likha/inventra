"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { fetchMyProfile } from "@/lib/api";
import { Sidebar, SidebarItem } from "@/components/dashboard/Sidebar";

const baseSidebarItems: SidebarItem[] = [
  { label: "Overview", href: "/dashboard", icon: "home" },
  {
    label: "My Assets", href: "/dashboard/assets", icon: "box", children: [
      { label: "Asset Manager", href: "/dashboard/assets/manager", icon: "activity" },
      { label: "Movement History", href: "/dashboard/assets/history", icon: "clock" },
      { label: "Disposed", href: "/dashboard/assets/disposed", icon: "trash" },
    ]
  },
  { label: "Inventory", href: "/dashboard/inventory", icon: "clipboard" },
  { label: "Departments", href: "/dashboard/departments", icon: "users" },
  {
    label: "Reports", href: "/dashboard/reports", icon: "chart", children: [
      { label: "Status", href: "/dashboard/reports/status", icon: "activity" },
      { label: "Assets", href: "/dashboard/reports/assets", icon: "box" },
      { label: "Check-Out", href: "/dashboard/reports/checkout", icon: "log-out" },
      { label: "Transactions", href: "/dashboard/reports/transactions", icon: "tag" },
      { label: "Maintenance", href: "/dashboard/reports/maintenance", icon: "settings" },
      { label: "Reservations", href: "/dashboard/reports/reservations", icon: "clock" },
      { label: "Audit", href: "/dashboard/reports/audit", icon: "shield" },
      { label: "Depreciation", href: "/dashboard/reports/depreciation", icon: "chart" },
      { label: "Leased", href: "/dashboard/reports/leased", icon: "clipboard" },
    ]
  },
  { label: "Documents", href: "/dashboard/gallery/documents", icon: "file" },
  { label: "Images", href: "/dashboard/gallery/images", icon: "image" },
  { label: "Settings", href: "/dashboard/settings", icon: "settings" },
];

function getSidebarItems(role: string): SidebarItem[] {
  if (role === "admin") {
    // Insert "Users" before "Settings"
    const items = [...baseSidebarItems];
    const settingsIdx = items.findIndex((i) => i.label === "Settings");
    items.splice(settingsIdx, 0, { label: "Users", href: "/dashboard/users", icon: "users" });
    return items;
  }
  return baseSidebarItems;
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [userName, setUserName] = useState("");
  const [userRole, setUserRole] = useState("user");
  const [companyName, setCompanyName] = useState("");
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function checkAuth(session: import("@supabase/supabase-js").Session | null) {
      if (!session) {
        router.push("/login");
        return;
      }

      try {
        const profile = await fetchMyProfile();
        if (cancelled) return;
        setUserName(profile.first_name || "User");
        setUserRole(profile.role || "user");
        setCompanyName(profile.company?.name || "");
      } catch (err) {
        if (cancelled) return;
        console.error("Failed to fetch profile:", err);
        setUserName("User");
      }

      setAuthorized(true);
      setLoading(false);
    }

    // Check session immediately on mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!cancelled) checkAuth(session);
    });

    // Also listen for auth state changes (sign-in, sign-out, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        checkAuth(session);
      }
    );

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, [router]);

  const handleSignOut = useCallback(async () => {
    await supabase.auth.signOut();
    router.push("/login");
  }, [router]);

  if (loading || !authorized) return null;

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar
        items={getSidebarItems(userRole)}
        role={userRole as "admin" | "user"}
        userName={userName}
        companyName={companyName}
        onSignOut={handleSignOut}
      />

      <main className="flex-1 min-w-0 min-h-screen lg:pt-0 pt-14">
        <div className="p-6 lg:p-10 w-full">
          {children}
        </div>
      </main>
    </div>
  );
}
