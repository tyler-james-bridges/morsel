"use client";

import { Fragment } from "react";

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
          {paragraph.split(/(https?:\/\/[^\s<>"']+)/g).map((part, j) => {
            if (!/^https?:\/\//.test(part)) return part;

            const url = part.replace(/[.,!?;:)\]]+$/, "");
            return (
              <Fragment key={j}>
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="break-words underline underline-offset-4 hover:text-accent"
                >
                  {url}
                </a>
                {part.slice(url.length)}
              </Fragment>
            );
          })}
        </p>
      ))}
    </div>
  );
}
