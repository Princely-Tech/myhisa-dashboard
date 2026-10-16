"use client";
import { createContext, useContext } from "react";
import type { User } from "@/utils/types";

export interface ShellContextValue {
  /** Session user as cached in localStorage at login (may be stale). */
  user: User | null;
  /** Fresh GET /me response (includes wallet), null until loaded. */
  me: User | null;
  meLoading: boolean;
  meError: boolean;
  refreshMe: () => Promise<void>;
  openFundWallet: () => void;
}

const noop = async () => {};

export const ShellContext = createContext<ShellContextValue>({
  user: null,
  me: null,
  meLoading: false,
  meError: false,
  refreshMe: noop,
  openFundWallet: () => {},
});

export const useShell = () => useContext(ShellContext);
