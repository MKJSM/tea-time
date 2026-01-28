import { createAsyncThunk } from '@reduxjs/toolkit';

/**
 * A reusable wrapper for createAsyncThunk that handles common API patterns:
 * - Execution of the API call
 * - Optional data transformation
 * - Standardized error handling with rejectWithValue
 * 
 * @param typePrefix The Redux action type prefix
 * @param apiCall A function that returns the promise (e.g., API request)
 * @param transform Optional function to transform the response data before returning
 */
export const createApiThunk = <Returned, ThunkArg = void>(
    typePrefix: string,
    apiCall: (arg: ThunkArg, thunkAPI: any) => Promise<any>,
    transform?: (data: any) => Returned
) => {
    return createAsyncThunk<Returned, ThunkArg>(
        typePrefix,
        async (arg, thunkAPI) => {
            try {
                const response = await apiCall(arg, thunkAPI);
                // If the API call returns a response object with data, use that
                const data = response?.data !== undefined ? response.data : response;

                return transform ? transform(data) : (data as Returned);
            } catch (err: any) {
                // Prefer backend error message over generic messages
                const backendError = err.response?.data?.error || err.response?.data?.message;
                const message = backendError || (err.message !== 'Request failed' ? err.message : null) || 'Something went wrong';
                return thunkAPI.rejectWithValue(message);
            }
        }
    );
};
