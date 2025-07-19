import type {
 Reference,
 ReferenceFilterResolver,
 Rule,
 SanityDocument,
} from "sanity";

import config from "@/config";
import {getLocale} from "@/utils/locale";

export function isRefOfSameLocale(Rule: Rule): Rule {
 return Rule.custom<Reference>(async (value, {document, getClient}) => {
   // Add early return if no value or no reference
   if (!value || !value._ref) return true;

   const referencedLocale = await getClient({
     apiVersion: config.sanity.apiVersion,
   }).fetch(
     // Match both draft & non-draft versions, either will have locale set
     '*[_id match ("**" + $docId)][0].locale',
     {
       docId: value._ref,
     },
   );

   if (referencedLocale && referencedLocale !== document?.locale) {
     return `This link is pointing to a document in another language (${
       getLocale(referencedLocale).title || referencedLocale
     })`;
   }

   return true;
 }).info();
}

const NON_VARIANT_FILTER = `_type != "variant"`;

type GetRefFilterOptions = {
 additionalFilters?: {filter?: string; params?: Record<string, unknown>};
 allowed?: {
   differentLocale?: boolean;
   unindexable?: boolean;
 };
};

export function getRefFilter(
 document: SanityDocument,
 options: GetRefFilterOptions = {
   allowed: {},
   additionalFilters: {},
 },
): {filter: string; params: Record<string, unknown>} | ReferenceFilterResolver {
 const {allowed = {}, additionalFilters = {}} = options;

 const filters = [
   NON_VARIANT_FILTER,
   allowed.unindexable !== true && `indexable != false`,
   allowed.differentLocale !== true &&
     document?.locale &&
     "locale == $curLocale",
   additionalFilters?.filter,
 ];

 return {
   filter: filters.filter(Boolean).join(" && "),
   params: {
     curLocale: document?.locale || null,
     ...additionalFilters?.params,
   },
 };
}