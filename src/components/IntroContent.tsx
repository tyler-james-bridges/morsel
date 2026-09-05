"use client";

import { Fragment } from "react";

interface IntroContentProps {
  content: string;
}

function isWebUrl(url: string) {
  try {
    const { protocol } = new URL(url);
    return protocol === "http:" || protocol === "https:";
  } catch {
    return false;
  }
}

export default function IntroContent({ content }: IntroContentProps) {
  if (!content) return null;

  const paragraphs = content.split("\n\n").filter(Boolean);

  return (
    <div className="space-y-[22px]">
      {paragraphs.map((paragraph, i) => (
        <p
          key={i}
          className={paragraph.startsWith("Source: ")
            ? "text-ink-3 text-[12.5px] leading-[1.5]"
            : "text-ink text-[18px] leading-[1.72]"}
        >
          {paragraph.split(/(\[[^\]\n]+\]\([^\s)]+\)|https?:\/\/[^\s<>"']+)/gi).map((part, j) => {
            const labeledLink = part.match(/^\[([^\]\n]+)\]\(([^\s)]+)\)$/);
            const url = labeledLink ? labeledLink[2] : part.replace(/[.,!?;:)\]]+$/, "");
            if (!isWebUrl(url)) return part;

            return (
              <Fragment key={j}>
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="break-words underline underline-offset-4 hover:text-accent"
                >
                  {labeledLink ? labeledLink[1] : url}
                </a>
                {!labeledLink && part.slice(url.length)}
              </Fragment>
            );
          })}
        </p>
      ))}
    </div>
  );
}
