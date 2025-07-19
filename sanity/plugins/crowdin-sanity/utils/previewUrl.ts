export function buildPreviewUrl({
  origin,
  targetLang,
  pathname,
}: {
  origin: string;
  sourceDocId?: string;
  documentType?: string;
  targetLang: string;
  pathname?: string;
}) {
  return `${origin}/${targetLang.toLocaleLowerCase()}${pathname ? `${pathname}` : ""}`;
}
