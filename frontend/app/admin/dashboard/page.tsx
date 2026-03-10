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

export default function AdminDashboardPage() {
  return (
    <motion.div variants={stagger} initial="hidden" animate="visible">
      {/* Header */}
      <motion.div variants={fadeUp} className="mb-10">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Admin Overview
        </h1>
        <p className="text-foreground/50 mt-1 text-sm">
          Organization-wide asset management.
        </p>
      </motion.div>

      {/* Stat cards */}
      <motion.div variants={fadeUp} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        {[
          { label: "Total Assets", value: "892", sub: "+24 this month" },
          { label: "Active Users", value: "124", sub: "8 new this week" },
          { label: "Checked Out", value: "341", sub: "38% utilization" },
          { label: "Pending Requests", value: "12", sub: "3 urgent" },
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
            <p className="text-foreground/40 text-xs mt-1">{stat.sub}</p>
          </div>
        ))}
      </motion.div>

      {/* Two-column layout */}
      <motion.div variants={fadeUp} className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Recent activity — wider */}
        <div className="lg:col-span-3">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-bold text-foreground tracking-tight">Recent Activity</h2>
            <button className="text-xs font-medium text-foreground/50 hover:text-foreground/70 transition-colors">
              View log
            </button>
          </div>

          <div className="border border-foreground/[0.08] rounded-2xl overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-foreground/[0.08]">
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-foreground/50 uppercase tracking-wider">User</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-foreground/50 uppercase tracking-wider hidden sm:table-cell">Action</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-foreground/50 uppercase tracking-wider">Asset</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-foreground/50 uppercase tracking-wider hidden md:table-cell">Time</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { user: "Sarah K.", action: "Checked out", asset: "MacBook Pro 16\"", time: "2 min ago" },
                  { user: "Mike R.", action: "Returned", asset: "Dell Monitor", time: "15 min ago" },
                  { user: "Anna L.", action: "Requested", asset: "Standing Desk", time: "1 hr ago" },
                  { user: "James T.", action: "Checked out", asset: "iPad Pro", time: "2 hrs ago" },
                  { user: "Lisa M.", action: "Reported issue", asset: "Logitech Mouse", time: "3 hrs ago" },
                ].map((entry, i) => (
                  <tr
                    key={i}
                    className="border-b border-foreground/[0.06] last:border-0 hover:bg-foreground/[0.03] transition-colors"
                  >
                    <td className="px-5 py-3.5 text-sm font-medium text-foreground">{entry.user}</td>
                    <td className="px-5 py-3.5 text-sm text-foreground/55 hidden sm:table-cell">{entry.action}</td>
                    <td className="px-5 py-3.5 text-sm text-foreground/55">{entry.asset}</td>
                    <td className="px-5 py-3.5 text-xs text-foreground/40 hidden md:table-cell">{entry.time}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pending requests — narrower */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-bold text-foreground tracking-tight">Pending Requests</h2>
            <span className="text-[11px] font-bold bg-foreground/[0.08] text-foreground/60 px-2.5 py-1 rounded-full">
              12
            </span>
          </div>

          <div className="flex flex-col gap-3">
            {[
              { user: "Anna L.", asset: "Standing Desk", type: "Checkout" },
              { user: "Tom W.", asset: "Webcam C920", type: "Checkout" },
              { user: "Sarah K.", asset: "USB-C Hub", type: "Return" },
              { user: "James T.", asset: "Monitor Arm", type: "Checkout" },
            ].map((req, i) => (
              <div
                key={i}
                className="bg-foreground/[0.03] border border-foreground/[0.08] rounded-xl p-4 hover:bg-foreground/[0.06] transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-foreground">{req.user}</p>
                    <p className="text-xs text-foreground/45 mt-0.5">{req.asset}</p>
                  </div>
                  <span className="text-[11px] font-medium text-foreground/45 bg-foreground/[0.06] px-2 py-0.5 rounded-md">
                    {req.type}
                  </span>
                </div>
                <div className="flex gap-2 mt-3">
                  <button className="flex-1 bg-foreground text-background text-xs font-medium py-2 rounded-lg hover:opacity-90 transition-opacity">
                    Approve
                  </button>
                  <button className="flex-1 border border-foreground/[0.10] text-foreground/60 text-xs font-medium py-2 rounded-lg hover:bg-foreground/[0.05] transition-colors">
                    Decline
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
