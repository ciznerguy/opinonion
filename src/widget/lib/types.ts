export type Mode = "select" | "text" | null;

export interface Target {
  mode: "element" | "text";
  el: Element;
  /** Only for text mode: the selected range (kept alive after the native selection is cleared). */
  range?: Range;
  selectedText?: string;
}

export interface Box { left: number; top: number; width: number; height: number }

export interface WidgetConfig { host: string; site: string; siteKey: string }

export interface FeedbackPayload {
  siteName: string; siteKey: string;
  comment: string; type: string; priority: string; author: string;
  mode: "element" | "text";
  url: string; title: string;
  viewport: { width: number; height: number; device: string };
  selector: string; xpath: string; tag: string;
  originalText: string; originalSrc: string;
  heading: string; before: string; after: string; scrollPct: number;
  userAgent: string;
  screenshot: string | null;
}
