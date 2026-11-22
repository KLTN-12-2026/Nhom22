'use client';
import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api-client';
import { planKey, tierOf } from '@/lib/tier.mjs';

export function usePlan(enabled = true) {
  return useQuery({ queryKey: planKey, queryFn: () => apiFetch('/api/v1/me/plan'), staleTime: 60000, enabled });
}

export function useTier(enabled = true) {
  const plan = usePlan(enabled);
  return { plan: plan.data, tier: tierOf(plan.data), isPending: plan.isPending };
}

export function useTierAttribute(tier) {
  useEffect(() => {
    if (!tier) return undefined;
    const root = document.documentElement;
    root.dataset.tier = tier;
    return () => { delete root.dataset.tier; };
  }, [tier]);
}
