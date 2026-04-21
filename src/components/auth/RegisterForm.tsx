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

  const canSubmit = form.username.trim() && form.email.trim() && form.password;

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
      <Input
        label="Email"
        type="email"
        placeholder="your@email.com"
        value={form.email}
        onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
      />
      <Input
        label="Password"
        type="password"
        placeholder="Create a strong password"
        value={form.password}
        onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
      />
      {error ? <p className="form-error" role="alert">{error}</p> : null}
      <div style={{ marginTop: '8px' }}>
        <Button disabled={isSubmitting || !canSubmit} type="submit" style={{ width: '100%' }}>
          {isSubmitting ? "Creating account..." : "Create account"}
        </Button>
      </div>
    </form>
  );
}
