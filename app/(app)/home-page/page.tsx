"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { userStore } from "../../store/useStore";

import { Bookmark } from "lucide-react";

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
}

function HomePage() {
  const router = useRouter();
  const [jobs, setJobs] = useState<JobProps[]>([]);
  const pageSize = 6;
  const [nextCursor, setNextCursor] = useState("");
  const [cursor, setCursor] = useState("");
  const [cursorHistory, setCursorHistory] = useState<string[]>([""]);
  const [page, setPage] = useState(1);
  const [nextPageExists, setNextPageExists] = useState<boolean | null>(null);

  const [savedJobs, setSavedJobs] = useState(new Set<string>());

  // Bookmark animation ------------------------------------------------
  const [bookmarkAnimating, setBookmarkAnimating] = useState<{
    id: string;
    action: "save" | "remove";
  } | null>(null);

  const handleSaveClick = (jobId: string) => {
    const isSaved = savedJobs.has(jobId);

    setBookmarkAnimating({
      id: jobId,
      action: isSaved ? "remove" : "save",
    });

    setTimeout(() => {
      toggleSaved(jobId);
    }, 250);

    setTimeout(() => {
      setBookmarkAnimating(null);
    }, 700);
  };
  // ------------------------------------------------------------------

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

  // Fetching Profile Data ---------------------------------------------------
  useEffect(() => {
    const fetchProfilePage = async () => {
      try {
        const res = await fetch("http://localhost:8080/fetch_profile_data", {
          method: "GET",
          credentials: "include",
        });

        if (!res.ok) {
          throw new Error(`Error: ${res.status}`);
        }

        const data = await res.json();
        // No profile/setup data yet
        if (!data.setup_data) {
          userStore.getState().setSetupData(null);
          return;
        }

        const specifics = data.setup_data.specifics;

        let parsed = null;

        if (specifics) {
          try {
            parsed = specifics ? JSON.parse(specifics) : null;
          } catch (e) {
            console.error("Failed to parse specifics:", e);
          }
        }

        const cleanSetupData = {
          ...data.setup_data,
          specifics: parsed,
        };

        const setSetupData = userStore.getState().setSetupData;

        setSetupData(cleanSetupData);
      } catch (err) {
        console.error(`error: ${err}`);
      }
    };

    fetchProfilePage();
  }, []);
  // ------------------------------------------------------------------------------------

  // Fetching Jobs ----------------------------------------------------------------------
  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const res = await fetch(
          `http://localhost:8080/fetch_jobs?&limit=${pageSize}&cursor=${cursor}`,
          {
            method: "GET",
            credentials: "include",
          },
        );

        if (!res.ok) {
          throw new Error(`Error: ${res.status}`);
        }

        const data = await res.json();
        setJobs(data.jobs);
        setNextCursor(data.nextCursor);
        setNextPageExists(data.nextPage);
      } catch (err) {
        console.error(`Error: ${err}`);
      }
    };

    fetchJobs();
  }, [cursor]);
  // ----------------------------------------------------------------------

  const toggleSaved = (jobId: string) => {
    setSavedJobs((prev) => {
      const updated = new Set(prev);

      if (updated.has(jobId)) {
        updated.delete(jobId);
        deleteSavedJob(jobId);
      } else {
        updated.add(jobId);
        handleSavedJob(jobId);
      }

      return updated;
    });
  };

  // Fetching Saved Jobs ----------------------------------------------------------------------
  useEffect(() => {
    const fetchSavedJobs = async () => {
      try {
        const res = await fetch(`http://localhost:8080/fetch_saved_jobs?}`, {
          method: "GET",
          credentials: "include",
        });

        if (!res.ok) {
          throw new Error(`Error: ${res.status}`);
        }

        const data = await res.json();
        const savedSet = new Set<string>(
          data.saved_jobs.map((job: { jobId: string }) => job.jobId),
        );

        setSavedJobs(savedSet);
        console.log(savedSet);
      } catch (err) {
        console.error(`Error: ${err}`);
      }
    };

    fetchSavedJobs();
  }, []);
  // ----------------------------------------------------------------------

  const handleSavedJob = async (jobId: string) => {
    try {
      const res = await fetch(
        `http://localhost:8080/add_saved_jobs?jobId=${jobId}`,
        { method: "POST", credentials: "include" },
      );

      if (!res.ok) {
        throw new Error(`Error: ${res.status}`);
      }

      const data = await res.json();

      // if (data.message == "added") {
      //   alert("Job Saved!");
      // }
    } catch (err) {
      console.error(`Error: ${err}`);
    }
  };

  const deleteSavedJob = async (jobId: string) => {
    try {
      const res = await fetch(
        `http://localhost:8080/delete_saved_jobs?jobId=${jobId}`,
        { method: "DELETE", credentials: "include" },
      );

      if (!res.ok) {
        throw new Error(`Error: ${res.status}`);
      }

      const data = await res.json();

      // if (data.message == "deleted") {
      //   alert("Job removed from saved jobs");
      // }
    } catch (err) {
      console.error(`Error: ${err}`);
    }
  };

  const handleNext = () => {
    if (!nextCursor) return;
    setCursorHistory((prev) => [...prev, nextCursor]);
    setCursor(nextCursor);
    setPage((p) => p + 1);
  };

  const handlePrev = () => {
    if (cursorHistory.length <= 1) return;

    const newHistory = [...cursorHistory];
    newHistory.pop();

    const prevCursor = newHistory[newHistory.length - 1];

    setCursorHistory(newHistory);
    setCursor(prevCursor);
    setPage((p) => p - 1);
  };

  if (!jobs) {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-500">
        Loading profile...
      </div>
    );
  }

  const handleViewJob = (job: JobProps) => {
    router.push(`/jobs/${job.job_id}`);
  };

  return (
    <main className="h-full p-8 bg-[#F8FAFC] flex flex-col min-h-0">
      <div className="rounded-3xl border border-slate-200 bg-white p-8 flex flex-col flex-1 min-h-0 overflow-hidden">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold">Jobs</h1>
            <p className="mt-2 text-sm text-slate-500">
              Browse opportunities tailored to your profile.
            </p>
          </div>

          <span className="text-sm text-slate-400">Page {page}</span>
        </div>

        {/* Jobs */}
        <div className="mt-6 flex-1 min-h-0 overflow-y-auto pr-2 flex flex-col gap-5">
          {jobs.map((job) => (
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

                <span className="rounded-full bg-slate-200 px-3 py-1 text-xs text-slate-600">
                  {job.work_type}
                </span>
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

              <div className="mt-5 flex justify-end gap-3">
                <button
                  onClick={() => handleSaveClick(job.job_id)}
                  className="rounded-xl border border-slate-300 p-2 hover:bg-slate-100"
                >
                  <div className="relative h-6 w-6">
                    {/* Empty bookmark */}
                    {!savedJobs.has(job.job_id) && (
                      <Bookmark className="absolute h-5 w-5 text-slate-500" />
                    )}

                    {/* Pen animation Maybe Replace this emoji wth an SVG */}
                    {bookmarkAnimating?.id === job.job_id && (
                      <span className="absolute left-0 top-0 text-xs pen-write z-10">
                        {bookmarkAnimating.action === "save" ? "✏️" : "🧽"}
                      </span>
                    )}

                    {/* Filled bookmark */}
                    {savedJobs.has(job.job_id) && (
                      <Bookmark className="absolute h-5 w-5 fill-green-500 text-green-500 bookmark-fill" />
                    )}
                  </div>
                </button>

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

export default HomePage;
