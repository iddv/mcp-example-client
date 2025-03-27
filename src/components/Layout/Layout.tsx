import React, { useState, useRef, useEffect } from 'react';
import styled from 'styled-components';
import Sidebar from '../Sidebar/Sidebar';
import TerminalContainer from '../Terminal/TerminalContainer';
import ProtocolVisualizer from '../Protocol/ProtocolVisualizer';
import ConnectionStatus from './ConnectionStatus';
import TabManager from '../Tabs/TabManager';
import ShortcutsHelp from './ShortcutsHelp';
import { useKeyboardShortcuts, KeyboardShortcut } from '../../utils/keyboardShortcuts';

const LayoutContainer = styled.div`
  display: grid;
  grid-template-rows: 1fr auto;
  grid-template-columns: 300px 1fr;
  grid-template-areas:
    "sidebar main"
    "sidebar status";
  height: 100vh;
  width: 100%;
  overflow: hidden;
  background-color: #1e1e1e;
  color: #f0f0f0;
  font-family: 'Inter', sans-serif;
`;

const SidebarArea = styled.div`
  grid-area: sidebar;
  border-right: 1px solid #3a3a3a;
  overflow: hidden;
`;

const MainContent = styled.div`
  display: flex;
  grid-area: main;
  overflow: hidden;
`;

interface LayoutProps {
  children?: React.ReactNode;
}

interface TerminalInstanceRef {
  focusInput: () => void;
}

interface TerminalRefs {
  [key: string]: React.RefObject<TerminalInstanceRef | null>;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [terminalCommands, setTerminalCommands] = useState<{ [key: string]: string }>({});
  const [isShortcutsHelpOpen, setIsShortcutsHelpOpen] = useState(false);
  const terminalRefs = useRef<TerminalRefs>({});

  // Define global keyboard shortcuts
  const globalShortcuts: KeyboardShortcut[] = [
    {
      keys: ['F1'],
      description: 'Show keyboard shortcuts help',
      action: () => {
        setIsShortcutsHelpOpen(true);
      },
      scope: 'global',
    },
  ];

  // Register global keyboard shortcuts
  useKeyboardShortcuts(globalShortcuts, 'global');

  /**
   * Get or create a terminal ref for a tab
   */
  const getTerminalRef = (tabId: string) => {
    if (!terminalRefs.current[tabId]) {
      terminalRefs.current[tabId] = React.createRef<TerminalInstanceRef | null>();
    }
    return terminalRefs.current[tabId];
  };

  /**
   * Handle executing a command from the function browser
   * @param command - The command to execute
   */
  const handleTryFunction = (command: string) => {
    // Find the active tab (if any) 
    const activeTabId = Object.keys(terminalRefs.current)[0];
    
    if (activeTabId) {
      // Set the command for the active tab
      setTerminalCommands(prev => ({
        ...prev,
        [activeTabId]: command
      }));
      
      // Focus the terminal input after setting the command
      const terminalRef = terminalRefs.current[activeTabId];
      if (terminalRef.current) {
        terminalRef.current.focusInput();
      }
    }
  };

  /**
   * Handle command execution completion
   */
  const handleCommandExecuted = (tabId: string) => {
    setTerminalCommands(prev => {
      const newCommands = { ...prev };
      delete newCommands[tabId];
      return newCommands;
    });
  };

  /**
   * Render a terminal for a specific tab
   */
  const renderTerminal = (tabId: string) => {
    const terminalRef = getTerminalRef(tabId);
    
    return (
      <TerminalContainer
        key={tabId}
        ref={terminalRef}
        initialCommand={terminalCommands[tabId] || ''}
        onCommandExecuted={() => handleCommandExecuted(tabId)}
      />
    );
  };

  return (
    <LayoutContainer>
      <SidebarArea>
        <Sidebar onTryFunction={handleTryFunction} />
      </SidebarArea>
      <MainContent>
        <TabManager>
          {(tabId) => renderTerminal(tabId)}
        </TabManager>
        <ProtocolVisualizer />
      </MainContent>
      <ConnectionStatus />
      <ShortcutsHelp
        isOpen={isShortcutsHelpOpen}
        onClose={() => setIsShortcutsHelpOpen(false)}
      />
    </LayoutContainer>
  );
};

export default Layout; 