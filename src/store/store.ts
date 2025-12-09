// src/store/store.ts

import { configureStore } from '@reduxjs/toolkit';
import boardReducer from './boardSlice'; // Import your board slice reducer

// 1. Configure the Redux Store
export const store = configureStore({
  reducer: {
    // Add all your application slices here
    board: boardReducer,
    // [other slices]...
  },
  // Adding dev tools and middleware here (Redux Toolkit does this by default)
});

// 2. Define the RootState Type
// This type infers the state structure from the store's reducers.
export type RootState = ReturnType<typeof store.getState>;

// 3. Define the AppDispatch Type
// This type infers the dispatch function signature.
export type AppDispatch = typeof store.dispatch;

// You can now use these types in your components:
/*
  // Example usage in a component:
  import { RootState, AppDispatch } from '../store/store';
  import { useSelector, useDispatch } from 'react-redux';

  const boardData = useSelector((state: RootState) => state.board.columns);
  const dispatch: AppDispatch = useDispatch();
*/