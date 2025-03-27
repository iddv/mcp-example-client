import React, { useState, useRef } from 'react';
import styled from 'styled-components';
import Sidebar from '../Sidebar/Sidebar';
import TerminalContainer from '../Terminal/TerminalContainer';
import ProtocolVisualizer from '../Protocol/ProtocolVisualizer';

const LayoutContainer = styled.div`
  display: flex;
  height: 100vh;
  width: 100%;
  overflow: hidden;
  background-color: #1e1e1e;
  color: #f0f0f0;
  font-family: 'Inter', sans-serif;
`;

const MainContent = styled.div`
  display: flex;
  flex: 1;
  height: 100%;
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
      <Sidebar onTryFunction={handleTryFunction} />
      <MainContent>
        <TerminalContainer 
          ref={terminalRef}
          initialCommand={terminalCommand}
          onCommandExecuted={() => setTerminalCommand('')}
        />
        <ProtocolVisualizer />
      </MainContent>
    </LayoutContainer>
  );
};

export default Layout; 