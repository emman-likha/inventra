"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { Sidebar, SidebarItem } from "./Sidebar";

interface DashboardLayoutProps {
  children: React.ReactNode;
  role: "admin" | "user";
  sidebarItems: SidebarItem[];
}

export function DashboardLayout({ children, role, sidebarItems }: DashboardLayoutProps) {
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

      // Role-based redirect
      if (role === "admin" && profile.role !== "admin") {
        router.push("/dashboard");
        return;
      }
      if (role === "user" && profile.role === "admin") {
        router.push("/admin/dashboard");
        return;
      }

      setUserName(profile.first_name || "User");
      setAuthorized(true);
      setLoading(false);
    };

    checkAuth();
  }, [router, role]);

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
        role={role}
        userName={userName}
        onSignOut={handleSignOut}
      />

      {/* Main content */}
      <main className="flex-1 min-w-0 min-h-screen lg:pt-0 pt-14">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.05 }}
          className="p-6 lg:p-10 w-full"
        >
          {children}
        </motion.div>
      </main>
    </div>
  );
}
