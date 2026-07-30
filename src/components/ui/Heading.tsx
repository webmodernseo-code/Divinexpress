type HeadingLevel = 1 | 2 | 3;

const SIZES: Record<HeadingLevel, string> = {
  1: 'text-4xl md:text-5xl',
  2: 'text-3xl md:text-4xl',
  3: 'text-2xl'
};

export function Heading({
  level = 2,
  children,
  className = ''
}: {
  level?: HeadingLevel;
  children: React.ReactNode;
  className?: string;
}) {
  const Tag = `h${level}` as 'h1' | 'h2' | 'h3';
  return <Tag className={`font-serif ${SIZES[level]} ${className}`}>{children}</Tag>;
}
