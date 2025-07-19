import type { LangCode } from "../types";

const displayNames = new Intl.DisplayNames(["en"], { type: "language" });

export function getReadableLanguageName(lang: string | LangCode) {
  const langValue = typeof lang === "string" ? lang : lang;
  try {
    return displayNames.of(langValue) || langValue;
  } catch (error) {
    return langValue;
  }
}

export function langsAreTheSame(lang1: LangCode, lang2: LangCode) {
  const lang1Value = typeof lang1 === "string" ? lang1 : lang1;
  const lang2Value = typeof lang2 === "string" ? lang2 : lang2;

  return lang1Value === lang2Value;
}

export function targetLangsIntersect(langs1: LangCode[], langs2: LangCode[]) {
  return langs1.some((l1) => langs2.some((l2) => langsAreTheSame(l1, l2)));
}

export function formatLangsForCrowdin(langs: LangCode[]): LangCode[] {
  return langs.map((lang) => {
    if (lang.includes("-")) {
      return lang.split("-")[0] + "-" + lang.split("-")[1].toUpperCase();
    }
    return lang;
  });
}
