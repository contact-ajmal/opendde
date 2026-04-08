'use client';

import { useAssistant } from './AssistantContext';

export default function AssistantTrigger() {
  const { toggleDrawer, drawerOpen } = useAssistant();

  if (drawerOpen) return null;

  return (
    <button
      onClick={toggleDrawer}
      className="fixed bottom-6 right-6 z-30 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500 text-white shadow-lg hover:bg-emerald-600 active:scale-95 transition-all"
      title="Ask AI assistant"
    >
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
      </svg>
    </button>
  );
}
