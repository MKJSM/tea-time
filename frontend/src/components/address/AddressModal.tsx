import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MapPin, Home, Briefcase, MoreHorizontal, Check, Navigation } from 'lucide-react';
import { useCreateAddressMutation, useUpdateAddressMutation } from '../../features/addresses/addressesApi';
import { Address, AddressLabel, CreateAddressRequest } from '../../types';
import toast from 'react-hot-toast';

interface AddressModalProps {
  isOpen: boolean;
  onClose: () => void;
  editAddress?: Address | null;
  onSuccess?: (address: Address) => void;
}

// Erode, Tamil Nadu coordinates
const ERODE_CENTER = {
  lat: 11.3410,
  lng: 77.7172,
};

const AddressModal: React.FC<AddressModalProps> = ({ isOpen, onClose, editAddress, onSuccess }) => {
  const [createAddress, { isLoading: isCreating }] = useCreateAddressMutation();
  const [updateAddress, { isLoading: isUpdating }] = useUpdateAddressMutation();

  const isLoading = isCreating || isUpdating;

  // Form state
  const [label, setLabel] = useState<AddressLabel>('Home');
  const [recipientName, setRecipientName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [streetAddress, setStreetAddress] = useState('');
  const [city, setCity] = useState('Erode');
  const [state, setState] = useState('Tamil Nadu');
  const [postalCode, setPostalCode] = useState('');
  const [isDefault, setIsDefault] = useState(false);
  const [latitude, setLatitude] = useState<number>(ERODE_CENTER.lat);
  const [longitude, setLongitude] = useState<number>(ERODE_CENTER.lng);

  // Reset form when modal opens/closes or edit address changes
  useEffect(() => {
    if (isOpen) {
      if (editAddress) {
        setLabel(editAddress.label);
        setRecipientName(editAddress.recipient_name);
        setPhoneNumber(editAddress.phone_number);
        setStreetAddress(editAddress.street_address);
        setCity(editAddress.city);
        setState(editAddress.state);
        setPostalCode(editAddress.postal_code);
        setIsDefault(editAddress.is_default);
        setLatitude(editAddress.latitude || ERODE_CENTER.lat);
        setLongitude(editAddress.longitude || ERODE_CENTER.lng);
      } else {
        // Reset to defaults
        setLabel('Home');
        setRecipientName('');
        setPhoneNumber('');
        setStreetAddress('');
        setCity('Erode');
        setState('Tamil Nadu');
        setPostalCode('');
        setIsDefault(false);
        setLatitude(ERODE_CENTER.lat);
        setLongitude(ERODE_CENTER.lng);
      }
    }
  }, [isOpen, editAddress]);

  // Scroll lock
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      // Approximate scrollbar width to prevent jump
      document.body.style.paddingRight = '15px';
    } else {
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
    }
    return () => {
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
    };
  }, [isOpen]);

  // Escape key handler
  const handleEsc = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
  }, [onClose]);

  useEffect(() => {
    if (isOpen) {
      window.addEventListener('keydown', handleEsc);
    }
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, handleEsc]);

  const handleUseCurrentLocation = () => {
    if (navigator.geolocation) {
      const toastId = toast.loading('Fetching your location...');
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLatitude(position.coords.latitude);
          setLongitude(position.coords.longitude);
          toast.success('Location updated!', { id: toastId });
        },
        (error) => {
          toast.error('Failed to get location: ' + error.message, { id: toastId });
        }
      );
    } else {
      toast.error('Geolocation is not supported by your browser');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!recipientName.trim()) {
      toast.error('Recipient name is required');
      return;
    }
    if (!phoneNumber.trim() || phoneNumber.length < 10) {
      toast.error('Valid phone number is required (10+ digits)');
      return;
    }
    if (!streetAddress.trim()) {
      toast.error('Street address is required');
      return;
    }
    if (!postalCode.trim() || postalCode.length < 5) {
      toast.error('Valid postal code is required');
      return;
    }

    const addressData: CreateAddressRequest = {
      label,
      recipient_name: recipientName.trim(),
      phone_number: phoneNumber.trim(),
      street_address: streetAddress.trim(),
      city: city.trim(),
      state: state.trim(),
      postal_code: postalCode.trim(),
      latitude,
      longitude,
      is_default: isDefault,
    };

    try {
      let result: Address;
      if (editAddress) {
        result = await updateAddress({ id: editAddress.id, data: addressData }).unwrap();
        toast.success('Address updated successfully!');
      } else {
        result = await createAddress(addressData).unwrap();
        toast.success('Address added successfully!');
      }
      onSuccess?.(result);
      onClose();
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to save address');
    }
  };

  const getLabelIcon = (l: AddressLabel) => {
    switch (l) {
      case 'Home': return <Home size={18} />;
      case 'Work': return <Briefcase size={18} />;
      default: return <MoreHorizontal size={18} />;
    }
  };

  // Generate OpenStreetMap embed URL centered on the selected location
  const mapUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${longitude - 0.01}%2C${latitude - 0.005}%2C${longitude + 0.01}%2C${latitude + 0.005}&layer=mapnik&marker=${latitude}%2C${longitude}`;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center overflow-hidden p-4 sm:p-6">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ y: '20%', opacity: 0, scale: 0.95 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: '20%', opacity: 0, scale: 0.95 }}
            transition={{ type: "spring", damping: 25, stiffness: 120 }}
            className="relative w-full max-h-[90vh] md:max-h-[85vh] md:max-w-2xl z-10"
          >
            <div className="bg-white rounded-[2rem] md:rounded-[2.5rem] w-full max-h-[90vh] md:max-h-[85vh] overflow-hidden shadow-2xl flex flex-col border border-white/50">

              {/* Header */}
              <div className="p-6 md:p-8 flex justify-between items-center shrink-0 bg-white z-10 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="bg-tea-100 p-2.5 rounded-2xl shadow-sm">
                    <MapPin className="text-tea-700" size={24} />
                  </div>
                  <h2 className="text-2xl font-serif font-bold text-tea-900">
                    {editAddress ? 'Edit Address' : 'Add New Address'}
                  </h2>
                </div>
                <button
                  onClick={onClose}
                  className="p-3 bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-gray-800 rounded-full transition-all group"
                  aria-label="Close modal"
                >
                  <X size={20} className="group-hover:rotate-90 transition-transform duration-300" />
                </button>
              </div>

              {/* Form Body */}
              <div className="flex-grow overflow-y-auto custom-scrollbar">
                <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-6">

                  {/* Map Section */}
                  <div className="rounded-[2rem] overflow-hidden border border-gray-100 shadow-inner group relative">
                    <div className="h-56 relative">
                      <iframe
                        src={mapUrl}
                        className="w-full h-full border-0 grayscale-[20%] group-hover:grayscale-0 transition-all duration-700"
                        title="Location Map"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
                      
                      <button 
                        type="button"
                        onClick={handleUseCurrentLocation}
                        className="absolute bottom-4 right-4 bg-white hover:bg-tea-50 text-tea-700 px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 shadow-xl hover:shadow-tea-900/10 transition-all active:scale-95 border border-tea-100"
                      >
                        <Navigation size={14} className="animate-pulse" />
                        Use My Current Location
                      </button>
                      
                      <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-lg text-[10px] font-bold text-tea-800 uppercase tracking-widest flex items-center gap-1.5 shadow-sm border border-white/50">
                        <MapPin size={10} />
                        Selected Location
                      </div>
                    </div>
                  </div>

                  {/* Address Type Selection */}
                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3 block">
                      Address Type
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                      {(['Home', 'Work', 'Other'] as AddressLabel[]).map((l) => (
                        <button
                          key={l}
                          type="button"
                          onClick={() => setLabel(l)}
                          className={`py-3.5 px-4 rounded-2xl flex items-center justify-center gap-2 font-bold transition-all active:scale-95 ${
                            label === l
                              ? 'bg-tea-800 text-white shadow-lg shadow-tea-900/20'
                              : 'bg-gray-50 text-gray-500 hover:bg-gray-100 border border-gray-200'
                          }`}
                        >
                          {getLabelIcon(l)}
                          <span className="text-xs uppercase tracking-widest">{l}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Name & Phone */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-wide px-1">
                        Recipient Name *
                      </label>
                      <input
                        type="text"
                        value={recipientName}
                        onChange={(e) => setRecipientName(e.target.value)}
                        placeholder="Full name"
                        className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-4 outline-none focus:bg-white focus:ring-4 focus:ring-tea-500/5 focus:border-tea-500/30 transition-all text-tea-900 font-medium shadow-sm"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-wide px-1">
                        Phone Number *
                      </label>
                      <input
                        type="tel"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        placeholder="10-digit mobile number"
                        className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-4 outline-none focus:bg-white focus:ring-4 focus:ring-tea-500/5 focus:border-tea-500/30 transition-all text-tea-900 font-medium shadow-sm"
                        required
                      />
                    </div>
                  </div>

                  {/* Street Address */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wide px-1">
                      Street Address *
                    </label>
                    <textarea
                      value={streetAddress}
                      onChange={(e) => setStreetAddress(e.target.value)}
                      placeholder="House/Flat No., Building Name, Street, Area"
                      rows={3}
                      className="w-full bg-gray-50 border border-gray-100 rounded-[1.5rem] px-5 py-4 outline-none focus:bg-white focus:ring-4 focus:ring-tea-500/5 focus:border-tea-500/30 transition-all resize-none text-tea-900 font-medium shadow-sm"
                      required
                    />
                  </div>

                  {/* City, State, Postal Code */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-wide px-1">
                        City *
                      </label>
                      <input
                        type="text"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        placeholder="City"
                        className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-4 outline-none focus:bg-white focus:ring-4 focus:ring-tea-500/5 focus:border-tea-500/30 transition-all text-tea-900 font-medium shadow-sm"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-wide px-1">
                        State *
                      </label>
                      <input
                        type="text"
                        value={state}
                        onChange={(e) => setState(e.target.value)}
                        placeholder="State"
                        className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-4 outline-none focus:bg-white focus:ring-4 focus:ring-tea-500/5 focus:border-tea-500/30 transition-all text-tea-900 font-medium shadow-sm"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-wide px-1">
                        Postal Code *
                      </label>
                      <input
                        type="text"
                        value={postalCode}
                        onChange={(e) => setPostalCode(e.target.value)}
                        placeholder="6 digits"
                        className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-4 outline-none focus:bg-white focus:ring-4 focus:ring-tea-500/5 focus:border-tea-500/30 transition-all text-tea-900 font-medium shadow-sm"
                        required
                      />
                    </div>
                  </div>

                  {/* Default Address Toggle */}
                  <label className="flex items-center gap-4 cursor-pointer p-6 bg-tea-50/50 rounded-[1.5rem] border border-tea-100 hover:bg-tea-50 transition-all group">
                    <div className={`w-7 h-7 rounded-xl border-2 flex items-center justify-center transition-all group-hover:scale-110 ${
                      isDefault ? 'bg-tea-700 border-tea-700' : 'border-gray-300 bg-white'
                    }`}>
                      {isDefault && <Check size={18} className="text-white" />}
                    </div>
                    <input
                      type="checkbox"
                      checked={isDefault}
                      onChange={(e) => setIsDefault(e.target.checked)}
                      className="sr-only"
                    />
                    <div>
                      <span className="font-bold text-tea-900">Set as default address</span>
                      <p className="text-xs text-tea-600/70 font-medium">Use this for my future orders automatically</p>
                    </div>
                  </label>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-5 bg-tea-800 hover:bg-tea-950 text-white font-bold rounded-[1.5rem] transition-all shadow-xl shadow-tea-900/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 active:scale-[0.98] group"
                  >
                    {isLoading ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <MapPin size={20} className="group-hover:bounce" />
                        <span className="uppercase tracking-[0.2em] text-xs">
                          {editAddress ? 'Update Delivery Address' : 'Save Delivery Address'}
                        </span>
                      </>
                    )}
                  </button>
                </form>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default AddressModal;