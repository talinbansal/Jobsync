"use client";

import { useContext, useEffect } from "react";
import { WebSocketContext } from "../providers/WebSocketProvider";

export default function ShowNotifications() {
  const { notifs } = useContext(WebSocketContext);

  useEffect(() => {
    const updateJobStatus = async () => {
      try {
        const res = await fetch("http://localhost:8080/update_job_status", {
          method: "PATCH",
          credentials: "include",
        });

        if (!res.ok) {
          const errorMessage = await res.json();

          throw new Error(`Error: ${errorMessage}`);
        }
      } catch (err) {
        console.error(`Error: ${err}`);
      }
    };

    updateJobStatus();
  }, []);

  return (
    <main className="h-full p-8 bg-[#F8FAFC] flex flex-col min-h-0">
      <div className="rounded-3xl border border-slate-200 bg-white p-8 flex flex-col flex-1 min-h-0 overflow-hidden">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold">Application Status</h1>
          <p className="mt-2 text-sm text-slate-500">
            Track the status of your applications.
          </p>
        </div>

        {/* Notifications */}

        {notifs && (
          <div className="mt-6 flex-1 min-h-0 overflow-y-auto pr-2 flex flex-col gap-4">
            {notifs.map((notif) => (
              <div
                key={notif.jobId}
                className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 p-6 transition hover:shadow-md hover:border-slate-300"
              >
                {/* Job Info */}
                <div className="space-y-1">
                  <h2 className="text-lg font-semibold text-slate-900">
                    {notif.jobName}
                  </h2>

                  <p className="text-sm text-slate-500">Application Status</p>
                </div>

                {/* Status Badge */}
                <div
                  className={`
                  rounded-full px-4 py-1.5 text-sm font-medium
                  ${
                    notif.status === "In Review"
                      ? "bg-yellow-500/10 text-yellow-600 ring-1 ring-yellow-500/20"
                      : notif.status === "Interview"
                        ? "bg-green-500/10 text-green-600 ring-1 ring-green-500/20"
                        : notif.status === "Rejected"
                          ? "bg-red-500/10 text-red-600 ring-1 ring-red-500/20"
                          : "bg-slate-200 text-slate-600"
                  }
                `}
                >
                  {notif.status}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
