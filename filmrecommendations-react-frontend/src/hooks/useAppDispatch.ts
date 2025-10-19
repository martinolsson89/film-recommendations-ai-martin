import { useDispatch } from 'react-redux';
import type { AppDispatch } from '../app/store';

// Use throughout the app instead of plain useDispatch for proper typing
export const useAppDispatch: () => AppDispatch = useDispatch;

