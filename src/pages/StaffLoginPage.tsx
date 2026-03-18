import { useState, type FormEvent } from "react";
import { api } from "../api";
import type { AlertToastState } from "../hooks/useAlertToast";
import { useAdminSession } from "../hooks/useAdminSession";

type StaffLoginPageProps = {
  onToast: (toast: AlertToastState) => void;
};

export const StaffLoginPage = ({ onToast }: StaffLoginPageProps) => {
  const { setToken } = useAdminSession();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    try {
      const result = await api.adminLogin({ username, password });
      setToken(result.token);
      onToast({ type: "success", message: "Welcome back, admin." });
    } catch {
      onToast({ type: "error", message: "Invalid admin credentials." });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="page staff-login">
      <div className="page-header">
        <h2>Staff Login</h2>
        <p className="muted">Use your admin credentials to access orders.</p>
      </div>

      <div className="staff-login__card">
        <form className="form-grid" onSubmit={handleSubmit}>
          <label>
            Username
            <input
              placeholder="admin"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              type="text"
              required
            />
          </label>
          <label>
            Password
            <input
              placeholder="Enter password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              type="password"
              required
            />
          </label>
          <label className="staff-login__row">
            <input type="checkbox" />
            Remember this device
          </label>
          <button className="primary primary--wide" type="submit" disabled={submitting}>
            {submitting ? "Signing In..." : "Sign In"}
          </button>
          <button className="ghost" type="button">
            Forgot Password
          </button>
        </form>
      </div>
    </section>
  );
};
