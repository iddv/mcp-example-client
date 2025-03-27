import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { MCPFunctionDefinition, JSONSchemaProperty } from '../../types/mcp';
import ParameterInput from './ParameterInput';

const BuilderContainer = styled.div`
  background-color: #252526;
  border-radius: 4px;
  overflow: hidden;
  margin: 1rem 0;
`;

const BuilderHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: #333;
  padding: 0.75rem 1rem;
  border-bottom: 1px solid #444;
`;

const BuilderTitle = styled.h3`
  margin: 0;
  font-size: 0.9rem;
  color: #e9e9e9;
`;

const BuilderContent = styled.div`
  padding: 1rem;
`;

const BuilderFooter = styled.div`
  display: flex;
  justify-content: flex-end;
  padding: 0.75rem 1rem;
  border-top: 1px solid #444;
  gap: 0.5rem;
`;

const Button = styled.button<{ primary?: boolean }>`
  background-color: ${props => props.primary ? '#4A6FFF' : '#3a3a3a'};
  color: #e9e9e9;
  border: none;
  border-radius: 4px;
  padding: 0.5rem 1rem;
  font-size: 0.9rem;
  cursor: pointer;
  
  &:hover:not(:disabled) {
    background-color: ${props => props.primary ? '#3a5fd9' : '#4a4a4a'};
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const ErrorText = styled.div`
  color: #ff6b6b;
  margin-top: 0.5rem;
  font-size: 0.85rem;
`;

export interface CommandBuilderProps {
  functionDefinition: MCPFunctionDefinition;
  onGenerate: (parameters: Record<string, any>) => void;
  onCancel: () => void;
  initialParameters?: Record<string, any>;
}

const CommandBuilder: React.FC<CommandBuilderProps> = ({
  functionDefinition,
  onGenerate,
  onCancel,
  initialParameters = {}
}) => {
  const [parameters, setParameters] = useState<Record<string, any>>(initialParameters);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const schema = functionDefinition.parameters;
  
  // Reset parameters when function definition changes
  useEffect(() => {
    setParameters(initialParameters);
    setErrors({});
  }, [functionDefinition, initialParameters]);
  
  const handleParameterChange = (name: string, value: any) => {
    setParameters(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };
  
  const validateParameters = (): boolean => {
    const newErrors: Record<string, string> = {};
    let isValid = true;
    
    // Check required parameters
    if (schema.required) {
      for (const requiredParam of schema.required) {
        if (parameters[requiredParam] === undefined || parameters[requiredParam] === '') {
          newErrors[requiredParam] = `${requiredParam} is required`;
          isValid = false;
        }
      }
    }
    
    // Validate each parameter's type and constraints
    if (schema.properties) {
      for (const [paramName, paramSchema] of Object.entries(schema.properties)) {
        if (parameters[paramName] !== undefined) {
          // Validate based on type
          if (!validateParameterType(paramName, parameters[paramName], paramSchema)) {
            isValid = false;
          }
        }
      }
    }
    
    setErrors(newErrors);
    return isValid;
  };
  
  const validateParameterType = (
    paramName: string, 
    value: any, 
    paramSchema: JSONSchemaProperty
  ): boolean => {
    // Skip validation if value is undefined or empty string and not required
    if (
      (value === undefined || value === '') && 
      (!schema.required || !schema.required.includes(paramName))
    ) {
      return true;
    }
    
    if (!paramSchema.type) return true;
    
    const types = Array.isArray(paramSchema.type) ? paramSchema.type : [paramSchema.type];
    let isValid = false;
    
    for (const type of types) {
      switch (type) {
        case 'string':
          isValid = typeof value === 'string';
          break;
        case 'number':
        case 'integer':
          isValid = typeof value === 'number';
          if (type === 'integer' && isValid) {
            isValid = Number.isInteger(value);
          }
          break;
        case 'boolean':
          isValid = typeof value === 'boolean';
          break;
        case 'object':
          isValid = typeof value === 'object' && value !== null && !Array.isArray(value);
          break;
        case 'array':
          isValid = Array.isArray(value);
          break;
        case 'null':
          isValid = value === null;
          break;
      }
      
      if (isValid) break;
    }
    
    if (!isValid) {
      setErrors(prev => ({
        ...prev,
        [paramName]: `Invalid type for ${paramName}. Expected ${types.join(' or ')}.`
      }));
      return false;
    }
    
    return true;
  };
  
  const handleGenerate = () => {
    if (validateParameters()) {
      // Filter out empty string values for optional parameters
      const cleanedParameters = Object.entries(parameters).reduce((acc, [key, value]) => {
        if (value !== '') {
          acc[key] = value;
        }
        return acc;
      }, {} as Record<string, any>);
      
      onGenerate(cleanedParameters);
    }
  };
  
  const renderParameterInputs = () => {
    if (!schema.properties) return null;
    
    return Object.entries(schema.properties).map(([name, propSchema]) => {
      const isRequired = schema.required ? schema.required.includes(name) : false;
      
      return (
        <ParameterInput
          key={name}
          name={name}
          schema={propSchema}
          value={parameters[name]}
          onChange={(value) => handleParameterChange(name, value)}
          error={errors[name]}
          isRequired={isRequired}
        />
      );
    });
  };
  
  return (
    <BuilderContainer>
      <BuilderHeader>
        <BuilderTitle>
          {functionDefinition.name} - Command Builder
        </BuilderTitle>
      </BuilderHeader>
      
      <BuilderContent>
        <div style={{ marginBottom: '1rem' }}>
          <p>{functionDefinition.description}</p>
        </div>
        
        {renderParameterInputs()}
        
        {Object.keys(errors).length > 0 && (
          <ErrorText>
            Please fix the errors before generating the command.
          </ErrorText>
        )}
      </BuilderContent>
      
      <BuilderFooter>
        <Button onClick={onCancel}>
          Cancel
        </Button>
        <Button 
          primary 
          onClick={handleGenerate}
          disabled={Object.keys(errors).length > 0}
        >
          Generate Command
        </Button>
      </BuilderFooter>
    </BuilderContainer>
  );
};

export default CommandBuilder; 