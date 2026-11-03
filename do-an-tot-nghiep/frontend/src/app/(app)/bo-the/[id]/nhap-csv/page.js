'use client';
import { useParams } from 'next/navigation';
import { CsvImport } from '@/components/content/CsvImport';

export default function CsvPage() {
  const { id } = useParams();
  return <CsvImport key={id} deckId={id} />;
}
