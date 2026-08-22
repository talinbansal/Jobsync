"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { CheckCircle } from "lucide-react";

interface SelectedRoleProps {
  role: string;
  index: number;
}

type FormDataType = {
  specifics: {
    selectedRoles: { [key: number]: string };
    selectedWorkPref: string;
    experienceLevel: string;
    location: string;
  };
  resume: File | null;
  other: {
    coverLetter: File | null;
    portfolioLink: string;
    githubLink: string;
  };
};

const colors = [
  "bg-blue-100 text-blue-700 border-blue-200",
  "bg-green-100 text-green-700 border-green-200",
  "bg-purple-100 text-purple-700 border-purple-200",
  "bg-pink-100 text-pink-700 border-pink-200",
  "bg-yellow-100 text-yellow-700 border-yellow-200",
  "bg-indigo-100 text-indigo-700 border-indigo-200",
];

export default function ProfileSetup() {
  const router = useRouter();
  const [step, setStep] = useState<
    "intro" | "upload" | "upload_other" | "specifics" | "complete"
  >("intro");
  const [message, setMessage] = useState<string>("");

  const [formData, setFormData] = useState<FormDataType>({
    specifics: {
      selectedRoles: {} as { [key: number]: string },
      selectedWorkPref: "",
      experienceLevel: "",
      location: "",
    },
    resume: null as File | null,
    other: {
      coverLetter: null as File | null,
      portfolioLink: "",
      githubLink: "",
    },
  });

  const isEmpty =
    !formData.other.portfolioLink &&
    !formData.other.coverLetter &&
    !formData.other.githubLink;

  const email =
    typeof window !== "undefined" ? localStorage.getItem("email") : null;

  const steps = [
    "Resume uploaded",
    "Profile completed",
    "Job preferences saved",
    "Ready to apply",
  ];

  const [visible, setVisible] = useState<number[]>([]);

  useEffect(() => {
    if (step !== "complete") return;

    const newVisible: number[] = [];

    steps.forEach((_, i) => {
      setTimeout(() => {
        newVisible.push(i);
        setVisible([...newVisible]);
      }, i * 400);
    });
  }, [step]);

  // Handles case where email is not stored
  useEffect(() => {
    if (!email) {
      router.push("/create-account");
    }
  }, [email, router]);

  const getColor = (index: number) => {
    return colors[index % colors.length];
  };

  const toggleSelection = ({ role, index }: SelectedRoleProps) => {
    setFormData((prev) => {
      const updated = { ...prev.specifics.selectedRoles };
      if (updated[index]) {
        delete updated[index];
      } else {
        updated[index] = role;
      }

      return {
        ...prev,
        specifics: {
          ...prev.specifics,
          selectedRoles: updated,
        },
      };
    });
  };

  const setWorkPref = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      specifics: {
        ...prev.specifics,
        selectedWorkPref: value,
      },
    }));
  };

  const setExperience = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      specifics: {
        ...prev.specifics,
        experienceLevel: value,
      },
    }));
  };

  const setLocation = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      specifics: {
        ...prev.specifics,
        location: value,
      },
    }));
  };

  const setResume = (file: File | null) => {
    setFormData((prev) => ({
      ...prev,
      resume: file,
    }));
  };

  const setCoverLetter = (file: File | null) => {
    setFormData((prev) => ({
      ...prev,
      other: {
        ...prev.other,
        coverLetter: file,
      },
    }));
  };

  const setPortfolioLink = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      other: {
        ...prev.other,
        portfolioLink: value,
      },
    }));
  };

  const setGithubLink = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      other: {
        ...prev.other,
        githubLink: value,
      },
    }));
  };

  const handleDataUpload = async (data: FormDataType): Promise<void> => {
    try {
      if (!email) return; // THIS is ONLY for safety here
      const formData = new FormData();

      if (data.resume) {
        formData.append("resume", data.resume);
      }
      formData.append("specifics", JSON.stringify(data.specifics));
      formData.append("portfolio", data.other.portfolioLink);
      formData.append("github", data.other.githubLink);
      if (data.other.coverLetter) {
        formData.append("coverLetter", data.other.coverLetter);
      }
      formData.append("email", email);

      const res = await fetch("http://localhost:8080/upload_setup_data", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        // throw new Error(`Internal Error: ${res.status}`);
        const text = await res.text();
        console.log("Response body:", text);
        throw new Error(text);
      }

      const reply = await res.json();
      setMessage(reply.message);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (message == "successful") {
      console.log(message);
      router.push("/");
    }
  }, [message]);

  if (step === "intro") {
    return (
      <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex items-center justify-center px-6">
        <div className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white shadow-[0_10px_40px_rgba(0,0,0,0.06)] p-10 text-center">
          <h1 className="text-3xl font-bold tracking-tight">
            Welcome to JobSync
          </h1>

          <p className="mt-3 text-sm text-slate-500 leading-6">
            Set up your profile so we can match you with the right jobs, or skip
            and explore the dashboard.
          </p>

          <div className="mt-8 flex flex-col gap-3">
            <button
              onClick={() => setStep("specifics")}
              className="w-full rounded-xl bg-slate-900 py-3 text-sm font-semibold text-white hover:bg-slate-800 transition"
            >
              Set up profile
            </button>

            <button
              onClick={() => {
                router.push("/");
              }}
              className="w-full rounded-xl border border-slate-200 bg-white py-3 text-sm font-medium text-slate-700 hover:bg-slate-50 transition"
            >
              Skip for now
            </button>
          </div>
        </div>
      </div>
    );
  }
  if (step === "specifics") {
    return (
      <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex items-center justify-center px-6">
        <div className="w-full max-w-2xl rounded-3xl border border-slate-200 bg-white shadow-[0_10px_40px_rgba(0,0,0,0.06)] p-10">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">
              What are you looking for?
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              Select the roles and preferences you would like us to match you
              with.
            </p>
          </div>

          {/* Job Types */}
          <div className="mt-8">
            <h3 className="text-sm font-semibold text-slate-800 mb-3">
              Job Categories
            </h3>

            <div className="flex flex-wrap gap-3">
              {[
                "Software Engineer",
                "Frontend",
                "Backend",
                "Full Stack",
                "DevOps",
                "Data Engineer",
                "Data Analyst",
                "Machine Learning",
                "QA Engineer",
                "Product Manager",
                "Business Analyst",
                "UI/UX Designer",
              ].map((role, index) => (
                <button
                  key={index}
                  className={`
                    rounded-full
                    border
                    px-4
                    py-2
                    text-sm
                    font-medium
                    transition-all
                    cursor-pointer
                
                    ${
                      formData.specifics.selectedRoles[index]
                        ? getColor(index)
                        : "bg-white text-slate-700 border-slate-200 hover:border-slate-900 hover:text-slate-900"
                    }
                  `}
                  onClick={() => {
                    toggleSelection({ role, index });
                    getColor(index);
                  }}
                >
                  {role}
                </button>
              ))}
            </div>
          </div>

          {/* Work Preference */}
          <div className="mt-8">
            <h3 className="text-sm font-semibold text-slate-800 mb-3">
              Work Preference
            </h3>

            <div className="flex gap-3">
              {["Remote", "Hybrid", "On-site"].map((option) => (
                <button
                  key={option}
                  onClick={() => setWorkPref(option)}
                  className={`
                    rounded-xl
                    border
                    px-4
                    py-3
                    text-sm
                    font-medium
                    transition-all

                    ${
                      formData.specifics.selectedWorkPref === option
                        ? "bg-slate-900 text-white border-slate-900 shadow-md"
                        : "bg-white text-slate-700 border-slate-200 hover:border-slate-900 hover:text-slate-900"
                    }
                  `}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          {/* Experience */}
          <div className="mt-8">
            <h3 className="text-sm font-semibold text-slate-800 mb-3">
              Experience Level
            </h3>

            <select
              value={formData.specifics.experienceLevel}
              onChange={(e) => setExperience(e.target.value)}
              className="
                w-full
                rounded-xl
                border
                border-slate-200
                bg-white
                px-4
                py-3
                text-sm
                outline-none
                focus:border-blue-500
                focus:ring-4
                focus:ring-blue-100
              "
            >
              <option>Internship</option>
              <option>Entry Level</option>
              <option>Junior</option>
              <option>Mid-Level</option>
              <option>Senior</option>
            </select>
          </div>

          {/* Location */}
          <div className="mt-8">
            <h3 className="text-sm font-semibold text-slate-800 mb-3">
              Preferred Location (if not Remote)
            </h3>

            <input
              type="text"
              placeholder="Toronto, Waterloo, ..."
              value={formData.specifics.location}
              className="
                w-full
                rounded-xl
                border
                border-slate-200
                px-4
                py-3
                text-sm
                outline-none
                placeholder:text-slate-400
                focus:border-blue-500
                focus:ring-4
                focus:ring-blue-100
              "
              onChange={(e) => setLocation(e.target.value)}
            />
          </div>

          <div className="mt-10 flex justify-end">
            <button
              className="
                rounded-xl
                bg-slate-900
                px-8
                py-3
                text-sm
                font-semibold
                text-white
                transition
                hover:bg-slate-800
              "
              onClick={() => setStep("upload")}
            >
              Continue
            </button>
          </div>
        </div>
      </div>
    );
  }
  if (step === "upload") {
    return (
      <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex items-center justify-center px-6">
        <div className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white shadow-[0_10px_40px_rgba(0,0,0,0.06)] p-10">
          <h2 className="text-2xl font-bold tracking-tight">
            Upload your resume
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            We’ll use this to match you with relevant jobs.
          </p>

          <div className="mt-6 space-y-4">
            <input
              type="file"
              accept="application/pdf"
              onChange={(e) => setResume(e.target.files?.[0] ?? null)}
              className="w-full cursor-pointer rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-500 file:mr-4 file:rounded-lg file:border-0 file:bg-slate-900 file:px-4 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-slate-800"
            />

            {formData.resume && (
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                Selected:{" "}
                <span className="font-medium">{formData.resume.name}</span>
              </div>
            )}

            <button
              onClick={() => setStep("upload_other")}
              disabled={!formData.resume}
              className="w-full rounded-xl bg-slate-900 py-3 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              Continue
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (step === "upload_other") {
    return (
      <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex items-center justify-center px-6">
        <div className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white shadow-[0_10px_40px_rgba(0,0,0,0.06)] p-10">
          <h2 className="text-2xl font-bold tracking-tight">
            Additional Documents
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            Upload any supporting documents that can strengthen your profile.
            Everything here is optional.
          </p>

          <div className="mt-8 space-y-6">
            {/* Cover Letter */}
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Cover Letter
              </label>

              <input
                type="file"
                accept="application/pdf"
                className="w-full cursor-pointer rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-500 file:mr-4 file:rounded-lg file:border-0 file:bg-slate-900 file:px-4 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-slate-800"
                onChange={(e) => setCoverLetter(e.target.files?.[0] ?? null)}
              />
            </div>

            {/* Portfolio URL */}
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Portfolio / Website
              </label>

              <input
                type="url"
                value={formData.other.portfolioLink}
                placeholder="https://yourportfolio.com"
                className="
                  w-full
                  rounded-xl
                  border
                  border-slate-200
                  bg-white
                  px-4
                  py-3
                  text-sm
                  outline-none
                  transition
                  placeholder:text-slate-400
                  focus:border-blue-500
                  focus:ring-4
                  focus:ring-blue-100
                "
                onChange={(e) => setPortfolioLink(e.target.value)}
              />
            </div>

            {/* GitHub */}
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                GitHub Profile
              </label>

              <input
                type="url"
                value={formData.other.githubLink}
                placeholder="https://github.com/username"
                className="
                  w-full
                  rounded-xl
                  border
                  border-slate-200
                  bg-white
                  px-4
                  py-3
                  text-sm
                  outline-none
                  transition
                  placeholder:text-slate-400
                  focus:border-blue-500
                  focus:ring-4
                  focus:ring-blue-100
                "
                onChange={(e) => setGithubLink(e.target.value)}
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setStep("upload")}
                className="flex-1 rounded-xl border border-slate-200 py-3 text-sm font-medium hover:bg-slate-50"
              >
                Back
              </button>

              <button
                disabled={isEmpty}
                onClick={() => setStep("complete")}
                className={`px-4 py-2 rounded-xl text-white transition
                  ${isEmpty ? "bg-slate-300 cursor-not-allowed" : "bg-slate-900 hover:bg-slate-700"}
                `}
              >
                Continue
              </button>
            </div>

            <button
              onClick={() => handleDataUpload(formData)}
              className="w-full text-sm text-slate-500 hover:text-slate-700"
            >
              Skip for now
            </button>
          </div>
        </div>
      </div>
    );
  }
  if (step === "complete") {
    const handleComplete = async () => {
      await handleDataUpload(formData);

      setTimeout(() => {
        router.push("/");
      }, 1200);
    };

    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] px-6">
        <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-10 shadow-lg text-center">
          <h2 className="text-2xl font-bold tracking-tight">
            You’re job-ready 💼
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            Your profile setup is complete.
          </p>

          {/* Animated steps */}
          <div className="mt-8 space-y-4 text-left">
            {steps.map((step, i) => (
              <div
                key={i}
                className={`flex items-center gap-3 transition-all duration-500 ${
                  visible.includes(i)
                    ? "opacity-100 translate-y-0"
                    : "opacity-0 translate-y-2"
                }`}
              >
                <CheckCircle
                  className={`h-5 w-5 rounded-full border flex items-center justify-center transition-all duration-300 ${
                    visible.includes(i)
                      ? "bg-green-500 border-green-500"
                      : "border-slate-300"
                  }`}
                >
                  {visible.includes(i) && (
                    <span className="text-white text-xs">✓</span>
                  )}
                </CheckCircle>

                <span className="text-sm text-slate-700">{step}</span>
              </div>
            ))}
          </div>

          <button
            onClick={handleComplete}
            className="mt-8 w-full rounded-xl bg-slate-900 py-3 text-sm font-semibold text-white hover:bg-slate-800 transition"
          >
            Go Back to Login
          </button>
        </div>
      </div>
    );
  }
}
