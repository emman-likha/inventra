"use client";

import { motion } from "framer-motion";

const stagger = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06 },
  },
};

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

export default function DashboardPage() {
  return (
    <motion.div variants={stagger} initial="hidden" animate="visible">
      {/* Header */}
      <motion.div variants={fadeUp} className="mb-10">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Overview
        </h1>
        <p className="text-foreground/50 mt-1 text-sm">
          Your asset management at a glance.
        </p>
      </motion.div>

      {/* Stat cards */}
      <motion.div variants={fadeUp} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        {[
          { label: "Total Assets", value: "48", change: "+3 this week" },
          { label: "Checked Out", value: "12", change: "25% of total" },
          { label: "Categories", value: "6", change: "2 most used" },
          { label: "Pending", value: "3", change: "Awaiting approval" },
        ].map((stat, i) => (
          <div
            key={i}
            className="bg-foreground/[0.03] border border-foreground/[0.08] rounded-2xl p-5 hover:bg-foreground/[0.06] transition-colors group"
          >
            <p className="text-foreground/50 text-xs font-semibold uppercase tracking-wider mb-3">
              {stat.label}
            </p>
            <p className="text-2xl font-bold text-foreground tracking-tight group-hover:translate-x-0.5 transition-transform">
              {stat.value}
            </p>
            <p className="text-foreground/40 text-xs mt-1">{stat.change}</p>
          </div>
        ))}
      </motion.div>

      {/* Recent assets table */}
      <motion.div variants={fadeUp}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-foreground tracking-tight">Recent Assets</h2>
          <button className="text-xs font-medium text-foreground/50 hover:text-foreground/70 transition-colors">
            View all
          </button>
        </div>

        <div className="border border-foreground/[0.08] rounded-2xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-foreground/[0.08]">
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-foreground/50 uppercase tracking-wider">Name</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-foreground/50 uppercase tracking-wider hidden sm:table-cell">Category</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-foreground/50 uppercase tracking-wider hidden md:table-cell">Assigned To</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-foreground/50 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody>
              {[
                { name: "MacBook Pro 14\"", category: "Laptops", assignee: "You", status: "Active" },
                { name: "Dell Monitor 27\"", category: "Monitors", assignee: "You", status: "Active" },
                { name: "Logitech MX Keys", category: "Peripherals", assignee: "You", status: "Active" },
                { name: "Standing Desk", category: "Furniture", assignee: "You", status: "Pending" },
                { name: "Webcam C920", category: "Peripherals", assignee: "—", status: "Available" },
              ].map((asset, i) => (
                <tr
                  key={i}
                  className="border-b border-foreground/[0.06] last:border-0 hover:bg-foreground/[0.03] transition-colors"
                >
                  <td className="px-5 py-3.5 text-sm font-medium text-foreground">{asset.name}</td>
                  <td className="px-5 py-3.5 text-sm text-foreground/55 hidden sm:table-cell">{asset.category}</td>
                  <td className="px-5 py-3.5 text-sm text-foreground/55 hidden md:table-cell">{asset.assignee}</td>
                  <td className="px-5 py-3.5">
                    <span className={`
                      text-xs font-medium px-2.5 py-1 rounded-full
                      ${asset.status === "Active" ? "bg-foreground/[0.06] text-foreground/60" : ""}
                      ${asset.status === "Pending" ? "bg-amber-500/10 text-amber-600" : ""}
                      ${asset.status === "Available" ? "bg-emerald-500/10 text-emerald-600" : ""}
                    `}>
                      {asset.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </motion.div>
  );
}
