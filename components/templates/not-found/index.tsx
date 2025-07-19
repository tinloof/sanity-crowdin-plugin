"use client";

import {client} from "@/data/sanity/client";
import {NOT_FOUND_QUERY} from "@/data/sanity/queries";
import {useLocale} from "@/hooks/use-locale";
import useSWR, {unstable_serialize} from "swr";

export default function NotFound() {
  const {locale} = useLocale();

  const {data} = useSWR(
    unstable_serialize(["not found", locale.id]),
    () => client.fetch(NOT_FOUND_QUERY, {locale: locale.id}),
    {keepPreviousData: true},
  );

  return (
    <div className="flex h-screen flex-col items-center justify-center gap-2">
      <h1 className="font-bold">{data?.title}</h1>
      {data?.description && <p>{data.description}</p>}
    </div>
  );
}
