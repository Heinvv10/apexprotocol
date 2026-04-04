export const metadata = {
  title: "Status | ApexGEO",
  description: "Real-time status of ApexGEO services.",
};

export default function StatusPage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center max-w-md px-4">
        <h1 className="text-3xl font-bold tracking-tight mb-3">Status</h1>
        <p className="text-muted-foreground">Real-time status of ApexGEO services.</p>
      </div>
    </div>
  );
}
