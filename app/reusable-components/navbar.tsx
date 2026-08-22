"use client";

import { useRouter, usePathname } from "next/navigation";

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();

  const navigateHomePage = () => {
    router.push("/home-page");
  };

  const navigateSavedPage = () => {
    router.push("/saved-jobs");
  };

  const navigateApplicationsPage = () => {
    router.push("/job-applications");
  };

  return (
    <nav className="sticky top-0 z-50 border-b border-slate-200 bg-white/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <div className="flex items-center gap-8">
          <h1 className="text-xl font-bold tracking-tight">JobSync</h1>

          <div className="hidden md:flex items-center gap-1">
            <button
              onClick={() => navigateHomePage()}
              className={
                pathname === "/home-page"
                  ? "rounded-lg bg-slate-100 px-4 py-2 text-sm font-medium"
                  : "rounded-lg px-4 py-2 text-sm font-medium text-slate-500 hover:bg-slate-100"
              }
            >
              Jobs
            </button>
            <button
              onClick={() => navigateSavedPage()}
              className={
                pathname === "/saved-jobs"
                  ? "rounded-lg bg-slate-100 px-4 py-2 text-sm font-medium"
                  : "rounded-lg px-4 py-2 text-sm font-medium text-slate-500 hover:bg-slate-100"
              }
            >
              Saved
            </button>
            <button
              onClick={() => navigateApplicationsPage()}
              className={
                pathname === "/job-applications"
                  ? "rounded-lg bg-slate-100 px-4 py-2 text-sm font-medium"
                  : "rounded-lg px-4 py-2 text-sm font-medium text-slate-500 hover:bg-slate-100"
              }
            >
              Applications
            </button>
            <button className="rounded-lg px-4 py-2 text-sm font-medium text-slate-500 hover:bg-slate-100">
              Interviews
            </button>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-900 text-white text-sm font-semibold">
            T
          </div>
        </div>
      </div>
    </nav>
  );
}
