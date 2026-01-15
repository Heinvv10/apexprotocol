import { ContentPerformanceAnalyzer } from "@/components/admin/content-performance";

export default function ContentPerformancePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Content Performance</h1>
        <p className="text-gray-400 mt-2">
          Analyze what content types get cited most and platform preferences
        </p>
      </div>

      <ContentPerformanceAnalyzer />
    </div>
  );
}
