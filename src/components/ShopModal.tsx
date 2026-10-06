import React, { useState } from 'react';
import { Season, InventoryItem } from '../types/game';
import { CROPS_DATA, SEASON_NAMES } from '../data/crops';
import { X, ShoppingBag, ArrowUpCircle, DollarSign } from 'lucide-react';
import { sounds } from '../audio/soundManager';

interface ShopModalProps {
  isOpen: boolean;
  onClose: () => void;
  gold: number;
  season: Season;
  inventory: InventoryItem[];
  maxSlots: number;
  hoeLevel: number;
  canLevel: number;
  onBuySeed: (cropId: string, price: number) => void;
  onUpgradeBackpack: (cost: number) => void;
  onUpgradeTool: (tool: 'hoe' | 'watering_can', cost: number) => void;
  onSellItem: (itemIndex: number, count: number, price: number) => void;
}

export const ShopModal: React.FC<ShopModalProps> = ({
  isOpen,
  onClose,
  gold,
  season,
  inventory,
  maxSlots,
  hoeLevel,
  canLevel,
  onBuySeed,
  onUpgradeBackpack,
  onUpgradeTool,
  onSellItem,
}) => {
  const [activeTab, setActiveTab] = useState<'seeds' | 'upgrades' | 'sell'>('seeds');

  if (!isOpen) return null;

  const currentCrops = Object.values(CROPS_DATA).filter((crop) =>
    crop.season.includes(season)
  );
  const otherCrops = Object.values(CROPS_DATA).filter(
    (crop) => !crop.season.includes(season)
  );

  const backpackCost = maxSlots === 6 ? 300 : maxSlots === 8 ? 800 : null;
  const copperHoeCost = hoeLevel === 1 ? 500 : null;
  const copperCanCost = canLevel === 1 ? 500 : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-xs">
      <div className="stardew-wood-box w-full max-w-xl max-h-[90vh] flex flex-col rounded-2xl overflow-hidden shadow-2xl border-4 border-[#7d441f]">
        {/* Header */}
        <div className="bg-[#4a2810] text-[#fefae0] px-4 py-3 flex items-center justify-between border-b-2 border-[#7d441f]">
          <div className="flex items-center gap-2">
            <span className="text-xl">🏪</span>
            <div>
              <h2 className="font-bold text-base md:text-lg tracking-wide">
                皮埃爾雜貨店 (Pierre's General Store)
              </h2>
              <p className="text-xs text-[#d4a373]">農場種子、農具鍛造與出貨商行</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="bg-[#fff8e7] text-[#854d0e] px-3 py-1 rounded font-pixel text-xs border border-[#b45309] font-bold">
              💰 {gold} G
            </div>
            <button
              onClick={() => {
                sounds.play('chop');
                onClose();
              }}
              className="text-[#fefae0] hover:text-white p-1 rounded-full bg-[#7d441f]/50 hover:bg-[#7d441f]"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Selector */}
        <div className="flex bg-[#faedcd] border-b-2 border-[#7d441f] p-1 gap-1">
          <button
            onClick={() => setActiveTab('seeds')}
            className={`flex-1 py-1.5 px-3 rounded-lg font-bold text-xs md:text-sm flex items-center justify-center gap-1.5 transition-colors ${
              activeTab === 'seeds'
                ? 'bg-[#854d0e] text-white shadow-sm'
                : 'text-[#4a2810] hover:bg-[#fefae0]'
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            種子選購
          </button>
          <button
            onClick={() => setActiveTab('upgrades')}
            className={`flex-1 py-1.5 px-3 rounded-lg font-bold text-xs md:text-sm flex items-center justify-center gap-1.5 transition-colors ${
              activeTab === 'upgrades'
                ? 'bg-[#854d0e] text-white shadow-sm'
                : 'text-[#4a2810] hover:bg-[#fefae0]'
            }`}
          >
            <ArrowUpCircle className="w-4 h-4" />
            鐵匠與升級
          </button>
          <button
            onClick={() => setActiveTab('sell')}
            className={`flex-1 py-1.5 px-3 rounded-lg font-bold text-xs md:text-sm flex items-center justify-center gap-1.5 transition-colors ${
              activeTab === 'sell'
                ? 'bg-[#854d0e] text-white shadow-sm'
                : 'text-[#4a2810] hover:bg-[#fefae0]'
            }`}
          >
            <DollarSign className="w-4 h-4" />
            隨身收購
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 overflow-y-auto flex-1 bg-[#faedcd]/40 space-y-4">
          {/* SEEDS TAB */}
          {activeTab === 'seeds' && (
            <div className="space-y-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-bold text-[#854d0e] uppercase tracking-wider">
                    當季推薦 ({SEASON_NAMES[season].zh.split(' ')[0]})
                  </span>
                  <div className="flex-1 border-b border-[#854d0e]/30" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {currentCrops.map((crop) => (
                    <div
                      key={crop.id}
                      className="bg-[#faedcd] border-2 border-[#854d0e] rounded-xl p-2.5 flex items-center justify-between hover:border-[#b45309] shadow-xs"
                    >
                      <div className="flex items-center gap-2.5">
                        <div
                          className="w-10 h-10 rounded-lg flex items-center justify-center text-xl shadow-inner"
                          style={{ backgroundColor: crop.color + '44' }}
                        >
                          🌱
                        </div>
                        <div>
                          <div className="font-bold text-sm text-[#4a2810]">
                            {crop.name}種子
                          </div>
                          <div className="text-[11px] text-[#6f3b14]">
                            生長: {crop.growDays} 天
                            {crop.regrowDays ? ' · 連續收穫' : ''}
                            {crop.bonusYieldChance ? ' · 機率雙產' : ''}
                          </div>
                          <div className="text-[11px] text-emerald-800 font-bold">
                            成物價值: {crop.sellPrice} G
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => onBuySeed(crop.id, crop.seedPrice)}
                        disabled={gold < crop.seedPrice}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold font-pixel flex flex-col items-center justify-center transition-all ${
                          gold >= crop.seedPrice
                            ? 'bg-[#854d0e] hover:bg-[#b45309] text-white active:scale-95'
                            : 'bg-stone-300 text-stone-500 cursor-not-allowed'
                        }`}
                      >
                        <span>購買</span>
                        <span className="text-[10px]">{crop.seedPrice}G</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Other seasons */}
              {otherCrops.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-bold text-stone-600 uppercase tracking-wider">
                      其他季節種子 (可先囤貨)
                    </span>
                    <div className="flex-1 border-b border-stone-300" />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 opacity-85">
                    {otherCrops.map((crop) => (
                      <div
                        key={crop.id}
                        className="bg-[#faedcd]/70 border border-[#854d0e]/60 rounded-xl p-2.5 flex items-center justify-between"
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded bg-stone-200 flex items-center justify-center text-base">
                            🌱
                          </div>
                          <div>
                            <div className="font-bold text-xs text-[#4a2810]">
                              {crop.name}種子
                            </div>
                            <div className="text-[10px] text-stone-500">
                              季別: {crop.season.map((s) => SEASON_NAMES[s].zh.split(' ')[0]).join(',')}
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => onBuySeed(crop.id, crop.seedPrice)}
                          disabled={gold < crop.seedPrice}
                          className="px-2.5 py-1 rounded bg-[#854d0e] text-white text-xs font-pixel disabled:bg-stone-300 disabled:text-stone-500"
                        >
                          {crop.seedPrice}G
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* UPGRADES TAB */}
          {activeTab === 'upgrades' && (
            <div className="space-y-3">
              {/* Backpack upgrade */}
              <div className="bg-[#faedcd] border-2 border-[#854d0e] rounded-xl p-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="text-3xl">🎒</div>
                  <div>
                    <h3 className="font-bold text-sm text-[#4a2810]">
                      背包擴充包 (當前: {maxSlots} 格)
                    </h3>
                    <p className="text-xs text-[#6f3b14]">
                      {backpackCost ? `升級至 ${maxSlots + 2} 個快捷物品欄位` : '背包已達到最大容量！'}
                    </p>
                  </div>
                </div>
                {backpackCost ? (
                  <button
                    onClick={() => onUpgradeBackpack(backpackCost)}
                    disabled={gold < backpackCost}
                    className="px-3 py-2 rounded-lg bg-[#854d0e] hover:bg-[#b45309] text-white font-pixel text-xs disabled:bg-stone-300 disabled:text-stone-500 transition-transform active:scale-95"
                  >
                    升級 {backpackCost}G
                  </button>
                ) : (
                  <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-2.5 py-1 rounded">
                    已達上限
                  </span>
                )}
              </div>

              {/* Copper Hoe */}
              <div className="bg-[#faedcd] border-2 border-[#854d0e] rounded-xl p-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="text-3xl">⛏️</div>
                  <div>
                    <h3 className="font-bold text-sm text-[#4a2810]">
                      鍛造銅鋤頭 (Copper Hoe)
                    </h3>
                    <p className="text-xs text-[#6f3b14]">
                      {copperHoeCost
                        ? '使鋤頭開墾範圍增加為一次 3 格！大幅節省體力'
                        : '已升級為銅鋤頭！'}
                    </p>
                  </div>
                </div>
                {copperHoeCost ? (
                  <button
                    onClick={() => onUpgradeTool('hoe', copperHoeCost)}
                    disabled={gold < copperHoeCost}
                    className="px-3 py-2 rounded-lg bg-[#854d0e] hover:bg-[#b45309] text-white font-pixel text-xs disabled:bg-stone-300 disabled:text-stone-500 transition-transform active:scale-95"
                  >
                    鍛造 {copperHoeCost}G
                  </button>
                ) : (
                  <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-2.5 py-1 rounded">
                    已擁有 Lv2
                  </span>
                )}
              </div>

              {/* Copper Watering Can */}
              <div className="bg-[#faedcd] border-2 border-[#854d0e] rounded-xl p-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="text-3xl">🪣</div>
                  <div>
                    <h3 className="font-bold text-sm text-[#4a2810]">
                      鍛造銅水壺 (Copper Watering Can)
                    </h3>
                    <p className="text-xs text-[#6f3b14]">
                      {copperCanCost
                        ? '一次能澆灌直排 3 格土地，且水壺容量升至 35 滴！'
                        : '已升級為銅水壺！'}
                    </p>
                  </div>
                </div>
                {copperCanCost ? (
                  <button
                    onClick={() => onUpgradeTool('watering_can', copperCanCost)}
                    disabled={gold < copperCanCost}
                    className="px-3 py-2 rounded-lg bg-[#854d0e] hover:bg-[#b45309] text-white font-pixel text-xs disabled:bg-stone-300 disabled:text-stone-500 transition-transform active:scale-95"
                  >
                    鍛造 {copperCanCost}G
                  </button>
                ) : (
                  <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-2.5 py-1 rounded">
                    已擁有 Lv2
                  </span>
                )}
              </div>
            </div>
          )}

          {/* SELL TAB */}
          {activeTab === 'sell' && (
            <div className="space-y-2">
              <p className="text-xs text-[#6f3b14] mb-2">
                直接把背包裡的作物、魚獲、採集品出售換取現金（也可放入農場右側出貨箱於次日清晨結算）：
              </p>
              {inventory.filter((item) => item.sellPrice && item.count > 0).length === 0 ? (
                <div className="text-center py-8 text-stone-500 text-sm">
                  背包裡目前沒有可以販賣的物品喔！快去種田、採集或釣魚吧。
                </div>
              ) : (
                <div className="space-y-1.5">
                  {inventory.map((item, idx) => {
                    if (!item.sellPrice || item.count <= 0) return null;
                    return (
                      <div
                        key={`${item.id}-${idx}`}
                        className="bg-[#faedcd] border border-[#854d0e] rounded-xl px-3 py-2 flex items-center justify-between"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-2xl">{item.icon}</span>
                          <div>
                            <span className="font-bold text-sm text-[#4a2810]">
                              {item.name}
                            </span>
                            <span className="text-xs text-stone-600 ml-2">
                              x {item.count}
                            </span>
                            <div className="text-xs text-emerald-800">
                              單價: {item.sellPrice} G
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => onSellItem(idx, 1, item.sellPrice!)}
                            className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded text-xs font-bold font-pixel"
                          >
                            賣出 1 個 (+{item.sellPrice}G)
                          </button>
                          {item.count > 1 && (
                            <button
                              onClick={() =>
                                onSellItem(idx, item.count, item.sellPrice! * item.count)
                              }
                              className="px-2.5 py-1 bg-emerald-700 hover:bg-emerald-600 text-white rounded text-xs font-bold font-pixel"
                            >
                              全部 (+{item.sellPrice! * item.count}G)
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
