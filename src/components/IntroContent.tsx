"use client";

interface IntroContentProps {
  content: string;
}

export default function IntroContent({ content }: IntroContentProps) {
  if (!content) return null;

  const paragraphs = content.split("\n\n").filter(Boolean);

  return (
    <div className="space-y-[22px]">
      {paragraphs.map((paragraph, i) => (
        <p
          key={i}
          className="text-ink text-[18px] leading-[1.72]"
        >
          {paragraph}
        </p>
      ))}
    </div>
  );
}
