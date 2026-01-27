import React, { useState, useCallback, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import {
    changePassword,
    fetchUserDevices,
    logoutDevice,
    logoutAllDevices
} from './authSlice';
import toast from 'react-hot-toast';

// Helper to extract error message safely
const getErrorMessage = (err: unknown, defaultMsg: string): string => {
    if (typeof err === 'string') return err;
    if (err && typeof err === 'object' && 'message' in err && typeof (err as { message: unknown }).message === 'string') {
        return (err as { message: string }).message;
    }
    return defaultMsg;
};

export const useSecurity = (isOpen: boolean) => {
    const dispatch = useAppDispatch();
    const [view, setView] = useState<'main' | 'changePassword' | 'confirmLogoutAll'>('main');
    const [isLoading, setIsLoading] = useState(false);
    const { devices } = useAppSelector((state) => state.auth);
    const [pendingLogoutAllCallback, setPendingLogoutAllCallback] = useState<(() => void) | null>(null);

    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
    });

    useEffect(() => {
        if (isOpen) {
            dispatch(fetchUserDevices());
        }
    }, [isOpen, dispatch]);

    const handleDeviceLogout = useCallback(async (sessionId: string) => {
        try {
            await dispatch(logoutDevice(sessionId)).unwrap();
            toast.success('Logged out from device');
        } catch (err: unknown) {
            // Error handled by global middleware
        }
    }, [dispatch]);

    // Request confirmation for logout all (shows confirmation view)
    const requestLogoutAll = useCallback((onSuccess?: () => void) => {
        setPendingLogoutAllCallback(() => onSuccess || null);
        setView('confirmLogoutAll');
    }, []);

    // Execute logout all after confirmation
    const confirmLogoutAll = useCallback(async () => {
        setIsLoading(true);
        try {
            await dispatch(logoutAllDevices()).unwrap();
            toast.success('Logged out from all devices');
            if (pendingLogoutAllCallback) pendingLogoutAllCallback();
            window.location.reload();
        } catch (err: unknown) {
            // Error handled by global middleware
            setView('main');
        } finally {
            setIsLoading(false);
            setPendingLogoutAllCallback(null);
        }
    }, [dispatch, pendingLogoutAllCallback]);

    // Cancel logout all
    const cancelLogoutAll = useCallback(() => {
        setView('main');
        setPendingLogoutAllCallback(null);
    }, []);

    const handlePasswordChange = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            toast.error('Passwords do not match');
            return;
        }

        // Validate password strength on frontend as well
        const passwordStrengthRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
        if (!passwordStrengthRegex.test(passwordData.newPassword)) {
            toast.error('Password must contain at least one uppercase letter, one lowercase letter, and one digit');
            return;
        }

        setIsLoading(true);
        try {
            await dispatch(changePassword({
                currentPassword: passwordData.currentPassword,
                newPassword: passwordData.newPassword
            })).unwrap();

            toast.success('Password changed successfully');
            setView('main');
            setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        } catch (err: unknown) {
            // Error handled by global middleware
        } finally {
            setIsLoading(false);
        }
    }, [dispatch, passwordData]);

    return {
        view,
        setView,
        isLoading,
        devices,
        passwordData,
        setPasswordData,
        handleDeviceLogout,
        handleLogoutAll: requestLogoutAll, // Keep the same name for backwards compatibility
        confirmLogoutAll,
        cancelLogoutAll,
        handlePasswordChange
    };
};
