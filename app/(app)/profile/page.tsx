"use client";

import { useEffect, useState } from "react";
import { userStore } from "../../store/useStore";

export default function ProfilePage() {
  const profileData = userStore((state) => state.setupData);

  if (!profileData) {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-500">
        Loading profile...
      </div>
    );
  }

  return (
    <div>
      {/* MAIN CONTENT */}
      <main className="flex-1 h-full overflow-hidden p-8 bg-[#F8FAFC]">
        {/* WHITE PANEL */}
        <div className="rounded-3xl border border-slate-200 bg-white p-8 h-full flex flex-col overflow-hidden">
          <h1 className="text-2xl font-bold">Profile Overview</h1>

          <p className="mt-2 text-sm text-slate-500">
            Manage your job profile and documents
          </p>

          {/* GRID */}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Resume */}
            <div className="rounded-2xl border border-slate-200 p-5">
              <p className="font-semibold">Resume</p>
              <a
                href={profileData.resume}
                target="_blank"
                className="text-sm text-blue-600 hover:underline"
              >
                View Resume
              </a>
            </div>

            {/* Cover Letter */}
            <div className="rounded-2xl border border-slate-200 p-5">
              <p className="font-semibold">Cover Letter</p>
              <a
                href={profileData.coverLetter}
                target="_blank"
                className="text-sm text-blue-600 hover:underline"
              >
                View Cover Letter
              </a>
            </div>

            {/* Links */}
            <div className="rounded-2xl border border-slate-200 p-5">
              <p className="font-semibold">Links</p>

              <div className="mt-2 text-sm space-y-1">
                <p>
                  GitHub:{" "}
                  <a className="text-blue-600" href={profileData.github}>
                    {profileData.github || "Not set"}
                  </a>
                </p>

                <p>
                  Portfolio:{" "}
                  <a className="text-blue-600" href={profileData.portfolio}>
                    {profileData.portfolio || "Not set"}
                  </a>
                </p>
              </div>
            </div>

            {/* Preferences */}
            <div className="rounded-2xl border border-slate-200 p-5">
              <p className="font-semibold">Job Preferences</p>

              <div className="mt-2 text-sm space-y-1 text-slate-600">
                <p>Work: {profileData.specifics.selectedWorkPref}</p>
                <p>Location: {profileData.specifics.location}</p>
                <p>Experience: {profileData.specifics.experienceLevel}</p>
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                {Object.values(profileData.specifics.selectedRoles || {}).map(
                  (role: string, i: number) => (
                    <span
                      key={i}
                      className="text-xs px-3 py-1 rounded-full bg-slate-100"
                    >
                      {role}
                    </span>
                  ),
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
