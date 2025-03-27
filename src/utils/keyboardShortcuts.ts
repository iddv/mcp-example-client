import { useEffect } from 'react';

/**
 * Type for keyboard shortcut definition
 */
export interface KeyboardShortcut {
  // List of key combinations (e.g., ['Control', 'Enter'], ['Alt', 'S'])
  keys: string[];
  // Description of what the shortcut does
  description: string;
  // Function to execute when shortcut is triggered
  action: (e: KeyboardEvent) => void;
  // Optional scope for the shortcut (e.g., 'global', 'terminal', 'editor')
  scope?: string;
}

/**
 * Check if all keys in the shortcut are pressed
 * @param e Keyboard event
 * @param shortcut Keyboard shortcut to check
 * @returns Boolean indicating if all keys in the shortcut are pressed
 */
const isShortcutPressed = (e: KeyboardEvent, shortcut: KeyboardShortcut): boolean => {
  // Mapping of key aliases
  const keyAliases: Record<string, string[]> = {
    'ctrl': ['control'],
    'control': ['ctrl'],
    'cmd': ['meta'],
    'meta': ['cmd'],
    'command': ['meta', 'cmd'],
    'option': ['alt'],
    'alt': ['option'],
    'esc': ['escape'],
    'escape': ['esc'],
    'return': ['enter'],
    'enter': ['return'],
  };

  // Convert shortcut keys to lowercase for case-insensitive comparison
  const shortcutKeys = shortcut.keys.map(key => key.toLowerCase());
  
  // Check if Ctrl/Cmd key is pressed and required
  const needsCtrlCmd = shortcutKeys.some(key => ['ctrl', 'control', 'cmd', 'meta', 'command'].includes(key));
  if (needsCtrlCmd && !(e.ctrlKey || e.metaKey)) {
    return false;
  }
  
  // Check if Alt key is pressed and required
  const needsAlt = shortcutKeys.some(key => ['alt', 'option'].includes(key));
  if (needsAlt && !e.altKey) {
    return false;
  }
  
  // Check if Shift key is pressed and required
  const needsShift = shortcutKeys.includes('shift');
  if (needsShift && !e.shiftKey) {
    return false;
  }
  
  // For non-modifier keys, check if the key matches any in the shortcut
  const nonModifierKeys = shortcutKeys.filter(key => 
    !['ctrl', 'control', 'cmd', 'meta', 'command', 'alt', 'option', 'shift'].includes(key)
  );
  
  if (nonModifierKeys.length > 0) {
    const pressedKey = e.key.toLowerCase();
    const isKeyPressed = nonModifierKeys.some(key => {
      // Check direct match
      if (key === pressedKey) {
        return true;
      }
      
      // Check aliases
      const aliases = keyAliases[key] || [];
      return aliases.includes(pressedKey);
    });
    
    if (!isKeyPressed) {
      return false;
    }
  }
  
  return true;
};

/**
 * Hook for registering keyboard shortcuts
 * @param shortcuts Array of keyboard shortcuts
 * @param scope Optional scope to filter shortcuts
 */
export const useKeyboardShortcuts = (
  shortcuts: KeyboardShortcut[],
  scope?: string
): void => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Filter shortcuts by scope if provided
      const applicableShortcuts = scope
        ? shortcuts.filter(s => !s.scope || s.scope === scope)
        : shortcuts;
      
      for (const shortcut of applicableShortcuts) {
        if (isShortcutPressed(e, shortcut)) {
          e.preventDefault();
          shortcut.action(e);
          break;
        }
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [shortcuts, scope]);
};

/**
 * Get keyboard shortcut notation for display
 * @param keys Array of keys in the shortcut
 * @returns Formatted shortcut string for display
 */
export const getShortcutDisplay = (keys: string[]): string => {
  const keySymbols: Record<string, string> = {
    'ctrl': '⌃',
    'control': '⌃',
    'alt': '⌥',
    'option': '⌥',
    'shift': '⇧',
    'meta': '⌘',
    'cmd': '⌘',
    'command': '⌘',
    'enter': '↵',
    'return': '↵',
    'escape': 'Esc',
    'esc': 'Esc',
    'backspace': '⌫',
    'delete': 'Del',
    'tab': '⇥',
  };

  return keys.map(key => {
    const lowerKey = key.toLowerCase();
    return keySymbols[lowerKey] || key.toUpperCase();
  }).join(' + ');
};

/**
 * Available keyboard shortcuts
 */
export const globalShortcuts: KeyboardShortcut[] = [
  {
    keys: ['F1'],
    description: 'Show help',
    action: () => {
      // Display help dialog
      console.log('Show help');
    },
    scope: 'global',
  },
  {
    keys: ['Ctrl', 'K'],
    description: 'Clear terminal',
    action: () => {
      // Dispatch clear terminal action
      console.log('Clear terminal');
    },
    scope: 'global',
  },
];

export const terminalShortcuts: KeyboardShortcut[] = [
  {
    keys: ['Ctrl', 'Enter'],
    description: 'Execute command',
    action: () => {
      // Execute the current command
      console.log('Execute command');
    },
    scope: 'terminal',
  },
  {
    keys: ['ArrowUp'],
    description: 'Previous command',
    action: () => {
      // Navigate to previous command in history
      console.log('Previous command');
    },
    scope: 'terminal',
  },
  {
    keys: ['ArrowDown'],
    description: 'Next command',
    action: () => {
      // Navigate to next command in history
      console.log('Next command');
    },
    scope: 'terminal',
  },
]; 