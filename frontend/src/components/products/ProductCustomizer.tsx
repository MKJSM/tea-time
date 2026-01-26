
import React from 'react';
import { ProductAttribute, SelectedAttributes, AttributeOption } from '../../types';
import { cn } from '../../utils/cn';
import { Check, Info } from 'lucide-react';

interface ProductCustomizerProps {
  attributes: ProductAttribute[];
  selections: SelectedAttributes;
  onSelectionChange: (attributeId: string, value: any) => void;
}

export const ProductCustomizer: React.FC<ProductCustomizerProps> = ({
  attributes,
  selections,
  onSelectionChange
}) => {

  const renderOption = (attr: ProductAttribute, opt: AttributeOption) => {
    const isSelected = selections[attr.id] === opt.value;
    const priceDisplay = opt.priceAdjustment > 0
      ? `+ ₹${opt.priceAdjustment.toFixed(2)}`
      : opt.priceAdjustment < 0
        ? `- ₹${Math.abs(opt.priceAdjustment).toFixed(2)}`
        : null;

    if (attr.type === 'color') {
      return (
        <button
          key={opt.id}
          onClick={() => onSelectionChange(attr.id, opt.value)}
          className={cn(
            "group relative flex flex-col items-center gap-2 transition-all p-2",
            !opt.inStock && "opacity-40 cursor-not-allowed"
          )}
          disabled={!opt.inStock}
        >
          <div
            className={cn(
              "w-12 h-12 rounded-full border-2 p-1 transition-all",
              isSelected ? "border-tea-700 scale-110 shadow-lg" : "border-transparent group-hover:border-gray-200"
            )}
          >
            <div
              className="w-full h-full rounded-full shadow-inner flex items-center justify-center"
              style={{ backgroundColor: opt.colorCode }}
            >
              {isSelected && <Check size={16} className="text-white drop-shadow-sm" />}
            </div>
          </div>
          <div className="flex flex-col items-center">
            <span className={cn(
              "text-[10px] font-bold uppercase tracking-tighter text-center",
              isSelected ? "text-tea-900" : "text-gray-400"
            )}>
              {opt.displayName}
            </span>
            {priceDisplay && (
              <span className="text-[8px] font-bold text-tea-600">{priceDisplay}</span>
            )}
          </div>
        </button>
      );
    }

    return (
      <button
        key={opt.id}
        onClick={() => onSelectionChange(attr.id, opt.value)}
        className={cn(
          "relative flex flex-col p-4 rounded-2xl border-2 transition-all text-left",
          isSelected
            ? "border-tea-700 bg-tea-50/30 shadow-md ring-4 ring-tea-500/5"
            : "border-gray-100 bg-white hover:border-gray-300",
          !opt.inStock && "opacity-40 cursor-not-allowed"
        )}
        disabled={!opt.inStock}
      >
        <div className="flex justify-between items-start w-full mb-1">
          <span className={cn(
            "text-sm font-bold",
            isSelected ? "text-tea-900" : "text-gray-700"
          )}>
            {opt.displayName}
          </span>
          {isSelected && <div className="w-4 h-4 rounded-full bg-tea-700 flex items-center justify-center"><Check size={10} className="text-white" /></div>}
        </div>
        {priceDisplay && (
          <span className="text-xs font-bold text-tea-600 mb-1">{priceDisplay}</span>
        )}
        {!opt.inStock && <span className="text-[8px] font-bold text-red-500 uppercase">Out of Stock</span>}
      </button>
    );
  };

  return (
    <div className="space-y-10">
      {attributes.map((attr) => (
        <div key={attr.id} className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-[0.2em]">{attr.name}</h4>
              {attr.required && (
                <span className="text-[9px] font-bold bg-tea-900 text-white px-2 py-0.5 rounded-full uppercase">Required</span>
              )}
            </div>
            {attr.helpText && (
              <button className="text-gray-300 hover:text-tea-600 transition-colors">
                <Info size={16} />
              </button>
            )}
          </div>

          {attr.description && (
            <p className="text-xs text-gray-500 font-light italic">{attr.description}</p>
          )}

          <div className={cn(
            "grid gap-3",
            attr.type === 'color' ? "flex flex-wrap" : "grid-cols-2 sm:grid-cols-3"
          )}>
            {attr.options.map(opt => renderOption(attr, opt))}
          </div>
        </div>
      ))}
    </div>
  );
};
