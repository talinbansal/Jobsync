"use client";

import { useRouter, usePathname } from "next/navigation";
import { useContext, useState, useEffect } from "react";

import { TotalPointsContext } from "../(app)/providers/TotalPointsProvider";
import { WebSocketContext } from "../(app)/providers/WebSocketProvider";

export default function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const { totalPoints } = useContext(TotalPointsContext);
  const { unread, setUnread } = useContext(WebSocketContext);

  console.log("Sidebar unread:", unread);

  useEffect(() => {
    const FetchUnreadJobs = async () => {
      try {
        const res = await fetch(`http://localhost:8080/fetch_unread`, {
          method: "GET",
          credentials: "include",
        });

        if (!res.ok) {
          const errorMessage = await res.json();

          throw new Error(`Error: ${errorMessage}`);
        }

        const data = await res.json();
        console.log(`unread size: ${data.unread}`);
        setUnread(data.unread);
      } catch (err) {
        console.error(`Error: ${err}`);
      }
    };

    FetchUnreadJobs();
  }, []);

  const navigateProfilePage = () => {
    router.push("/profile");
  };

  const navigateFoldersPage = () => {
    router.push("/folders");
  };

  const navigateNotificationsPage = () => {
    setUnread(0);
    router.push("/notifications");
  };

  return (
    <aside
      className={`hidden md:flex w-64 h-full flex-col border-r border-slate-200 bg-white p-6`}
    >
      <div>
        <h2 className="text-sm font-semibold text-slate-900">Your Workspace</h2>

        {totalPoints != 100 && (
          <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm font-medium">Profile Setup</p>
            <p className="mt-1 text-2xl font-bold">{totalPoints}%</p>

            <div className="mt-3 h-2 rounded-full bg-slate-200 overflow-hidden">
              <div
                className="h-full bg-slate-900 transition-all"
                style={{ width: `${totalPoints}%` }}
              />
            </div>
          </div>
        )}
      </div>

      <div className="mt-8 flex flex-col gap-2">
        <button
          onClick={() => navigateProfilePage()}
          className={
            pathname === "/profile"
              ? "rounded-xl bg-slate-100 px-4 py-3 text-left text-sm font-medium"
              : "rounded-xl px-4 py-3 text-left text-sm font-medium hover:bg-slate-100"
          }
        >
          Profile
        </button>

        <button
          onClick={navigateNotificationsPage}
          className={
            pathname === "/notifications"
              ? "flex items-center justify-between rounded-xl bg-slate-100 px-4 py-3 text-left text-sm font-medium"
              : "flex items-center justify-between rounded-xl px-4 py-3 text-left text-sm font-medium hover:bg-slate-100"
          }
        >
          <span>Notifications</span>

          {unread > 0 && (
            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 text-xs font-semibold text-white">
              {unread}
            </span>
          )}
        </button>

        <button
          onClick={() => navigateFoldersPage()}
          className={
            pathname === "/folders"
              ? "rounded-xl bg-slate-100 px-4 py-3 text-left text-sm font-medium"
              : "rounded-xl px-4 py-3 text-left text-sm font-medium hover:bg-slate-100"
          }
        >
          Folders
        </button>
      </div>

      <div className="mt-auto rounded-2xl border border-slate-200 bg-slate-50 p-4">
        <p className="text-sm font-medium">Tips</p>

        <p className="mt-2 text-xs leading-5 text-slate-500">
          Add a portfolio and update your skills to improve job matches.
        </p>
      </div>
    </aside>
  );
}
