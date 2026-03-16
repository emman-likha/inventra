"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { fetchMyProfile } from "@/lib/api";
import { Sidebar, SidebarItem } from "@/components/dashboard/Sidebar";

const sidebarItems: SidebarItem[] = [
  { label: "Overview", href: "/dashboard", icon: "home" },
  { label: "My Assets", href: "/dashboard/assets", icon: "box" },
  { label: "Inventory", href: "/dashboard/inventory", icon: "clipboard" },
  { label: "Departments", href: "/dashboard/departments", icon: "users" },
  { label: "Categories", href: "/dashboard/categories", icon: "tag" },
  { label: "Reports", href: "/dashboard/reports", icon: "chart" },
  { label: "Settings", href: "/dashboard/settings", icon: "settings" },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [userName, setUserName] = useState("");
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
        if (profile.role === "admin") {
          router.push("/admin/dashboard");
          return;
        }
        setUserName(profile.first_name || "User");
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
        items={sidebarItems}
        role="user"
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
