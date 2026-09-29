import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { MenuItem } from "./menu";

export interface CartLine {
  item: MenuItem;
  qty: number;
}

export interface CartStore {
  id: string;
  slug: string;
  name: string;
  lat: number | null;
  lng: number | null;
}

interface CartContextValue {
  lines: CartLine[];
  store: CartStore | null;
  /** Adds an item; if the cart holds another store's items it is replaced. */
  addFrom: (store: CartStore, item: MenuItem) => void;
  count: number;
  total: number;
  add: (item: MenuItem) => void;
  remove: (id: string) => void;
  setQty: (id: string, qty: number) => void;
  clear: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

const STORAGE_KEY = "alpha-cart-v2";

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [store, setStore] = useState<CartStore | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) setLines([]);
        else {
          setLines(parsed.lines ?? []);
          setStore(parsed.store ?? null);
        }
      }
    } catch {
      // ignore corrupted cart
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ lines, store }));
    } catch {
      // ignore
    }
  }, [lines, store]);

  const addFrom = useCallback((s: CartStore, item: MenuItem) => {
    setStore((cur) => {
      if (cur && cur.id !== s.id) setLines([{ item, qty: 1 }]);
      else
        setLines((prev) => {
          const found = prev.find((l) => l.item.id === item.id);
          if (found) return prev.map((l) => (l.item.id === item.id ? { ...l, qty: l.qty + 1 } : l));
          return [...prev, { item, qty: 1 }];
        });
      return s;
    });
  }, []);

  const add = useCallback((item: MenuItem) => {
    setLines((prev) => {
      const found = prev.find((l) => l.item.id === item.id);
      if (found) {
        return prev.map((l) =>
          l.item.id === item.id ? { ...l, qty: l.qty + 1 } : l
        );
      }
      return [...prev, { item, qty: 1 }];
    });
  }, []);

  const remove = useCallback((id: string) => {
    setLines((prev) => prev.filter((l) => l.item.id !== id));
  }, []);

  const setQty = useCallback((id: string, qty: number) => {
    setLines((prev) =>
      qty <= 0
        ? prev.filter((l) => l.item.id !== id)
        : prev.map((l) => (l.item.id === id ? { ...l, qty } : l))
    );
  }, []);

  const clear = useCallback(() => {
    setLines([]);
    setStore(null);
  }, []);

  const value = useMemo<CartContextValue>(() => {
    const count = lines.reduce((s, l) => s + l.qty, 0);
    const total = lines.reduce((s, l) => s + l.qty * l.item.price, 0);
    return { lines, store, addFrom, count, total, add, remove, setQty, clear };
  }, [lines, store, addFrom, add, remove, setQty, clear]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
