import { useState, useCallback, useEffect } from 'react';
import { useRazorpay, RazorpayOrderOptions } from 'react-razorpay';
import toast from 'react-hot-toast';
import {
    useCreateOrderMutation,
    useInitiatePaymentMutation,
    useVerifyPaymentMutation,
} from './ordersApi';

interface UseRazorpayPaymentProps {
    onSuccess?: (orderId: string) => void;
    onError?: (error: any) => void;
    onModalDismiss?: () => void;
}

export const useRazorpayPayment = ({
    onSuccess,
    onError,
    onModalDismiss,
}: UseRazorpayPaymentProps = {}) => {
    const { error: razorpayError, isLoading: isRazorpayLoading, Razorpay: HookRazorpay } = useRazorpay();
    const [createOrder, { isLoading: isCreatingOrder }] = useCreateOrderMutation();
    const [initiatePayment, { isLoading: isInitiatingPayment }] = useInitiatePaymentMutation();
    const [verifyPayment, { isLoading: isVerifyingPayment }] = useVerifyPaymentMutation();
    const [isInternalProcessing, setIsInternalProcessing] = useState(false);
    const [isRazorpayModalOpen, setIsRazorpayModalOpen] = useState(false);
    const [windowRazorpay, setWindowRazorpay] = useState<any>(null);

    // Fallback check for window.Razorpay
    useEffect(() => {
        const checkRazorpay = () => {
            if ((window as any).Razorpay) {
                setWindowRazorpay(() => (window as any).Razorpay);
            }
        };

        checkRazorpay();
        const interval = setInterval(checkRazorpay, 1000);
        return () => clearInterval(interval);
    }, []);

    const Razorpay = HookRazorpay || windowRazorpay;

    // isProcessing is true during backend calls only, NOT when Razorpay modal is open
    // This prevents the fullscreen loader from covering the Razorpay modal
    const isProcessing = (isCreatingOrder || isInitiatingPayment || isVerifyingPayment || isInternalProcessing) && !isRazorpayModalOpen;
    
    // SDK is loading ONLY if Razorpay is not yet available and there's no error
    const isSDKLoading = isRazorpayLoading && !Razorpay && !razorpayError;

    const handlePayment = useCallback(async (
        pendingOrderId: string | null,
        addressId: string,
        setPendingOrderId: (id: string) => void
    ) => {
        if (!Razorpay) {
            toast.error('Razorpay SDK failed to load');
            return;
        }

        setIsInternalProcessing(true);
        try {
            let orderId = pendingOrderId;

            if (!orderId) {
                // 1. Create Order
                const orderData = await createOrder({
                    address_id: addressId,
                    notes: '',
                }).unwrap();

                orderId = orderData.id;
                setPendingOrderId(orderId);
            }

            if (!orderId) throw new Error("Failed to get order ID");

            // 2. Initiate Payment
            const paymentData = await initiatePayment(orderId).unwrap();

            // 3. Open Razorpay
            const options: RazorpayOrderOptions = {
                key: paymentData.razorpay_key_id,
                amount: paymentData.amount,
                currency: paymentData.currency as any,
                name: 'Tea Haven',
                description: `Order ${paymentData.order_number}`,
                order_id: paymentData.razorpay_order_id,
                prefill: paymentData.prefill,
                theme: {
                    color: '#4A5D23', // tea-700
                },
                handler: async function (response: any) {
                    // Payment was successful, close modal state and show processing
                    setIsRazorpayModalOpen(false);
                    setIsInternalProcessing(true);
                    try {
                        // 4. Verify Payment
                        const verifyRes = await verifyPayment({
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature,
                        }).unwrap();

                        if (verifyRes.success) {
                            if (onSuccess) onSuccess(verifyRes.order_id);
                            // We don't set internal processing false here because we are navigating away
                        } else {
                            setIsInternalProcessing(false);
                            toast.error('Payment verification failed');
                            if (onError) onError('Payment verification failed');
                        }
                    } catch (err: any) {
                        setIsInternalProcessing(false);
                        console.error('Verification error:', err);
                        const msg = err.data?.message || 'Payment verification failed';
                        toast.error(msg);
                        if (onError) onError(msg);
                    }
                },
                modal: {
                    ondismiss: function () {
                        setIsRazorpayModalOpen(false);
                        setIsInternalProcessing(false);
                        toast('Payment cancelled', { icon: 'ℹ️' });
                        if (onModalDismiss) onModalDismiss();
                    }
                }
            };

            const razorpayInstance = new Razorpay(options);
            // Set processing to false and mark modal as open before opening
            setIsInternalProcessing(false);
            setIsRazorpayModalOpen(true);
            razorpayInstance.open();

        } catch (err: any) {
            setIsInternalProcessing(false);
            console.error('Payment flow error:', err);
            const msg = err.data?.message || 'Failed to process payment';
            toast.error(msg);
            if (onError) onError(msg);
        }
    }, [Razorpay, createOrder, initiatePayment, verifyPayment, onSuccess, onError, onModalDismiss]);

    return {
        handlePayment,
        isProcessing,
        isSDKLoading,
        isRazorpayModalOpen,
        razorpayError,
    };
};