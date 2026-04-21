import { useState, type FormEvent } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { getErrorMessage } from "../../utils/errorHandler";
import { Button } from "../common/Button";
import { Input } from "../common/Input";

export function LoginForm() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setError("");

    try {
      await login({ username, password });
      const nextPath = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname || "/";
      navigate(nextPath);
    } catch (submitError) {
      setError(getErrorMessage(submitError, "Unable to login."));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="auth-form" onSubmit={handleSubmit}>
      <Input
        label="Username"
        placeholder="Enter your username"
        value={username}
        onChange={(event) => setUsername(event.target.value)}
        autoFocus
      />
      <Input
        label="Password"
        type="password"
        placeholder="Enter your password"
        value={password}
        onChange={(event) => setPassword(event.target.value)}
      />
      {error ? <p className="form-error" role="alert">{error}</p> : null}
      <div style={{ marginTop: '8px' }}>
        <Button disabled={isSubmitting || !username.trim() || !password} type="submit" style={{ width: '100%' }}>
          {isSubmitting ? "Signing in..." : "Sign in"}
        </Button>
      </div>
    </form>
  );
}
