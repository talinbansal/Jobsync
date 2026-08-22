"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface CreateAccountProps {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

function CreatePage() {
  const router = useRouter();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const CreateAccount = async ({
    firstName,
    lastName,
    email,
    password,
  }: CreateAccountProps) => {
    try {
      const res = await fetch("http://localhost:8080/create_account", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          firstName,
          lastName,
          email,
          password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.message);
        return;
      }

      if (data.message == "User created") {
        console.log(data.message);
        localStorage.setItem("email", email);
        router.push("/profile-setup");
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="flex min-h-screen bg-[#F8FAFC] text-slate-900">
      {/* Left Side */}
      <div className="hidden lg:flex w-1/2 flex-col justify-between border-r border-slate-200 bg-white p-12">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">JobSync</h1>
          <p className="mt-4 max-w-sm text-sm leading-6 text-slate-500">
            Smart recruitment dashboard for managing applications, resume
            analysis, and hiring workflows.
          </p>
        </div>
        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
            <p className="text-sm leading-6 text-slate-600">
              Analyze resumes, match candidates, and streamline recruitment
              decisions through one unified platform.
            </p>
          </div>
          <p className="text-xs text-slate-400">
            © 2026 JobSync. All rights reserved.{" "}
          </p>
        </div>
      </div>
      {/* Right Side */}
      <div className="flex w-full items-center justify-center px-6 lg:w-1/2">
        <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 shadow-[0_10px_40px_rgba(0,0,0,0.06)]">
          {/* Header */}
          <div className="mb-8">
            <h2 className="text-3xl font-bold tracking-tight">Welcome</h2>
            <p className="mt-2 text-sm text-slate-500">Create your Account</p>
          </div>
          {/* Form */}
          <form
            className="space-y-5"
            onSubmit={(e) => {
              e.preventDefault();
              CreateAccount({ firstName, lastName, email, password });
            }}
          >
            {/* Name */}
            <div className="flex gap-4">
              <div className="w-1/2">
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  First Name
                </label>

                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="John"
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition-all placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                  required
                />
              </div>

              <div className="w-1/2">
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Last Name
                </label>

                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Doe"
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition-all placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                  required
                />
              </div>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                }}
                placeholder="you@example.com"
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition-all placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                required
              />
            </div>
            <div className="flex flex-col gap-4">
              <div className="mb-2 flex items-center justify-between">
                <label className="text-sm font-medium text-slate-700">
                  Password
                </label>

                <button
                  type="button"
                  className="text-xs text-blue-600 hover:text-blue-500"
                >
                  Forgot password?
                </button>
              </div>

              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                  }}
                  placeholder="Enter your password"
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 pr-16 text-sm outline-none transition-all placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                  required
                />

                <button
                  type="button"
                  onClick={() => {
                    setShowPassword(!showPassword);
                  }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-medium text-slate-500 hover:text-slate-700"
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
              {/* Password Confirmation */}
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={confirmPass}
                  onChange={(e) => {
                    setConfirmPass(e.target.value);
                  }}
                  placeholder="Confirm your password"
                  className={`w-full rounded-xl border bg-white px-4 py-3 pr-16 text-sm outline-none transition-all placeholder:text-slate-400 ${
                    password === confirmPass
                      ? "border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                      : "border-red-500 focus:border-red-500 focus:ring-4 focus:ring-red-100"
                  }`}
                  required
                />

                <button
                  type="button"
                  onClick={() => {
                    setShowPassword(!showPassword);
                  }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-medium text-slate-500 hover:text-slate-700"
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>
            <button
              type="submit"
              className="w-full rounded-xl bg-slate-900 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              Create Account
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default CreatePage;
