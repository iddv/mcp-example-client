import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { 
  ConnectionSettings, 
  CommandHistoryItem, 
  AppSettings,
  ProtocolStep,
  FavoriteCommand
} from '../types/mcp';
import apiClient from '../api/client';

// Define the state structure
interface AppState {
  connection: ConnectionSettings;
  history: CommandHistoryItem[];
  favorites: FavoriteCommand[];
  settings: AppSettings;
  protocol: ProtocolStep[];
  isLoading: boolean;
  error: string | null;
}

// Define action types
type AppAction =
  | { type: 'SET_CONNECTION'; payload: Partial<ConnectionSettings> }
  | { type: 'SET_CONNECTION_ERROR'; payload: string }
  | { type: 'CLEAR_CONNECTION_ERROR' }
  | { type: 'ADD_HISTORY_ITEM'; payload: CommandHistoryItem }
  | { type: 'CLEAR_HISTORY' }
  | { type: 'TOGGLE_FAVORITE'; payload: string }
  | { type: 'REMOVE_HISTORY_ITEM'; payload: string }
  | { type: 'ADD_FAVORITE'; payload: FavoriteCommand }
  | { type: 'REMOVE_FAVORITE'; payload: string }
  | { type: 'UPDATE_FAVORITE'; payload: FavoriteCommand }
  | { type: 'UPDATE_SETTINGS'; payload: Partial<AppSettings> }
  | { type: 'ADD_PROTOCOL_STEP'; payload: ProtocolStep }
  | { type: 'CLEAR_PROTOCOL_STEPS' }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null };

// Define the context type
interface AppContextType {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
  testConnection: () => Promise<boolean>;
  updateConnection: (serverUrl?: string, apiKey?: string) => void;
  addFavorite: (command: string, name: string, description?: string) => void;
  removeFavorite: (id: string) => void;
  updateFavorite: (favorite: FavoriteCommand) => void;
}

// Create the context
const AppContext = createContext<AppContextType | undefined>(undefined);

// Initial state
const initialState: AppState = {
  connection: {
    serverUrl: 'http://localhost:8000',
    apiKey: 'test-key',
    connected: false,
  },
  history: [],
  favorites: [],
  settings: {
    theme: 'dark',
    fontSize: 14,
    showTimestamps: true,
    expandResponses: true,
    maxHistoryItems: 100,
  },
  protocol: [],
  isLoading: false,
  error: null,
};

// Load state from localStorage if available
const loadState = (): AppState => {
  try {
    const savedState = localStorage.getItem('mcp-client-state');
    if (savedState) {
      return {
        ...initialState,
        ...JSON.parse(savedState),
      };
    }
  } catch (error) {
    console.error('Failed to load state from localStorage:', error);
  }
  return initialState;
};

// Save state to localStorage
const saveState = (state: AppState) => {
  try {
    const stateToPersist = {
      connection: {
        serverUrl: state.connection.serverUrl,
        apiKey: state.connection.apiKey,
      },
      settings: state.settings,
      history: state.history.slice(-state.settings.maxHistoryItems),
      favorites: state.favorites,
    };
    localStorage.setItem('mcp-client-state', JSON.stringify(stateToPersist));
  } catch (error) {
    console.error('Failed to save state to localStorage:', error);
  }
};

// Reducer function
const appReducer = (state: AppState, action: AppAction): AppState => {
  switch (action.type) {
    case 'SET_CONNECTION':
      return {
        ...state,
        connection: {
          ...state.connection,
          ...action.payload,
        },
      };
    case 'SET_CONNECTION_ERROR':
      return {
        ...state,
        connection: {
          ...state.connection,
          connected: false,
          error: action.payload,
        },
      };
    case 'CLEAR_CONNECTION_ERROR':
      return {
        ...state,
        connection: {
          ...state.connection,
          error: undefined,
        },
      };
    case 'ADD_HISTORY_ITEM':
      const newHistory = [action.payload, ...state.history].slice(
        0,
        state.settings.maxHistoryItems
      );
      return {
        ...state,
        history: newHistory,
      };
    case 'CLEAR_HISTORY':
      return {
        ...state,
        history: [],
      };
    case 'TOGGLE_FAVORITE':
      return {
        ...state,
        history: state.history.map((item) =>
          item.id === action.payload
            ? { ...item, favorite: !item.favorite }
            : item
        ),
      };
    case 'REMOVE_HISTORY_ITEM':
      return {
        ...state,
        history: state.history.filter((item) => item.id !== action.payload),
      };
    case 'ADD_FAVORITE':
      return {
        ...state,
        favorites: [...state.favorites, action.payload],
      };
    case 'REMOVE_FAVORITE':
      return {
        ...state,
        favorites: state.favorites.filter((item) => item.id !== action.payload),
      };
    case 'UPDATE_FAVORITE':
      return {
        ...state,
        favorites: state.favorites.map((item) =>
          item.id === action.payload.id ? action.payload : item
        ),
      };
    case 'UPDATE_SETTINGS':
      return {
        ...state,
        settings: {
          ...state.settings,
          ...action.payload,
        },
      };
    case 'ADD_PROTOCOL_STEP':
      return {
        ...state,
        protocol: [...state.protocol, action.payload],
      };
    case 'CLEAR_PROTOCOL_STEPS':
      return {
        ...state,
        protocol: [],
      };
    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload,
      };
    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload,
      };
    default:
      return state;
  }
};

// Provider component
export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, loadState());

  // Save state to localStorage whenever it changes
  useEffect(() => {
    saveState(state);
  }, [state]);

  // Update API client when connection settings change
  useEffect(() => {
    apiClient.updateConfig(state.connection.serverUrl, state.connection.apiKey);
  }, [state.connection.serverUrl, state.connection.apiKey]);

  /**
   * Test the connection to the server
   */
  const testConnection = async (): Promise<boolean> => {
    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'CLEAR_CONNECTION_ERROR' });
    
    try {
      const connected = await apiClient.testConnection();
      
      dispatch({
        type: 'SET_CONNECTION',
        payload: { connected },
      });
      
      if (!connected) {
        dispatch({
          type: 'SET_CONNECTION_ERROR',
          payload: 'Failed to connect to the server',
        });
      }
      
      dispatch({ type: 'SET_LOADING', payload: false });
      return connected;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      dispatch({
        type: 'SET_CONNECTION_ERROR',
        payload: errorMessage,
      });
      
      dispatch({ type: 'SET_LOADING', payload: false });
      return false;
    }
  };

  /**
   * Update connection settings
   */
  const updateConnection = (serverUrl?: string, apiKey?: string) => {
    if (serverUrl || apiKey) {
      dispatch({
        type: 'SET_CONNECTION',
        payload: {
          serverUrl,
          apiKey,
          connected: false,
        },
      });
    }
  };

  /**
   * Add a command to favorites
   */
  const addFavorite = (command: string, name: string, description?: string) => {
    const favorite: FavoriteCommand = {
      id: Date.now().toString(),
      name,
      command,
      description,
      createdAt: new Date().toISOString(),
    };

    dispatch({ type: 'ADD_FAVORITE', payload: favorite });
  };

  /**
   * Remove a favorite command
   */
  const removeFavorite = (id: string) => {
    dispatch({ type: 'REMOVE_FAVORITE', payload: id });
  };

  /**
   * Update a favorite command
   */
  const updateFavorite = (favorite: FavoriteCommand) => {
    dispatch({ type: 'UPDATE_FAVORITE', payload: favorite });
  };

  return (
    <AppContext.Provider
      value={{
        state,
        dispatch,
        testConnection,
        updateConnection,
        addFavorite,
        removeFavorite,
        updateFavorite,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

// Custom hook to use the app context
export const useApp = (): AppContextType => {
  const context = useContext(AppContext);

  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }

  return context;
};

export default AppContext; 