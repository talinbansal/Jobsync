"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

interface JobProps {
  id: number;
  job_id: string;
  title: string;
  company: string;
  location: string;
  work_type: string;
  experience_level: string;
  salary: string;
  description: string;
  posted_at: string;
  applied_at: string;
}

export default function AppliedJobs() {
  const router = useRouter();
  const pageSize = 6;
  const [nextCursor, setNextCursor] = useState("");
  const [cursor, setCursor] = useState("");
  const [cursorHistory, setCursorHistory] = useState<string[]>([""]);
  const [page, setPage] = useState(1);
  const [nextPageExists, setNextPageExists] = useState<boolean | null>(null);
  const [appliedJobs, setAppliedJobs] = useState<JobProps[]>([]);

  // Converting Time ---------------------------------------------------
  const timeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);

    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    const intervals = [
      { label: "year", seconds: 31536000 },
      { label: "month", seconds: 2592000 },
      { label: "day", seconds: 86400 },
      { label: "hour", seconds: 3600 },
      { label: "minute", seconds: 60 },
    ];

    for (const i of intervals) {
      const count = Math.floor(seconds / i.seconds);
      if (count >= 1) {
        return `${count} ${i.label}${count !== 1 ? "s" : ""} ago`;
      }
    }

    return "just now";
  };
  // ----------------------------------------------------------------------

  // Fetching Job Applications  ----------------------------------------------------------------------
  useEffect(() => {
    const fetchAppliedJobs = async () => {
      try {
        const res = await fetch(
          `http://localhost:8080/fetch_applied_jobs?limit=${pageSize}&cursor=${cursor}`,
          {
            method: "GET",
            credentials: "include",
          },
        );

        if (!res.ok) {
          throw new Error(`Error: ${res.status}`);
        }

        const data = await res.json();
        setAppliedJobs(data.applied_jobs);
        setNextCursor(data.nextCursor);
        setNextPageExists(data.nextPage);

        console.log(data);
      } catch (err) {
        console.error(`Error: ${err}`);
      }
    };

    fetchAppliedJobs();
  }, [cursor]);
  // ----------------------------------------------------------------------

  const handlePrev = () => {
    if (cursorHistory.length <= 1) return;

    const newHistory = [...cursorHistory];
    newHistory.pop();

    const prevCursor = newHistory[newHistory.length - 1];

    setCursorHistory(newHistory);
    setCursor(prevCursor);
    setPage((p) => p - 1);
  };

  const handleNext = () => {
    if (!nextCursor) return;
    setCursorHistory((prev) => [...prev, nextCursor]);
    setCursor(nextCursor);
    setPage((p) => p + 1);
  };

  const handleViewJob = (job: JobProps) => {
    router.push(`/jobs/${job.job_id}`);
  };

  return (
    <main className="h-full p-8 bg-[#F8FAFC] flex flex-col min-h-0">
      <div className="rounded-3xl border border-slate-200 bg-white p-8 flex flex-col flex-1 min-h-0 overflow-hidden">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold">Job Applications</h1>
            <p className="mt-2 text-sm text-slate-500">
              Browse the Jobs you have Applied to.
            </p>
          </div>

          <span className="text-sm text-slate-400">Page {page}</span>
        </div>

        {/* Jobs */}
        <div className="mt-6 flex-1 min-h-0 overflow-y-auto pr-2 flex flex-col gap-5">
          {appliedJobs.map((job) => (
            <div
              key={job.job_id}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-6 transition hover:shadow-md hover:border-slate-300"
            >
              {/* Header */}
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">
                    {job.title}
                  </h2>
                  <p className="text-sm text-slate-500">{job.company}</p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-slate-200 px-3 py-1 text-xs text-slate-600">
                    {job.work_type}
                  </span>
                </div>
              </div>

              {/* Meta */}
              <div className="mt-4 flex flex-wrap gap-4 text-sm text-slate-600">
                <span>📍 {job.location}</span>
                <span>🎯 {job.experience_level}</span>
                <span>💰 {job.salary}</span>
                <span>🕒 {timeAgo(job.posted_at)}</span>
              </div>

              {/* Description */}
              <p className="mt-4 text-sm leading-relaxed text-slate-600 line-clamp-2">
                {job.description}
              </p>

              {/* Footer */}
              <div className="mt-5 flex justify-end">
                <button
                  onClick={() => handleViewJob(job)}
                  className="rounded-xl bg-slate-900 px-4 py-2 text-sm text-white hover:bg-slate-700"
                >
                  View Job
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* PAGINATION FOOTER */}
        <div className="mt-4 flex items-center justify-between border-t border-slate-200 pt-4">
          <button
            onClick={handlePrev}
            disabled={page === 1}
            className="px-4 py-2 text-sm rounded-xl border border-slate-300 disabled:opacity-40"
          >
            ← Prev
          </button>

          <span className="text-sm text-slate-500">Page {page}</span>

          <button
            onClick={handleNext}
            disabled={!nextPageExists}
            className="px-4 py-2 text-sm rounded-xl bg-slate-900 text-white disabled:opacity-40"
          >
            Next →
          </button>
        </div>
      </div>
    </main>
  );
}
