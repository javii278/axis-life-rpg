"use client";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CosmeticItem, CosmeticCategory, CosmeticRarity, CharacterClass } from "@/lib/types";
import { api } from "@/lib/api";
import { useToast } from "@/components/ui/ToastProvider";
import { ShoppingBag } from "lucide-react";
import { CharacterSprite } from "@/components/character/CharacterSprite";

const RARITY_STYLE: Record<CosmeticRarity, { label: string; color: string; bg: string }> = {
  common:    { label: "Común",      color: "#9ca3af", bg: "#374151" },
  uncommon:  { label: "Inusual",    color: "#10b981", bg: "#064e3b" },
  rare:      { label: "Raro",       color: "#3b82f6", bg: "#1e3a5f" },
  epic:      { label: "Épico",      color: "#a78bfa", bg: "#3b0764" },
  legendary: { label: "Legendario", color: "#f59e0b", bg: "#451a03" },
};

const CATEGORY_LABELS: Record<CosmeticCategory | "all", string> = {
  all: "Todos", title: "Títulos", aura: "Auras", border: "Marcos", skin: "Skins",
};

function CoinDisplay({ coins }: { coins: number }) {
  return (
    <div className="flex items-center gap-2 bg-amber-900/20 border border-amber-800/30 rounded-xl px-3 py-1.5">
      <span className="text-lg">🪙</span>
      <span className="font-display font-bold text-amber-400 text-lg">{coins}</span>
      <span className="text-[10px] font-mono text-amber-700 uppercase">monedas</span>
    </div>
  );
}

function ItemCard({
  item, coins, characterClass, onBuy, onEquip, onUnequip, loading,
}: {
  item: CosmeticItem;
  coins: number;
  characterClass: CharacterClass;
  onBuy: () => void;
  onEquip: () => void;
  onUnequip: () => void;
  loading: boolean;
}) {
  const rarity = RARITY_STYLE[item.rarity];
  const canAfford = coins >= item.price;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative flex flex-col bg-[#0e0e1a] border rounded-2xl p-4 overflow-hidden"
      style={{
        borderColor: item.equipped ? rarity.color + "60" : "#2d2d4a",
        boxShadow: item.equipped ? `0 0 16px ${rarity.color}20` : undefined,
      }}
    >
      {/* Glow de rareza si está equipado */}
      {item.equipped && (
        <div
          className="absolute inset-0 opacity-[0.04] pointer-events-none rounded-2xl"
          style={{ background: `radial-gradient(ellipse at top, ${rarity.color}, transparent 70%)` }}
        />
      )}

      {/* Skin preview or emoji */}
      {item.category === "skin" ? (
        <div className="flex justify-center mb-2">
          <CharacterSprite characterClass={characterClass} level={1} size={72} skinKey={item.value} />
        </div>
      ) : (
        <div className="text-4xl mb-3 text-center">{item.emoji}</div>
      )}

      {/* Name + rarity */}
      <div className="flex items-start justify-between gap-2 mb-1">
        <h3 className="text-sm font-semibold text-white leading-tight flex-1">{item.name}</h3>
        <span
          className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-md flex-shrink-0"
          style={{ color: rarity.color, backgroundColor: rarity.bg + "80" }}
        >
          {rarity.label}
        </span>
      </div>

      <p className="text-[11px] text-gray-500 leading-snug mb-4 flex-1">{item.description}</p>

      {/* Action button */}
      <div className="mt-auto">
        {item.equipped ? (
          <button
            onClick={onUnequip}
            disabled={loading}
            className="w-full py-2 rounded-xl text-[11px] font-semibold font-mono transition-all border disabled:opacity-50"
            style={{ borderColor: rarity.color + "60", color: rarity.color }}
          >
            ✓ Equipado · Desequipar
          </button>
        ) : item.owned ? (
          <button
            onClick={onEquip}
            disabled={loading}
            className="w-full py-2 rounded-xl text-[11px] font-semibold font-mono bg-accent-purple/20 hover:bg-accent-purple/30 text-accent-purple_light transition-all disabled:opacity-50"
          >
            Equipar
          </button>
        ) : (
          <button
            onClick={onBuy}
            disabled={loading || !canAfford}
            className="w-full py-2 rounded-xl text-[11px] font-semibold font-mono transition-all disabled:opacity-50"
            style={{
              background: canAfford ? "linear-gradient(90deg, #92400e, #b45309)" : "#1f2937",
              color: canAfford ? "#fbbf24" : "#6b7280",
            }}
          >
            {loading ? "..." : `🪙 ${item.price} monedas`}
          </button>
        )}
      </div>
    </motion.div>
  );
}

export default function ShopPage() {
  const [items, setItems] = useState<CosmeticItem[]>([]);
  const [coins, setCoins] = useState(0);
  const [characterClass, setCharacterClass] = useState<CharacterClass>("Novice");
  const [filter, setFilter] = useState<CosmeticCategory | "all">("all");
  const [loadingKey, setLoadingKey] = useState<string | null>(null);
  const [pageLoading, setPageLoading] = useState(true);
  const { showToast } = useToast();

  async function load() {
    try {
      const [shopData, charData] = await Promise.all([
        api.shop.list() as Promise<CosmeticItem[]>,
        api.character.get() as any,
      ]);
      setItems(shopData);
      setCoins(charData.coins ?? 0);
      setCharacterClass((charData.character_class as CharacterClass) ?? "Novice");
    } finally {
      setPageLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function handleBuy(item: CosmeticItem) {
    setLoadingKey(item.key);
    try {
      const res = await api.shop.buy(item.key) as any;
      setCoins(res.coins_remaining);
      showToast({ type: "success", title: `¡Comprado! ${item.emoji} ${item.name}`, message: `Te quedan 🪙 ${res.coins_remaining}`, duration: 3000 });
      await load();
    } catch (e: any) {
      showToast({ type: "warning", title: "No se pudo comprar", message: e.message, duration: 3000 });
    } finally {
      setLoadingKey(null);
    }
  }

  async function handleEquip(item: CosmeticItem) {
    setLoadingKey(item.key);
    try {
      await api.shop.equip(item.key);
      showToast({ type: "success", title: `${item.emoji} ${item.name} equipado`, duration: 2000 });
      await load();
    } catch (e: any) {
      showToast({ type: "warning", title: "Error", message: e.message, duration: 2000 });
    } finally {
      setLoadingKey(null);
    }
  }

  async function handleUnequip(item: CosmeticItem) {
    setLoadingKey(item.key);
    try {
      await api.shop.unequip(item.key);
      showToast({ type: "success", title: `${item.name} desequipado`, duration: 2000 });
      await load();
    } catch (e: any) {
      showToast({ type: "warning", title: "Error", message: e.message, duration: 2000 });
    } finally {
      setLoadingKey(null);
    }
  }

  const filtered = filter === "all" ? items : items.filter(i => i.category === filter);

  if (pageLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 rounded-full border-2 border-accent-purple border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div className="flex items-center gap-3">
          <ShoppingBag size={20} className="text-amber-400" />
          <div>
            <h1 className="text-xl font-display font-bold text-white">Tienda</h1>
            <p className="text-xs text-gray-500 font-mono">Cosméticos para tu personaje</p>
          </div>
        </div>
        <CoinDisplay coins={coins} />
      </motion.div>

      {/* Cómo ganar monedas */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.05 }}
        className="bg-amber-900/10 border border-amber-800/20 rounded-xl px-4 py-3"
      >
        <p className="text-[11px] font-mono text-amber-700 mb-1 uppercase tracking-widest">Cómo ganar 🪙 monedas</p>
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-amber-600 font-mono">
          <span>✅ Hábito completado → +1~3 🪙</span>
          <span>🌟 Día perfecto → +10 🪙</span>
          <span>🐉 Boss semanal → +20 🪙</span>
          <span>🎁 Racha día 7 → +5 🪙</span>
        </div>
      </motion.div>

      {/* Filtros */}
      <div className="flex gap-2 flex-wrap">
        {(["all", "title", "aura", "border", "skin"] as const).map(cat => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition-all ${
              filter === cat
                ? "bg-accent-purple text-white"
                : "bg-[#14141f] border border-[#2d2d4a] text-gray-400 hover:text-white"
            }`}
          >
            {CATEGORY_LABELS[cat]}
          </button>
        ))}
      </div>

      {/* Grid */}
      <AnimatePresence mode="popLayout">
        <motion.div
          key={filter}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3"
        >
          {filtered.map(item => (
            <ItemCard
              key={item.key}
              item={item}
              coins={coins}
              characterClass={characterClass}
              onBuy={() => handleBuy(item)}
              onEquip={() => handleEquip(item)}
              onUnequip={() => handleUnequip(item)}
              loading={loadingKey === item.key}
            />
          ))}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
