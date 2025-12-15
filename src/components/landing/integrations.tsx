"use client";

const integrations = [
  { name: "Jira", category: "Project Management" },
  { name: "Trello", category: "Project Management" },
  { name: "Asana", category: "Project Management" },
  { name: "Linear", category: "Project Management" },
  { name: "Slack", category: "Communication" },
  { name: "Teams", category: "Communication" },
  { name: "WhatsApp", category: "Communication" },
  { name: "Discord", category: "Communication" },
  { name: "Analytics", category: "Analytics" },
  { name: "Search Console", category: "Analytics" },
  { name: "Ahrefs", category: "SEO" },
  { name: "Semrush", category: "SEO" },
];

export function Integrations() {
  return (
    <section className="py-24 relative">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-12">
          <span className="inline-block px-4 py-1.5 rounded-full bg-warning/10 text-warning text-sm font-medium mb-4">
            Integrations
          </span>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Connect Your{" "}
            <span className="bg-gradient-to-r from-warning to-accent-purple bg-clip-text text-transparent">
              Workflow
            </span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Seamlessly integrate with your existing tools. Push recommendations directly to your project boards.
          </p>
        </div>

        {/* Integrations Grid */}
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-4">
            {integrations.map((integration) => (
              <div
                key={integration.name}
                className="card-tertiary text-center py-6 group cursor-pointer"
              >
                {/* Placeholder Icon */}
                <div className="w-10 h-10 rounded-lg bg-muted/50 mx-auto mb-2 flex items-center justify-center font-bold text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                  {integration.name.charAt(0)}
                </div>
                <span className="text-xs font-medium">{integration.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* WhatsApp Highlight */}
        <div className="mt-12 max-w-2xl mx-auto">
          <div className="card-secondary p-6 flex flex-col md:flex-row items-center gap-6">
            <div className="w-16 h-16 rounded-2xl bg-success/10 flex items-center justify-center text-3xl shrink-0">
              💬
            </div>
            <div className="text-center md:text-left">
              <h4 className="font-semibold text-lg mb-1">WhatsApp Business Integration</h4>
              <p className="text-muted-foreground text-sm">
                Get real-time alerts directly to WhatsApp. Perfect for teams on the go. Never miss a critical AI mention.
              </p>
            </div>
            <div className="shrink-0">
              <span className="px-3 py-1 rounded-full bg-success/10 text-success text-xs font-medium">
                Popular in Africa
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
