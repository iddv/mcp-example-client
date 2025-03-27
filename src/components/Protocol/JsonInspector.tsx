import React, { useState } from 'react';
import styled from 'styled-components';

// Styled components
const Container = styled.div`
  font-family: 'Roboto Mono', monospace;
  font-size: 0.8rem;
  line-height: 1.4;
  margin-top: 1rem;
  color: #e9e9e9;
`;

interface TreeNodeProps {
  level: number;
}

const TreeNode = styled.div<TreeNodeProps>`
  padding-left: ${props => props.level * 1.2}rem;
`;

const NodeRow = styled.div`
  display: flex;
  align-items: flex-start;
  padding: 0.15rem 0;
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

const KeyName = styled.span`
  color: #9cdcfe;
  margin-right: 0.5rem;
  
  &::after {
    content: ':';
    color: #888;
  }
`;

const StringValue = styled.span`
  color: #ce9178;
  
  &::before {
    content: '"';
  }
  
  &::after {
    content: '"';
  }
`;

const NumberValue = styled.span`
  color: #b5cea8;
`;

const BooleanValue = styled.span`
  color: #569cd6;
`;

const NullValue = styled.span`
  color: #569cd6;
  font-style: italic;
`;

const ObjectBrace = styled.span`
  color: #cccccc;
`;

const ArrayBracket = styled.span`
  color: #cccccc;
`;

const Placeholder = styled.span`
  font-style: italic;
  color: #666;
`;

// Ellipsis added to very long values
const TruncatedValue = styled.span`
  color: #aaa;
`;

const MetaInfo = styled.span`
  color: #666;
  font-size: 0.75rem;
  margin-left: 0.5rem;
`;

// Helper function to stringify primitive values safely
const stringifyPrimitive = (value: any): string => {
  if (value === null) return 'null';
  if (value === undefined) return 'undefined';
  if (typeof value === 'function') return 'function() { ... }';
  if (typeof value === 'string') {
    // Truncate long strings
    if (value.length > 50) {
      return `${value.substring(0, 50)}...`;
    }
    return value;
  }
  return String(value);
};

// Helper function to get a preview of complex objects
const getObjectPreview = (obj: any): string => {
  if (Array.isArray(obj)) {
    if (obj.length === 0) return '[]';
    return `Array(${obj.length})`;
  }
  
  if (typeof obj === 'object' && obj !== null) {
    const keys = Object.keys(obj);
    if (keys.length === 0) return '{}';
    return `{${keys.slice(0, 3).join(', ')}${keys.length > 3 ? ', ...' : ''}}`;
  }
  
  return stringifyPrimitive(obj);
};

interface JsonInspectorProps {
  data: any;
  expandLevel?: number;
  maxExpandedKeys?: number;
}

interface JsonNodeProps {
  keyName?: string;
  value: any;
  level: number;
  expandLevel: number;
  isLast: boolean;
  path: string[];
}

const JsonNode: React.FC<JsonNodeProps> = ({ 
  keyName, 
  value, 
  level, 
  expandLevel, 
  isLast,
  path
}) => {
  // Check if this node should be expanded by default
  const defaultExpanded = level < expandLevel;
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const nodeType = Array.isArray(value) ? 'array' : typeof value;
  const hasChildren = nodeType === 'object' && value !== null;
  const displayKey = keyName !== undefined;

  // Generate unique path for this node based on its location in the tree
  const nodePath = displayKey ? [...path, keyName] : path;
  const nodePathString = nodePath.join('.');

  // Toggle expansion of this node
  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsExpanded(!isExpanded);
  };

  // Render different types of values
  const renderValue = () => {
    // Null value
    if (value === null) {
      return <NullValue>null</NullValue>;
    }

    // Undefined value
    if (value === undefined) {
      return <NullValue>undefined</NullValue>;
    }

    // Primitive types
    switch (nodeType) {
      case 'string':
        return <StringValue>{stringifyPrimitive(value)}</StringValue>;
      case 'number':
        return <NumberValue>{value}</NumberValue>;
      case 'boolean':
        return <BooleanValue>{value.toString()}</BooleanValue>;
      case 'function':
        return <Placeholder>function() {'{ ... }'}</Placeholder>;
      case 'array':
        return (
          <>
            <ArrayBracket>[</ArrayBracket>
            {!isExpanded && (
              <TruncatedValue>
                {value.length > 0 ? `${value.length} items` : 'empty'}
              </TruncatedValue>
            )}
            {!isExpanded && <ArrayBracket>]</ArrayBracket>}
          </>
        );
      case 'object':
        if (value === null) return <NullValue>null</NullValue>;
        const keys = Object.keys(value);
        return (
          <>
            <ObjectBrace>{'{'}</ObjectBrace>
            {!isExpanded && (
              <TruncatedValue>
                {keys.length > 0 ? `${keys.length} keys` : 'empty'}
              </TruncatedValue>
            )}
            {!isExpanded && <ObjectBrace>{'}'}</ObjectBrace>}
          </>
        );
      default:
        return <span>{String(value)}</span>;
    }
  };

  // Render children nodes for objects and arrays
  const renderChildren = () => {
    if (!hasChildren || !isExpanded) return null;

    if (Array.isArray(value)) {
      if (value.length === 0) {
        return (
          <TreeNode level={level + 1}>
            <NodeRow>
              <Placeholder>empty array</Placeholder>
            </NodeRow>
          </TreeNode>
        );
      }

      return value.map((item, index) => (
        <JsonNode
          key={`${nodePathString}.${index}`}
          keyName={index.toString()}
          value={item}
          level={level + 1}
          expandLevel={expandLevel}
          isLast={index === value.length - 1}
          path={[...nodePath]}
        />
      ));
    } else {
      const keys = Object.keys(value);

      if (keys.length === 0) {
        return (
          <TreeNode level={level + 1}>
            <NodeRow>
              <Placeholder>empty object</Placeholder>
            </NodeRow>
          </TreeNode>
        );
      }

      return keys.map((key, index) => (
        <JsonNode
          key={`${nodePathString}.${key}`}
          keyName={key}
          value={value[key]}
          level={level + 1}
          expandLevel={expandLevel}
          isLast={index === keys.length - 1}
          path={[...nodePath]}
        />
      ));
    }
  };

  // Render closing bracket for objects and arrays
  const renderClosing = () => {
    if (!hasChildren || !isExpanded) return null;

    return (
      <TreeNode level={level}>
        <NodeRow>
          {Array.isArray(value) ? (
            <ArrayBracket>]</ArrayBracket>
          ) : (
            <ObjectBrace>{'}'}</ObjectBrace>
          )}
        </NodeRow>
      </TreeNode>
    );
  };

  return (
    <>
      <TreeNode level={level}>
        <NodeRow onClick={hasChildren ? handleToggle : undefined}>
          {hasChildren && (
            <ToggleButton onClick={handleToggle}>
              {isExpanded ? '▼' : '►'}
            </ToggleButton>
          )}
          {!hasChildren && <span style={{ width: '1.2rem', marginRight: '0.3rem' }} />}

          {displayKey && <KeyName>{keyName}</KeyName>}
          {renderValue()}

          {hasChildren && (
            <MetaInfo>
              {Array.isArray(value) 
                ? `${value.length} items` 
                : `${Object.keys(value).length} keys`}
            </MetaInfo>
          )}
        </NodeRow>
      </TreeNode>

      {renderChildren()}
      {renderClosing()}
    </>
  );
};

const JsonInspector: React.FC<JsonInspectorProps> = ({ 
  data, 
  expandLevel = 2,
  maxExpandedKeys = 50
}) => {
  return (
    <Container>
      {data !== undefined ? (
        <JsonNode
          value={data}
          level={0}
          expandLevel={expandLevel}
          isLast={true}
          path={[]}
        />
      ) : (
        <Placeholder>No data to display</Placeholder>
      )}
    </Container>
  );
};

export default JsonInspector; 