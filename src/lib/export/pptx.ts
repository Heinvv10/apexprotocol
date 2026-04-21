/**
 * PPTX Export Generator (Phase 4.4)
 *
 * Minimal OpenXML PPTX generator — produces a valid .pptx package readable
 * by PowerPoint, Keynote, Google Slides, and LibreOffice Impress.
 *
 * Uses jszip (already installed) to zip the OpenXML parts. Kept deliberately
 * simple: title slide + N content slides. No charts — charts render as
 * bulleted summaries. For richer decks, wire to a dedicated renderer later.
 */

import JSZip from "jszip";
import type { InsightsNarrative } from "./narrative";

export interface PPTXSlide {
  title: string;
  /** Optional subtitle/eyebrow shown under the title */
  subtitle?: string;
  /** Paragraph body (plain text, no markdown) */
  body?: string;
  /** Optional bulleted list */
  bullets?: string[];
}

export interface PPTXDeckOptions {
  title: string;
  subtitle?: string;
  author?: string;
  slides: PPTXSlide[];
}

const xmlEscape = (s: string): string =>
  s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");

function renderParagraphRun(text: string, opts: { bold?: boolean; size?: number } = {}): string {
  const size = opts.size ?? 1800;
  const bold = opts.bold ? ` b="1"` : "";
  return `<a:p><a:r><a:rPr lang="en-US" sz="${size}"${bold}/><a:t>${xmlEscape(text)}</a:t></a:r></a:p>`;
}

function renderBulletParagraph(text: string): string {
  return `<a:p><a:pPr lvl="0"><a:buChar char="•"/></a:pPr><a:r><a:rPr lang="en-US" sz="1600"/><a:t>${xmlEscape(text)}</a:t></a:r></a:p>`;
}

function buildSlideXml(slide: PPTXSlide): string {
  const bodyParagraphs: string[] = [];
  if (slide.subtitle) {
    bodyParagraphs.push(renderParagraphRun(slide.subtitle, { size: 1400 }));
  }
  if (slide.body) {
    bodyParagraphs.push(renderParagraphRun(slide.body, { size: 1600 }));
  }
  if (slide.bullets && slide.bullets.length > 0) {
    for (const b of slide.bullets) {
      bodyParagraphs.push(renderBulletParagraph(b));
    }
  }

  const bodyText =
    bodyParagraphs.length > 0
      ? bodyParagraphs.join("")
      : `<a:p><a:endParaRPr lang="en-US"/></a:p>`;

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:sld xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">
<p:cSld>
<p:spTree>
<p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr>
<p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/><a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr>
<p:sp>
<p:nvSpPr><p:cNvPr id="2" name="Title"/><p:cNvSpPr><a:spLocks noGrp="1"/></p:cNvSpPr><p:nvPr><p:ph type="ctrTitle"/></p:nvPr></p:nvSpPr>
<p:spPr><a:xfrm><a:off x="457200" y="457200"/><a:ext cx="8229600" cy="1143000"/></a:xfrm></p:spPr>
<p:txBody><a:bodyPr anchor="ctr"/><a:lstStyle/>${renderParagraphRun(slide.title, { bold: true, size: 3200 })}</p:txBody>
</p:sp>
<p:sp>
<p:nvSpPr><p:cNvPr id="3" name="Body"/><p:cNvSpPr><a:spLocks noGrp="1"/></p:cNvSpPr><p:nvPr><p:ph idx="1"/></p:nvPr></p:nvSpPr>
<p:spPr><a:xfrm><a:off x="457200" y="1714500"/><a:ext cx="8229600" cy="4572000"/></a:xfrm></p:spPr>
<p:txBody><a:bodyPr/><a:lstStyle/>${bodyText}</p:txBody>
</p:sp>
</p:spTree>
</p:cSld>
</p:sld>`;
}

const CONTENT_TYPES = (slideCount: number): string => {
  const overrides: string[] = [
    `<Override PartName="/ppt/presentation.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.presentation.main+xml"/>`,
    `<Override PartName="/ppt/slideLayouts/slideLayout1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slideLayout+xml"/>`,
    `<Override PartName="/ppt/slideMasters/slideMaster1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slideMaster+xml"/>`,
    `<Override PartName="/ppt/theme/theme1.xml" ContentType="application/vnd.openxmlformats-officedocument.theme+xml"/>`,
  ];
  for (let i = 1; i <= slideCount; i++) {
    overrides.push(
      `<Override PartName="/ppt/slides/slide${i}.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slide+xml"/>`,
    );
  }
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
<Default Extension="xml" ContentType="application/xml"/>
${overrides.join("\n")}
</Types>`;
};

const ROOT_RELS = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="ppt/presentation.xml"/>
</Relationships>`;

const PRESENTATION_XML = (slideCount: number): string => {
  const slideRefs: string[] = [];
  for (let i = 0; i < slideCount; i++) {
    slideRefs.push(`<p:sldId id="${256 + i}" r:id="rId${i + 2}"/>`);
  }
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:presentation xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" saveSubsetFonts="1">
<p:sldMasterIdLst><p:sldMasterId id="2147483648" r:id="rId1"/></p:sldMasterIdLst>
<p:sldIdLst>${slideRefs.join("")}</p:sldIdLst>
<p:sldSize cx="9144000" cy="6858000"/>
<p:notesSz cx="6858000" cy="9144000"/>
</p:presentation>`;
};

const PRESENTATION_RELS = (slideCount: number): string => {
  const rels: string[] = [
    `<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideMaster" Target="slideMasters/slideMaster1.xml"/>`,
  ];
  for (let i = 0; i < slideCount; i++) {
    rels.push(
      `<Relationship Id="rId${i + 2}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide" Target="slides/slide${i + 1}.xml"/>`,
    );
  }
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
${rels.join("\n")}
</Relationships>`;
};

const SLIDE_MASTER = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:sldMaster xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">
<p:cSld>
<p:bg><p:bgRef idx="1001"><a:schemeClr val="bg1"/></p:bgRef></p:bg>
<p:spTree>
<p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr>
<p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/><a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr>
</p:spTree>
</p:cSld>
<p:clrMap bg1="lt1" tx1="dk1" bg2="lt2" tx2="dk2" accent1="accent1" accent2="accent2" accent3="accent3" accent4="accent4" accent5="accent5" accent6="accent6" hlink="hlink" folHlink="folHlink"/>
<p:sldLayoutIdLst><p:sldLayoutId id="2147483649" r:id="rId1"/></p:sldLayoutIdLst>
</p:sldMaster>`;

const SLIDE_MASTER_RELS = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideLayout" Target="../slideLayouts/slideLayout1.xml"/>
<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/theme" Target="../theme/theme1.xml"/>
</Relationships>`;

const SLIDE_LAYOUT = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:sldLayout xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" type="titleOnly" preserve="1">
<p:cSld name="Title + Content">
<p:spTree>
<p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr>
<p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/><a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr>
</p:spTree>
</p:cSld>
</p:sldLayout>`;

const SLIDE_LAYOUT_RELS = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideMaster" Target="../slideMasters/slideMaster1.xml"/>
</Relationships>`;

const SLIDE_RELS = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideLayout" Target="../slideLayouts/slideLayout1.xml"/>
</Relationships>`;

const THEME_XML = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<a:theme xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" name="ApexTheme">
<a:themeElements>
<a:clrScheme name="Apex">
<a:dk1><a:srgbClr val="0A0F1A"/></a:dk1>
<a:lt1><a:srgbClr val="FFFFFF"/></a:lt1>
<a:dk2><a:srgbClr val="141930"/></a:dk2>
<a:lt2><a:srgbClr val="E0E0E0"/></a:lt2>
<a:accent1><a:srgbClr val="00E5CC"/></a:accent1>
<a:accent2><a:srgbClr val="8B5CF6"/></a:accent2>
<a:accent3><a:srgbClr val="22C55E"/></a:accent3>
<a:accent4><a:srgbClr val="F59E0B"/></a:accent4>
<a:accent5><a:srgbClr val="EF4444"/></a:accent5>
<a:accent6><a:srgbClr val="3B82F6"/></a:accent6>
<a:hlink><a:srgbClr val="00E5CC"/></a:hlink>
<a:folHlink><a:srgbClr val="8B5CF6"/></a:folHlink>
</a:clrScheme>
<a:fontScheme name="Apex">
<a:majorFont><a:latin typeface="Inter"/><a:ea typeface=""/><a:cs typeface=""/></a:majorFont>
<a:minorFont><a:latin typeface="Inter"/><a:ea typeface=""/><a:cs typeface=""/></a:minorFont>
</a:fontScheme>
<a:fmtScheme name="Office">
<a:fillStyleLst><a:solidFill><a:schemeClr val="phClr"/></a:solidFill><a:solidFill><a:schemeClr val="phClr"/></a:solidFill><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:fillStyleLst>
<a:lnStyleLst><a:ln w="6350"><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:ln><a:ln w="12700"><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:ln><a:ln w="19050"><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:ln></a:lnStyleLst>
<a:effectStyleLst><a:effectStyle><a:effectLst/></a:effectStyle><a:effectStyle><a:effectLst/></a:effectStyle><a:effectStyle><a:effectLst/></a:effectStyle></a:effectStyleLst>
<a:bgFillStyleLst><a:solidFill><a:schemeClr val="phClr"/></a:solidFill><a:solidFill><a:schemeClr val="phClr"/></a:solidFill><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:bgFillStyleLst>
</a:fmtScheme>
</a:themeElements>
</a:theme>`;

/**
 * Build a valid .pptx file as a Uint8Array (Node Buffer-compatible).
 */
export async function buildPptx(options: PPTXDeckOptions): Promise<Uint8Array> {
  if (options.slides.length === 0) {
    throw new Error("At least one slide is required");
  }

  const zip = new JSZip();

  zip.file("[Content_Types].xml", CONTENT_TYPES(options.slides.length));
  zip.file("_rels/.rels", ROOT_RELS);

  // Presentation
  zip.file("ppt/presentation.xml", PRESENTATION_XML(options.slides.length));
  zip.file("ppt/_rels/presentation.xml.rels", PRESENTATION_RELS(options.slides.length));

  // Master + layout + theme
  zip.file("ppt/slideMasters/slideMaster1.xml", SLIDE_MASTER);
  zip.file("ppt/slideMasters/_rels/slideMaster1.xml.rels", SLIDE_MASTER_RELS);
  zip.file("ppt/slideLayouts/slideLayout1.xml", SLIDE_LAYOUT);
  zip.file("ppt/slideLayouts/_rels/slideLayout1.xml.rels", SLIDE_LAYOUT_RELS);
  zip.file("ppt/theme/theme1.xml", THEME_XML);

  // Slides
  for (let i = 0; i < options.slides.length; i++) {
    zip.file(`ppt/slides/slide${i + 1}.xml`, buildSlideXml(options.slides[i]));
    zip.file(`ppt/slides/_rels/slide${i + 1}.xml.rels`, SLIDE_RELS);
  }

  const buffer = await zip.generateAsync({ type: "uint8array" });
  return buffer;
}

/**
 * Convenience: build a PPTX deck from an InsightsNarrative.
 */
export async function buildNarrativePptx(
  narrative: InsightsNarrative,
  metadata: { author?: string } = {},
): Promise<Uint8Array> {
  const slides: PPTXSlide[] = [
    {
      title: narrative.headline,
      subtitle: metadata.author ? `Prepared by ${metadata.author}` : undefined,
      body: narrative.executive,
    },
    ...narrative.sections.map((s) => ({
      title: s.heading,
      body: s.body,
    })),
    {
      title: "Key Signals",
      bullets: narrative.bullets,
    },
    {
      title: "Takeaway",
      body: narrative.keyTakeaway,
    },
  ];

  return buildPptx({
    title: narrative.headline,
    author: metadata.author,
    slides,
  });
}
