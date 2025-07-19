import _ from "lodash";
import * as cheerio from "cheerio";

import type { SanityDocumentWithCrowdinMetadata } from "../types";

type SanityValue =
  | string
  | number
  | boolean
  | null
  | undefined
  | SanityObject
  | SanityArray;
type SanityObject = { [key: string]: SanityValue };
type SanityArray = SanityValue[];

export class SanityHTMLParser {
  private hiddenFields: Set<string>;
  private hiddenObjects: Set<string>;

  private static readonly DEFAULT_HIDDEN_FIELDS = [
    "_id",
    "_rev",
    "_key",
    "_ref",
    "_type",
    "_createdAt",
    "_updatedAt",
    "listItem",
    "level",
  ];

  private static readonly DEFAULT_HIDDEN_OBJECTS = ["crowdinMetadata"];

  constructor(
    additionalHiddenFields: readonly string[] = [],
    additionalHiddenObjects: readonly string[] = [],
  ) {
    this.hiddenFields = new Set([
      ...SanityHTMLParser.DEFAULT_HIDDEN_FIELDS,
      ...additionalHiddenFields,
    ]);
    this.hiddenObjects = new Set([
      ...SanityHTMLParser.DEFAULT_HIDDEN_OBJECTS,
      ...additionalHiddenObjects,
    ]);
  }

  jsonToHtml(json: SanityDocumentWithCrowdinMetadata): string {
    const html = ["<!DOCTYPE html><html><head>"];
    html.push(
      `<script type="application/json" id="sanity-root">${JSON.stringify(json)}</script>`,
    );
    html.push("</head><body>");
    html.push(this.renderVisibleContent(json));
    html.push("</body></html>");
    return html.join("\n");
  }

  private renderVisibleContent(
    obj: SanityDocumentWithCrowdinMetadata | SanityValue,
    path: string = "",
  ): string {
    if (_.isArray(obj)) {
      if (path.endsWith(".marks")) {
        return `<div data-field="${this.escapeAttr(path)}" data-type="array"></div>`;
      }
      return `<div data-field="${this.escapeAttr(path)}" data-type="array">
        ${_.map(obj, (item, index) =>
          this.renderVisibleContent(item, `${path}[${index}]`),
        ).join("\n")}
      </div>`;
    }

    if (!_.isPlainObject(obj)) {
      return `<div data-field="${this.escapeAttr(path)}" data-type="${typeof obj}">${this.escapeHtml(String(obj))}</div>`;
    }

    return `<div data-field="${this.escapeAttr(path)}" data-type="object">
      ${_.chain(obj)
        .toPairs()
        .reject(([key]) => this.shouldHide(key))
        .map(([key, value]) => {
          const currentPath = path ? `${path}.${key}` : key;
          if (key === "marks" && _.isArray(value)) {
            return `<div data-field="${this.escapeAttr(currentPath)}" data-type="array"></div>`;
          } else if (_.isPlainObject(value) || _.isArray(value)) {
            return this.renderVisibleContent(value, currentPath);
          } else if (typeof value === "boolean") {
            return `<div data-field="${this.escapeAttr(currentPath)}" data-type="boolean"></div>`;
          } else {
            return `<div data-field="${this.escapeAttr(currentPath)}" data-type="${typeof value}">${this.escapeHtml(String(value))}</div>`;
          }
        })
        .join("\n")
        .value()}
    </div>`;
  }

  htmlToJson(html: string) {
    const $ = cheerio.load(html);
    const scriptTag = $("#sanity-root");
    if (scriptTag.length === 0) {
      throw new Error("Invalid HTML: missing sanity-root script tag");
    }
    const content = scriptTag.html();
    if (!content) {
      throw new Error("Invalid HTML: sanity-root script tag has no content");
    }
    const originalJson = JSON.parse(content);
    const firtElement = $("body > div").first();

    if (firtElement) {
      const visibleContent = this.parseElement($, firtElement);
      return _.merge({}, originalJson, visibleContent);
    }
  }

  private parseElement(
    $: cheerio.CheerioAPI,
    $element: cheerio.Cheerio<cheerio.Element>,
  ): SanityValue {
    const type = $element.attr("data-type");

    if (type === "array") {
      return $element
        .children()
        .map((_, el) => this.parseElement($, $(el)))
        .get();
    }

    if (type === "object") {
      const obj: SanityObject = {};
      $element.children().each((_, el) => {
        const $child = $(el);
        const childField = $child.attr("data-field");
        if (childField) {
          const key = this.getLastFieldPart(childField);
          obj[key] = this.parseElement($, $child);
        }
      });
      return obj;
    }

    if (type === "boolean") {
      // For boolean values, we return undefined to ensure they're taken from the original JSON
      return undefined;
    }

    if (type === "number") {
      return parseFloat($element.text());
    }

    return $element.text() || "";
  }

  private getLastFieldPart(field: string): string {
    const parts = field.split(".");
    const lastPart = parts[parts.length - 1];
    const match = lastPart.match(/^(.*?)(\[\d+\])?$/);
    return match ? match[1] : lastPart;
  }

  private shouldHide(key: string): boolean {
    return this.hiddenFields.has(key) || this.hiddenObjects.has(key);
  }

  private escapeHtml(str: string): string {
    return _.escape(str);
  }

  private escapeAttr(str: string): string {
    return str.replace(/"/g, "&quot;");
  }
}
