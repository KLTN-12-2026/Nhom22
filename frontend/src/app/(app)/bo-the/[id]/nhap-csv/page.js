'use client';

import { CsvImport } from '@/components/content/CsvImport';
import { useParams } from 'next/navigation';

export default function NhapCsvPage() {
  const { id } = useParams();
  return <CsvImport key={id} deckId={id} />;
}
