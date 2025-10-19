import { useSelector, type TypedUseSelectorHook } from 'react-redux';
import type { RootState } from '../app/store';

// Typed selector hook for consistent usage across the app
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

