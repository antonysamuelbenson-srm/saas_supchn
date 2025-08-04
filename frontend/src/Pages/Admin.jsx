import React, { useEffect, useState } from "react";
import axios from "axios";

const AdminUserManager = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [newRole, setNewRole] = useState("");
  const token = localStorage.getItem("token");

  const headers = {
    Authorization: `Bearer ${token}`,
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await axios.get("http://127.0.0.1:5500/admin/users", { headers });
      setUsers(res.data);
    } catch (err) {
      console.error("Failed to fetch users", err);
    } finally {
      setLoading(false);
    }
  };

  const changeUserRole = async () => {
    if (!selectedUser || !newRole) return;
    try {
      await axios.put(
        `http://127.0.0.1:5500/admin/user/${selectedUser.role_user_id}/role`,
        { role: newRole },
        { headers }
      );
      alert("Role updated successfully.");
      fetchUsers();
      setSelectedUser(null);
      setNewRole("");
    } catch (err) {
      console.error("Failed to update role", err);
      alert("Failed to update role.");
    }
  };

  const deleteUser = async (user) => {
    if (!window.confirm(`Are you sure you want to delete ${user.email}?`)) return;
    try {
      await axios.delete(`http://127.0.0.1:5500/admin/user/${user.role_user_id}`, { headers });
      alert("User deleted successfully.");
      fetchUsers();
    } catch (err) {
      console.error("Failed to delete user", err);
    }
  };

  const deactivateUser = async (user) => {
    try {
      await axios.post(
        `http://127.0.0.1:5500/admin/user/${user.role_user_id}/deactivate`,
        {},
        { headers }
      );
      alert("User deactivated successfully.");
      fetchUsers();
    } catch (err) {
      console.error("Failed to deactivate user", err);
    }
  };

  if (loading) return <div className="text-center mt-10">Loading users...</div>;

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Admin Panel - Manage Users</h2>
      <div className="overflow-x-auto">
        <table className="table table-zebra w-full">
          <thead>
            <tr>
              <th>Email</th>
              <th>Role</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.role_user_id}>
                <td>{user.email}</td>
                <td>{user.role}</td>
                <td className="flex gap-2">
                  <button
                    className="btn btn-xs btn-info"
                    onClick={() => setSelectedUser(user)}
                  >
                    Change Role
                  </button>
                  <button
                    className="btn btn-xs btn-warning"
                    onClick={() => deactivateUser(user)}
                  >
                    Deactivate
                  </button>
                  <button
                    className="btn btn-xs btn-error"
                    onClick={() => deleteUser(user)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedUser && (
        <div className="mt-6 p-4 bg-base-200 rounded-lg">
          <h3 className="text-lg font-semibold mb-2">
            Change Role for: {selectedUser.email}
          </h3>
          <div className="flex items-center gap-4">
            <input
              type="text"
              placeholder="Enter new role (e.g., admin, viewer)"
              className="input input-bordered w-full max-w-xs"
              value={newRole}
              onChange={(e) => setNewRole(e.target.value)}
            />
            <button className="btn btn-primary" onClick={changeUserRole}>
              Update Role
            </button>
            <button className="btn" onClick={() => setSelectedUser(null)}>
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUserManager;