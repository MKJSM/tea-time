import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { setAddressModalOpen, setPendingCheckoutAfterAddress } from '../../features/auth/authSlice';
import AddressModal from './AddressModal';
import { Address } from '../../types';

const GlobalAddressModal: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { isAddressModalOpen, pendingCheckoutAfterAddress, editingAddress } = useAppSelector((state) => state.auth);

  const handleClose = () => {
    dispatch(setAddressModalOpen(false));
  };

  const handleSuccess = (address: Address) => {
    // If pending checkout, navigate to checkout after address is saved
    if (pendingCheckoutAfterAddress) {
      dispatch(setPendingCheckoutAfterAddress(false));
      navigate('/checkout');
    }
  };

  return (
    <AddressModal
      isOpen={isAddressModalOpen}
      onClose={handleClose}
      editAddress={editingAddress}
      onSuccess={handleSuccess}
    />
  );
};

export default GlobalAddressModal;
