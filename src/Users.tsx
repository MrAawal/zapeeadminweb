import React, { useEffect, useState } from "react";

// Define user type
interface User {
  userId: string;
  phone: string;
  walletBalance: number;
  notactive: boolean;
  createdTimestamp: string; // e.g. "20 August 2025 at 21:16:49 UTC+5:30"
  fcmToken: string;
  username: string | null;
}

export default function UsersPage() {
  const [searchUser, setSearchUser] = useState("");
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch users from API
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await fetch("/api/users"); // <-- replace with your API URL
        const data: User[] = await res.json();

        // Filter users created today
        const today = new Date().toDateString();
        const todayUsers = data.filter((user) => {
          const createdDate = new Date(user.createdTimestamp).toDateString();
          return createdDate === today;
        });

        setUsers(todayUsers);
      } catch (err) {
        console.error("Error fetching users:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  // Filter by search
  const filteredUsers = users.filter(
    (user) =>
      user.phone.includes(searchUser) ||
      (user.userId && user.userId.includes(searchUser))
  );

  return (
    <div className="layout">
      {/* Sidebar */}
      <aside className="sidebar">
        <h2>ZAPEE Admin</h2>
        <ul>
          <li>Dashboard</li>
          <li>Orders</li>
          <li className="active">Users</li>
          <li>Payments</li>
          <li>Settings</li>
        </ul>
      </aside>

      {/* Main content */}
      <div className="main">
        {/* Header */}
        <header className="header">
          <h1>Users Created Today</h1>
          <input
            type="text"
            placeholder="Search by phone or user ID"
            value={searchUser}
            onChange={(e) => setSearchUser(e.target.value)}
          />
        </header>

        {/* Users Grid */}
        <div className="user-grid">
          {loading ? (
            <p>Loading users...</p>
          ) : filteredUsers.length > 0 ? (
            filteredUsers.map((user) => (
              <div key={user.userId} className="user-card">
                <h3>User ID: {user.userId}</h3>
                <p>
                  <strong>Phone:</strong> {user.phone}
                </p>
                <p>
                  <strong>Wallet:</strong> ₹{user.walletBalance}
                </p>
                <p>
                  <strong>Status:</strong>{" "}
                  {user.notactive ? "Inactive" : "Active"}
                </p>
                <p>
                  <strong>Created:</strong> {user.createdTimestamp}
                </p>
                <p>
                  <strong>Username:</strong> {user.username || "N/A"}
                </p>
                <p>
                  <strong>FCM Token:</strong>{" "}
                  <small>{user.fcmToken.substring(0, 30)}...</small>
                </p>
              </div>
            ))
          ) : (
            <p style={{ marginTop: 20 }}>No users created today</p>
          )}
        </div>

        {/* Footer */}
        <footer className="footer">
          <p>© 2025 ZAPEE. All rights reserved.</p>
        </footer>
      </div>

      {/* Styles */}
      <style>{`
        .layout {
          display: flex;
          height: 100vh;
        }
        .sidebar {
          width: 220px;
          background: #016123;
          color: white;
          padding: 20px;
          flex-shrink: 0;
        }
        .sidebar h2 {
          margin-bottom: 20px;
        }
        .sidebar ul {
          list-style: none;
          padding: 0;
        }
        .sidebar li {
          padding: 10px;
          cursor: pointer;
          border-radius: 6px;
        }
        .sidebar li.active,
        .sidebar li:hover {
          background: #024a1b;
        }
        .main {
          flex: 1;
          display: flex;
          flex-direction: column;
        }
        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 15px 20px;
          border-bottom: 1px solid #ddd;
          background: #fff;
        }
        .header input {
          padding: 8px 12px;
          font-size: 14px;
          border: 1px solid #ccc;
          border-radius: 8px;
          width: 300px;
        }
        .user-grid {
          flex: 1;
          padding: 20px;
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 20px;
          overflow-y: auto;
        }
        .user-card {
          background: #fff;
          border-radius: 12px;
          padding: 20px;
          box-shadow: 0 3px 6px rgba(0, 0, 0, 0.1);
        }
        .user-card h3 {
          margin-top: 0;
          margin-bottom: 10px;
          font-size: 16px;
          color: #016123;
        }
        .footer {
          padding: 10px;
          text-align: center;
          background: #f5f5f5;
          border-top: 1px solid #ddd;
        }
      `}</style>
    </div>
  );
}
