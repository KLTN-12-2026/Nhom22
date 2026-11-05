import { notFound } from 'next/navigation';
import UIKitDemo from '@/components/ui/UIKitDemo';
export default function UIKitPage() {
  if (process.env.NODE_ENV === 'production') notFound();
  return <UIKitDemo />;
}
