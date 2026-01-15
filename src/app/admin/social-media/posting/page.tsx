"use client";

export default function PostingPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Social Posting</h1>
        <p className="text-muted-foreground mt-1">Schedule and publish content</p>
      </div>
      <div className="card-secondary flex items-center justify-center py-12">
        <p className="text-muted-foreground">No posts scheduled</p>
      </div>
    </div>
  );
}
