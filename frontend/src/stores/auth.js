import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useAuthStore = create(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      login: (token, user) => set({ token, user }),
      setUser: (user) => set({ user }),
      logout: () => set({ token: null, user: null }),
      can: (menu, action = 'view') => {
        const u = get().user;
        if (!u) return false;
        if (u.isSuperAdmin) return true;
        return !!(u.permissions?.[menu]?.[action]);
      },
    }),
    { name: 'lunapos-auth' }
  )
);
