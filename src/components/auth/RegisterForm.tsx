import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { getErrorMessage } from "../../utils/errorHandler";
import { Button } from "../common/Button";
import { Input } from "../common/Input";

export function RegisterForm() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email);

  const passwordCriteria = {
    length: form.password.length >= 8,
    hasUpper: /[A-Z]/.test(form.password),
    hasLower: /[a-z]/.test(form.password),
    hasNumber: /\d/.test(form.password),
    hasSpecial: /[!@#$%^&*]/.test(form.password),
  };

  const isPasswordValid = Object.values(passwordCriteria).every(Boolean);

  const canSubmit = form.username.trim() && isEmailValid && isPasswordValid;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setError("");

    try {
      await register(form);
      navigate("/");
    } catch (submitError) {
      setError(getErrorMessage(submitError, "Unable to create account."));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="auth-form" onSubmit={handleSubmit}>
      <Input
        label="Username"
        placeholder="Choose a unique username"
        value={form.username}
        onChange={(event) => setForm((current) => ({ ...current, username: event.target.value }))}
        autoFocus
      />
      <div style={{ marginBottom: '16px' }}>
        <Input
          label="Email"
          type="email"
          placeholder="your@email.com"
          value={form.email}
          onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
        />
        {form.email && !isEmailValid && (
          <span className="email-warning" role="alert">
            Please enter a valid email address format.
          </span>
        )}
      </div>

      <div style={{ marginBottom: '16px' }}>
        <Input
          label="Password"
          type="password"
          placeholder="Create a strong password"
          value={form.password}
          onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
        />
        {form.password && (
          <ul className="password-checklist">
            <li className={`password-checklist__item ${passwordCriteria.length ? 'password-checklist__item--met' : ''}`}>
              <span className="password-checklist__icon">{passwordCriteria.length ? '✓' : ''}</span>
              8+ characters
            </li>
            <li className={`password-checklist__item ${passwordCriteria.hasUpper ? 'password-checklist__item--met' : ''}`}>
              <span className="password-checklist__icon">{passwordCriteria.hasUpper ? '✓' : ''}</span>
              At least one uppercase letter
            </li>
            <li className={`password-checklist__item ${passwordCriteria.hasLower ? 'password-checklist__item--met' : ''}`}>
              <span className="password-checklist__icon">{passwordCriteria.hasLower ? '✓' : ''}</span>
              At least one lowercase letter
            </li>
            <li className={`password-checklist__item ${passwordCriteria.hasNumber ? 'password-checklist__item--met' : ''}`}>
              <span className="password-checklist__icon">{passwordCriteria.hasNumber ? '✓' : ''}</span>
              At least one number
            </li>
            <li className={`password-checklist__item ${passwordCriteria.hasSpecial ? 'password-checklist__item--met' : ''}`}>
              <span className="password-checklist__icon">{passwordCriteria.hasSpecial ? '✓' : ''}</span>
              One special character (!@#$%^&*)
            </li>
          </ul>
        )}
      </div>
      {error ? <p className="form-error" role="alert">{error}</p> : null}
      <div style={{ marginTop: '8px' }}>
        <Button disabled={isSubmitting || !canSubmit} type="submit" style={{ width: '100%' }}>
          {isSubmitting ? "Creating account..." : "Create account"}
        </Button>
      </div>
    </form>
  );
}
