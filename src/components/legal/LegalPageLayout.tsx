import { Fragment } from 'react';
import { Container } from '@/components/ui/Container';
import { Heading } from '@/components/ui/Heading';
import { parseLegalText } from '@/lib/legalText';

export interface LegalSection {
  heading: string;
  /** One or more paragraphs for this section. */
  body: string[];
}

/** Anchors are derived from the section order — never hardcoded per page. */
function sectionAnchor(index: number) {
  return `section-${index + 1}`;
}

/**
 * Renders one legal paragraph, highlighting the `**…**` fields that still have to be filled in
 * (SIREN, registered address, host…). The wording itself ("à compléter") always stays visible.
 */
function LegalText({ text }: { text: string }) {
  return (
    <>
      {parseLegalText(text).map((segment, index) =>
        segment.isPlaceholder ? (
          <span
            key={index}
            className="box-decoration-clone rounded-full bg-accent/10 px-2 py-0.5 font-medium text-accent"
          >
            {segment.text}
          </span>
        ) : (
          <Fragment key={index}>{segment.text}</Fragment>
        )
      )}
    </>
  );
}

/**
 * Shared shell for the three legal pages (mentions légales, CGV, confidentialité).
 * Title, "last updated" line, an anchored table of contents generated from `sections`,
 * the numbered sections themselves, and the shared disclaimer box.
 */
export function LegalPageLayout({
  title,
  updatedLabel,
  sections,
  disclaimer
}: {
  title: string;
  updatedLabel: string;
  sections: LegalSection[];
  disclaimer: string;
}) {
  return (
    <Container className="max-w-3xl py-12 md:py-16">
      <Heading level={1}>{title}</Heading>
      <p className="mt-3 text-xs text-mist-500">
        <LegalText text={updatedLabel} />
      </p>

      <nav aria-label={title} className="mt-8 rounded-2xl border border-mist-100 bg-mist-50 p-5 md:mt-10 md:p-6">
        <ol className="grid gap-x-8 gap-y-2 text-sm sm:grid-cols-2">
          {sections.map((section, index) => (
            <li key={sectionAnchor(index)}>
              <a href={`#${sectionAnchor(index)}`} className="text-mist-700 transition-colors hover:text-accent">
                <span className="tabular-nums text-mist-500">{index + 1}.</span> {section.heading}
              </a>
            </li>
          ))}
        </ol>
      </nav>

      {/* scroll-mt clears the sticky Header so a TOC jump doesn't hide the section title. */}
      <div className="mt-10 space-y-10 md:mt-12">
        {sections.map((section, index) => (
          <section key={sectionAnchor(index)} id={sectionAnchor(index)} className="scroll-mt-28 md:scroll-mt-32">
            {/* Plain h2 (same pattern as CartDrawer/SizeGuideTable): `Heading` bakes in a
                `md:text-4xl` that would win over any smaller responsive size passed here. */}
            <h2 className="font-serif text-xl md:text-2xl">
              {index + 1}. {section.heading}
            </h2>
            <div className="mt-3 space-y-3 text-sm leading-relaxed text-mist-700">
              {section.body.map((paragraph, paragraphIndex) => (
                <p key={paragraphIndex}>
                  <LegalText text={paragraph} />
                </p>
              ))}
            </div>
          </section>
        ))}
      </div>

      <p className="mt-12 rounded-2xl border border-mist-200 bg-mist-50 p-5 text-xs leading-relaxed text-mist-600 md:p-6">
        {disclaimer}
      </p>
    </Container>
  );
}
