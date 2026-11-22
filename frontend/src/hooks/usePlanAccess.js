'use client';
import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api-client';
import { access, cardUsageKey, plansKey, quotaKey } from '@/lib/plan-access.mjs';
import { usePlan } from '@/components/tier/useTier';

export function usePlans() {
  return useQuery({ queryKey: plansKey, queryFn: () => apiFetch('/api/v1/billing/plans'), staleTime: 300000 });
}

export function useServiceQuota(enabled = true) {
  return useQuery({ queryKey: quotaKey, queryFn: () => apiFetch('/api/v1/me/service-quota'), refetchInterval: 120000, staleTime: 30000, enabled });
}

export function useCardUsage(enabled = true) {
  return useQuery({ queryKey: cardUsageKey, queryFn: () => apiFetch('/api/v1/me/card-usage'), staleTime: 30000, enabled });
}

export function usePlanAccess(enabled = true) {
  const plan = usePlan(enabled);
  const plans = usePlans();
  const quota = useServiceQuota(!!plan.data);
  const ready = !!plan.data && !!plans.data;
  return {
    ready,
    plan: plan.data,
    plans: plans.data,
    quota: quota.data,
    of: feature => ready ? access({ plans: plans.data, planCode: plan.data.goiMa, admin: plan.data.quanTri, quota: quota.data, feature }) : null
  };
}
