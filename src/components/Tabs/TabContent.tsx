import React from 'react';
import styled from 'styled-components';

const TabContentContainer = styled.div`
  display: flex;
  flex: 1;
  overflow: hidden;
  background-color: #1e1e1e;
`;

interface TabContentProps {
  children: React.ReactNode;
}

const TabContent: React.FC<TabContentProps> = ({ children }) => {
  return (
    <TabContentContainer>
      {children}
    </TabContentContainer>
  );
};

export default TabContent; 