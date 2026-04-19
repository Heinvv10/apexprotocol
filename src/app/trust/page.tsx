import type { Metadata } from "next";
import {
  CERTIFICATIONS,
  SUB_PROCESSORS,
  DATA_RESIDENCY_OPTIONS,
  INCIDENT_SUMMARY,
  SECURITY_CONTACTS,
  LEGAL_DOCS,
} from "@/lib/trust/registry";

export const metadata: Metadata = {
  title: "Apex — Trust Center",
  description:
    "Security posture, compliance certifications, sub-processors, and data residency for Apex.",
  robots: { index: true, follow: true },
};

const STATUS_COLORS: Record<string, string> = {
  certified: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  in_progress: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  planned: "bg-slate-500/10 text-slate-400 border-slate-500/20",
  not_applicable: "bg-slate-500/10 text-slate-500 border-slate-500/20",
  available: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
};

const STATUS_LABEL: Record<string, string> = {
  certified: "Certified",
  in_progress: "In progress",
  planned: "Planned",
  not_applicable: "N/A",
  available: "Available",
};

export default function TrustCenterPage() {
  return (
    <main className="mx-auto max-w-5xl space-y-12 p-6 py-12">
      <header className="space-y-3">
        <p className="text-sm text-cyan-400/80">Trust Center</p>
        <h1 className="text-4xl font-semibold tracking-tight">
          How Apex protects your data
        </h1>
        <p className="max-w-2xl text-base text-muted-foreground">
          Live posture. If a certification here says &ldquo;in progress,&rdquo;
          that&apos;s because it&apos;s in progress — we don&apos;t pre-claim
          compliance. Security contacts are one email away.
        </p>
      </header>

      <Section title="Certifications & frameworks">
        <div className="grid gap-3 sm:grid-cols-2">
          {CERTIFICATIONS.map((c) => (
            <div
              key={c.name}
              className="rounded-lg border border-border bg-card p-5"
            >
              <div className="mb-2 flex items-center justify-between gap-3">
                <h3 className="font-medium">{c.name}</h3>
                <Badge status={c.status} />
              </div>
              <p className="text-sm text-muted-foreground">{c.summary}</p>
              {c.reportUrl && (
                <a
                  href={c.reportUrl}
                  className="mt-2 inline-block text-xs text-cyan-400 hover:underline"
                >
                  View report →
                </a>
              )}
            </div>
          ))}
        </div>
      </Section>

      <Section title="Data residency">
        <p className="mb-4 text-sm text-muted-foreground">
          Pick the region where your tenant lives at workspace creation.
          Data stays in-region — no cross-border replication.
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          {DATA_RESIDENCY_OPTIONS.map((r) => (
            <div
              key={r.region}
              className="rounded-lg border border-border bg-card p-5"
            >
              <div className="mb-2 flex items-center justify-between gap-3">
                <h3 className="font-medium">{r.label}</h3>
                <Badge status={r.status} />
              </div>
              <p className="text-sm text-muted-foreground">{r.description}</p>
              {r.availableFrom && r.status === "planned" && (
                <p className="mt-2 text-xs text-slate-500">
                  Expected: {new Date(r.availableFrom).toLocaleDateString()}
                </p>
              )}
            </div>
          ))}
        </div>
      </Section>

      <Section title="Sub-processors">
        <p className="mb-4 text-sm text-muted-foreground">
          Vendors that process your data on Apex&apos;s behalf. Adding a new
          vendor updates this list before go-live — you can subscribe to
          changes via{" "}
          <a
            href="/api/v1/webhooks/events"
            className="text-cyan-400 hover:underline"
          >
            our events API
          </a>
          .
        </p>
        <div className="overflow-hidden rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead className="bg-card text-left text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Vendor</th>
                <th className="px-4 py-3">Purpose</th>
                <th className="px-4 py-3">Data</th>
                <th className="px-4 py-3">Country</th>
                <th className="px-4 py-3">Policy</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {SUB_PROCESSORS.map((s) => (
                <tr key={s.name}>
                  <td className="px-4 py-3 font-medium">{s.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {s.purpose}
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {s.dataProcessed}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {s.country}
                  </td>
                  <td className="px-4 py-3">
                    <a
                      href={s.privacyUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-cyan-400 hover:underline"
                    >
                      Privacy →
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <Section title="Uptime & incidents">
        <div className="grid gap-3 sm:grid-cols-3">
          <Stat
            label="12-month uptime"
            value={
              INCIDENT_SUMMARY.uptime12mo === null
                ? "Insufficient data"
                : `${INCIDENT_SUMMARY.uptime12mo.toFixed(2)}%`
            }
            note={
              INCIDENT_SUMMARY.uptime12mo === null
                ? "Launching — data collection in progress"
                : undefined
            }
          />
          <Stat
            label="Postmortems published"
            value={String(INCIDENT_SUMMARY.incidentsWithPostmortems)}
            note="Every Sev-1 incident gets a public writeup within 5 business days"
          />
          <Stat label="Status page" value="Live" linkTo={INCIDENT_SUMMARY.statusPageUrl} />
        </div>
      </Section>

      <Section title="Security contacts">
        <div className="space-y-2 text-sm">
          <p>
            <span className="text-muted-foreground">Security team:</span>{" "}
            <a
              className="text-cyan-400 hover:underline"
              href={`mailto:${SECURITY_CONTACTS.securityEmail}`}
            >
              {SECURITY_CONTACTS.securityEmail}
            </a>
          </p>
          <p>
            <span className="text-muted-foreground">Vulnerability disclosure:</span>{" "}
            <a
              className="text-cyan-400 hover:underline"
              href={SECURITY_CONTACTS.vulnDisclosurePolicy}
            >
              security.txt
            </a>
          </p>
          <p>
            <span className="text-muted-foreground">Bug bounty:</span>{" "}
            <a
              className="text-cyan-400 hover:underline"
              href={SECURITY_CONTACTS.bugBounty}
            >
              program details →
            </a>
          </p>
        </div>
      </Section>

      <Section title="Legal documents">
        <div className="flex flex-wrap gap-2 text-sm">
          {Object.entries(LEGAL_DOCS).map(([key, url]) => (
            <a
              key={key}
              href={url}
              className="rounded-md border border-border bg-card px-3 py-1.5 text-muted-foreground hover:border-cyan-500/40 hover:text-cyan-400"
            >
              {key.replace(/([A-Z])/g, " $1").replace(/^./, (c) => c.toUpperCase())}
            </a>
          ))}
        </div>
      </Section>
    </main>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-4">
      <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
      {children}
    </section>
  );
}

function Badge({ status }: { status: string }) {
  const className = `inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${
    STATUS_COLORS[status] ?? STATUS_COLORS.not_applicable
  }`;
  return <span className={className}>{STATUS_LABEL[status] ?? status}</span>;
}

function Stat({
  label,
  value,
  note,
  linkTo,
}: {
  label: string;
  value: string;
  note?: string;
  linkTo?: string;
}) {
  const body = (
    <>
      <p className="text-xs uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 text-2xl font-semibold">{value}</p>
      {note && <p className="mt-1 text-xs text-slate-500">{note}</p>}
    </>
  );
  const className =
    "rounded-lg border border-border bg-card p-5 transition hover:border-cyan-500/40";
  if (linkTo) {
    return (
      <a href={linkTo} className={className}>
        {body}
      </a>
    );
  }
  return <div className={className}>{body}</div>;
}
