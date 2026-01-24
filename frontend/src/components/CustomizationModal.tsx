import { useState, useEffect } from 'react';
import { Product, ProductCustomization, CustomizationOption } from '../types';

interface CustomizationModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
  onAddToCart: (product: Product, selectedOptions: Record<number, number>, quantity: number, totalPrice: number) => void;
}

export default function CustomizationModal({ isOpen, onClose, product, onAddToCart }: CustomizationModalProps) {
  const [loading, setLoading] = useState(false);
  const [groups, setGroups] = useState<ProductCustomization[]>([]);
  const [selections, setSelections] = useState<Record<number, number>>({}); // group_id -> option_id (assuming single select for now as per HTML)
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    if (isOpen && product) {
      setLoading(true);
      fetch(`/api/products/${product.id}/customizations`)
        .then(res => res.json())
        .then((data: ProductCustomization[]) => {
          setGroups(data);
          // Set defaults
          const defaults: Record<number, number> = {};
          data.forEach(group => {
            const defaultOption = group.options.find(opt => opt.is_default);
            if (defaultOption) {
              defaults[group.id] = defaultOption.id;
            } else if (group.options.length > 0) {
              defaults[group.id] = group.options[0].id;
            }
          });
          setSelections(defaults);
          setQuantity(1);
          setLoading(false);
        })
        .catch(err => {
          console.error("Failed to fetch customizations", err);
          setLoading(false);
        });
    }
  }, [isOpen, product]);

  if (!isOpen || !product) return null;

  const handleOptionSelect = (groupId: number, optionId: number) => {
    setSelections(prev => ({
      ...prev,
      [groupId]: optionId
    }));
  };

  const handleQuantityChange = (delta: number) => {
    setQuantity(prev => Math.max(1, prev + delta));
  };

  const calculateTotal = () => {
    let total = product.base_price;
    groups.forEach(group => {
      const selectedOptionId = selections[group.id];
      const option = group.options.find(opt => opt.id === selectedOptionId);
      if (option) {
        total += option.price_modifier;
      }
    });
    return total * quantity;
  };

  const totalPrice = calculateTotal();

  const getIcon = (name: string) => {
    const lower = name.toLowerCase();
    if (lower.includes('small')) return '☕';
    if (lower.includes('medium')) return '🥤';
    if (lower.includes('large')) return '🍺';
    if (lower.includes('no sugar')) return '🚫';
    if (lower.includes('less sugar')) return '🍬';
    if (lower.includes('normal')) return '🍭';
    if (lower.includes('extra')) return '🍰';
    if (lower.includes('hot')) return '🔥';
    if (lower.includes('cold')) return '❄️';
    return '✨';
  };

  return (
    <div className={`modal ${isOpen ? 'active' : ''}`} onClick={(e) => {
      if (e.target === e.currentTarget) onClose();
    }}>
      <div className="modal-content">
        <div className="modal-header">
          <h2>Customize {product.name}</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          {loading ? (
            <p>Loading options...</p>
          ) : (
            <>
              {groups.map(group => (
                <div key={group.id} className="customization-section">
                  <h3 className="customization-title">{group.name}</h3>
                  <div className="options-grid">
                    {group.options.map(option => (
                      <div 
                        key={option.id} 
                        className={`option-card ${selections[group.id] === option.id ? 'selected' : ''}`}
                        onClick={() => handleOptionSelect(group.id, option.id)}
                      >
                        <div style={{ fontSize: '2rem' }}>{getIcon(option.name)}</div>
                        <div style={{ fontWeight: 600, marginTop: '0.5rem' }}>{option.name}</div>
                        {option.price_modifier > 0 && (
                          <div style={{ color: '#7f8c8d', fontSize: '0.85rem' }}>+₹{option.price_modifier}</div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              <div className="customization-section">
                <h3 className="customization-title">Quantity</h3>
                <div className="quantity-selector">
                  <button className="quantity-btn" onClick={() => handleQuantityChange(-1)}>−</button>
                  <div className="quantity-display">{quantity}</div>
                  <button className="quantity-btn" onClick={() => handleQuantityChange(1)}>+</button>
                </div>
              </div>

              <button 
                className="add-btn" 
                style={{ width: '100%', marginTop: '2rem', padding: '1rem' }}
                onClick={() => onAddToCart(product, selections, quantity, totalPrice)}
              >
                Add to Cart - ₹{totalPrice}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
