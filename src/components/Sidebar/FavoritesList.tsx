import React, { useState } from 'react';
import styled from 'styled-components';
import { useApp } from '../../context/AppContext';
import type { FavoriteCommand } from '../../types/mcp';

const FavoritesContainer = styled.div`
  display: flex;
  flex-direction: column;
  padding: 1rem;
`;

const FavoritesHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid #3a3a3a;
`;

const Title = styled.h3`
  margin: 0;
  color: #e9e9e9;
  font-size: 1rem;
`;

const FavoritesList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  overflow-y: auto;
  max-height: 300px;
`;

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  color: #a0a0a0;
  font-style: italic;
  text-align: center;
`;

const FavoriteItem = styled.div`
  display: flex;
  flex-direction: column;
  padding: 0.75rem;
  background-color: #252526;
  border-radius: 4px;
  border: 1px solid #3a3a3a;
  
  &:hover {
    border-color: #4A6FFF;
  }
`;

const FavoriteHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
`;

const FavoriteName = styled.span`
  color: #e9e9e9;
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const FavoriteDescription = styled.span`
  color: #a0a0a0;
  font-size: 0.85rem;
  margin-bottom: 0.5rem;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
`;

const FavoriteCommand = styled.code`
  display: block;
  color: #4A6FFF;
  background-color: #2d2d2d;
  font-family: 'Roboto Mono', monospace;
  font-size: 0.85rem;
  padding: 0.5rem;
  border-radius: 4px;
  overflow-x: auto;
  white-space: nowrap;
  cursor: pointer;
  
  &:hover {
    background-color: #333333;
  }
`;

const ButtonsContainer = styled.div`
  display: flex;
  gap: 0.5rem;
`;

const ActionButton = styled.button`
  background-color: transparent;
  border: none;
  color: #a0a0a0;
  cursor: pointer;
  padding: 0.25rem;
  
  &:hover {
    color: #e9e9e9;
  }
`;

const AddFavoriteButton = styled.button`
  background-color: transparent;
  border: 1px solid #4A6FFF;
  border-radius: 4px;
  color: #4A6FFF;
  padding: 0.25rem 0.5rem;
  font-size: 0.85rem;
  cursor: pointer;
  
  &:hover {
    background-color: rgba(74, 111, 255, 0.1);
  }
`;

interface FavoritesListProps {
  onTryCommand: (command: string) => void;
}

const FavoritesListComponent: React.FC<FavoritesListProps> = ({ onTryCommand }) => {
  const { state, removeFavorite } = useApp();
  const { favorites } = state;
  
  const handleUseCommand = (command: string) => {
    onTryCommand(command);
  };
  
  const handleDeleteFavorite = (id: string) => {
    if (window.confirm('Are you sure you want to delete this favorite?')) {
      removeFavorite(id);
    }
  };
  
  return (
    <FavoritesContainer>
      <FavoritesHeader>
        <Title>Favorites</Title>
      </FavoritesHeader>
      
      {favorites.length === 0 ? (
        <EmptyState>
          <p>No favorite commands yet.</p>
          <p>Add your frequently used commands here for quick access.</p>
        </EmptyState>
      ) : (
        <FavoritesList>
          {favorites.map((favorite) => (
            <FavoriteItem key={favorite.id}>
              <FavoriteHeader>
                <FavoriteName>{favorite.name}</FavoriteName>
                <ButtonsContainer>
                  <ActionButton 
                    title="Delete favorite"
                    onClick={() => handleDeleteFavorite(favorite.id)}
                  >
                    🗑️
                  </ActionButton>
                </ButtonsContainer>
              </FavoriteHeader>
              
              {favorite.description && (
                <FavoriteDescription>{favorite.description}</FavoriteDescription>
              )}
              
              <FavoriteCommand onClick={() => handleUseCommand(favorite.command)}>
                {favorite.command}
              </FavoriteCommand>
            </FavoriteItem>
          ))}
        </FavoritesList>
      )}
    </FavoritesContainer>
  );
};

export default FavoritesListComponent; 