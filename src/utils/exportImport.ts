import { CommandHistoryItem, FavoriteCommand } from '../types/mcp';

/**
 * Interface for exported data structure
 */
interface ExportedData {
  history?: CommandHistoryItem[];
  favorites?: FavoriteCommand[];
  timestamp: number;
  version: string;
}

/**
 * Export history and/or favorites to a JSON file
 * @param history Optional history items to export
 * @param favorites Optional favorites to export
 * @returns A File object containing the exported data
 */
export const exportData = (
  history?: CommandHistoryItem[],
  favorites?: FavoriteCommand[]
): File => {
  const data: ExportedData = {
    timestamp: Date.now(),
    version: '1.0.0', // Version of the export format
  };

  if (history?.length) {
    data.history = history;
  }

  if (favorites?.length) {
    data.favorites = favorites;
  }

  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: 'application/json',
  });

  return new File([blob], `mcp-export-${new Date().toISOString().slice(0, 10)}.json`, {
    type: 'application/json',
  });
};

/**
 * Download the exported data file
 * @param file The File object to download
 */
export const downloadExportedFile = (file: File): void => {
  const url = URL.createObjectURL(file);
  const a = document.createElement('a');
  a.href = url;
  a.download = file.name;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 0);
};

/**
 * Import data from a JSON file
 * @param file The File object to import
 * @returns A Promise that resolves to the imported data
 */
export const importData = async (
  file: File
): Promise<{ history?: CommandHistoryItem[]; favorites?: FavoriteCommand[] }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (event) => {
      try {
        if (!event.target?.result) {
          throw new Error('Failed to read file');
        }
        
        const data = JSON.parse(event.target.result as string) as ExportedData;
        
        // Validate the imported data
        if (!data.version || !data.timestamp) {
          throw new Error('Invalid export file format');
        }
        
        resolve({
          history: data.history,
          favorites: data.favorites,
        });
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };
    
    reader.readAsText(file);
  });
}; 