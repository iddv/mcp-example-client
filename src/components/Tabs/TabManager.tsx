import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { v4 as uuidv4 } from 'uuid';
import TabBar from './TabBar';
import TabContent from './TabContent';

const TabManagerContainer = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
  overflow: hidden;
  background-color: #1e1e1e;
`;

export interface Tab {
  id: string;
  title: string;
  active: boolean;
}

interface TabManagerProps {
  children: (tabId: string) => React.ReactNode;
}

const TabManager: React.FC<TabManagerProps> = ({ children }) => {
  const [tabs, setTabs] = useState<Tab[]>([]);
  const [activeTabId, setActiveTabId] = useState<string>('');

  // Create default tab on component mount
  useEffect(() => {
    if (tabs.length === 0) {
      const defaultTab = createNewTab('Terminal 1');
      setTabs([defaultTab]);
      setActiveTabId(defaultTab.id);
    }
  }, []);

  // Create a new tab with a unique ID
  const createNewTab = (title: string): Tab => {
    return {
      id: uuidv4(),
      title,
      active: true
    };
  };

  // Add a new tab
  const addTab = () => {
    const newTabNumber = tabs.length + 1;
    const newTab = createNewTab(`Terminal ${newTabNumber}`);
    
    // Deactivate all current tabs
    const updatedTabs = tabs.map(tab => ({
      ...tab,
      active: false
    }));
    
    // Add the new tab and set it as active
    setTabs([...updatedTabs, newTab]);
    setActiveTabId(newTab.id);
  };

  // Remove a tab by ID
  const removeTab = (tabId: string) => {
    // Don't remove if it's the last tab
    if (tabs.length <= 1) return;
    
    // Remove the tab
    const updatedTabs = tabs.filter(tab => tab.id !== tabId);
    
    // If the active tab is being removed, activate the first tab
    if (activeTabId === tabId) {
      setActiveTabId(updatedTabs[0].id);
      
      // Update active state of the new active tab
      updatedTabs[0].active = true;
    }
    
    setTabs(updatedTabs);
  };

  // Activate a tab by ID
  const activateTab = (tabId: string) => {
    if (activeTabId === tabId) return;
    
    const updatedTabs = tabs.map(tab => ({
      ...tab,
      active: tab.id === tabId
    }));
    
    setTabs(updatedTabs);
    setActiveTabId(tabId);
  };

  return (
    <TabManagerContainer>
      <TabBar
        tabs={tabs}
        onAddTab={addTab}
        onRemoveTab={removeTab}
        onActivateTab={activateTab}
      />
      <TabContent>
        {activeTabId && children(activeTabId)}
      </TabContent>
    </TabManagerContainer>
  );
};

export default TabManager; 