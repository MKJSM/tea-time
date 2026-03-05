/**
 * Store integration test for eventsApi:
 * Verifies that the eventsApi slice is correctly registered in the Redux store
 * and its initial state is correct.
 */
import { describe, it, expect } from 'vitest';
import { configureStore } from '@reduxjs/toolkit';
import { eventsApi } from '../../features/events/eventsApi';

function makeTestStore() {
    return configureStore({
        reducer: {
            [eventsApi.reducerPath]: eventsApi.reducer,
        },
        middleware: (getDefault) => getDefault().concat(eventsApi.middleware),
    });
}

describe('eventsApi store integration', () => {
    it('registers eventsApi reducer under correct key', () => {
        const store = makeTestStore();
        const state = store.getState();
        expect(state).toHaveProperty('eventsApi');
    });

    it('initial queries state is an empty object', () => {
        const store = makeTestStore();
        const state = store.getState() as any;
        expect(state.eventsApi.queries).toEqual({});
    });

    it('initial mutations state is an empty object', () => {
        const store = makeTestStore();
        const state = store.getState() as any;
        expect(state.eventsApi.mutations).toEqual({});
    });
});
