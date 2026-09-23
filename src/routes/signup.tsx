import { type FormEvent, useState } from "react";
import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { signup } from "../lib/api";

export const Route = createFileRoute("/signup")({
  component: SignupPage,
});

function SignupPage() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSignup(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setError("");

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setLoading(true);

    try {
      await signup(email, password);
      navigate({ to: "/" });
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to create your account."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#f6f8f7] flex">

      {/* LEFT PANEL */}
      <div className="hidden lg:flex lg:w-[52%] bg-[#075e61] text-white relative overflow-hidden">
        <div className="absolute -top-32 -left-32 w-[450px] h-[450px] rounded-full bg-[#0d7779] opacity-40" />
        <div className="absolute -bottom-40 -right-32 w-[550px] h-[550px] rounded-full bg-[#043f42] opacity-50" />

        <div className="relative z-10 flex flex-col justify-between p-14 w-full">

          {/* LOGO */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center">
              <span className="text-xl font-bold">D</span>
            </div>

            <div>
              <div className="text-lg font-semibold">
                DocuMind
              </div>

              <div className="text-xs text-white/50">
                Product Documentation Assistant
              </div>
            </div>
          </div>

          {/* HERO */}
          <div className="max-w-xl">

            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/10 text-sm text-white/80 mb-6">
              <span className="w-2 h-2 rounded-full bg-emerald-300" />
              AI-powered documentation
            </div>

            <h1 className="text-5xl font-semibold leading-[1.08] tracking-tight">
              Your documentation.
              <br />
              <span className="text-emerald-200">
                One intelligent assistant.
              </span>
            </h1>

            <p className="mt-6 text-lg leading-8 text-white/65 max-w-lg">
              Upload product documentation, search across your knowledge
              base, and get grounded answers with source citations.
            </p>

            {/* FEATURES */}
            <div className="mt-10 space-y-5">

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 shrink-0 rounded-lg bg-white/10 flex items-center justify-center">
                  <span className="text-lg">⌕</span>
                </div>

                <div>
                  <p className="font-medium">
                    Intelligent retrieval
                  </p>

                  <p className="text-sm text-white/50 mt-1">
                    Find relevant information across your documentation.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 shrink-0 rounded-lg bg-white/10 flex items-center justify-center">
                  <span className="text-lg">✦</span>
                </div>

                <div>
                  <p className="font-medium">
                    Grounded AI answers
                  </p>

                  <p className="text-sm text-white/50 mt-1">
                    Responses are based on your indexed documentation.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 shrink-0 rounded-lg bg-white/10 flex items-center justify-center">
                  <span className="text-lg">↗</span>
                </div>

                <div>
                  <p className="font-medium">
                    Built for product teams
                  </p>

                  <p className="text-sm text-white/50 mt-1">
                    Keep product knowledge searchable and accessible.
                  </p>
                </div>
              </div>

            </div>
          </div>

          <p className="text-xs text-white/35">
            DocuMind Cloud
          </p>

        </div>
      </div>

      {/* RIGHT PANEL */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">

        <div className="w-full max-w-md">

          {/* MOBILE LOGO */}
          <div className="flex items-center gap-2 mb-10 lg:hidden">
            <div className="w-9 h-9 rounded-lg bg-[#075e61] text-white flex items-center justify-center font-bold">
              D
            </div>

            <span className="font-semibold text-xl text-slate-900">
              DocuMind
            </span>
          </div>

          {/* HEADING */}
          <div className="mb-8">
            <div className="text-xs font-semibold tracking-widest text-[#075e61] mb-3">
              GET STARTED
            </div>

            <h2 className="text-3xl font-semibold tracking-tight text-slate-900">
              Create your account
            </h2>

            <p className="mt-2 text-slate-500">
              Start building your documentation workspace.
            </p>
          </div>

          {/* FORM */}
          <form onSubmit={handleSignup} className="space-y-5">

            {/* EMAIL */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Email address
              </label>

              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                required
                autoComplete="email"
                className="
                  w-full h-12 px-4 rounded-xl
                  border border-slate-200
                  bg-white
                  text-slate-900
                  placeholder:text-slate-400
                  outline-none
                  transition
                  focus:border-[#075e61]
                  focus:ring-4
                  focus:ring-[#075e61]/10
                "
              />
            </div>

            {/* PASSWORD */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-slate-700">
                  Password
                </label>

                <span className="text-xs text-slate-400">
                  8+ characters
                </span>
              </div>

              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Create a secure password"
                required
                minLength={8}
                autoComplete="new-password"
                className="
                  w-full h-12 px-4 rounded-xl
                  border border-slate-200
                  bg-white
                  text-slate-900
                  placeholder:text-slate-400
                  outline-none
                  transition
                  focus:border-[#075e61]
                  focus:ring-4
                  focus:ring-[#075e61]/10
                "
              />
            </div>

            {/* ERROR */}
            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                {error}
              </div>
            )}

            {/* BUTTON */}
            <button
              type="submit"
              disabled={loading}
              className="
                w-full h-12 rounded-xl
                bg-[#075e61]
                text-white
                font-medium
                shadow-sm
                transition
                hover:bg-[#064f52]
                hover:shadow-md
                disabled:opacity-60
                disabled:cursor-not-allowed
              "
            >
              {loading ? "Creating account..." : "Create account"}
            </button>

          </form>

          {/* LOGIN */}
          <p className="text-center text-sm text-slate-500 mt-7">
            Already have an account?{" "}
            <Link
              to="/login"
              className="font-medium text-[#075e61] hover:underline"
            >
              Log in
            </Link>
          </p>

          {/* FOOTER */}
          <div className="mt-10 pt-6 border-t border-slate-200">
            <p className="text-xs text-center text-slate-400">
              Your account is protected with secure server-side
              authentication.
            </p>
          </div>

        </div>
      </div>

    </div>
  );
}