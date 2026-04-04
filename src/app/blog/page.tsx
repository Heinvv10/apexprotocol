export const metadata = {
  title: "Blog | ApexGEO",
  description: "Insights, guides, and updates from the ApexGEO team.",
};

export default function BlogPage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center max-w-md px-4">
        <h1 className="text-3xl font-bold tracking-tight mb-3">Blog</h1>
        <p className="text-muted-foreground">Insights, guides, and updates from the ApexGEO team.</p>
      </div>
    </div>
  );
}
