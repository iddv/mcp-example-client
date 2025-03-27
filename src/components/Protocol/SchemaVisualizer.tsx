import React, { useState } from 'react';
import styled from 'styled-components';
import { JSONSchemaProperty } from '../../types/mcp';

// Styled components
const Container = styled.div`
  font-family: 'Roboto Mono', monospace;
  font-size: 0.8rem;
  color: #e9e9e9;
  padding: 1rem;
  background-color: #252526;
  border-radius: 4px;
  margin: 1rem 0;
`;

interface TreeNodeProps {
  level: number;
}

const TreeNode = styled.div<TreeNodeProps>`
  padding-left: ${props => props.level * 1.2}rem;
`;

const PropertyRow = styled.div`
  display: flex;
  align-items: flex-start;
  padding: 0.3rem 0;
  border-radius: 2px;
  cursor: pointer;
  
  &:hover {
    background-color: #383838;
  }
`;

const ToggleButton = styled.button`
  background-color: transparent;
  color: #aaa;
  border: none;
  width: 1.2rem;
  height: 1.2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 0.8rem;
  padding: 0;
  margin-right: 0.3rem;
  
  &:hover {
    color: #fff;
  }
`;

const PropertyName = styled.span<{ required?: boolean }>`
  color: #9cdcfe;
  margin-right: 0.5rem;
  font-weight: ${props => props.required ? 'bold' : 'normal'};
  
  &::after {
    content: ':';
    color: #888;
  }
`;

const PropertyType = styled.span<{ type?: string }>`
  background-color: ${props => {
    switch (props.type) {
      case 'string':
        return '#2d5836';
      case 'number':
      case 'integer':
        return '#614a00';
      case 'boolean':
        return '#2a3367';
      case 'object':
        return '#5e2626';
      case 'array':
        return '#4d336a';
      default:
        return '#444';
    }
  }};
  color: white;
  padding: 0.1rem 0.4rem;
  border-radius: 3px;
  font-size: 0.7rem;
  margin-right: 0.5rem;
`;

const PropertyDescription = styled.span`
  color: #aaa;
  font-style: italic;
  margin-left: 0.5rem;
  font-size: 0.7rem;
`;

const Constraints = styled.div`
  color: #888;
  font-size: 0.7rem;
  margin: 0.25rem 0 0.25rem 1.5rem;
`;

const SchemaGroup = styled.div`
  border-left: 2px solid #444;
  margin: 0.5rem 0 0.5rem 0.5rem;
  padding-left: 1rem;
`;

const SectionTitle = styled.div`
  font-weight: bold;
  color: #aaa;
  margin: 0.5rem 0;
  font-size: 0.9rem;
`;

const Badge = styled.span`
  background-color: #333;
  color: #aaa;
  padding: 0.1rem 0.3rem;
  border-radius: 3px;
  font-size: 0.7rem;
  margin-right: 0.3rem;
`;

interface SchemaPropertyProps {
  name?: string;
  schema: JSONSchemaProperty;
  level: number;
  required?: boolean;
  path: string[];
}

// Function to get display string for type
const getTypeDisplay = (schema: JSONSchemaProperty): string => {
  if (!schema.type) return 'any';
  
  if (Array.isArray(schema.type)) {
    return schema.type.join(' | ');
  }
  
  return schema.type;
};

// Function to determine if a schema has children
const hasChildren = (schema: JSONSchemaProperty): boolean => {
  return (
    !!schema.properties || 
    !!schema.items || 
    !!schema.anyOf || 
    !!schema.oneOf || 
    !!schema.allOf
  );
};

// Format constraint values
const formatConstraint = (value: any): string => {
  if (typeof value === 'object') {
    return JSON.stringify(value);
  }
  return String(value);
};

const SchemaProperty: React.FC<SchemaPropertyProps> = ({ 
  name, 
  schema, 
  level, 
  required = false,
  path = []
}) => {
  const [isExpanded, setIsExpanded] = useState(level < 2);
  const typeDisplay = getTypeDisplay(schema);
  const schemaHasChildren = hasChildren(schema);
  const propertyPath = name ? [...path, name] : path;
  
  // Get constraints that should be displayed
  const getConstraints = () => {
    const constraints = [];
    
    // String constraints
    if (schema.minLength !== undefined) {
      constraints.push(`minLength: ${schema.minLength}`);
    }
    if (schema.maxLength !== undefined) {
      constraints.push(`maxLength: ${schema.maxLength}`);
    }
    if (schema.pattern) {
      constraints.push(`pattern: ${schema.pattern}`);
    }
    if (schema.format) {
      constraints.push(`format: ${schema.format}`);
    }
    
    // Number constraints
    if (schema.minimum !== undefined) {
      constraints.push(`minimum: ${schema.minimum}`);
    }
    if (schema.maximum !== undefined) {
      constraints.push(`maximum: ${schema.maximum}`);
    }
    if (schema.multipleOf !== undefined) {
      constraints.push(`multipleOf: ${schema.multipleOf}`);
    }
    
    // Array constraints
    if (schema.minItems !== undefined) {
      constraints.push(`minItems: ${schema.minItems}`);
    }
    if (schema.maxItems !== undefined) {
      constraints.push(`maxItems: ${schema.maxItems}`);
    }
    if (schema.uniqueItems !== undefined) {
      constraints.push(`uniqueItems: ${schema.uniqueItems}`);
    }
    
    // Object constraints
    if (schema.minProperties !== undefined) {
      constraints.push(`minProperties: ${schema.minProperties}`);
    }
    if (schema.maxProperties !== undefined) {
      constraints.push(`maxProperties: ${schema.maxProperties}`);
    }
    
    // Enum
    if (schema.enum) {
      constraints.push(`enum: [${schema.enum.map(formatConstraint).join(', ')}]`);
    }
    
    // Default value
    if (schema.default !== undefined) {
      constraints.push(`default: ${formatConstraint(schema.default)}`);
    }
    
    return constraints;
  };
  
  const constraints = getConstraints();
  
  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsExpanded(!isExpanded);
  };
  
  const renderObjectProperties = () => {
    if (!schema.properties || !isExpanded) return null;
    
    const propertyNames = Object.keys(schema.properties);
    const requiredProps = schema.required || [];
    
    if (propertyNames.length === 0) {
      return <TreeNode level={level + 1}>No properties defined</TreeNode>;
    }
    
    return (
      <SchemaGroup>
        {propertyNames.map(propName => (
          <SchemaProperty
            key={`${propertyPath.join('.')}.${propName}`}
            name={propName}
            schema={schema.properties![propName]}
            level={level + 1}
            required={requiredProps.includes(propName)}
            path={propertyPath}
          />
        ))}
      </SchemaGroup>
    );
  };
  
  const renderArrayItems = () => {
    if (!schema.items || !isExpanded) return null;
    
    return (
      <SchemaGroup>
        <SectionTitle>Array Items</SectionTitle>
        {Array.isArray(schema.items) ? (
          schema.items.map((item, index) => (
            <SchemaProperty
              key={`${propertyPath.join('.')}.items.${index}`}
              name={`[${index}]`}
              schema={item}
              level={level + 1}
              path={[...propertyPath, 'items']}
            />
          ))
        ) : (
          <SchemaProperty
            name="items"
            schema={schema.items}
            level={level + 1}
            path={[...propertyPath, 'items']}
          />
        )}
      </SchemaGroup>
    );
  };
  
  const renderCombinationSchemas = (
    schemas: JSONSchemaProperty[] | undefined,
    title: string,
    type: 'allOf' | 'anyOf' | 'oneOf'
  ) => {
    if (!schemas || !isExpanded) return null;
    
    return (
      <SchemaGroup>
        <SectionTitle>{title}</SectionTitle>
        {schemas.map((subSchema, index) => (
          <SchemaProperty
            key={`${propertyPath.join('.')}.${type}.${index}`}
            name={`Option ${index + 1}`}
            schema={subSchema}
            level={level + 1}
            path={[...propertyPath, type, String(index)]}
          />
        ))}
      </SchemaGroup>
    );
  };
  
  return (
    <TreeNode level={level}>
      <PropertyRow onClick={schemaHasChildren ? handleToggle : undefined}>
        {schemaHasChildren && (
          <ToggleButton onClick={handleToggle}>
            {isExpanded ? '▼' : '►'}
          </ToggleButton>
        )}
        {!schemaHasChildren && <span style={{ width: '1.2rem', marginRight: '0.3rem' }} />}
        
        {name && <PropertyName required={required}>{name}</PropertyName>}
        
        <PropertyType type={Array.isArray(schema.type) ? schema.type[0] : schema.type}>
          {typeDisplay}
        </PropertyType>
        
        {schema.description && (
          <PropertyDescription>{schema.description}</PropertyDescription>
        )}
      </PropertyRow>
      
      {constraints.length > 0 && isExpanded && (
        <Constraints>
          {constraints.map((constraint, index) => (
            <Badge key={index}>{constraint}</Badge>
          ))}
        </Constraints>
      )}
      
      {renderObjectProperties()}
      {renderArrayItems()}
      {renderCombinationSchemas(schema.allOf, 'All Of', 'allOf')}
      {renderCombinationSchemas(schema.anyOf, 'Any Of', 'anyOf')}
      {renderCombinationSchemas(schema.oneOf, 'One Of', 'oneOf')}
    </TreeNode>
  );
};

interface SchemaVisualizerProps {
  schema: JSONSchemaProperty;
  title?: string;
}

const SchemaVisualizer: React.FC<SchemaVisualizerProps> = ({ schema, title }) => {
  return (
    <Container>
      {title && <SectionTitle>{title}</SectionTitle>}
      <SchemaProperty 
        schema={schema} 
        level={0} 
        path={[]} 
      />
    </Container>
  );
};

export default SchemaVisualizer; 