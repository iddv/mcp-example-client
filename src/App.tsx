import React from 'react';
import { AppProvider } from './context/AppContext';
import Layout from './components/Layout/Layout';
import { createGlobalStyle } from 'styled-components';

const GlobalStyle = createGlobalStyle`
  * {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }
  
  body {
    font-family: 'Inter', sans-serif;
    font-size: 16px;
    line-height: 1.5;
    color: #e9e9e9;
    background-color: #1e1e1e;
    overflow: hidden;
  }
  
  ::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }
  
  ::-webkit-scrollbar-track {
    background: #252526;
  }
  
  ::-webkit-scrollbar-thumb {
    background: #3a3a3a;
    border-radius: 4px;
  }
  
  ::-webkit-scrollbar-thumb:hover {
    background: #4a4a4a;
  }
`;

function App() {
  return (
    <AppProvider>
      <GlobalStyle />
      <Layout />
    </AppProvider>
  );
}

export default App;
