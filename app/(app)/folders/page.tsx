"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Folder } from "lucide-react";
import { useFolderStore } from "../../store/useFolderStore";

type FolderJobs = {
  folder_name: string;
  folder_id: string;
  job_ids: string[];
};

export default function Folders() {
  const router = useRouter();

  const [folders, setFolders] = useState<FolderJobs[]>([]);
  const [menuFolderId, setMenuFolderId] = useState<string | null>(null);
  const [editingFolderId, setEditingFolderId] = useState<string | null>(null);

  const [menuPosition, setMenuPosition] = useState({
    x: 0,
    y: 0,
  });

  useEffect(() => {
    const fetchFolders = async () => {
      try {
        const res = await fetch("http://localhost:8080/get_folders", {
          method: "GET",
          credentials: "include",
        });

        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.error);
        }

        const data = await res.json();

        setFolders(data.folders);

        const folderStore = useFolderStore.getState().setFolderData;

        folderStore(data.folders);
      } catch (err) {
        console.error(`Error: ${err}`);
      }
    };

    fetchFolders();
  }, []);

  const AddFolder = async (folderName: string) => {
    try {
      const res = await fetch(
        `http://localhost:8080/add_folders?folder_name=${encodeURIComponent(
          folderName,
        )}`,
        {
          method: "POST",
          credentials: "include",
        },
      );

      if (!res.ok) {
        throw new Error(`Error: ${res.status}`);
      }

      const data = await res.json();

      return data.folder;
    } catch (err) {
      console.error(err);
    }
  };

  const addFolder = async () => {
    const newFolder = await AddFolder("New Folder");

    if (!newFolder) return;

    const formattedNewFolder = {
      folder_name: newFolder.folder_name,
      folder_id: newFolder.folder_id,
      job_ids: newFolder.job_ids ?? [],
    };

    setFolders((prev) => [...prev, formattedNewFolder]);
  };

  const UpdateFolderName = async (id: string, name: string) => {
    try {
      const res = await fetch(
        `http://localhost:8080/update_folder?folder_id=${id}&folder_name=${encodeURIComponent(
          name,
        )}`,
        {
          method: "PATCH",
          credentials: "include",
        },
      );

      if (!res.ok) {
        throw new Error(`Error: ${res.status}`);
      }

      const data = await res.json();

      console.log(data.message);
    } catch (err) {
      console.error(`Error: ${err}`);
    }
  };

  const renameFolder = (id: string, name: string) => {
    setFolders((prev) =>
      prev.map((folder) =>
        folder.folder_id === id ? { ...folder, folder_name: name } : folder,
      ),
    );
  };

  const DeleteFolder = async (id: string) => {
    try {
      const res = await fetch(
        `http://localhost:8080/delete_folder?folder_id=${id}`,
        {
          method: "DELETE",
          credentials: "include",
        },
      );

      if (!res.ok) {
        throw new Error(`Error: ${res.status}`);
      }

      const data = await res.json();

      console.log(data.message);
    } catch (err) {
      console.error(`Error: ${err}`);
    }
  };

  const deleteFolder = (id: string) => {
    setFolders((prev) => prev.filter((folder) => folder.folder_id !== id));

    DeleteFolder(id);
  };

  const OpenFolder = (id: string) => {
    router.push(`/folders/${id}`);
  };

  return (
    <main
      className="h-full p-8 bg-[#F8FAFC] flex flex-col min-h-0"
      onClick={() => setMenuFolderId(null)}
    >
      <div className="rounded-3xl border border-slate-200 bg-white p-8 flex flex-col flex-1 min-h-0 overflow-hidden">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold">Folders</h1>

            <p className="mt-2 text-sm text-slate-500">
              Organize your selected jobs.
            </p>
          </div>

          <button
            onClick={addFolder}
            className="rounded-xl bg-slate-900 px-4 py-2 text-sm text-white hover:bg-slate-700 transition"
          >
            + Add Folder
          </button>
        </div>

        {/* Folder Grid */}
        <div className="mt-6 flex-1 overflow-y-auto">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {folders.map((folder) => {
              const jobCount = (folder.job_ids ?? []).filter(
                (id) => id && id.trim() !== "",
              ).length;

              return (
                <div
                  key={folder.folder_id}
                  onClick={() => OpenFolder(folder.folder_id)}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    e.stopPropagation();

                    setMenuFolderId(folder.folder_id);

                    setMenuPosition({
                      x: e.clientX,
                      y: e.clientY,
                    });
                  }}
                  className="rounded-2xl border border-slate-200 bg-slate-50 p-6 flex flex-col items-center justify-center hover:shadow-md hover:border-slate-300 transition cursor-pointer"
                >
                  <Folder size={48} className="text-slate-500" />

                  {editingFolderId === folder.folder_id ? (
                    <input
                      autoFocus
                      value={folder.folder_name}
                      onChange={(e) =>
                        renameFolder(folder.folder_id, e.target.value)
                      }
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          UpdateFolderName(
                            folder.folder_id,
                            folder.folder_name,
                          );

                          setEditingFolderId(null);
                        }
                      }}
                      onBlur={() => setEditingFolderId(null)}
                      className="mt-3 w-full rounded-lg border border-slate-300 px-2 py-1 text-center text-sm outline-none"
                    />
                  ) : (
                    <>
                      <p className="mt-3 text-sm font-medium text-slate-700">
                        {folder.folder_name}
                      </p>

                      <p className="mt-1 text-xs text-slate-500">
                        {jobCount === 0
                          ? "Empty folder"
                          : `${jobCount} ${jobCount === 1 ? "job" : "jobs"}`}
                      </p>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Context Menu */}
      {menuFolderId !== null && (
        <div
          style={{
            top: menuPosition.y,
            left: menuPosition.x,
          }}
          onClick={(e) => e.stopPropagation()}
          className="fixed w-36 rounded-xl border border-slate-200 bg-white shadow-lg overflow-hidden z-50"
        >
          <button
            onClick={() => {
              setEditingFolderId(menuFolderId);
              setMenuFolderId(null);
            }}
            className="w-full px-4 py-2 text-left text-sm hover:bg-slate-100"
          >
            Rename
          </button>

          <button
            onClick={() => {
              deleteFolder(menuFolderId);
              setMenuFolderId(null);
            }}
            className="w-full px-4 py-2 text-left text-sm text-red-500 hover:bg-red-50"
          >
            Delete
          </button>
        </div>
      )}
    </main>
  );
}
