"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabase";
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

      const { data: profile } = await supabase
        .from("profiles")
        .select("first_name, role")
        .eq("id", session.user.id)
        .single();

      if (!profile) {
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

  if (loading || !authorized) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-foreground/20 text-sm"
        >
          Loading...
        </motion.div>
      </div>
    );
  }

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
