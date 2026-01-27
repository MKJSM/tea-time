
import { isRejectedWithValue } from '@reduxjs/toolkit';
import { Middleware } from '@reduxjs/toolkit';
import toast from 'react-hot-toast';

export const rtkQueryErrorLogger: Middleware = () => (next) => (action) => {
    if (isRejectedWithValue(action)) {
        // Check if it's a backend error with a message
        // action.payload is usually the error object returned by the query
        const payload = action.payload as any;
        const errorData = payload?.data || payload;
        // Backend returns "error", some libs "message", or fallback to string
        const message = errorData?.error || errorData?.message || payload?.message || (typeof payload === 'string' ? payload : 'Something went wrong');

        // Only toast if it's not a "cancelled" error or component unmount issue
        if (message && message !== 'Aborted') {
            toast.error(message, {
                style: { borderRadius: '10px', background: '#333', color: '#fff' },
                duration: 4000
            });
        }
    }
    return next(action);
};
