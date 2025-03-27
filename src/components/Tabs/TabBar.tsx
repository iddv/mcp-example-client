import React from 'react';
import styled from 'styled-components';
import { Tab } from './TabManager';

const TabBarContainer = styled.div`
  display: flex;
  background-color: #252526;
  border-bottom: 1px solid #3a3a3a;
  height: 36px;
  overflow-x: auto;
  white-space: nowrap;
  
  &::-webkit-scrollbar {
    height: 5px;
  }
`;

interface TabItemProps {
  active: boolean;
}

const TabItem = styled.div<TabItemProps>`
  display: flex;
  align-items: center;
  padding: 0 1rem;
  height: 100%;
  min-width: 120px;
  background-color: ${props => props.active ? '#1e1e1e' : '#252526'};
  color: ${props => props.active ? '#ffffff' : '#a0a0a0'};
  border-right: 1px solid #3a3a3a;
  user-select: none;
  cursor: pointer;
  position: relative;
  
  &:hover {
    background-color: ${props => props.active ? '#1e1e1e' : '#2d2d2d'};
  }
`;

const TabTitle = styled.span`
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const CloseButton = styled.div`
  width: 16px;
  height: 16px;
  display: flex;
  justify-content: center;
  align-items: center;
  border-radius: 50%;
  margin-left: 8px;
  
  &:hover {
    background-color: rgba(255, 255, 255, 0.1);
  }
`;

const AddTabButton = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 100%;
  color: #a0a0a0;
  cursor: pointer;
  
  &:hover {
    background-color: #2d2d2d;
    color: #ffffff;
  }
`;

interface TabBarProps {
  tabs: Tab[];
  onAddTab: () => void;
  onRemoveTab: (tabId: string) => void;
  onActivateTab: (tabId: string) => void;
}

const TabBar: React.FC<TabBarProps> = ({ 
  tabs, 
  onAddTab, 
  onRemoveTab, 
  onActivateTab 
}) => {
  return (
    <TabBarContainer>
      {tabs.map(tab => (
        <TabItem
          key={tab.id}
          active={tab.active}
          onClick={() => onActivateTab(tab.id)}
          data-active={tab.active.toString()}
        >
          <TabTitle>{tab.title}</TabTitle>
          <CloseButton 
            onClick={(e) => {
              e.stopPropagation();
              onRemoveTab(tab.id);
            }}
          >
            ×
          </CloseButton>
        </TabItem>
      ))}
      <AddTabButton onClick={onAddTab}>+</AddTabButton>
    </TabBarContainer>
  );
};

export default TabBar; 