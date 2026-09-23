import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { login } from "@/lib/api";

export const Route = createFileRoute("/login")({ component: LoginPage });

function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(email, password);
      window.location.assign("/");
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : "Login failed.");
      setSubmitting(false);
    }
  }

  return (
    <AuthLayout title="Welcome back" description="Sign in to your DocuMind workspace.">
      <form className="space-y-4" onSubmit={handleSubmit}>
        <Input aria-label="Email" type="email" placeholder="Email" value={email} onChange={(event) => setEmail(event.target.value)} required />
        <Input aria-label="Password" type="password" placeholder="Password" value={password} onChange={(event) => setPassword(event.target.value)} required />
        <Button className="w-full" type="submit" disabled={submitting}>{submitting ? "Logging in..." : "Log in"}</Button>
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
      </form>
      <p className="mt-6 text-center text-sm text-muted-foreground">New to DocuMind? <Link className="text-primary hover:underline" to="/signup">Create an account</Link></p>
    </AuthLayout>
  );
}

function AuthLayout({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4">
      <section className="w-full max-w-sm rounded-lg border border-border bg-surface p-6 shadow-sm">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">{title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{description}</p>
        <div className="mt-6">{children}</div>
      </section>
    </main>
  );
}