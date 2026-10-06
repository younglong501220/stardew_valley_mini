import React from 'react';
import { DaySummaryData, Weather } from '../types/game';
import { SEASON_NAMES } from '../data/crops';
import { Sparkles, Sun, CloudRain } from 'lucide-react';
import { sounds } from '../audio/soundManager';

interface DaySummaryModalProps {
  isOpen: boolean;
  data: DaySummaryData | null;
  nextWeather: Weather;
  onNextDay: () => void;
}

export const DaySummaryModal: React.FC<DaySummaryModalProps> = ({
  isOpen,
  data,
  nextWeather,
  onNextDay,
}) => {
  if (!isOpen || !data) return null;

  const seasonInfo = SEASON_NAMES[data.season];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-xs select-none">
      <div className="stardew-wood-box w-full max-w-md rounded-2xl overflow-hidden border-4 border-[#7d441f] shadow-2xl p-5 flex flex-col items-center">
        {/* Header Ribbon */}
        <div className="text-center pb-3 border-b-2 border-[#7d441f] w-full">
          <div className="inline-block px-3 py-0.5 rounded-full text-xs font-bold text-white mb-1 shadow-sm" style={{ backgroundColor: seasonInfo.color }}>
            {seasonInfo.zh}
          </div>
          <h2 className="text-xl font-bold text-[#4a2810] tracking-wider">
            第 {data.day} 天 出貨總結
          </h2>
          <p className="text-xs text-[#7d441f]">今日出貨箱商品已全數換算入帳</p>
        </div>

        {/* Shipped items list */}
        <div className="w-full my-4 max-h-56 overflow-y-auto space-y-2 bg-[#faedcd]/60 p-3 rounded-xl border border-[#854d0e]/40">
          {data.itemsShipped.length === 0 ? (
            <div className="text-center py-6 text-stone-500 text-xs">
              今天出貨箱空空如也，沒有寄送農產或漁獲。
            </div>
          ) : (
            data.itemsShipped.map((item, idx) => (
              <div
                key={`${item.name}-${idx}`}
                className="flex items-center justify-between text-xs bg-[#faedcd] px-3 py-1.5 rounded-lg border border-[#854d0e]/30"
              >
                <div className="flex items-center gap-2">
                  <span className="text-lg">{item.icon}</span>
                  <span className="font-bold text-[#4a2810]">{item.name}</span>
                  <span className="text-stone-500">x{item.count}</span>
                </div>
                <div className="font-pixel text-[#854d0e] font-bold">
                  +{item.total} G
                </div>
              </div>
            ))
          )}
        </div>

        {/* Total revenue */}
        <div className="w-full bg-[#faedcd] border-2 border-[#854d0e] rounded-xl p-3 flex items-center justify-between mb-4">
          <div>
            <div className="text-xs text-[#7d441f]">今日出貨總收益</div>
            <div className="text-xs text-stone-500">體力已完全恢復滿格 (100⚡)</div>
          </div>
          <div className="text-right">
            <div className="font-pixel text-base font-bold text-emerald-700">
              +{data.totalEarnings} G
            </div>
            <div className="text-[11px] text-[#854d0e]">
              總資產: <span className="font-bold">{data.newGold}</span> G
            </div>
          </div>
        </div>

        {/* Weather forecast */}
        <div className="w-full bg-[#fefae0] rounded-lg p-2.5 flex items-center justify-between border border-[#854d0e]/40 mb-4 text-xs">
          <div className="flex items-center gap-2 text-[#4a2810]">
            <span>明日氣象預報：</span>
            {nextWeather === 'rainy' ? (
              <span className="flex items-center gap-1 font-bold text-blue-700">
                <CloudRain className="w-4 h-4 text-blue-500" />
                陰雨天 (將自動灌溉所有農田！)
              </span>
            ) : (
              <span className="flex items-center gap-1 font-bold text-amber-700">
                <Sun className="w-4 h-4 text-amber-500" />
                萬里無雲晴天
              </span>
            )}
          </div>
        </div>

        {/* Button to start next day */}
        <button
          onClick={() => {
            sounds.play('sleep');
            onNextDay();
          }}
          className="w-full py-3 bg-[#854d0e] hover:bg-[#b45309] text-white font-bold font-pixel text-xs rounded-xl shadow-lg border-2 border-[#542d0a] transition-transform active:scale-98 flex items-center justify-center gap-2"
        >
          <Sparkles className="w-4 h-4 text-amber-300" />
          迎接早晨出門農作！
        </button>
      </div>
    </div>
  );
};
