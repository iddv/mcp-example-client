import React from 'react';
import styled from 'styled-components';
import { 
  globalShortcuts, 
  terminalShortcuts,
  getShortcutDisplay 
} from '../../utils/keyboardShortcuts';

const Modal = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.6);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
`;

const ModalContent = styled.div`
  background-color: var(--background-primary);
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.25);
  width: 600px;
  max-width: 90%;
  max-height: 80vh;
  overflow-y: auto;
  padding: 1.5rem;
`;

const Title = styled.h2`
  color: var(--text-primary);
  margin-top: 0;
  margin-bottom: 1.5rem;
  font-size: 1.5rem;
`;

const Section = styled.div`
  margin-bottom: 1.5rem;
`;

const SectionTitle = styled.h3`
  color: var(--text-primary);
  margin-bottom: 0.75rem;
  font-size: 1.2rem;
`;

const ShortcutTable = styled.table`
  width: 100%;
  border-collapse: collapse;
`;

const TableRow = styled.tr`
  &:nth-child(odd) {
    background-color: var(--background-secondary);
  }
`;

const TableCell = styled.td`
  padding: 0.5rem 1rem;
  color: var(--text-primary);
  &:first-child {
    width: 40%;
    font-family: 'Roboto Mono', monospace;
  }
`;

const CloseButton = styled.button`
  position: absolute;
  top: 1rem;
  right: 1rem;
  background-color: transparent;
  border: none;
  color: var(--text-primary);
  font-size: 1.5rem;
  cursor: pointer;
  
  &:hover {
    color: var(--primary-color);
  }
`;

const Footer = styled.div`
  display: flex;
  justify-content: flex-end;
  margin-top: 1rem;
`;

const Button = styled.button`
  background-color: var(--primary-color);
  color: #fff;
  border: none;
  border-radius: 4px;
  padding: 0.5rem 1rem;
  cursor: pointer;
  font-size: 0.9rem;
  
  &:hover {
    background-color: var(--primary-color-hover);
  }
`;

interface ShortcutsHelpProps {
  isOpen: boolean;
  onClose: () => void;
}

const ShortcutsHelp: React.FC<ShortcutsHelpProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <Modal onClick={onClose}>
      <ModalContent onClick={e => e.stopPropagation()}>
        <Title>Keyboard Shortcuts</Title>
        
        <Section>
          <SectionTitle>Global Shortcuts</SectionTitle>
          <ShortcutTable>
            <tbody>
              {globalShortcuts.map((shortcut, index) => (
                <TableRow key={index}>
                  <TableCell>{getShortcutDisplay(shortcut.keys)}</TableCell>
                  <TableCell>{shortcut.description}</TableCell>
                </TableRow>
              ))}
            </tbody>
          </ShortcutTable>
        </Section>
        
        <Section>
          <SectionTitle>Terminal Shortcuts</SectionTitle>
          <ShortcutTable>
            <tbody>
              {terminalShortcuts.map((shortcut, index) => (
                <TableRow key={index}>
                  <TableCell>{getShortcutDisplay(shortcut.keys)}</TableCell>
                  <TableCell>{shortcut.description}</TableCell>
                </TableRow>
              ))}
            </tbody>
          </ShortcutTable>
        </Section>
        
        <Footer>
          <Button onClick={onClose}>Close</Button>
        </Footer>
      </ModalContent>
    </Modal>
  );
};

export default ShortcutsHelp; 