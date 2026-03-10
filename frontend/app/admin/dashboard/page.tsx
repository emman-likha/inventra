"use client";

import { KineticBackground } from "@/components/KineticBackground";
import { FloatingDots } from "@/components/FloatingDots";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function AdminDashboardPage() {
    const router = useRouter();
    const [adminName, setAdminName] = useState("");

    useEffect(() => {
        const checkAdmin = async () => {
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

            if (profile?.role !== "admin") {
                router.push("/dashboard");
                return;
            }

            setAdminName(profile?.first_name || "Admin");
        };

        checkAdmin();
    }, [router]);

    const handleSignOut = async () => {
        await supabase.auth.signOut();
        router.push("/login");
    };

    return (
        <div className="min-h-screen bg-background relative overflow-hidden flex flex-col items-center justify-center p-6">
            <KineticBackground />
            <FloatingDots />

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="w-full max-w-4xl bg-foreground/[0.03] backdrop-blur-xl border border-foreground/[0.08] rounded-[2.5rem] p-12 relative z-10"
            >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12 border-b border-foreground/[0.05] pb-8">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <span className="bg-foreground text-background text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-md">
                                Admin
                            </span>
                            <h1 className="text-3xl font-bold text-foreground">
                                Control Center
                            </h1>
                        </div>
                        <p className="text-foreground/50">
                            Welcome back, Commander {adminName}. System status is optimal.
                        </p>
                    </div>
                    <button
                        onClick={handleSignOut}
                        className="self-start md:self-center bg-foreground/[0.05] text-foreground px-6 py-2.5 rounded-full text-sm font-medium hover:bg-foreground/[0.1] transition-colors"
                    >
                        Sign Out
                    </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                    {[
                        { label: "Total Users", value: "124", icon: "Users" },
                        { label: "Active Assets", value: "892", icon: "Box" },
                        { label: "Pending Requests", value: "12", icon: "Clock" }
                    ].map((stat, i) => (
                        <div key={i} className="bg-foreground/[0.02] border border-foreground/[0.05] p-6 rounded-3xl hover:bg-foreground/[0.04] transition-colors group">
                            <p className="text-foreground/40 text-xs font-medium uppercase tracking-wider mb-2">{stat.label}</p>
                            <p className="text-3xl font-bold text-foreground group-hover:translate-x-1 transition-transform">{stat.value}</p>Stat
                        </div>
                    ))}
                </div>

                <div className="mt-8 flex gap-4">
                    <button className="flex-1 bg-foreground text-background py-4 rounded-full font-medium hover:opacity-90 transition-opacity">
                        Manage All Assets
                    </button>
                    <button className="flex-1 border border-foreground/[0.08] text-foreground py-4 rounded-full font-medium hover:bg-foreground/[0.02] transition-colors">
                        System Logs
                    </button>
                </div>
            </motion.div>

            <p className="absolute bottom-8 text-foreground/10 text-[10px] uppercase tracking-widest z-10">
                Inventra Administration &bull; Secure Environment
            </p>
        </div>
    );
}
