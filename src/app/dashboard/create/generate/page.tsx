import GenerateContentForm from '@/components/features/content/GenerateContentForm';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function GenerateContentPage() {
  return (
    <div className="space-y-6">
      {/* Back Link */}
      <Link
        href="/dashboard/create"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Create
      </Link>

      {/* Page Title */}
      <h1 className="text-2xl font-bold text-foreground">Generate AI Content</h1>

      {/* Main Content */}
      <GenerateContentForm />
    </div>
  );
}