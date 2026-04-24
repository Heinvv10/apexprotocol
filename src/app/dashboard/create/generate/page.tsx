import GenerateContentForm from '@/components/features/content/GenerateContentForm';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export interface FixContext {
  recommendation: string;
  auditUrl?: string;
  category?: string;
  issues?: Array<{
    title?: string;
    type?: string;
    category?: string;
    severity?: string;
    impact?: string;
  }>;
}

function parseContext(raw: string | undefined): FixContext | null {
  if (!raw) return null;
  try {
    const decoded = JSON.parse(decodeURIComponent(raw));
    if (typeof decoded?.recommendation !== 'string' || decoded.recommendation.length === 0) {
      return null;
    }
    return decoded as FixContext;
  } catch {
    return null;
  }
}

export default function GenerateContentPage({
  searchParams,
}: {
  searchParams?: { context?: string };
}) {
  const initialContext = parseContext(searchParams?.context);

  return (
    <div className="space-y-6">
      <Link
        href="/dashboard/create"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Create
      </Link>

      <h1 className="text-2xl font-bold text-foreground">Generate AI Content</h1>

      <GenerateContentForm initialContext={initialContext} />
    </div>
  );
}
