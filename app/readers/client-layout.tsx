"use client";

import ReaderNavigation from "@/components/reader-navigation";
import { useSearchParams } from 'next/navigation';

export default function ReadersLayoutClient({ children }: { children: React.ReactNode }) {
  const searchParams = useSearchParams();
  const isPreview = searchParams.get('preview') === 'true';

  return (
    <>
      {!isPreview && <ReaderNavigation />}
      <main className="flex-1">{children}</main>
    </>
  );
} 