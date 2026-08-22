"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { userStore } from "../../../store/useStore";

// CSS import
import { AnimatePresence, motion } from "framer-motion";
import confetti from "canvas-confetti";

type Specifics = {
  selectedRoles: Record<number, string>;
  selectedWorkPref: string;
  experienceLevel: string;
  location: string;
};

export default function Apply() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const profileData = userStore((state) => state.setupData);

  // CSS constants --------------------------------------
  const [state, setState] = useState<
    "idle" | "loading" | "success" | "alreadyApplied"
  >("idle");
  // ----------------------------------------------------

  const jobId = params.jobId;
  const mode = searchParams.get("mode");

  const resumeURL = mode === "auto" ? profileData?.resume : null;
  const [resume, setResume] = useState<File | null>(null);
  const coverLetterURL = mode === "auto" ? profileData?.coverLetter : null;
  const [coverLetter, setCoverLetter] = useState<File | null>(null);
  const [portfolioLink, setPortfolioLink] = useState(profileData?.portfolio);
  const [githubLink, setGithubLink] = useState(profileData?.github);

  //When we submit manually
  const handleSubmit = async () => {
    try {
      setState("loading");

      const formData = new FormData();
      if (portfolioLink) {
        formData.append("portfolioLink", portfolioLink);
      }
      if (githubLink) {
        formData.append("githubLink", githubLink);
      }
      if (jobId && typeof jobId === "string") {
        formData.append("jobId", jobId);
      }
      if (resume) {
        formData.append("resume", resume);
      }
      if (coverLetter) {
        formData.append("coverLetter", coverLetter);
      }
      const res = await fetch("http://localhost:8080/submit_application", {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();

        if (res.status === 409) {
          setState("alreadyApplied");
          return;
        }

        throw new Error(data.error || "Something went wrong");
      }

      const data = await res.json();
      const message = data.message;
      console.log(message);

      if (data.message === "success") {
        setState("success");

        // small delay so animation finishes
        setTimeout(() => {
          router.push("/home-page");
        }, 1600);
      } else {
        setState("idle");
      }
    } catch (err) {
      console.error(err);
      setState("idle");
    }
  };

  //When we use autofill
  const handleAutoSubmit = async () => {
    console.log("clicked");
    try {
      setState("loading");

      const res = await fetch("http://localhost:8080/auto_submit_application", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          resumeURL,
          coverLetterURL,
          portfolioLink,
          githubLink,
          jobId,
        }),
      });

      if (!res.ok) {
        const data = await res.json();

        if (res.status === 409) {
          setState("alreadyApplied");
          return;
        }

        throw new Error(data.error || "Something went wrong");
      }

      const data = await res.json();
      const message = data.message;

      console.log(message);
      if (data.message === "success") {
        setState("success");

        // small delay so animation finishes
        setTimeout(() => {
          router.push("/home-page");
        }, 1600);
      } else {
        setState("idle");
      }
    } catch (err) {
      console.error(err);
      setState("idle");
    }
  };

  // Animation Hook -------------
  useEffect(() => {
    if (state === "success") {
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 },
      });
    }
  }, [state]);
  // ----------------------------

  return (
    <div className="h-screen bg-[#F8FAFC] flex">
      {/* Successful Application Animation ----------------------------------------------- */}
      <AnimatePresence>
        {state === "loading" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-white/80 backdrop-blur-md flex items-center justify-center z-50"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 200 }}
              className="text-center"
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                className="w-10 h-10 border-2 border-slate-900 border-t-transparent rounded-full mx-auto"
              />
              <p className="mt-4 text-slate-600 text-sm">
                Submitting application...
              </p>
            </motion.div>
          </motion.div>
        )}

        {state === "success" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-white flex items-center justify-center z-50"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 200 }}
              className="text-center"
            >
              {/* checkmark draw-in style */}
              <motion.div
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.6 }}
                className="mx-auto mb-4"
              >
                <div className="flex items-center justify-center mb-4">
                  <svg width="80" height="80" viewBox="0 0 24 24">
                    <motion.path
                      d="M20 6L9 17l-5-5"
                      fill="transparent"
                      stroke="black"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      transform="translate(0, 1)"
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ duration: 0.6 }}
                    />
                  </svg>
                </div>
              </motion.div>

              <motion.h2
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-xl font-semibold"
              >
                Application submitted
              </motion.h2>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-sm text-slate-500 mt-1"
              >
                Redirecting you...
              </motion.p>
            </motion.div>
          </motion.div>
        )}

        {state === "alreadyApplied" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-white/90 backdrop-blur-md flex items-center justify-center z-50"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 200 }}
              className="text-center"
            >
              <motion.div
                initial={{ y: -10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-yellow-100"
              >
                <span className="text-4xl">!</span>
              </motion.div>

              <h2 className="text-xl font-semibold text-slate-900">
                Already applied
              </h2>

              <p className="mt-2 text-sm text-slate-500">
                You have already submitted an application for this job.
              </p>

              <button
                onClick={() => setState("idle")}
                className="mt-5 rounded-xl bg-slate-900 px-5 py-2 text-sm text-white hover:bg-slate-700"
              >
                Go back
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* ------------------------------------------------------------------------------ */}

      <main className="flex-1 h-full p-8 bg-[#F8FAFC] overflow-hidden flex flex-col">
        {/* WHITE PANEL */}
        <div className="rounded-3xl border border-slate-200 bg-white p-8 h-full overflow-y-auto pb-16 flex justify-center">
          <form
            onSubmit={(e) => {
              e.preventDefault();

              if (mode == "auto") handleAutoSubmit();
              else handleSubmit();
            }}
            className="w-full max-w-3xl flex flex-col gap-6"
          >
            {/* Header */}
            <div>
              <h1 className="text-2xl font-bold text-slate-900">
                Manual Application
              </h1>
              <p className="text-sm text-slate-500 mt-2">
                Fill in your details manually for this application.
              </p>
            </div>

            {/* Resume */}
            <div className="mt-6 space-y-4">
              <label className="text-sm font-medium text-slate-700">
                Resume (PDF)
              </label>

              {resumeURL && (
                <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                  Current resume:{" "}
                  <a
                    href={resumeURL}
                    target="_blank"
                    className="text-blue-600 underline"
                  >
                    View uploaded resume
                  </a>
                </div>
              )}

              {!resumeURL && (
                <input
                  type="file"
                  accept="application/pdf"
                  onChange={(e) => setResume(e.target.files?.[0] ?? null)}
                  className="w-full cursor-pointer rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-500
      file:mr-4 file:rounded-lg file:border-0 file:bg-slate-900 file:px-4 file:py-2 file:text-sm file:font-medium file:text-white
      hover:file:bg-slate-800"
                  required={!resumeURL}
                />
              )}

              {resume && (
                <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                  Selected: <span className="font-medium">{resume.name}</span>
                </div>
              )}
            </div>

            {/* Cover Letter */}
            <div className="mt-6 space-y-4">
              <label className="text-sm font-medium text-slate-700">
                Cover Letter (PDF)
              </label>

              {coverLetterURL && (
                <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                  Current cover letter:{" "}
                  <a
                    href={coverLetterURL}
                    target="_blank"
                    className="text-blue-600 underline"
                  >
                    View uploaded cover letter
                  </a>
                </div>
              )}

              {!coverLetterURL && (
                <input
                  type="file"
                  accept="application/pdf"
                  onChange={(e) => setCoverLetter(e.target.files?.[0] ?? null)}
                  className="w-full cursor-pointer rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-500
      file:mr-4 file:rounded-lg file:border-0 file:bg-slate-900 file:px-4 file:py-2 file:text-sm file:font-medium file:text-white
      hover:file:bg-slate-800"
                />
              )}

              {coverLetter && (
                <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                  Selected:{" "}
                  <span className="font-medium">{coverLetter.name}</span>
                </div>
              )}
            </div>

            {/* Portfolio */}
            <div>
              <label className="text-sm font-medium text-slate-700">
                Portfolio Link
              </label>
              <input
                type="url"
                value={portfolioLink}
                onChange={(e) => setPortfolioLink(e.target.value)}
                placeholder="https://yourportfolio.com"
                className="mt-2 w-full border border-slate-300 rounded-xl p-3"
              />
            </div>

            {/* GitHub */}
            <div>
              <label className="text-sm font-medium text-slate-700">
                GitHub Link
              </label>
              <input
                type="url"
                value={githubLink}
                onChange={(e) => setGithubLink(e.target.value)}
                placeholder="https://github.com/yourname"
                className="mt-2 w-full border border-slate-300 rounded-xl p-3"
              />
            </div>

            {/* Submit */}
            <div className="flex justify-end pt-4 border-t border-slate-200">
              <button
                type="submit"
                className="bg-slate-900 text-white px-6 py-2 rounded-xl hover:bg-slate-700"
              >
                Submit Application
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
