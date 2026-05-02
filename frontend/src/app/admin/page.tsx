"use client";

import { useEffect, useMemo, useState } from "react";

type AdminTab = "users" | "roles" | "permissions";

interface PermissionItem {
  id: string;
  key: string;
  label: string;
  description: string;
}

interface RoleItem {
  id: string;
  name: string;
  permissionIds: string[];
}

interface UserItem {
  id: string;
  name: string;
  email: string;
  roleId: string;
  active: boolean;
}

const STORAGE_KEY = "ostora:admin:rbac:v1";

const defaultPermissions: PermissionItem[] = [
  { id: "perm_users_view", key: "users.view", label: "View Users", description: "Can view all users and role assignments." },
  { id: "perm_users_edit", key: "users.edit", label: "Edit Users", description: "Can edit and remove users." },
  { id: "perm_roles_manage", key: "roles.manage", label: "Manage Roles", description: "Can create, update, and delete roles." },
  { id: "perm_permissions_manage", key: "permissions.manage", label: "Manage Permissions", description: "Can create and manage permissions." },
  { id: "perm_theme_toggle", key: "ui.theme.toggle", label: "View Dark Theme", description: "Can toggle dark theme view for dashboard." },
];

const defaultRoles: RoleItem[] = [
  {
    id: "role_admin",
    name: "Admin",
    permissionIds: ["perm_users_view", "perm_users_edit", "perm_roles_manage", "perm_permissions_manage", "perm_theme_toggle"],
  },
  {
    id: "role_recruiter",
    name: "Recruiter",
    permissionIds: ["perm_users_view", "perm_theme_toggle"],
  },
  {
    id: "role_user",
    name: "User",
    permissionIds: ["perm_theme_toggle"],
  },
];

const defaultUsers: UserItem[] = [
  { id: "usr_1", name: "Zakaria Kardache", email: "tet@test.com", roleId: "role_admin", active: true },
  { id: "usr_2", name: "Nora Haddad", email: "nora@example.com", roleId: "role_recruiter", active: true },
  { id: "usr_3", name: "Sami El Amrani", email: "sami@example.com", roleId: "role_user", active: false },
];

function uid(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<AdminTab>("users");
  const [permissions, setPermissions] = useState<PermissionItem[]>(defaultPermissions);
  const [roles, setRoles] = useState<RoleItem[]>(defaultRoles);
  const [users, setUsers] = useState<UserItem[]>(defaultUsers);

  const [newUser, setNewUser] = useState({ name: "", email: "", roleId: defaultRoles[0].id });
  const [newRoleName, setNewRoleName] = useState("");
  const [newPermission, setNewPermission] = useState({ key: "", label: "", description: "" });

  useEffect(() => {
    if (typeof window === "undefined") return;
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw) as {
        users?: UserItem[];
        roles?: RoleItem[];
        permissions?: PermissionItem[];
      };
      if (Array.isArray(parsed.permissions) && parsed.permissions.length > 0) {
        setPermissions(parsed.permissions);
      }
      if (Array.isArray(parsed.roles) && parsed.roles.length > 0) {
        setRoles(parsed.roles);
      }
      if (Array.isArray(parsed.users) && parsed.users.length > 0) {
        setUsers(parsed.users);
      }
    } catch {
      // Ignore malformed local storage and fallback to defaults.
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ users, roles, permissions }));
  }, [users, roles, permissions]);

  const roleById = useMemo(() => new Map(roles.map((role) => [role.id, role])), [roles]);

  const handleCreateUser = () => {
    if (!newUser.name.trim() || !newUser.email.trim() || !newUser.roleId) return;
    setUsers((prev) => [
      {
        id: uid("usr"),
        name: newUser.name.trim(),
        email: newUser.email.trim(),
        roleId: newUser.roleId,
        active: true,
      },
      ...prev,
    ]);
    setNewUser({ name: "", email: "", roleId: roles[0]?.id || "" });
  };

  const handleCreateRole = () => {
    if (!newRoleName.trim()) return;
    setRoles((prev) => [...prev, { id: uid("role"), name: newRoleName.trim(), permissionIds: [] }]);
    setNewRoleName("");
  };

  const handleCreatePermission = () => {
    if (!newPermission.key.trim() || !newPermission.label.trim()) return;
    setPermissions((prev) => [
      ...prev,
      {
        id: uid("perm"),
        key: newPermission.key.trim(),
        label: newPermission.label.trim(),
        description: newPermission.description.trim(),
      },
    ]);
    setNewPermission({ key: "", label: "", description: "" });
  };

  const removePermission = (permissionId: string) => {
    setPermissions((prev) => prev.filter((permission) => permission.id !== permissionId));
    setRoles((prev) =>
      prev.map((role) => ({ ...role, permissionIds: role.permissionIds.filter((id) => id !== permissionId) }))
    );
  };

  const removeRole = (roleId: string) => {
    setRoles((prev) => prev.filter((role) => role.id !== roleId));
    const fallbackRole = roles.find((role) => role.id !== roleId)?.id || "";
    setUsers((prev) => prev.map((user) => (user.roleId === roleId ? { ...user, roleId: fallbackRole } : user)));
  };

  const toggleRolePermission = (roleId: string, permissionId: string) => {
    setRoles((prev) =>
      prev.map((role) => {
        if (role.id !== roleId) return role;
        const hasPermission = role.permissionIds.includes(permissionId);
        return {
          ...role,
          permissionIds: hasPermission
            ? role.permissionIds.filter((id) => id !== permissionId)
            : [...role.permissionIds, permissionId],
        };
      })
    );
  };

  return (
    <main className="page-shell">
      <section className="glass-card p-8 space-y-6">
        <div>
          <p className="mb-1 text-sm text-[var(--muted)]">Role-protected route</p>
          <h1 className="mb-3 text-3xl font-bold">Admin Control Panel</h1>
          <p className="text-[var(--muted)]">
            Manage users, roles, and permissions dynamically with in-browser CRUD.
          </p>
        </div>

        <div className="flex flex-wrap gap-2 border-b border-gray-200 pb-3">
          {[
            { id: "users", label: "Users" },
            { id: "roles", label: "Roles" },
            { id: "permissions", label: "Permissions" },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as AdminTab)}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${activeTab === tab.id ? "bg-black text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === "users" && (
          <div className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <input
                value={newUser.name}
                onChange={(event) => setNewUser((prev) => ({ ...prev, name: event.target.value }))}
                placeholder="Full name"
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
              <input
                value={newUser.email}
                onChange={(event) => setNewUser((prev) => ({ ...prev, email: event.target.value }))}
                placeholder="Email"
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
              <select
                value={newUser.roleId}
                onChange={(event) => setNewUser((prev) => ({ ...prev, roleId: event.target.value }))}
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
              >
                {roles.map((role) => (
                  <option key={role.id} value={role.id}>
                    {role.name}
                  </option>
                ))}
              </select>
              <button type="button" onClick={handleCreateUser} className="rounded-lg bg-black text-white text-sm font-semibold px-4 py-2 hover:bg-gray-800">
                Add User
              </button>
            </div>

            <div className="space-y-2">
              {users.map((user) => {
                const role = roleById.get(user.roleId);
                return (
                  <div key={user.id} className="rounded-lg border border-gray-200 bg-white p-4 flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-black">{user.name}</p>
                      <p className="text-xs text-gray-500">{user.email}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <select
                        value={user.roleId}
                        onChange={(event) =>
                          setUsers((prev) =>
                            prev.map((item) => (item.id === user.id ? { ...item, roleId: event.target.value } : item))
                          )
                        }
                        className="rounded-md border border-gray-300 px-2 py-1 text-xs font-semibold"
                      >
                        {roles.map((item) => (
                          <option key={item.id} value={item.id}>
                            {item.name}
                          </option>
                        ))}
                      </select>
                      <span className="rounded-full px-2 py-1 text-xs font-semibold bg-gray-100 text-gray-700">
                        {role?.permissionIds.length || 0} permissions
                      </span>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={user.active}
                        onClick={() =>
                          setUsers((prev) =>
                            prev.map((item) => (item.id === user.id ? { ...item, active: !item.active } : item))
                          )
                        }
                        className={`inline-flex h-6 w-11 items-center rounded-full border-2 transition-colors ${user.active ? "bg-black border-black" : "bg-gray-200 border-gray-200"}`}
                      >
                        <span className={`h-4 w-4 rounded-full bg-white transition-transform ${user.active ? "translate-x-5" : "translate-x-1"}`} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setUsers((prev) => prev.filter((item) => item.id !== user.id))}
                        className="rounded-md border border-gray-300 px-2 py-1 text-xs font-semibold text-gray-700 hover:bg-gray-100"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === "roles" && (
          <div className="space-y-5">
            <div className="flex gap-3">
              <input
                value={newRoleName}
                onChange={(event) => setNewRoleName(event.target.value)}
                placeholder="Role name"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
              <button type="button" onClick={handleCreateRole} className="rounded-lg bg-black text-white text-sm font-semibold px-4 py-2 hover:bg-gray-800">
                Add Role
              </button>
            </div>

            <div className="space-y-4">
              {roles.map((role) => (
                <article key={role.id} className="rounded-lg border border-gray-200 bg-white p-4 space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="text-sm font-bold text-black">{role.name}</h3>
                    <button
                      type="button"
                      onClick={() => removeRole(role.id)}
                      className="rounded-md border border-gray-300 px-2 py-1 text-xs font-semibold text-gray-700 hover:bg-gray-100"
                    >
                      Delete Role
                    </button>
                  </div>
                  <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {permissions.map((permission) => {
                      const checked = role.permissionIds.includes(permission.id);
                      return (
                        <li key={permission.id} className="flex gap-2 rounded-md border border-gray-100 px-3 py-2">
                          <button
                            type="button"
                            role="switch"
                            aria-checked={checked}
                            onClick={() => toggleRolePermission(role.id, permission.id)}
                            className={`peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 transition-colors ${checked ? "bg-black border-black" : "bg-gray-200 border-gray-200"}`}
                          >
                            <span className={`pointer-events-none block h-5 w-5 rounded-full bg-white shadow-lg ring-0 transition-transform ${checked ? "translate-x-5" : "translate-x-0"}`} />
                          </button>
                          <label className="text-sm font-medium leading-none flex-1 my-auto text-gray-800 cursor-pointer">
                            {permission.label}
                          </label>
                        </li>
                      );
                    })}
                  </ul>
                </article>
              ))}
            </div>
          </div>
        )}

        {activeTab === "permissions" && (
          <div className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <input
                value={newPermission.key}
                onChange={(event) => setNewPermission((prev) => ({ ...prev, key: event.target.value }))}
                placeholder="permissions.key"
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
              <input
                value={newPermission.label}
                onChange={(event) => setNewPermission((prev) => ({ ...prev, label: event.target.value }))}
                placeholder="Permission label"
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
              <input
                value={newPermission.description}
                onChange={(event) => setNewPermission((prev) => ({ ...prev, description: event.target.value }))}
                placeholder="Description"
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
              <button type="button" onClick={handleCreatePermission} className="rounded-lg bg-black text-white text-sm font-semibold px-4 py-2 hover:bg-gray-800">
                Add Permission
              </button>
            </div>

            <div className="space-y-2">
              {permissions.map((permission) => (
                <div key={permission.id} className="rounded-lg border border-gray-200 bg-white p-4 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-black">{permission.label}</p>
                    <p className="text-xs text-gray-500">{permission.key}</p>
                    <p className="text-xs text-gray-400 mt-1">{permission.description}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => removePermission(permission.id)}
                    className="rounded-md border border-gray-300 px-2 py-1 text-xs font-semibold text-gray-700 hover:bg-gray-100"
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
