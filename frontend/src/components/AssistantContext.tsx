'use client';

import { createContext, useContext, useState, useCallback } from 'react';

interface AssistantContextData {
  page: string;
  target?: {
    name: string;
    uniprot_id: string;
    organism: string;
    length: number;
    gene_name?: string | null;
    plddt_mean?: number | null;
  };
  pockets?: {
    rank: number;
    score: number;
    druggability: number;
    residue_count: number;
  }[];
  current_pocket?: {
    rank: number;
    score: number;
    druggability: number;
    residue_count: number;
  };
  known_ligands_summary?: {
    total: number;
    approved: number;
    best_ic50: number | null;
  };
}

interface AssistantCtx {
  context: AssistantContextData;
  setContext: (data: AssistantContextData) => void;
  drawerOpen: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
  toggleDrawer: () => void;
}

const Ctx = createContext<AssistantCtx>({
  context: { page: 'home' },
  setContext: () => {},
  drawerOpen: false,
  openDrawer: () => {},
  closeDrawer: () => {},
  toggleDrawer: () => {},
});

export function useAssistant() {
  return useContext(Ctx);
}

export default function AssistantProvider({ children }: { children: React.ReactNode }) {
  const [context, setContext] = useState<AssistantContextData>({ page: 'home' });
  const [drawerOpen, setDrawerOpen] = useState(false);

  const openDrawer = useCallback(() => setDrawerOpen(true), []);
  const closeDrawer = useCallback(() => setDrawerOpen(false), []);
  const toggleDrawer = useCallback(() => setDrawerOpen(p => !p), []);

  return (
    <Ctx.Provider value={{ context, setContext, drawerOpen, openDrawer, closeDrawer, toggleDrawer }}>
      {children}
    </Ctx.Provider>
  );
}
