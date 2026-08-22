"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface verifyLoginProps {
  email: string;
  password: string;
}

const images = ["/img1.jpg", "/img2.png", "/img3.png"]; // Change images and carousel style

function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const verifyAccount = async ({ email, password }: verifyLoginProps) => {
    try {
      const res = await fetch("http://localhost:8080/verify_login", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.message);
        return;
      }

      if (data.message == "Login successful") {
        router.push("home-page");
      } else {
        alert("Incorrect Email or Password");
      }
    } catch (err) {
      console.error(err);
    }
  };

  // For carousel
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % images.length);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex min-h-screen bg-[#F8FAFC] text-slate-900">
      {/* Left Side */}
      <div className="hidden lg:flex w-1/2 relative flex-col justify-between border-r border-slate-200 bg-white p-12 overflow-hidden">
        {/* Carousel Background */}
        <div className="absolute inset-0">
          {images.map((img, i) => (
            <img
              alt="carousel-img-i"
              key={img}
              src={img}
              className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-1000 ease-in-out ${
                i === index ? "opacity-100 scale-105" : "opacity-0 scale-110"
              }`}
            />
          ))}

          {/* Overlay for readability */}
          <div className="absolute inset-0 bg-linear-to-r from-white via-white/80 to-white/40" />
        </div>

        {/* Top Content */}
        <div className="relative z-10">
          <h1 className="text-3xl font-bold tracking-tight">JobSync</h1>
          <p className="mt-4 max-w-sm text-sm leading-6 text-slate-600">
            Smart recruitment dashboard for managing applications, resume
            analysis, and hiring workflows.
          </p>
        </div>

        {/* Bottom Content */}
        <div className="relative z-10 space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white/70 backdrop-blur p-6">
            <p className="text-sm leading-6 text-slate-700">
              Analyze resumes, match candidates, and streamline recruitment
              decisions through one unified platform.
            </p>
          </div>

          <p className="text-xs text-slate-400">
            © 2026 JobSync. All rights reserved.
          </p>
        </div>
      </div>

      {/* Right Side */}
      <div className="flex w-full items-center justify-center px-6 lg:w-1/2">
        <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 shadow-[0_10px_40px_rgba(0,0,0,0.06)]">
          {/* Header */}
          <div className="mb-8">
            <h2 className="text-3xl font-bold tracking-tight">Welcome back</h2>
            <p className="mt-2 text-sm text-slate-500">
              Sign in to continue to your dashboard.
            </p>
          </div>

          {/* Form */}
          <form
            className="space-y-5"
            onSubmit={(e) => {
              e.preventDefault();
              verifyAccount({ email, password });
            }}
          >
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition-all placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              />
            </div>

            <div>
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
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 pr-16 text-sm outline-none transition-all placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
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
              Sign In
            </button>
          </form>

          {/* Divider */}
          <div className="my-6 flex items-center">
            <div className="h-px flex-1 bg-slate-200"></div>
            <span className="px-3 text-xs uppercase tracking-wider text-slate-400">
              Or
            </span>
            <div className="h-px flex-1 bg-slate-200"></div>
          </div>

          <button
            onClick={() => router.push("/create-account")}
            className="w-full rounded-xl border border-slate-200 bg-white py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            Create Account
          </button>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
