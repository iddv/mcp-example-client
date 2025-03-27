import React, { useState } from 'react';
import styled from 'styled-components';
import ConnectionSettings from './ConnectionSettings';
import FunctionBrowser from './FunctionBrowser';
import FavoritesList from './FavoritesList';
import ExportImport from './ExportImport';

const SidebarContainer = styled.div`
  display: flex;
  flex-direction: column;
  width: 300px;
  background-color: #1e1e1e;
  border-right: 1px solid #333;
  height: 100%;
  overflow: hidden;
`;

const SidebarContent = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow-y: auto;
`;

const CollapseButton = styled.button<{ isCollapsed: boolean }>`
  position: absolute;
  top: 0.5rem;
  right: ${props => props.isCollapsed ? '0.5rem' : '0.5rem'};
  background-color: transparent;
  border: none;
  color: #aaa;
  font-size: 1rem;
  cursor: pointer;
  z-index: 10;
  padding: 0.25rem;
  
  &:hover {
    color: #e9e9e9;
  }
`;

const CollapsedSidebar = styled.div`
  width: 30px;
  background-color: #1e1e1e;
  border-right: 1px solid #333;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-top: 2rem;
`;

const ExpandButton = styled.button`
  background-color: transparent;
  border: none;
  color: #aaa;
  font-size: 1.2rem;
  cursor: pointer;
  margin-top: 0.5rem;
  padding: 0.25rem;
  
  &:hover {
    color: #e9e9e9;
  }
`;

const Divider = styled.div`
  height: 1px;
  background-color: #3a3a3a;
  margin: 0.5rem 0;
`;

interface SidebarProps {
  onTryFunction: (command: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ onTryFunction }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  // If sidebar is collapsed, show a minimal version
  if (isCollapsed) {
    return (
      <CollapsedSidebar>
        <ExpandButton
          onClick={() => setIsCollapsed(false)}
          title="Expand sidebar"
        >
          &#8250;
        </ExpandButton>
      </CollapsedSidebar>
    );
  }

  return (
    <SidebarContainer>
      <CollapseButton 
        isCollapsed={isCollapsed}
        onClick={() => setIsCollapsed(true)}
        title="Collapse sidebar"
      >
        &#8249;
      </CollapseButton>
      <SidebarContent>
        <ConnectionSettings />
        <Divider />
        <FavoritesList onTryCommand={onTryFunction} />
        <Divider />
        <ExportImport />
        <Divider />
        <FunctionBrowser onTryFunction={onTryFunction} />
      </SidebarContent>
    </SidebarContainer>
  );
};

export default Sidebar; 