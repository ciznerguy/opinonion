import { h, render } from "preact";
import css from "./styles.css?inline";
import { App } from "./components/App";

/**
 * OpinOnion widget entry. Everything (markup + Tailwind CSS) lives inside a Shadow DOM
 * attached to a single zero-size host element, so host-site styles can't leak in and
 * ours can't leak out.
 */
const w = window as unknown as { __OPINONION_MOUNTED__?: boolean };

function mount() {
  if (w.__OPINONION_MOUNTED__) return;
  w.__OPINONION_MOUNTED__ = true;

  const host = document.createElement("opinonion-widget");
  host.style.cssText = "all:initial;position:fixed;top:0;left:0;width:0;height:0;z-index:2147483647;";
  const shadow = host.attachShadow({ mode: "open" });

  const style = document.createElement("style");
  style.textContent = css;
  const root = document.createElement("div");
  shadow.append(style, root);

  // Appended to <html>, not <body>, so framework re-renders of body can't remove it.
  document.documentElement.appendChild(host);
  render(h(App, { host }), root);
}

mount();
