import React from 'react';
import styled from 'styled-components';
import { JSONSchemaProperty } from '../../types/mcp';

const InputContainer = styled.div`
  margin-bottom: 1rem;
`;

const InputLabel = styled.label<{ required?: boolean }>`
  display: block;
  margin-bottom: 0.5rem;
  font-size: 0.9rem;
  color: #e9e9e9;
  
  &::after {
    content: ${props => props.required ? '"*"' : '""'};
    color: #ff6b6b;
    margin-left: 0.25rem;
  }
`;

const TextInput = styled.input<{ hasError?: boolean }>`
  width: 100%;
  padding: 0.5rem;
  background-color: #1e1e1e;
  border: 1px solid ${props => props.hasError ? '#ff6b6b' : '#3a3a3a'};
  border-radius: 4px;
  color: #e9e9e9;
  font-family: 'Roboto Mono', monospace;
  font-size: 0.9rem;
  
  &:focus {
    outline: none;
    border-color: ${props => props.hasError ? '#ff6b6b' : '#4A6FFF'};
  }
`;

const NumberInput = styled(TextInput)`
  /* Additional styles for number inputs */
`;

const Select = styled.select<{ hasError?: boolean }>`
  width: 100%;
  padding: 0.5rem;
  background-color: #1e1e1e;
  border: 1px solid ${props => props.hasError ? '#ff6b6b' : '#3a3a3a'};
  border-radius: 4px;
  color: #e9e9e9;
  font-family: 'Roboto Mono', monospace;
  font-size: 0.9rem;
  
  &:focus {
    outline: none;
    border-color: ${props => props.hasError ? '#ff6b6b' : '#4A6FFF'};
  }
`;

const Checkbox = styled.input.attrs({ type: 'checkbox' })<{ hasError?: boolean }>`
  margin-right: 0.5rem;
  vertical-align: middle;
`;

const TextArea = styled.textarea<{ hasError?: boolean }>`
  width: 100%;
  min-height: 100px;
  padding: 0.5rem;
  background-color: #1e1e1e;
  border: 1px solid ${props => props.hasError ? '#ff6b6b' : '#3a3a3a'};
  border-radius: 4px;
  color: #e9e9e9;
  font-family: 'Roboto Mono', monospace;
  font-size: 0.9rem;
  resize: vertical;
  
  &:focus {
    outline: none;
    border-color: ${props => props.hasError ? '#ff6b6b' : '#4A6FFF'};
  }
`;

const ErrorMessage = styled.div`
  color: #ff6b6b;
  font-size: 0.8rem;
  margin-top: 0.25rem;
`;

const Description = styled.div`
  color: #a0a0a0;
  font-size: 0.8rem;
  margin-top: 0.25rem;
  margin-bottom: 0.5rem;
`;

export interface ParameterInputProps {
  name: string;
  schema: JSONSchemaProperty;
  value: any;
  onChange: (value: any) => void;
  error?: string;
  isRequired?: boolean;
}

const ParameterInput: React.FC<ParameterInputProps> = ({
  name,
  schema,
  value,
  onChange,
  error,
  isRequired = false,
}) => {
  const getDisplayName = (name: string): string => {
    return name
      .split(/(?=[A-Z])/)
      .map(s => s.charAt(0).toUpperCase() + s.slice(1))
      .join(' ');
  };
  
  const getPlaceholder = (): string => {
    if (schema.default !== undefined) {
      return `Default: ${schema.default}`;
    }
    
    if (schema.type) {
      const type = Array.isArray(schema.type) ? schema.type[0] : schema.type;
      return `Enter ${type}...`;
    }
    
    return '';
  };
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { type, checked, value: inputValue } = e.target as HTMLInputElement;
    
    if (type === 'checkbox') {
      onChange(checked);
    } else if (type === 'number') {
      // Convert to number or keep empty string for optional fields
      onChange(inputValue === '' ? '' : Number(inputValue));
    } else {
      onChange(inputValue);
    }
  };
  
  const handleJsonChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    try {
      if (e.target.value === '') {
        onChange('');
        return;
      }
      
      const parsed = JSON.parse(e.target.value);
      onChange(parsed);
    } catch (err) {
      // If invalid JSON, just update the raw value
      // Error will be caught by validation
      onChange(e.target.value);
    }
  };
  
  const renderInput = () => {
    if (!schema.type) {
      return (
        <TextInput
          value={value || ''}
          onChange={handleInputChange}
          placeholder={getPlaceholder()}
          hasError={!!error}
        />
      );
    }
    
    const types = Array.isArray(schema.type) ? schema.type : [schema.type];
    const primaryType = types[0];
    
    // Handle enum type with select box
    if (schema.enum) {
      return (
        <Select
          value={value || ''}
          onChange={handleInputChange}
          hasError={!!error}
        >
          <option value="">{isRequired ? 'Select an option' : 'Optional - select an option'}</option>
          {schema.enum.map((option) => (
            <option key={String(option)} value={String(option)}>
              {String(option)}
            </option>
          ))}
        </Select>
      );
    }
    
    switch (primaryType) {
      case 'string':
        // Use textarea for strings with format='markdown' or long strings
        if (schema.format === 'markdown' || schema.maxLength && schema.maxLength > 100) {
          return (
            <TextArea
              value={value || ''}
              onChange={handleInputChange}
              placeholder={getPlaceholder()}
              hasError={!!error}
            />
          );
        }
        return (
          <TextInput
            type="text"
            value={value || ''}
            onChange={handleInputChange}
            placeholder={getPlaceholder()}
            hasError={!!error}
          />
        );
        
      case 'number':
      case 'integer':
        return (
          <NumberInput
            type="number"
            value={value === undefined || value === '' ? '' : value}
            onChange={handleInputChange}
            placeholder={getPlaceholder()}
            min={schema.minimum}
            max={schema.maximum}
            step={primaryType === 'integer' ? 1 : 'any'}
            hasError={!!error}
          />
        );
        
      case 'boolean':
        return (
          <div>
            <Checkbox
              checked={!!value}
              onChange={handleInputChange}
              hasError={!!error}
            />
            <span>Enabled</span>
          </div>
        );
        
      case 'object':
      case 'array':
        // For complex types, use textarea with JSON
        const jsonValue = value ? JSON.stringify(value, null, 2) : '';
        return (
          <TextArea
            value={jsonValue}
            onChange={handleJsonChange}
            placeholder={`Enter JSON ${primaryType}...`}
            hasError={!!error}
          />
        );
        
      default:
        return (
          <TextInput
            value={value || ''}
            onChange={handleInputChange}
            placeholder={getPlaceholder()}
            hasError={!!error}
          />
        );
    }
  };
  
  return (
    <InputContainer>
      <InputLabel required={isRequired}>
        {getDisplayName(name)}
      </InputLabel>
      
      {schema.description && (
        <Description>
          {schema.description}
        </Description>
      )}
      
      {renderInput()}
      
      {error && (
        <ErrorMessage>
          {error}
        </ErrorMessage>
      )}
    </InputContainer>
  );
};

export default ParameterInput; 