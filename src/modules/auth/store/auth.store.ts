"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { AuthUser } from "@/src/modules/auth/types/auth.types";

interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  setSession: (payload: { user: AuthUser }) => void;
  clearSession: () => void;
}

const memoryStorage = {
  getItem: () => null,
  setItem: () => undefined,
  removeItem: () => undefined,
};

const storage = createJSONStorage(() =>
  typeof window === "undefined" ? memoryStorage : localStorage
);

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      setSession: ({ user }) =>
        set({
          user,
          isAuthenticated: true,
        }),
      clearSession: () =>
        set({
          user: null,
          isAuthenticated: false,
        }),
    }),
    {
      name: "factory_auth",
      storage,
      version: 2,
      migrate: (persistedState) => {
        const state = persistedState as Partial<AuthState> & { token?: string };
        return {
          user: state.user ?? null,
          isAuthenticated: Boolean(state.isAuthenticated),
        };
      },
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
