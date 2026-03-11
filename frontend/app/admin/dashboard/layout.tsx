"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { fetchMyProfile } from "@/lib/api";
import { Sidebar, SidebarItem } from "@/components/dashboard/Sidebar";

const sidebarItems: SidebarItem[] = [
  { label: "Overview", href: "/admin/dashboard", icon: "home" },
  { label: "All Assets", href: "/admin/assets", icon: "box" },
  { label: "Users", href: "/admin/users", icon: "users" },
  { label: "Categories", href: "/admin/categories", icon: "tag" },
  { label: "Audit Log", href: "/admin/audit", icon: "clipboard" },
  { label: "Reports", href: "/admin/reports", icon: "chart" },
  { label: "Settings", href: "/admin/settings", icon: "settings" },
];

export default function AdminDashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [userName, setUserName] = useState("");
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push("/login");
        return;
      }

      let profile;
      try {
        profile = await fetchMyProfile();
      } catch {
        router.push("/login");
        return;
      }

      if (profile.role !== "admin") {
        router.push("/dashboard");
        return;
      }

      setUserName(profile.first_name || "User");
      setAuthorized(true);
      setLoading(false);
    };

    checkAuth();
  }, [router]);

  const handleSignOut = useCallback(async () => {
    await supabase.auth.signOut();
    router.push("/login");
  }, [router]);

  if (loading || !authorized) return null;

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar
        items={sidebarItems}
        role="admin"
        userName={userName}
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
