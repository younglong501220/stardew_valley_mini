import React from 'react';
import { InventoryItem } from '../types/game';

interface ToolbarProps {
  inventory: InventoryItem[];
  selectedIndex: number;
  onSelectSlot: (index: number) => void;
  onEatItem?: (index: number) => void;
}

export const Toolbar: React.FC<ToolbarProps> = ({
  inventory,
  selectedIndex,
  onSelectSlot,
  onEatItem,
}) => {
  const currentItem = inventory[selectedIndex];

  return (
    <div className="w-full max-w-[800px] mt-2 flex flex-col items-center">
      {/* Hotbar Slots */}
      <div className="stardew-wood-box p-2 rounded-xl flex items-center justify-center gap-1.5 overflow-x-auto max-w-full">
        {inventory.map((item, idx) => {
          const isActive = idx === selectedIndex;
          const isEdible = item.energyRestore && item.count > 0;

          return (
            <button
              key={`${item.id}-${idx}`}
              onClick={() => onSelectSlot(idx)}
              className={`stardew-slot-btn relative w-12 h-14 md:w-14 md:h-16 rounded-lg flex flex-col items-center justify-between p-1 cursor-pointer select-none ${
                isActive ? 'active' : ''
              }`}
              title={`${item.name} ${item.count > 1 ? `(數量: ${item.count})` : ''}`}
            >
              {/* Hotkey Number */}
              <span className="text-[10px] font-pixel text-[#854d0e] self-start leading-none opacity-80">
                {idx + 1}
              </span>

              {/* Icon */}
              <div className="text-xl md:text-2xl leading-none drop-shadow-sm">
                {item.icon}
              </div>

              {/* Quantity or Level */}
              <div className="w-full text-right">
                {item.count > 1 ? (
                  <span className="text-[11px] font-bold text-[#4a2810] font-pixel leading-none">
                    {item.count}
                  </span>
                ) : item.level && item.level > 1 ? (
                  <span className="text-[9px] font-bold text-amber-700 bg-amber-200 px-1 rounded-sm leading-none">
                    Lv{item.level}
                  </span>
                ) : (
                  <span className="text-[10px] text-transparent leading-none">.</span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Selected Item Quick Action / Description Bar */}
      {currentItem && (
        <div className="mt-1 flex items-center gap-2 text-xs text-[#faedcd] bg-[#3e2723]/90 px-3 py-1 rounded-full border border-[#7d441f]/70">
          <span className="font-bold text-[#ffd166]">{currentItem.name}</span>
          {currentItem.count > 0 && <span>· 數量: {currentItem.count}</span>}
          {currentItem.sellPrice && (
            <span className="text-emerald-400">· 出貨價: {currentItem.sellPrice}G</span>
          )}
          {currentItem.energyRestore && (
            <span className="text-amber-300">· 體力: +{currentItem.energyRestore}</span>
          )}

          {currentItem.energyRestore && currentItem.count > 0 && onEatItem && (
            <button
              onClick={() => onEatItem(selectedIndex)}
              className="ml-2 px-2 py-0.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded font-bold transition-transform active:scale-95"
            >
              食用 🍽️
            </button>
          )}
        </div>
      )}
    </div>
  );
};
