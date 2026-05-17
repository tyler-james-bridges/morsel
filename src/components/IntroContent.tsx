"use client";

interface IntroContentProps {
  content: string;
}

export default function IntroContent({ content }: IntroContentProps) {
  if (!content) return null;

  const paragraphs = content.split("\n\n").filter(Boolean);

  return (
    <div className="space-y-5">
      {paragraphs.map((paragraph, i) => (
        <p
          key={i}
          className="text-gray-300 text-lg leading-relaxed tracking-wide"
        >
          {paragraph}
        </p>
      ))}
    </div>
  );
}
