
import { isRejectedWithValue } from '@reduxjs/toolkit';
import { Middleware } from '@reduxjs/toolkit';
import toast from 'react-hot-toast';

// Actions that should not show error toasts
const SILENT_ERROR_ACTIONS = [
    'auth/me',
    'favorites/getFavoriteIds',
];

export const rtkQueryErrorLogger: Middleware = () => (next) => (action) => {
    if (isRejectedWithValue(action)) {
        const actionType = (action as any).type as string;

        // Skip error toast for silent actions (like /me check)
        const isSilentAction = SILENT_ERROR_ACTIONS.some(prefix => actionType.startsWith(prefix));
        if (isSilentAction) {
            return next(action);
        }

        // Check if it's a backend error with a message
        // action.payload is usually the error object returned by the query
        const payload = action.payload as any;
        const errorData = payload?.data || payload;
        // Backend returns "error", some libs "message", or fallback to string
        const message = errorData?.error || errorData?.message || (typeof payload === 'string' ? payload : null);

        // Only toast if we have a real backend message, not generic errors
        if (message && message !== 'Aborted' && message !== 'Request failed') {
            toast.error(message, {
                style: { borderRadius: '10px', background: '#333', color: '#fff' },
                duration: 4000
            });
        }
    }
    return next(action);
};
