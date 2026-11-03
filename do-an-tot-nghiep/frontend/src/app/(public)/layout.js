import { FeatureGate } from '@/components/layout/FeatureGate';
import { PublicLayout } from '@/components/layout';

export default function PublicRouteLayout({ children }) {
  return <PublicLayout><FeatureGate>{children}</FeatureGate></PublicLayout>;
}
