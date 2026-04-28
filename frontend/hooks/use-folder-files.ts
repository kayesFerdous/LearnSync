import { useQuery } from "@tanstack/react-query";
import { fetchFolderFiles } from "../app/(main)/chat/_lib/api";
import { FolderFile } from "../app/(main)/chat/_lib/types";

export const useFolderFiles = (folderId?: string) => {
    return useQuery({
        queryKey: ["folderPlugins", folderId], // Using a unique key to avoid collisions
        queryFn: async () => {
            if (!folderId) return [];
            const response = await fetchFolderFiles(folderId);
            return response.files;
        },
        enabled: !!folderId,
        staleTime: 1000 * 60 * 5, // 5 minutes cache
    });
};
