"use client";

import * as React from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Copy,
  Check,
  ExternalLink,
  Plus,
  Trash2,
  Building2,
  ShoppingBag,
  FileText,
  List,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type SchemaType = "Organization" | "Product" | "Article" | "BreadcrumbList";

interface OrganizationForm {
  name: string;
  url: string;
  logo: string;
  description: string;
  sameAs: string[];
  contactPhone: string;
  contactEmail: string;
}

interface ProductForm {
  name: string;
  image: string;
  description: string;
  brand: string;
  price: string;
  priceCurrency: string;
  availability:
    | "InStock"
    | "OutOfStock"
    | "PreOrder"
    | "BackOrder"
    | "Discontinued";
  productUrl: string;
  ratingValue: string;
  reviewCount: string;
}

interface ArticleForm {
  headline: string;
  image: string;
  datePublished: string;
  dateModified: string;
  authorName: string;
  authorUrl: string;
  publisherName: string;
  publisherLogo: string;
  description: string;
}

interface Breadcrumb {
  id: string;
  name: string;
  url: string;
}

function mkId() {
  return Math.random().toString(36).slice(2, 10);
}

function stripUndefined<T extends Record<string, unknown>>(obj: T): Partial<T> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v === undefined || v === "" || (Array.isArray(v) && v.length === 0)) continue;
    out[k] = v;
  }
  return out as Partial<T>;
}

function buildOrganizationLd(f: OrganizationForm): Record<string, unknown> | null {
  if (!f.name.trim() || !f.url.trim()) return null;
  const contactPoint =
    f.contactPhone.trim() || f.contactEmail.trim()
      ? stripUndefined({
          "@type": "ContactPoint",
          telephone: f.contactPhone.trim(),
          email: f.contactEmail.trim(),
          contactType: "customer service",
        })
      : undefined;
  return stripUndefined({
    "@context": "https://schema.org",
    "@type": "Organization",
    name: f.name.trim(),
    url: f.url.trim(),
    logo: f.logo.trim(),
    description: f.description.trim(),
    sameAs: f.sameAs.filter((x) => x.trim()).map((x) => x.trim()),
    contactPoint,
  });
}

function buildProductLd(f: ProductForm): Record<string, unknown> | null {
  if (!f.name.trim() || !f.image.trim()) return null;
  const offers =
    f.price.trim() || f.productUrl.trim()
      ? stripUndefined({
          "@type": "Offer",
          price: f.price.trim(),
          priceCurrency: f.priceCurrency.trim() || "USD",
          availability: `https://schema.org/${f.availability}`,
          url: f.productUrl.trim(),
        })
      : undefined;
  const aggregateRating =
    f.ratingValue.trim() && f.reviewCount.trim()
      ? {
          "@type": "AggregateRating",
          ratingValue: f.ratingValue.trim(),
          reviewCount: f.reviewCount.trim(),
        }
      : undefined;
  const brand = f.brand.trim()
    ? { "@type": "Brand", name: f.brand.trim() }
    : undefined;
  return stripUndefined({
    "@context": "https://schema.org",
    "@type": "Product",
    name: f.name.trim(),
    image: f.image.trim(),
    description: f.description.trim(),
    brand,
    offers,
    aggregateRating,
  });
}

function buildArticleLd(f: ArticleForm): Record<string, unknown> | null {
  if (!f.headline.trim() || !f.datePublished.trim()) return null;
  const author = f.authorName.trim()
    ? stripUndefined({
        "@type": "Person",
        name: f.authorName.trim(),
        url: f.authorUrl.trim(),
      })
    : undefined;
  const publisher = f.publisherName.trim()
    ? stripUndefined({
        "@type": "Organization",
        name: f.publisherName.trim(),
        logo: f.publisherLogo.trim()
          ? {
              "@type": "ImageObject",
              url: f.publisherLogo.trim(),
            }
          : undefined,
      })
    : undefined;
  return stripUndefined({
    "@context": "https://schema.org",
    "@type": "Article",
    headline: f.headline.trim(),
    image: f.image.trim(),
    datePublished: f.datePublished.trim(),
    dateModified: f.dateModified.trim() || f.datePublished.trim(),
    author,
    publisher,
    description: f.description.trim(),
  });
}

function buildBreadcrumbLd(crumbs: Breadcrumb[]): Record<string, unknown> | null {
  const clean = crumbs.filter((c) => c.name.trim() && c.url.trim());
  if (clean.length === 0) return null;
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: clean.map((c, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: c.name.trim(),
      item: c.url.trim(),
    })),
  };
}

function wrapScript(doc: Record<string, unknown>): string {
  return `<script type="application/ld+json">\n${JSON.stringify(doc, null, 2)}\n</script>`;
}

export default function SchemaBuilderPage() {
  const [type, setType] = React.useState<SchemaType>("Organization");
  const [copied, setCopied] = React.useState(false);

  const [org, setOrg] = React.useState<OrganizationForm>({
    name: "",
    url: "",
    logo: "",
    description: "",
    sameAs: [""],
    contactPhone: "",
    contactEmail: "",
  });
  const [product, setProduct] = React.useState<ProductForm>({
    name: "",
    image: "",
    description: "",
    brand: "",
    price: "",
    priceCurrency: "USD",
    availability: "InStock",
    productUrl: "",
    ratingValue: "",
    reviewCount: "",
  });
  const [article, setArticle] = React.useState<ArticleForm>({
    headline: "",
    image: "",
    datePublished: new Date().toISOString().slice(0, 10),
    dateModified: "",
    authorName: "",
    authorUrl: "",
    publisherName: "",
    publisherLogo: "",
    description: "",
  });
  const [crumbs, setCrumbs] = React.useState<Breadcrumb[]>([
    { id: mkId(), name: "Home", url: "" },
    { id: mkId(), name: "", url: "" },
  ]);

  const doc = React.useMemo(() => {
    switch (type) {
      case "Organization":
        return buildOrganizationLd(org);
      case "Product":
        return buildProductLd(product);
      case "Article":
        return buildArticleLd(article);
      case "BreadcrumbList":
        return buildBreadcrumbLd(crumbs);
    }
  }, [type, org, product, article, crumbs]);

  const jsonLd = doc ? wrapScript(doc) : "";

  const copy = async () => {
    if (!jsonLd) return;
    await navigator.clipboard.writeText(jsonLd);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const TABS: Array<{ key: SchemaType; label: string; icon: React.ReactNode }> = [
    { key: "Organization", label: "Organization", icon: <Building2 className="h-3.5 w-3.5" /> },
    { key: "Product", label: "Product", icon: <ShoppingBag className="h-3.5 w-3.5" /> },
    { key: "Article", label: "Article", icon: <FileText className="h-3.5 w-3.5" /> },
    { key: "BreadcrumbList", label: "Breadcrumbs", icon: <List className="h-3.5 w-3.5" /> },
  ];

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <div>
        <Link
          href="/dashboard/competitive/roadmap"
          className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mb-2"
        >
          <ArrowLeft className="h-3 w-3" /> Back to roadmap
        </Link>
        <h1 className="text-2xl font-semibold">Schema Markup Builder</h1>
        <p className="text-sm text-muted-foreground mt-1">
          The four schema types that move the needle for AI citations and Google rich
          results. Fill in the form, get ready-to-deploy JSON-LD. Validate with the Rich
          Results Test before shipping.
        </p>
      </div>

      <div className="card-secondary p-5 space-y-5">
        <div className="flex flex-wrap gap-2 border-b border-border/40 pb-3">
          {TABS.map((t) => {
            const active = t.key === type;
            return (
              <button
                key={t.key}
                type="button"
                onClick={() => setType(t.key)}
                className={
                  "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors " +
                  (active
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted/30 text-muted-foreground hover:bg-muted/60")
                }
              >
                {t.icon}
                {t.label}
              </button>
            );
          })}
        </div>

        {type === "Organization" && <OrganizationFields form={org} set={setOrg} />}
        {type === "Product" && <ProductFields form={product} set={setProduct} />}
        {type === "Article" && <ArticleFields form={article} set={setArticle} />}
        {type === "BreadcrumbList" && (
          <BreadcrumbFields crumbs={crumbs} set={setCrumbs} />
        )}
      </div>

      {jsonLd ? (
        <div className="card-secondary p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium">Generated JSON-LD</div>
              <div className="text-xs text-muted-foreground">
                Paste this inside the <code>&lt;head&gt;</code> of the relevant page.
              </div>
            </div>
            <Button onClick={copy} className="gap-2">
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copied ? "Copied" : "Copy"}
            </Button>
          </div>
          <pre className="rounded-md bg-muted/40 border border-border/50 p-3 text-xs overflow-x-auto leading-relaxed">
            <code>{jsonLd}</code>
          </pre>
          <div className="flex items-center gap-3 text-xs text-muted-foreground pt-1">
            <span>Next step: validate with</span>
            <a
              href="https://search.google.com/test/rich-results"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-primary hover:underline"
            >
              Google Rich Results Test <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>
      ) : (
        <div className="card-secondary p-5 text-center text-sm text-muted-foreground">
          Fill in the required fields to generate JSON-LD.
        </div>
      )}
    </div>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-muted-foreground">{label}</label>
      {children}
      {hint && <div className="text-[10px] text-muted-foreground">{hint}</div>}
    </div>
  );
}

function OrganizationFields({
  form,
  set,
}: {
  form: OrganizationForm;
  set: React.Dispatch<React.SetStateAction<OrganizationForm>>;
}) {
  const patch = (p: Partial<OrganizationForm>) => set((f) => ({ ...f, ...p }));
  const updateSameAs = (i: number, v: string) =>
    set((f) => {
      const next = [...f.sameAs];
      next[i] = v;
      return { ...f, sameAs: next };
    });
  const addSameAs = () => set((f) => ({ ...f, sameAs: [...f.sameAs, ""] }));
  const removeSameAs = (i: number) =>
    set((f) => ({
      ...f,
      sameAs: f.sameAs.length > 1 ? f.sameAs.filter((_, j) => j !== i) : f.sameAs,
    }));

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Field label="Name *">
        <Input value={form.name} onChange={(e) => patch({ name: e.target.value })} placeholder="Acme Inc." />
      </Field>
      <Field label="URL *">
        <Input value={form.url} onChange={(e) => patch({ url: e.target.value })} placeholder="https://acme.com" />
      </Field>
      <Field label="Logo URL" hint="Direct link to your logo (PNG/SVG)">
        <Input value={form.logo} onChange={(e) => patch({ logo: e.target.value })} placeholder="https://acme.com/logo.png" />
      </Field>
      <Field label="Contact phone">
        <Input value={form.contactPhone} onChange={(e) => patch({ contactPhone: e.target.value })} placeholder="+1-555-555-0100" />
      </Field>
      <Field label="Contact email">
        <Input value={form.contactEmail} onChange={(e) => patch({ contactEmail: e.target.value })} placeholder="support@acme.com" />
      </Field>
      <div className="md:col-span-2">
        <Field label="Description">
          <textarea
            value={form.description}
            onChange={(e) => patch({ description: e.target.value })}
            rows={2}
            placeholder="One-sentence description of what your company does."
            className="w-full rounded-md border border-border bg-muted/30 px-3 py-2 text-sm resize-y focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </Field>
      </div>
      <div className="md:col-span-2 space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-medium text-muted-foreground">
            sameAs — social profile URLs
          </label>
          <Button type="button" variant="ghost" size="sm" onClick={addSameAs} className="h-7 gap-1 text-xs">
            <Plus className="h-3 w-3" /> Add
          </Button>
        </div>
        {form.sameAs.map((v, i) => (
          <div key={i} className="flex items-center gap-2">
            <Input
              value={v}
              onChange={(e) => updateSameAs(i, e.target.value)}
              placeholder="https://linkedin.com/company/acme"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => removeSameAs(i)}
              className="h-8 w-8 shrink-0"
              disabled={form.sameAs.length <= 1}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}

function ProductFields({
  form,
  set,
}: {
  form: ProductForm;
  set: React.Dispatch<React.SetStateAction<ProductForm>>;
}) {
  const patch = (p: Partial<ProductForm>) => set((f) => ({ ...f, ...p }));
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Field label="Product name *">
        <Input value={form.name} onChange={(e) => patch({ name: e.target.value })} placeholder="Premium Widget Pro" />
      </Field>
      <Field label="Image URL *" hint="Direct link to a product image">
        <Input value={form.image} onChange={(e) => patch({ image: e.target.value })} placeholder="https://acme.com/widget.jpg" />
      </Field>
      <Field label="Brand">
        <Input value={form.brand} onChange={(e) => patch({ brand: e.target.value })} placeholder="Acme" />
      </Field>
      <Field label="Product page URL">
        <Input value={form.productUrl} onChange={(e) => patch({ productUrl: e.target.value })} placeholder="https://acme.com/widget" />
      </Field>
      <Field label="Price">
        <Input value={form.price} onChange={(e) => patch({ price: e.target.value })} placeholder="29.99" />
      </Field>
      <Field label="Currency">
        <Input
          value={form.priceCurrency}
          onChange={(e) => patch({ priceCurrency: e.target.value.toUpperCase() })}
          placeholder="USD"
          maxLength={3}
        />
      </Field>
      <Field label="Availability">
        <select
          value={form.availability}
          onChange={(e) => patch({ availability: e.target.value as ProductForm["availability"] })}
          className="w-full rounded-md border border-border bg-muted/30 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
        >
          <option value="InStock">In stock</option>
          <option value="OutOfStock">Out of stock</option>
          <option value="PreOrder">Pre-order</option>
          <option value="BackOrder">Back-order</option>
          <option value="Discontinued">Discontinued</option>
        </select>
      </Field>
      <Field label="Average rating (optional)" hint="Only include if you have real review data">
        <Input value={form.ratingValue} onChange={(e) => patch({ ratingValue: e.target.value })} placeholder="4.6" />
      </Field>
      <Field label="Review count (optional)">
        <Input value={form.reviewCount} onChange={(e) => patch({ reviewCount: e.target.value })} placeholder="128" />
      </Field>
      <div className="md:col-span-2">
        <Field label="Description">
          <textarea
            value={form.description}
            onChange={(e) => patch({ description: e.target.value })}
            rows={3}
            placeholder="Concise product description, 1-2 sentences."
            className="w-full rounded-md border border-border bg-muted/30 px-3 py-2 text-sm resize-y focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </Field>
      </div>
    </div>
  );
}

function ArticleFields({
  form,
  set,
}: {
  form: ArticleForm;
  set: React.Dispatch<React.SetStateAction<ArticleForm>>;
}) {
  const patch = (p: Partial<ArticleForm>) => set((f) => ({ ...f, ...p }));
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Field label="Headline *">
        <Input value={form.headline} onChange={(e) => patch({ headline: e.target.value })} placeholder="How to optimize for AI search" />
      </Field>
      <Field label="Featured image URL" hint="1200×630 or better">
        <Input value={form.image} onChange={(e) => patch({ image: e.target.value })} placeholder="https://acme.com/article-hero.jpg" />
      </Field>
      <Field label="Date published *">
        <Input type="date" value={form.datePublished} onChange={(e) => patch({ datePublished: e.target.value })} />
      </Field>
      <Field label="Date modified" hint="Defaults to published date if empty">
        <Input type="date" value={form.dateModified} onChange={(e) => patch({ dateModified: e.target.value })} />
      </Field>
      <Field label="Author name">
        <Input value={form.authorName} onChange={(e) => patch({ authorName: e.target.value })} placeholder="Jane Doe" />
      </Field>
      <Field label="Author URL" hint="Link to their profile or byline page">
        <Input value={form.authorUrl} onChange={(e) => patch({ authorUrl: e.target.value })} placeholder="https://acme.com/team/jane" />
      </Field>
      <Field label="Publisher name">
        <Input value={form.publisherName} onChange={(e) => patch({ publisherName: e.target.value })} placeholder="Acme Blog" />
      </Field>
      <Field label="Publisher logo URL">
        <Input value={form.publisherLogo} onChange={(e) => patch({ publisherLogo: e.target.value })} placeholder="https://acme.com/logo.png" />
      </Field>
      <div className="md:col-span-2">
        <Field label="Description">
          <textarea
            value={form.description}
            onChange={(e) => patch({ description: e.target.value })}
            rows={2}
            placeholder="Article summary, 1-2 sentences. Used as the search snippet."
            className="w-full rounded-md border border-border bg-muted/30 px-3 py-2 text-sm resize-y focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </Field>
      </div>
    </div>
  );
}

function BreadcrumbFields({
  crumbs,
  set,
}: {
  crumbs: Breadcrumb[];
  set: React.Dispatch<React.SetStateAction<Breadcrumb[]>>;
}) {
  const update = (id: string, patch: Partial<Breadcrumb>) =>
    set((xs) => xs.map((x) => (x.id === id ? { ...x, ...patch } : x)));
  const addRow = () => set((xs) => [...xs, { id: mkId(), name: "", url: "" }]);
  const removeRow = (id: string) =>
    set((xs) => (xs.length > 1 ? xs.filter((x) => x.id !== id) : xs));

  return (
    <div className="space-y-3">
      <div className="text-xs text-muted-foreground">
        Describe the path from the home page to the current page. Each crumb is a label +
        the URL of that intermediate page.
      </div>
      {crumbs.map((c, i) => (
        <div key={c.id} className="grid grid-cols-[auto_1fr_1fr_auto] items-center gap-2">
          <div className="text-xs text-muted-foreground w-6 text-right">{i + 1}.</div>
          <Input
            value={c.name}
            onChange={(e) => update(c.id, { name: e.target.value })}
            placeholder="Home / Products / Widgets"
          />
          <Input
            value={c.url}
            onChange={(e) => update(c.id, { url: e.target.value })}
            placeholder="https://acme.com/products/widgets"
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => removeRow(c.id)}
            className="h-8 w-8"
            disabled={crumbs.length <= 1}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      ))}
      <Button type="button" variant="outline" onClick={addRow} className="gap-2">
        <Plus className="h-4 w-4" /> Add step
      </Button>
    </div>
  );
}
