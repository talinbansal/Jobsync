"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

import { FolderPlus } from "lucide-react";

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

type FolderType = {
  id: number;
  name: string;
};

type FetchedFolderType = {
  folder_id: number;
  folder_name: string;
};

export default function ViewJob() {
  const router = useRouter();
  const params = useParams();
  const jobId = params.jobId;
  const [job, setJob] = useState<JobProps | null>(null);

  const [folderName, setFolderName] = useState("");
  const [showFolderDrawer, setShowFolderDrawer] = useState(false);
  const [folderMode, setFolderMode] = useState<"existing" | "new">("existing");
  const [folders, setFolders] = useState<FolderType[]>([]);

  const [showFolderCreated, setShowFolderCreated] = useState(false);

  useEffect(() => {
    if (jobId) {
      const fetchJob = async () => {
        try {
          const res = await fetch(
            `http://localhost:8080/view_job?jobId=${jobId}`,
            {
              method: "GET",
              credentials: "include",
            },
          );

          if (!res.ok) {
            throw new Error(`"Error: ${res.status}`);
          }

          const data = await res.json();
          setJob(data);
        } catch (err) {
          console.error(`Error: ${err}`);
        }
      };

      fetchJob();
    }
  }, []);

  useEffect(() => {
    const fetchFolders = async () => {
      //Add functionality to fethc Folder Data by joining tables in this query as well
      try {
        const res = await fetch(`http://localhost:8080/get_folders`, {
          method: "GET",
          credentials: "include",
        });

        if (!res.ok) {
          throw new Error(`Error: ${res.status}`);
        }

        const data = await res.json();

        const fetchedFolders = data.folders.map(
          (folder: FetchedFolderType) => ({
            id: folder.folder_id,
            name: folder.folder_name,
          }),
        );

        setFolders(fetchedFolders);
      } catch (err) {
        console.error(`Error: ${err}`);
      }
    };
    fetchFolders();
  }, [folderMode]);

  const AddFolder = async (folderName: string) => {
    try {
      const res = await fetch(
        `http://localhost:8080/add_folders?folder_name=${folderName}`,
        {
          method: "POST",
          credentials: "include",
        },
      );

      if (!res.ok) {
        throw new Error(`Error: ${res.status}`);
      }

      setFolderName("");

      setShowFolderCreated(true);

      setTimeout(() => {
        setShowFolderCreated(false);
      }, 2500);
    } catch (err) {
      console.error(err);
    }
  };

  const AddJobToFolder = async (folderId: number) => {
    try {
      const res = await fetch(
        `http://localhost:8080/add_job_to_folder?folder_id=${folderId}&job_id=${jobId}`,
        {
          method: "POST",
          credentials: "include",
        },
      );

      if (!res.ok) {
        const errorData = await res.json();

        throw new Error(errorData.message || "Failed to add job to folder");
      }

      const data = await res.json();
      const message = data.message;

      console.log(message);

      if (message == "completed") {
        setShowFolderDrawer(false);
      }
    } catch (err) {
      console.error(`Error: ${err}`);
    }
  };

  const handleManualApply = () => {
    router.push(`/apply/${jobId}?mode=manual`);
  };

  const handleAutomaticApply = () => {
    router.push(`/apply/${jobId}?mode=auto`);
  };

  return (
    <div className="h-screen bg-[#F8FAFC] flex">
      {showFolderCreated && (
        <div className="fixed top-8 right-8 z-[100] animate-slide-in rounded-xl bg-slate-900 px-6 py-3 text-white shadow-lg">
          Folder created successfully!
        </div>
      )}
      <main className="flex-1 h-full p-8 bg-[#F8FAFC] overflow-hidden flex flex-col">
        {/* WHITE PANEL */}
        <div className="rounded-3xl border border-slate-200 bg-white p-8 h-full overflow-y-auto pb-16">
          {!job ? (
            <div className="flex h-full items-center justify-center text-slate-400">
              Loading job...
            </div>
          ) : (
            <div className="max-w-4xl mx-auto">
              {/* Header */}
              <div className="border-b border-slate-200 pb-6">
                <div className="flex items-start justify-between">
                  <h1 className="text-3xl font-bold text-slate-900">
                    {job.title}
                  </h1>

                  <button
                    // onClick={handleAddToFolder}
                    onClick={() => setShowFolderDrawer(true)}
                    className="flex items-center gap-2 rounded-xl bg-slate-900 px-6 py-2 text-sm text-white transition hover:bg-slate-700"
                  >
                    <FolderPlus size={16} />
                    Add to Folder
                  </button>
                </div>

                <p className="mt-2 text-lg text-slate-600">{job.company}</p>

                <div className="mt-4 flex flex-wrap gap-3 text-sm text-slate-600">
                  <span className="rounded-full bg-slate-100 px-3 py-1">
                    📍 {job.location}
                  </span>
                  <span className="rounded-full bg-slate-100 px-3 py-1">
                    💼 {job.work_type}
                  </span>
                  <span className="rounded-full bg-slate-100 px-3 py-1">
                    🎯 {job.experience_level}
                  </span>
                  <span className="rounded-full bg-slate-100 px-3 py-1">
                    💰 {job.salary}
                  </span>
                </div>
              </div>

              {/* Description */}
              <div className="mt-6">
                <h2 className="text-lg font-semibold text-slate-900">
                  Job Description
                </h2>

                <p className="mt-3 text-slate-600 leading-relaxed whitespace-pre-line">
                  {job.description}
                </p>
              </div>
              {/* Footer */}
              <div className="mt-10 mb-4 flex items-center justify-between border-t border-slate-200 pt-6">
                <p className="text-sm text-slate-400">
                  Posted on {new Date(job.posted_at).toLocaleDateString()}
                </p>

                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      handleAutomaticApply();
                    }}
                    className="rounded-xl bg-slate-900 px-6 py-2 text-sm text-white transition hover:bg-slate-700"
                  >
                    Apply using Profile
                  </button>

                  <button
                    onClick={() => {
                      handleManualApply();
                    }}
                    className="rounded-xl bg-slate-900 px-6 py-2 text-sm text-white transition hover:bg-slate-700"
                  >
                    Apply Manually
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
        {/* Overlay */}
        <div
          className={`
    fixed inset-0 z-40 bg-black/20
    transition-opacity duration-300 ease-in-out
    ${showFolderDrawer ? "opacity-100" : "pointer-events-none opacity-0"}
  `}
          onClick={() => setShowFolderDrawer(false)}
        />

        {/* Drawer */}
        <div
          className={`
    fixed right-0 top-24 bottom-0 z-50 w-96
    rounded-l-3xl
    bg-white shadow-xl
    p-6
    transform
    transition-transform duration-300 ease-in-out
    ${showFolderDrawer ? "translate-x-0" : "translate-x-full"}
  `}
        >
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Add to Folder</h2>

            <button onClick={() => setShowFolderDrawer(false)}>✕</button>
          </div>

          {/* Tabs */}
          <div className="mt-6 flex rounded-xl bg-slate-100 p-1">
            <button
              onClick={() => setFolderMode("existing")}
              className={`flex-1 rounded-lg py-2 text-sm ${
                folderMode === "existing" ? "bg-white shadow" : ""
              }`}
            >
              Existing
            </button>

            <button
              onClick={() => setFolderMode("new")}
              className={`flex-1 rounded-lg py-2 text-sm ${
                folderMode === "new" ? "bg-white shadow" : ""
              }`}
            >
              New Folder
            </button>
          </div>

          {folderMode === "existing" ? (
            <div className="mt-6 space-y-2">
              {folders.map((folder) => (
                <button
                  onClick={() => AddJobToFolder(folder.id)}
                  key={folder.id}
                  className="flex w-full items-center gap-3 rounded-xl p-3 hover:bg-slate-100"
                >
                  📁 {folder.name}
                </button>
              ))}
            </div>
          ) : (
            <div className="mt-6">
              <input
                value={folderName}
                onChange={(e) => setFolderName(e.target.value)}
                placeholder="Folder name"
                className="w-full rounded-xl border border-slate-200 px-4 py-2"
              />

              <button
                onClick={() => {
                  AddFolder(folderName);
                }}
                className="mt-4 w-full rounded-xl bg-slate-900 py-2 text-white"
              >
                Create Folder
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
