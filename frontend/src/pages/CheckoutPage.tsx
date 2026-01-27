
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../features/cart/useCart';
import { motion } from 'framer-motion';
import { ShieldCheck, CreditCard, Truck, CheckCircle, Apple, Plus, MapPin, Home, Briefcase, MoreHorizontal, Check, Edit2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { TeaLoader } from '../components/common/TeaLoader';
import { useAppSelector, useAppDispatch } from '../store/hooks';
import { setAuthModalOpen, setPendingCheckoutAfterAddress } from '../features/auth/authSlice';
import { useRazorpayPayment } from '../features/orders/useRazorpayPayment';
import { formatPrice } from '../utils/format';
import { useGetAddressesQuery, useSetDefaultAddressMutation } from '../features/addresses/addressesApi';
import { Address, AddressLabel } from '../types';
import AddressModal from '../components/address/AddressModal';

const CheckoutPage: React.FC = () => {
  const { cartTotal, clearEntireCart, items } = useCart();

  const [step, setStep] = useState(1);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [pendingOrderId, setPendingOrderId] = useState<string | null>(() => {
    return sessionStorage.getItem('pending_checkout_order_id');
  });
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  // Persist pending order ID
  useEffect(() => {
    if (pendingOrderId) {
      sessionStorage.setItem('pending_checkout_order_id', pendingOrderId);
    } else {
      sessionStorage.removeItem('pending_checkout_order_id');
    }
  }, [pendingOrderId]);

  const { isAuthenticated } = useAppSelector((state) => state.auth);
  const { data: addresses = [], isLoading: isLoadingAddresses, refetch } = useGetAddressesQuery(undefined, {
    skip: !isAuthenticated,
  });
  const [setDefaultAddress] = useSetDefaultAddressMutation();

  const handlePaymentSuccess = React.useCallback((orderId: string) => {
    clearEntireCart();
    setPendingOrderId(null);
    sessionStorage.removeItem('pending_checkout_order_id');
    toast.success('Order placed successfully!', { icon: '🎉' });
    navigate(`/order/${orderId}?success=true`);
  }, [clearEntireCart, navigate]);

  const handlePaymentError = React.useCallback((err: any) => {
    console.error("Payment failed", err);
    const errorMessage = typeof err === 'string' ? err : (err.data?.message || err.message || 'Failed to place order');
    toast.error(errorMessage);
  }, []);

  const { handlePayment, isProcessing, isSDKLoading, razorpayError } = useRazorpayPayment({
    onSuccess: handlePaymentSuccess,
    onError: handlePaymentError
  });

  // Redirect to cart if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      dispatch(setPendingCheckoutAfterAddress(true));
      dispatch(setAuthModalOpen(true));
      navigate('/cart');
    }
  }, [isAuthenticated, dispatch, navigate]);

  // Open address modal if no addresses are found
  useEffect(() => {
    if (isAuthenticated && !isLoadingAddresses && addresses.length === 0) {
      setIsAddressModalOpen(true);
    }
  }, [isAuthenticated, isLoadingAddresses, addresses.length]);

  // Set default address as selected when addresses load
  useEffect(() => {
    if (addresses.length > 0 && !selectedAddressId) {
      const defaultAddress = addresses.find(a => a.is_default);
      setSelectedAddressId(defaultAddress?.id || addresses[0].id);
    }
  }, [addresses, selectedAddressId]);

  const selectedAddress = addresses.find(a => a.id === selectedAddressId);

  const handlePlaceOrder = async () => {
    if (!selectedAddress) {
      toast.error('Please select a delivery address');
      setStep(1);
      return;
    }

    await handlePayment(pendingOrderId, selectedAddress.id, setPendingOrderId);
  };

  const handleContinueToPayment = () => {
    if (!selectedAddressId) {
      toast.error('Please select a delivery address');
      return;
    }
    setStep(2);
  };

  const handleAddNewAddress = () => {
    setEditingAddress(null);
    setIsAddressModalOpen(true);
  };

  const handleEditAddress = (address: Address) => {
    setEditingAddress(address);
    setIsAddressModalOpen(true);
  };

  const handleAddressModalClose = () => {
    setIsAddressModalOpen(false);
    setEditingAddress(null);
  };

  const handleAddressSuccess = (address: Address) => {
    setSelectedAddressId(address.id);
    refetch();
  };

  const getLabelIcon = (label: AddressLabel) => {
    switch (label) {
      case 'Home': return <Home size={16} />;
      case 'Work': return <Briefcase size={16} />;
      default: return <MoreHorizontal size={16} />;
    }
  };

  if (isProcessing) {
    return <TeaLoader type="whisk" size="fullscreen" message="Processing payment and whisking your tea collection..." />;
  }

  if (!isAuthenticated) {
    return null; // Will redirect in useEffect
  }

  // Calculate totals to match backend (5% CGST + 5% SGST + 30 Delivery)
  const subtotal = cartTotal;
  const tax = subtotal * 0.10; // 10% total tax
  const deliveryCharge = 30.0;
  const finalTotal = subtotal + tax + deliveryCharge;

  return (
    <div className="min-h-screen bg-cream py-6 sm:py-12 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-center gap-2 sm:gap-4 mb-8 sm:mb-12">
          {[1, 2, 3].map((i) => (
            <React.Fragment key={i}>
              <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-xs sm:text-base font-bold transition-colors ${step >= i ? 'bg-tea-700 text-white' : 'bg-gray-200 text-gray-500'
                }`}>
                {step > i ? <CheckCircle size={18} className="sm:w-5 sm:h-5" /> : i}
              </div>
              {i < 3 && <div className={`h-1 w-8 sm:w-12 rounded-full ${step > i ? 'bg-tea-700' : 'bg-gray-200'}`} />}
            </React.Fragment>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 lg:gap-12">
          <div className="lg:col-span-3">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-gray-100"
            >
              {step === 1 && (
                <div>
                  <h2 className="text-xl sm:text-2xl font-serif font-bold text-tea-900 mb-6 flex items-center gap-2">
                    <Truck className="text-tea-700" /> Delivery Address
                  </h2>

                  {isLoadingAddresses ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="w-8 h-8 border-2 border-tea-200 border-t-tea-700 rounded-full animate-spin" />
                    </div>
                  ) : addresses.length === 0 ? (
                    <div className="text-center py-8">
                      <div className="w-16 h-16 bg-tea-50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <MapPin size={32} className="text-tea-600" />
                      </div>
                      <p className="text-gray-500 mb-6">No saved addresses yet</p>
                      <button
                        onClick={handleAddNewAddress}
                        className="inline-flex items-center gap-2 px-6 py-3 bg-tea-700 text-white font-bold rounded-xl hover:bg-tea-800 transition-colors"
                      >
                        <Plus size={18} />
                        Add New Address
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {addresses.map((address) => (
                        <div
                          key={address.id}
                          onClick={() => setSelectedAddressId(address.id)}
                          className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${selectedAddressId === address.id
                            ? 'border-tea-600 bg-tea-50'
                            : 'border-gray-100 hover:border-gray-200'
                            }`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-3">
                              <div className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full border-2 flex items-center justify-center mt-1 sm:mt-0.5 shrink-0 ${selectedAddressId === address.id
                                ? 'border-tea-600 bg-tea-600'
                                : 'border-gray-300'
                                }`}>
                                {selectedAddressId === address.id && (
                                  <Check size={12} className="text-white sm:w-3.5 sm:h-3.5" />
                                )}
                              </div>
                              <div>
                                <div className="flex items-center flex-wrap gap-2 mb-1">
                                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold ${address.label === 'Home' ? 'bg-blue-50 text-blue-700' :
                                    address.label === 'Work' ? 'bg-purple-50 text-purple-700' :
                                      'bg-gray-50 text-gray-700'
                                    }`}>
                                    {getLabelIcon(address.label)}
                                    {address.label}
                                  </span>
                                  {address.is_default && (
                                    <span className="text-[9px] font-bold text-tea-600 uppercase tracking-wider">Default</span>
                                  )}
                                </div>
                                <p className="font-bold text-tea-900 text-sm sm:text-base">{address.recipient_name}</p>
                                <p className="text-xs sm:text-sm text-gray-600 line-clamp-1">{address.street_address}</p>
                                <p className="text-xs sm:text-sm text-gray-500">
                                  {address.city}, {address.state} - {address.postal_code}
                                </p>
                                <p className="text-[10px] sm:text-xs text-gray-500 mt-1">Phone: {address.phone_number}</p>
                              </div>
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditAddress(address);
                              }}
                              className="p-2 text-gray-400 hover:text-tea-700 hover:bg-tea-50 rounded-lg transition-colors"
                            >
                              <Edit2 size={16} />
                            </button>
                          </div>
                        </div>
                      ))}

                      <button
                        onClick={handleAddNewAddress}
                        className="w-full p-4 rounded-2xl border-2 border-dashed border-gray-200 hover:border-tea-300 hover:bg-tea-50/50 transition-all flex items-center justify-center gap-2 text-gray-500 hover:text-tea-700"
                      >
                        <Plus size={20} />
                        <span className="font-medium text-sm">Add New Address</span>
                      </button>
                    </div>
                  )}

                  {addresses.length > 0 && (
                    <button
                      onClick={handleContinueToPayment}
                      disabled={!selectedAddressId}
                      className="w-full mt-8 py-4 bg-tea-700 text-white font-bold rounded-2xl hover:bg-tea-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
                    >
                      Continue to Payment
                    </button>
                  )}
                </div>
              )}

              {step === 2 && (
                <div>
                  <h2 className="text-xl sm:text-2xl font-serif font-bold text-tea-900 mb-6 flex items-center gap-2">
                    <CreditCard className="text-tea-700" /> Payment Method
                  </h2>

                  {selectedAddress && (
                    <div className="mb-6 p-4 bg-gray-50 rounded-xl border border-gray-100">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-xs sm:text-sm">
                          <MapPin size={14} className="text-tea-600" />
                          <span className="font-medium text-gray-700">Delivering to:</span>
                          <span className="text-tea-800 font-bold line-clamp-1">{selectedAddress.recipient_name}</span>
                        </div>
                        <button
                          onClick={() => setStep(1)}
                          className="text-[10px] sm:text-xs text-tea-600 font-bold hover:underline shrink-0 ml-2"
                        >
                          Change
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="space-y-4">
                    {/* Placeholder for UPI / Other payments - for now we only support the Razorpay Modal flow which covers cards/UPI */}
                    <div className="p-4 bg-green-50 border border-green-100 rounded-xl">
                      <p className="text-sm text-green-800 font-medium text-center">
                        You will be redirected to Razorpay securely to complete your payment.
                      </p>
                    </div>


                  </div>
                  <button
                    onClick={() => setStep(3)}
                    className="w-full mt-8 py-4 bg-tea-700 text-white font-bold rounded-2xl hover:bg-tea-800 transition-colors active:scale-[0.98]"
                  >Review Order</button>
                </div>
              )}

              {step === 3 && (
                <div>
                  <h2 className="text-xl sm:text-2xl font-serif font-bold text-tea-900 mb-6 flex items-center gap-2">
                    <CheckCircle className="text-tea-700" /> Final Review
                  </h2>

                  {selectedAddress && (
                    <div className="mb-6 p-4 bg-tea-50 rounded-xl border border-tea-100">
                      <div className="flex items-center gap-2 mb-2">
                        <Truck size={16} className="text-tea-600" />
                        <span className="text-xs font-bold text-tea-800 uppercase tracking-widest">Delivery Address</span>
                      </div>
                      <p className="text-sm font-bold text-tea-900">{selectedAddress.recipient_name}</p>
                      <p className="text-xs text-tea-700 mt-0.5">
                        {selectedAddress.street_address}, {selectedAddress.city}, {selectedAddress.state} - {selectedAddress.postal_code}
                      </p>
                      <p className="text-xs text-tea-600 mt-1">Phone: {selectedAddress.phone_number}</p>
                    </div>
                  )}

                  <div className="p-5 bg-gray-50 rounded-2xl border border-gray-100 mb-8">
                    <p className="text-xs text-gray-500 leading-relaxed mb-3">By placing this order, you agree to our terms of service and the premium quality guarantee.</p>
                    <div className="flex items-center gap-2 text-tea-900">
                      <ShieldCheck size={16} className="text-tea-600" />
                      <span className="text-xs font-bold">Estimated Delivery: 2-3 Business Days</span>
                    </div>
                  </div>

                  {razorpayError && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-xl text-red-700 text-xs font-medium flex items-center gap-2">
                      <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                      Failed to load secure payment gateway. Please refresh or check your connection.
                    </div>
                  )}

                  <button
                    onClick={handlePlaceOrder}
                    disabled={isSDKLoading || !!razorpayError}
                    className="w-full py-5 bg-tea-800 text-white font-bold text-lg rounded-2xl hover:bg-tea-900 transition-all shadow-xl active:scale-[0.98] disabled:opacity-70 disabled:cursor-wait"
                  >
                    {isSDKLoading ? 'Initializing Secure Payment...' : razorpayError ? 'Payment Gateway Error' : `Complete Purchase — ${formatPrice(finalTotal)}`}
                  </button>
                  <button
                    onClick={() => setStep(1)}
                    className="w-full mt-4 py-2 text-tea-700 font-bold text-xs uppercase tracking-widest hover:underline"
                  >Change Details</button>
                </div>
              )}
            </motion.div>
          </div>

          <div className="lg:col-span-2">
            <div className="bg-tea-900 text-white rounded-[2rem] p-6 sm:p-8 lg:sticky lg:top-24 shadow-2xl">
              <h3 className="text-xl font-serif font-bold mb-6">Order Summary</h3>
              <div className="space-y-4 mb-8 max-h-48 lg:max-h-64 overflow-y-auto custom-scrollbar-light pr-2">
                {items.map(item => (
                  <div key={item.itemKey} className="flex justify-between items-center text-xs">
                    <div className="flex gap-3">
                      <img src={item.image} className="w-10 h-10 object-cover rounded-lg" alt={item.name} />
                      <div>
                        <p className="font-bold line-clamp-1">{item.name}</p>
                        <p className="text-tea-400 text-[10px]">Qty: {item.quantity}</p>
                      </div>
                    </div>
                    <span className="font-bold shrink-0">{formatPrice(item.price * item.quantity)}</span>
                  </div>
                ))}
              </div>
              <div className="space-y-3 pt-6 border-t border-white/10">
                <div className="flex justify-between text-tea-300 text-sm">
                  <span>Subtotal</span>
                  <span>{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between text-tea-300 text-sm">
                  <span>Tax (10%)</span>
                  <span>{formatPrice(tax)}</span>
                </div>
                <div className="flex justify-between text-xl font-bold pt-2 text-white">
                  <span>Total</span>
                  <span className="text-accent-400">{formatPrice(finalTotal)}</span>
                </div>
              </div>
              <div className="mt-8 flex items-center gap-2 text-tea-400 text-[9px] uppercase tracking-[0.2em] font-bold">
                <ShieldCheck size={12} /> Secure Checkout
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Address Modal */}
      <AddressModal
        isOpen={isAddressModalOpen}
        onClose={handleAddressModalClose}
        editAddress={editingAddress}
        onSuccess={handleAddressSuccess}
      />
    </div>
  );
};

export default CheckoutPage;
