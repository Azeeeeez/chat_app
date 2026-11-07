import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { ApiError } from "../services/api";
import "../components/shared.css";
import "./LoginPage.css";

interface LoginPageProps {
  mode: "login" | "register" | "forgot-password" | "reset-password";
}

export default function LoginPage({ mode }: LoginPageProps) {
  const { login, register, forgotPassword, resetPassword } = useAuth();
  const { token  = ""} = useParams();
  const [identifier, setIdentifier] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      if (mode === "login") {
        await login(identifier, password);
      } else if (mode === "register") {
        await register(username, email, password);
      } else if (mode === "forgot-password") {
        await forgotPassword(email);
        setSubmitted(true);
      } else {
        await resetPassword(password, token);
        setSubmitted(true);
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  const titles = {
    login: "Welcome back",
    register: "Create an account",
    "forgot-password": "Reset your password",
    "reset-password": "Choose a new password",
  };

  const submitLabels = {
    login: "Log in",
    register: "Sign up",
    "forgot-password": "Send reset link",
    "reset-password": "Reset password",
  };

  return (
    <div className="login-shell">
      <section className="login-hero">
        <p className="login-hero-eyebrow">real-time messaging</p>
        <h1 className="login-hero-title">
          Every conversation,
          <br />
          <em>as it happens.</em>
        </h1>
        <p className="login-hero-copy">
          Thread keeps a live thread going — who's online, who's typing, and what
          you missed while your tab was closed.
        </p>
      </section>

      <section className="login-form-panel">
        {submitted && mode === "forgot-password" ? (
          <div className="login-form">
            <h2 className="login-form-title">Check your email</h2>
            <p>If an account exists for that email, we've sent a link to reset your password.</p>
            <Link to="/login" className="login-switch">Back to login</Link>
          </div>
        ) : submitted && mode === "reset-password" ? (
          <div className="login-form">
            <h2 className="login-form-title">Password updated</h2>
            <p>You can now log in with your new password.</p>
            <Link to="/login" className="login-switch">Log in</Link>
          </div>
        ) : (
          <form className="login-form" onSubmit={handleSubmit}>
            <h2 className="login-form-title">{titles[mode]}</h2>

            {mode === "login" && (
              <div className="field">
                <label htmlFor="identifier">Username or email</label>
                <input
                  id="identifier"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  required
                  autoComplete="username"
                />
              </div>
            )}

            {mode === "register" && (
              <>
                <div className="field">
                  <label htmlFor="username">Username</label>
                  <input
                    id="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    minLength={3}
                    maxLength={24}
                    required
                    autoComplete="username"
                  />
                </div>
                <div className="field">
                  <label htmlFor="email">Email</label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                  />
                </div>
              </>
            )}

            {(mode === "forgot-password" || mode === "reset-password") && (
              <div className="field">
                <label htmlFor="email">Email</label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </div>
            )}

            {mode !== "forgot-password" && (
              <div className="field">
                <label htmlFor="password">{mode === "reset-password" ? "New password" : "Password"}</label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  minLength={6}
                  required
                  autoComplete={mode === "login" ? "current-password" : "new-password"}
                />
              </div>
            )}

            {error && <p className="login-error">{error}</p>}

            <button className="btn btn-primary" type="submit" disabled={submitting}>
              {submitting ? "Please wait…" : submitLabels[mode]}
            </button>

            <Link
              to={mode === "login" ? "/register" : mode === "register" ? "/login" : "/login"}
              className="login-switch"
            >
              {mode === "login"
                ? "Need an account? Sign up"
                : mode === "register"
                ? "Already have an account? Log in"
                : "Remember your password? Log in"}
            </Link>

            {mode === "login" && (
              <Link to="/forgot-password" className="login-switch">
                Forgot your password?
              </Link>
            )}
          </form>
        )}
      </section>
    </div>
  );
}