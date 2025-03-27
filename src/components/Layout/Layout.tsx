import React, { useState, useRef } from 'react';
import styled from 'styled-components';
import Sidebar from '../Sidebar/Sidebar';
import TerminalContainer from '../Terminal/TerminalContainer';
import ProtocolVisualizer from '../Protocol/ProtocolVisualizer';
import ConnectionStatus from './ConnectionStatus';

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

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [terminalCommand, setTerminalCommand] = useState('');
  const terminalRef = useRef<any>(null);

  /**
   * Handle executing a command from the function browser
   * @param command - The command to execute
   */
  const handleTryFunction = (command: string) => {
    setTerminalCommand(command);
    // Focus the terminal input after setting the command
    if (terminalRef.current) {
      terminalRef.current.focusInput();
    }
  };

  return (
    <LayoutContainer>
      <SidebarArea>
        <Sidebar onTryFunction={handleTryFunction} />
      </SidebarArea>
      <MainContent>
        <TerminalContainer 
          ref={terminalRef}
          initialCommand={terminalCommand}
          onCommandExecuted={() => setTerminalCommand('')}
        />
        <ProtocolVisualizer />
      </MainContent>
      <ConnectionStatus />
    </LayoutContainer>
  );
};

export default Layout; 