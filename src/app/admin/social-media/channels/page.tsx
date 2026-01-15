"use client";

export default function ChannelsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Social Channels</h1>
        <p className="text-muted-foreground mt-1">Configure and manage social media channels</p>
      </div>
      <div className="card-secondary flex items-center justify-center py-12">
        <p className="text-muted-foreground">No channels configured</p>
      </div>
    </div>
  );
}
