import {create} from "zustand";

type FolderData = {
    folder_name: string;
    folder_id: string;
    job_ids: string[];
}

type FolderStore = {
    folderData: FolderData[] | null;
    setFolderData: (data:FolderData[]) => void;
    clearFolderData: () => void
}

export const useFolderStore = create<FolderStore>((set) => ({
    folderData: null,

    setFolderData: (data) => set({ folderData: data}),

    clearFolderData: () => set({folderData: null}),
}))

