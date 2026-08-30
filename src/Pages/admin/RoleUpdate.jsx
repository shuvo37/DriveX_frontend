import { useState } from "react";
import axios from "axios";
import styles from "../admin/CSS/RoleUpdate.module.css";

const ROLES = ["ADMIN", "USER", "STUFF"];

function RoleUpdate() {
  const [email, setEmail] = useState("");
  const [user, setUser] = useState(null);
  const [selectedRole, setSelectedRole] = useState("");
  const [searching, setSearching] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const handleSearch = async () => {
    if (!email.trim()) return;
    setSearching(true);
    setError("");
    setUser(null);
    setSaved(false);

    try {
      const res = await axios.get("http://localhost:8080/api/auth/get-user-by-email", {
        params: { email },
      });
      setUser(res.data);
      setSelectedRole(res.data.role);
    } catch (err) {
      setError(
        err.response
          ? (typeof err.response.data === "string" ? err.response.data : "User not found")
          : "Server is not running. Please try again."
      );
    } finally {
      setSearching(false);
    }
  };

  const handleUpdateRole = async () => {
    setUpdating(true);
    setError("");

    try {
      const res = await axios.patch("http://localhost:8080/api/auth/role-update",{} ,  {
        params:{
        email: user.email,
        role: selectedRole
        }
      });
      setUser(res.data);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(
        err.response
          ? (typeof err.response.data === "string" ? err.response.data : JSON.stringify(err.response.data))
          : "Server is not running. Please try again."
      );
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.formCard}>
        <h3>Find User by Email</h3>
        <div className={styles.emailSearchRow}>
          <input
            className={styles.searchInput}
            type="text"
            placeholder="Enter user email..."
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          />
          <button className={styles.btnSubmit} onClick={handleSearch} disabled={searching}>
            {searching ? "Searching..." : "Search"}
          </button>
        </div>

        {error && <div className={styles.errorMsg}>❌ {error}</div>}

        {!user && !error && (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>👤</div>
            <h3>No User Selected</h3>
            <p>Enter an email above to look up a user</p>
          </div>
        )}

        {user && (
          <>
            <div className={styles.infoGrid}>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Name</span>
                <span className={styles.infoValue}>{user.firstName} {user.lastName}</span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Email</span>
                <span className={styles.infoValue}>{user.email}</span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Current Role</span>
                <span className={styles.infoValue}>{user.role}</span>
              </div>
            </div>

            <div className={styles.roleSelectBox}>
              <label>Change Role</label>
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
              >
                {ROLES.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>

              <button
                className={styles.btnSubmit}
                onClick={handleUpdateRole}
                disabled={updating || selectedRole === user.role}
              >
                {updating ? "Updating..." : "Update Role"}
              </button>
            </div>

            {saved && <div className={styles.deletedMsg}>✅ Role updated successfully!</div>}
          </>
        )}
      </div>
    </div>
  );
}

export default RoleUpdate;