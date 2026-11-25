import type { Box } from "../lib/types";

interface Props { hover: { boxes: Box[]; label: string } | null; target: Box[] }

const px = (n: number) => `${Math.round(n * 10) / 10}px`;

export function Overlay({ hover, target }: Props) {
  return (
    <div class="pointer-events-none fixed inset-0">
      {hover?.boxes.map((b, i) => (
        <div key={"h" + i} class="absolute rounded-[3px] border-2 border-onion-500 bg-onion-500/10" style={{ left: px(b.left), top: px(b.top), width: px(b.width), height: px(b.height) }}>
          {i === 0 && (
            <span class="absolute -top-6 left-[-2px] whitespace-nowrap rounded-md bg-onion-600 px-1.5 py-0.5 font-mono text-[11px] text-white" style={{ top: b.top < 28 ? "100%" : undefined, marginTop: b.top < 28 ? "2px" : undefined }}>
              {hover.label} · {Math.round(b.width)}×{Math.round(b.height)}
            </span>
          )}
        </div>
      ))}
      {target.map((b, i) => (
        <div key={"t" + i} class="absolute rounded-[3px] border-2 border-onion-500 bg-onion-500/20 shadow-[0_0_0_4px_rgba(168,85,247,0.2)]" style={{ left: px(b.left), top: px(b.top), width: px(b.width), height: px(b.height) }} />
      ))}
    </div>
  );
}
