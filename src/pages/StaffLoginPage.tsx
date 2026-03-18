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
  const [otp, setOtp] = useState("");
  const [otpRequested, setOtpRequested] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    try {
      if (!otpRequested) {
        await api.adminRequestOtp({ username, password });
        setOtpRequested(true);
        onToast({ type: "success", message: "OTP sent to rashmijee@rediffmail.com" });
      } else {
        const result = await api.adminLogin({ username, password, otp });
        setToken(result.token);
        onToast({ type: "success", message: "Welcome back, owner." });
      }
    } catch {
      onToast({
        type: "error",
        message: otpRequested ? "Invalid OTP or credentials." : "Invalid owner credentials."
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="page staff-login">
      <div className="page-header staff-login__header">
        <span className="eyebrow">Secure Access</span>
        <h2>Owner Login</h2>
        <p className="muted">Only the owner can sign in.</p>
      </div>

      <div className="staff-login__card">
        <form className="form-grid staff-login__form" onSubmit={handleSubmit}>
          <label>
            Username
            <input
              placeholder="admin"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              type="text"
              autoComplete="username"
              required
            />
          </label>
          <label>
            Password
            <div className="staff-login__password-wrap">
              <input
                placeholder="Enter password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                required
              />
              <button
                className="staff-login__toggle"
                type="button"
                onClick={() => setShowPassword((value) => !value)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
          </label>
          {otpRequested ? (
            <label>
              OTP
              <input
                placeholder="Enter 6-digit OTP"
                value={otp}
                onChange={(event) => setOtp(event.target.value.replace(/\D/g, "").slice(0, 6))}
                type="text"
                inputMode="numeric"
                maxLength={6}
                required
              />
            </label>
          ) : null}
          <p className="staff-login__row">OTP is sent to rashmijee@rediffmail.com.</p>
          <button className="primary primary--wide" type="submit" disabled={submitting}>
            {submitting ? "Please wait..." : otpRequested ? "Verify OTP & Sign In" : "Send OTP"}
          </button>
          {otpRequested ? (
            <button
              className="ghost staff-login__ghost"
              type="button"
              onClick={() => {
                setOtpRequested(false);
                setOtp("");
              }}
            >
              Edit Username / Password
            </button>
          ) : null}
        </form>
      </div>
    </section>
  );
};
