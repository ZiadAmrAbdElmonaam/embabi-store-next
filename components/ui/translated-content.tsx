'use client';

import { useState, useEffect } from "react";
import { useTranslation } from "@/hooks/use-translation";

interface TranslatedContentProps {
  translationKey: string;
}

export function TranslatedContent({ translationKey }: TranslatedContentProps) {
  const { t } = useTranslation();
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);
  
  // During SSR and initial client render, return an empty span to avoid hydration mismatch
  if (!mounted) {
    return <span className="opacity-0">.</span>;
  }
  
  return <>{t(translationKey)}</>;
} 