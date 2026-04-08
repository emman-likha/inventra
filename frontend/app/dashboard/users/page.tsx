"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchUsers, inviteUser, deleteUser, type CompanyUser } from "@/lib/api";
import { SkeletonPage } from "@/components/ui/Skeleton";

export default function UsersPage() {
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const { data: users = [], isLoading } = useQuery<CompanyUser[]>({
    queryKey: ["users"],
    queryFn: fetchUsers,
  });

  const inviteMutation = useMutation({
    mutationFn: inviteUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      setShowModal(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      setConfirmDelete(null);
    },
  });

  const filtered = search.trim()
    ? users.filter(
        (u) =>
          `${u.first_name} ${u.last_name}`.toLowerCase().includes(search.toLowerCase()) ||
          u.email?.toLowerCase().includes(search.toLowerCase())
      )
    : users;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Users</h1>
          <p className="text-foreground/50 mt-1 text-sm">
            Manage users in your company.
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="px-5 py-2.5 rounded-xl text-sm font-medium bg-foreground text-background hover:opacity-90 transition-opacity cursor-pointer"
        >
          Add User
        </button>
      </div>

      {/* Search */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs text-foreground/40">
          {filtered.length} {filtered.length === 1 ? "user" : "users"}
        </p>
        <div className="relative w-64">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/30"
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            placeholder="Search users..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-foreground/[0.03] border border-foreground/[0.08] rounded-xl pl-9 pr-4 py-2 text-sm text-foreground placeholder:text-foreground/30 focus:outline-none focus:border-foreground/20 transition-colors"
          />
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <SkeletonPage header={false} search={false} cols={4} />
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 border border-foreground/[0.08] rounded-2xl">
          <div className="w-14 h-14 rounded-2xl bg-foreground/[0.03] border border-foreground/[0.08] flex items-center justify-center mb-4">
            <svg
              className="text-foreground/20"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4-4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 00-3-3.87" />
              <path d="M16 3.13a4 4 0 010 7.75" />
            </svg>
          </div>
          <p className="text-sm font-medium text-foreground/50">No users yet</p>
          <p className="text-xs text-foreground/30 mt-1">Add users to your company.</p>
        </div>
      ) : (
        <div className="border border-foreground/[0.08] rounded-2xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-foreground/[0.08]">
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-foreground/50 uppercase tracking-wider">
                  Name
                </th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-foreground/50 uppercase tracking-wider hidden sm:table-cell">
                  Email
                </th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-foreground/50 uppercase tracking-wider hidden md:table-cell">
                  Role
                </th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-foreground/50 uppercase tracking-wider hidden lg:table-cell">
                  Joined
                </th>
                <th className="w-[80px] px-5 py-3.5" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((user) => (
                <tr
                  key={user.id}
                  className="border-b border-foreground/[0.06] last:border-0 hover:bg-foreground/[0.02] transition-colors"
                >
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-foreground/[0.06] flex items-center justify-center text-xs font-semibold text-foreground/50">
                        {user.first_name?.[0]}
                        {user.last_name?.[0]}
                      </div>
                      <span className="text-sm font-medium text-foreground">
                        {user.first_name} {user.last_name}
                      </span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-sm text-foreground/50 hidden sm:table-cell">
                    {user.email}
                  </td>
                  <td className="px-5 py-3.5 hidden md:table-cell">
                    <span
                      className={`inline-block px-2.5 py-1 rounded-lg text-xs font-medium ${
                        user.role === "admin"
                          ? "bg-amber-500/10 text-amber-600"
                          : "bg-foreground/[0.06] text-foreground/50"
                      }`}
                    >
                      {user.role}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-xs text-foreground/40 hidden lg:table-cell">
                    {new Date(user.created_at).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    {user.role !== "admin" && (
                      <button
                        onClick={() => setConfirmDelete(user.id)}
                        className="p-1.5 rounded-lg text-foreground/30 hover:text-red-500 hover:bg-red-500/10 transition-colors cursor-pointer"
                        title="Remove user"
                      >
                        <svg
                          width="15"
                          height="15"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <polyline points="3 6 5 6 21 6" />
                          <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                        </svg>
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add User Modal */}
      {showModal && (
        <AddUserModal
          onClose={() => setShowModal(false)}
          onSubmit={(data) => inviteMutation.mutate(data)}
          loading={inviteMutation.isPending}
          error={inviteMutation.error?.message ?? null}
        />
      )}

      {/* Delete Confirmation */}
      {confirmDelete && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setConfirmDelete(null)}
        >
          <div
            className="bg-background border border-foreground/[0.08] rounded-2xl p-6 w-full max-w-sm"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-foreground mb-2">Remove User</h3>
            <p className="text-sm text-foreground/50 mb-6">
              This will permanently remove this user from your company. This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setConfirmDelete(null)}
                className="px-4 py-2 rounded-xl text-sm font-medium text-foreground/60 hover:text-foreground transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => deleteMutation.mutate(confirmDelete)}
                disabled={deleteMutation.isPending}
                className="px-4 py-2 rounded-xl text-sm font-medium bg-red-500 text-white hover:bg-red-600 transition-colors cursor-pointer disabled:opacity-50"
              >
                {deleteMutation.isPending ? "Removing..." : "Remove"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function AddUserModal({
  onClose,
  onSubmit,
  loading,
  error,
}: {
  onClose: () => void;
  onSubmit: (data: { first_name: string; last_name: string; email: string; password: string }) => void;
  loading: boolean;
  error: string | null;
}) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const inputClass =
    "w-full bg-foreground/[0.04] border border-foreground/[0.08] rounded-xl px-4 py-3 text-foreground placeholder:text-foreground/25 focus:outline-none focus:border-foreground/20 transition-all text-sm";

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-background border border-foreground/[0.08] rounded-2xl p-6 w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-semibold text-foreground mb-1">Add User</h3>
        <p className="text-sm text-foreground/50 mb-6">
          Create a new user account for your company.
        </p>

        {error && (
          <p className="text-red-500 text-xs bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 mb-4">
            {error}
          </p>
        )}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit({
              first_name: firstName,
              last_name: lastName,
              email,
              password,
            });
          }}
          className="flex flex-col gap-4"
        >
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-foreground/40 text-xs font-medium mb-1.5 ml-1">
                First name
              </label>
              <input
                type="text"
                placeholder="John"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-foreground/40 text-xs font-medium mb-1.5 ml-1">
                Last name
              </label>
              <input
                type="text"
                placeholder="Doe"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
                className={inputClass}
              />
            </div>
          </div>

          <div>
            <label className="block text-foreground/40 text-xs font-medium mb-1.5 ml-1">
              Email
            </label>
            <input
              type="email"
              placeholder="john@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className={inputClass}
            />
          </div>

          <div>
            <label className="block text-foreground/40 text-xs font-medium mb-1.5 ml-1">
              Password
            </label>
            <input
              type="password"
              placeholder="Min 6 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className={inputClass}
            />
          </div>

          <div className="flex gap-3 justify-end mt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-sm font-medium text-foreground/60 hover:text-foreground transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 rounded-xl text-sm font-medium bg-foreground text-background hover:opacity-90 transition-opacity cursor-pointer disabled:opacity-50"
            >
              {loading ? "Creating..." : "Create User"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
