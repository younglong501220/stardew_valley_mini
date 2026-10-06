import React from 'react';
import { ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Zap, Droplet } from 'lucide-react';
import { Direction } from '../types/game';

interface MobileControlsProps {
  onMove: (dir: Direction) => void;
  onInteract: () => void;
  onRefillWater: () => void;
}

export const MobileControls: React.FC<MobileControlsProps> = ({
  onMove,
  onInteract,
  onRefillWater,
}) => {
  return (
    <div className="w-full max-w-[800px] mt-2 flex items-center justify-between px-2 select-none md:hidden">
      {/* Direction D-Pad */}
      <div className="relative w-32 h-32 flex items-center justify-center">
        <button
          onClick={() => onMove('up')}
          className="absolute top-0 left-10 w-12 h-11 bg-[#7d441f] active:bg-[#572e12] text-amber-200 rounded-t-xl border-2 border-[#b45309] flex items-center justify-center shadow-md active:scale-95"
          aria-label="向上移動"
        >
          <ArrowUp className="w-6 h-6" />
        </button>
        <button
          onClick={() => onMove('down')}
          className="absolute bottom-0 left-10 w-12 h-11 bg-[#7d441f] active:bg-[#572e12] text-amber-200 rounded-b-xl border-2 border-[#b45309] flex items-center justify-center shadow-md active:scale-95"
          aria-label="向下移動"
        >
          <ArrowDown className="w-6 h-6" />
        </button>
        <button
          onClick={() => onMove('left')}
          className="absolute top-10 left-0 w-11 h-12 bg-[#7d441f] active:bg-[#572e12] text-amber-200 rounded-l-xl border-2 border-[#b45309] flex items-center justify-center shadow-md active:scale-95"
          aria-label="向左移動"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <button
          onClick={() => onMove('right')}
          className="absolute top-10 right-0 w-11 h-12 bg-[#7d441f] active:bg-[#572e12] text-amber-200 rounded-r-xl border-2 border-[#b45309] flex items-center justify-center shadow-md active:scale-95"
          aria-label="向右移動"
        >
          <ArrowRight className="w-6 h-6" />
        </button>
        <div className="w-8 h-8 bg-[#4a2810] rounded-full border border-[#854d0e]" />
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col items-center gap-2">
        <button
          onClick={onInteract}
          className="w-20 h-16 bg-[#e11d48] active:bg-[#be123c] text-white font-pixel text-xs rounded-2xl border-3 border-[#9f1239] shadow-lg flex flex-col items-center justify-center active:scale-95"
          aria-label="互動或使用工具"
        >
          <Zap className="w-5 h-5 text-amber-300" />
          <span>動作</span>
        </button>
        <button
          onClick={onRefillWater}
          className="px-3 py-1 bg-[#0284c7] active:bg-[#0369a1] text-white rounded-lg text-xs font-bold border border-[#075985] flex items-center gap-1 shadow-sm"
        >
          <Droplet className="w-3.5 h-3.5" />
          裝水
        </button>
      </div>
    </div>
  );
};
