import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/* Keranjang POS: item {productId, code, name, unit_id, unit_name, unit_factor, qty, price, discount, is_free, promo_id, stockQty} */
export const usePosStore = create(
  persist(
    (set, get) => ({
      items: [],
      customer: null, // {id, name, type}
      transDiscount: 0,
      taxRate: 0,
      note: '',
      currentHoldId: null,

      addItem: (item, qty = 1) => {
        const items = [...get().items];
        const existing = items.find((i) => i.productId === item.productId && i.unit_id === item.unit_id && i.variant_id === (item.variant_id || null) && !i.is_free);
        if (existing) {
          existing.qty = +(existing.qty + qty).toFixed(3);
        } else {
          items.push({ ...item, qty, is_free: false, promo_id: null });
        }
        set({ items });
      },
      updateQty: (index, qty) => {
        const items = [...get().items];
        if (qty <= 0) { items.splice(index, 1); return set({ items }); }
        items[index] = { ...items[index], qty: +qty.toFixed(3) };
        set({ items });
      },
      updatePrice: (index, price) => {
        const items = [...get().items];
        items[index] = { ...items[index], price: +price };
        set({ items });
      },
      updateItem: (index, patch) => {
        const items = [...get().items];
        items[index] = { ...items[index], ...patch };
        set({ items });
      },
      updateDiscount: (index, discount) => {
        const items = [...get().items];
        items[index] = { ...items[index], discount: +discount };
        set({ items });
      },
      removeItem: (index) => set({ items: get().items.filter((_, i) => i !== index) }),
      clear: () => set({ items: [], customer: null, transDiscount: 0, taxRate: 0, note: '', currentHoldId: null }),
      setCustomer: (customer) => set({ customer }),
      setTransDiscount: (v) => set({ transDiscount: +v || 0 }),
      setTaxRate: (v) => set({ taxRate: +v || 0 }),
      setNote: (note) => set({ note }),
      setCurrentHoldId: (id) => set({ currentHoldId: id }),
      loadHeldItems: (held) =>
        set({
          items: held.items,
          customer: held.customer_id ? { id: held.customer_id, name: held.customer_name, type: 'umum' } : null,
          transDiscount: +held.discount_total || 0,
          taxRate: +held.tax || 0,
          note: held.note || '',
          currentHoldId: held.id,
        }),

      subtotal: () => get().items.reduce((s, i) => s + (i.is_free ? 0 : i.price * i.qty), 0),
      itemDiscount: () => get().items.reduce((s, i) => s + (i.discount || 0), 0),
      total: () => {
        const s = get();
        const sub = s.subtotal();
        const disc = s.itemDiscount() + s.transDiscount;
        const tax = ((sub - s.itemDiscount()) * s.taxRate) / 100;
        return { subtotal: sub, discount_total: disc, tax, total: Math.round((sub - disc + tax) * 100) / 100 };
      },
      payload: () => {
        const s = get();
        const t = s.total();
        return {
          items: s.items.map((i) => ({
            product_id: i.productId, unit_id: i.unit_id, qty: i.qty,
            price: i.is_free ? 0 : i.price, discount: i.discount || 0,
            name: i.name, variant_id: i.variant_id || null, variant_name: i.variant_name || null,
          })),
          customer_id: s.customer?.id || null,
          trans_discount: s.transDiscount,
          tax_rate: s.taxRate,
          note: s.note,
          ...t,
        };
      },
    }),
    { name: 'lunapos-pos' }
  )
);
