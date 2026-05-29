import { ReactNode } from "react";

interface MasonryGridProps {
  children: ReactNode;
}

export default function MasonryGrid({ children }: MasonryGridProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
      {children}
    </div>
  );
}
