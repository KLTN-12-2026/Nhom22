'use client';
import { useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api-client';
import { bestSense, cardFromSense, lookupKey, lookupPath, pickEntry } from '@/lib/dictionary.mjs';

export function useDictionaryPick(onFill) {
  const client = useQueryClient();
  const [picked, setPicked] = useState(null);
  const token = useRef(0);

  const pick = async ({ tu, hint }) => {
    const mine = ++token.current;
    setPicked({ term: tu, hint, key: null, loading: true });
    onFill({ tu });
    try {
      const data = await client.fetchQuery({ queryKey: lookupKey(tu), queryFn: () => apiFetch(lookupPath(tu)), staleTime: 300000 });
      if (mine !== token.current) return;
      const entry = pickEntry(data, tu);
      const sense = entry && bestSense(entry, hint);
      if (entry && sense) {
        onFill(cardFromSense(entry, sense));
        setPicked({ term: tu, hint, key: `${entry.id}-${sense.key}`, loading: false });
      } else {
        if (hint) onFill({ tu, nghiaVi: hint });
        setPicked({ term: tu, hint, key: null, loading: false });
      }
    } catch {
      if (mine === token.current) setPicked({ term: tu, hint, key: null, loading: false, failed: true });
    }
  };

  const choose = (entry, sense) => {
    onFill(cardFromSense(entry, sense));
    setPicked(current => ({ ...current, key: `${entry.id}-${sense.key}` }));
  };

  const clear = () => { token.current++; setPicked(null); };

  return { picked, pick, choose, clear };
}
