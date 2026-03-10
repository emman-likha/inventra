"use client";

import { KineticBackground } from "@/components/KineticBackground";
import { FloatingDots } from "@/components/FloatingDots";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function DashboardPage() {
    const router = useRouter();
    const [userName, setUserName] = useState("");

    useEffect(() => {
        const checkUser = async () => {
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

            if (profile?.role === "admin") {
                router.push("/admin/dashboard");
                return;
            }

            setUserName(profile?.first_name || "User");
        };

        checkUser();
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
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="w-full max-w-2xl bg-foreground/[0.03] backdrop-blur-xl border border-foreground/[0.08] rounded-[2.5rem] p-12 text-center relative z-10"
            >
                <div className="mb-8">
                    <div className="w-20 h-20 bg-foreground/[0.05] rounded-full flex items-center justify-center mx-auto mb-6">
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-foreground/40">
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                            <circle cx="12" cy="7" r="4"></circle>
                        </svg>
                    </div>
                    <h1 className="text-4xl font-bold text-foreground tracking-tight">
                        Welcome back, {userName}
                    </h1>
                    <p className="text-foreground/50 mt-3 text-lg">
                        This is your personal asset management dashboard.
                    </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-12">
                    <button className="bg-foreground text-background py-4 px-8 rounded-full font-medium transition-opacity hover:opacity-90">
                        View Assets
                    </button>
                    <button
                        onClick={handleSignOut}
                        className="bg-foreground/[0.05] text-foreground py-4 px-8 rounded-full font-medium transition-colors hover:bg-foreground/[0.1]"
                    >
                        Sign Out
                    </button>
                </div>
            </motion.div>

            <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
                className="absolute bottom-8 text-foreground/20 text-xs z-10"
            >
                &copy; {new Date().getFullYear()} Inventra &bull; Private Access
            </motion.p>
        </div>
    );
}
