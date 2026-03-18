import { useEffect, useRef, useState } from "react";
import { HexColorPicker } from "react-colorful";

type ColorWheelProps = {
  color: string;
  onChange: (color: string) => void;
  label: string;
};

export function ColorWheel({ color, onChange, label }: ColorWheelProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleClick = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  return (
    <div className="color-wheel-root" ref={ref}>
      <span className="color-wheel-label">{label}</span>
      <button
        type="button"
        className="color-wheel-swatch"
        style={{ background: color }}
        onClick={() => setOpen((prev) => !prev)}
        aria-label={`Pick ${label} color, current: ${color}`}
      />
      <span className="color-wheel-hex">{color}</span>
      {open && (
        <div className="color-wheel-popover">
          <HexColorPicker color={color} onChange={onChange} />
          <input
            className="color-wheel-hex-input"
            type="text"
            value={color}
            maxLength={7}
            onChange={(e) => {
              const val = e.target.value;
              if (/^#[0-9a-fA-F]{0,6}$/.test(val)) onChange(val);
            }}
          />
        </div>
      )}
    </div>
  );
}
