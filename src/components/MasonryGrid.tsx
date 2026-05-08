import { ReactNode } from "react";

interface MasonryGridProps {
  children: ReactNode;
}

export default function MasonryGrid({ children }: MasonryGridProps) {
  return (
    <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4">
      {children}
    </div>
  );
}
