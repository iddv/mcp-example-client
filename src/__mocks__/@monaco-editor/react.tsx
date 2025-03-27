import React from 'react';

const MonacoEditor = ({ value, onChange }: { value: string; onChange: (value: string) => void }) => {
  function handleChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    onChange(e.target.value);
  }
  return <textarea data-testid="monaco-editor" value={value} onChange={handleChange} />;
};

export default MonacoEditor; 