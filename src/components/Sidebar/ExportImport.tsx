import React, { useState, useRef } from 'react';
import styled from 'styled-components';
import { useApp } from '../../context/AppContext';
import { exportData, downloadExportedFile, importData } from '../../utils/exportImport';

const Container = styled.div`
  padding: 1rem;
  background-color: var(--background-secondary);
  border-radius: 8px;
  margin-bottom: 1rem;
`;

const Title = styled.h3`
  font-size: 1rem;
  margin-bottom: 1rem;
  color: var(--text-primary);
`;

const ButtonGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const Button = styled.button`
  background-color: var(--background-tertiary);
  color: var(--text-primary);
  border: 1px solid var(--border-color);
  border-radius: 4px;
  padding: 0.5rem 1rem;
  cursor: pointer;
  font-size: 0.9rem;
  transition: background-color 0.2s;

  &:hover {
    background-color: var(--background-hover);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const Checkbox = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 0.5rem;
  gap: 0.5rem;
  color: var(--text-primary);
  font-size: 0.9rem;
`;

const FileInput = styled.input`
  display: none;
`;

const StatusMessage = styled.div<{ isError?: boolean }>`
  font-size: 0.8rem;
  margin-top: 0.5rem;
  color: ${(props) => (props.isError ? 'var(--error-color)' : 'var(--success-color)')};
`;

const ExportImport: React.FC = () => {
  const { state, dispatch } = useApp();
  const [exportHistory, setExportHistory] = useState(true);
  const [exportFavorites, setExportFavorites] = useState(true);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    try {
      const historyToExport = exportHistory ? state.history : undefined;
      const favoritesToExport = exportFavorites ? state.favorites : undefined;
      
      if (!exportHistory && !exportFavorites) {
        setStatusMessage('Please select data to export');
        setIsError(true);
        return;
      }
      
      const file = exportData(historyToExport, favoritesToExport);
      downloadExportedFile(file);
      
      setStatusMessage('Export successful');
      setIsError(false);
      
      // Clear status message after 3 seconds
      setTimeout(() => {
        setStatusMessage(null);
      }, 3000);
    } catch (error) {
      setStatusMessage(`Export failed: ${error instanceof Error ? error.message : String(error)}`);
      setIsError(true);
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    try {
      const file = files[0];
      const importedData = await importData(file);
      
      if (importedData.history) {
        // Replace existing history with imported history
        importedData.history.forEach(item => {
          dispatch({ type: 'ADD_HISTORY_ITEM', payload: item });
        });
      }
      
      if (importedData.favorites) {
        // Replace existing favorites with imported favorites
        importedData.favorites.forEach(favorite => {
          // Remove existing favorite with same ID if exists
          dispatch({ type: 'REMOVE_FAVORITE', payload: favorite.id });
          // Add the imported favorite
          dispatch({ type: 'ADD_FAVORITE', payload: favorite });
        });
      }
      
      setStatusMessage('Import successful');
      setIsError(false);
      
      // Clear status message after 3 seconds
      setTimeout(() => {
        setStatusMessage(null);
      }, 3000);
    } catch (error) {
      setStatusMessage(`Import failed: ${error instanceof Error ? error.message : String(error)}`);
      setIsError(true);
    }
    
    // Reset the input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <Container>
      <Title>Export/Import Data</Title>
      
      <Checkbox>
        <input
          type="checkbox"
          id="exportHistory"
          checked={exportHistory}
          onChange={(e) => setExportHistory(e.target.checked)}
        />
        <label htmlFor="exportHistory">Export Command History</label>
      </Checkbox>
      
      <Checkbox>
        <input
          type="checkbox"
          id="exportFavorites"
          checked={exportFavorites}
          onChange={(e) => setExportFavorites(e.target.checked)}
        />
        <label htmlFor="exportFavorites">Export Favorites</label>
      </Checkbox>
      
      <ButtonGroup>
        <Button onClick={handleExport}>
          Export Data
        </Button>
        
        <Button onClick={handleImportClick}>
          Import Data
        </Button>
        
        <FileInput
          ref={fileInputRef}
          type="file"
          accept=".json"
          onChange={handleFileChange}
        />
      </ButtonGroup>
      
      {statusMessage && (
        <StatusMessage isError={isError}>
          {statusMessage}
        </StatusMessage>
      )}
    </Container>
  );
};

export default ExportImport; 