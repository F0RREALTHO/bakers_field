"use client";

import {
  forwardRef,
  useRef,
  useEffect,
  useState,
  useCallback,
  createContext,
  useContext,
  type ReactNode,
  type HTMLAttributes,
  type RefObject
} from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { cva, type VariantProps } from "class-variance-authority";
import type { LucideIcon } from "lucide-react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(
  ...inputs: (string | undefined | null | false | Record<string, boolean>)[]
) {
  return twMerge(clsx(inputs));
}

const springs = {
  fast: { type: "spring" as const, duration: 0.08, bounce: 0 },
  moderate: { type: "spring" as const, duration: 0.16, bounce: 0.15 }
};

const shape = {
  bg: "rounded-[14px]",
  item: "rounded-[14px]",
  input: "rounded-[14px]",
  focusRing: "rounded-[14px]",
  container: "rounded-[16px]"
};

// ─── useProximityHover (inlined) ─────────────────────────────────────────────

interface ItemRect {
  top: number;
  height: number;
  left: number;
  width: number;
}

function useProximityHover<T extends HTMLElement>(
  containerRef: RefObject<T | null>
) {
  const itemsRef = useRef(new Map<number, HTMLElement>());
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [itemRects, setItemRects] = useState<ItemRect[]>([]);
  const itemRectsRef = useRef<ItemRect[]>([]);
  const sessionRef = useRef(0);
  const rafIdRef = useRef<number | null>(null);

  const registerItem = useCallback((index: number, element: HTMLElement | null) => {
    if (element) itemsRef.current.set(index, element);
    else itemsRef.current.delete(index);
  }, []);

  const measureItems = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;
    const containerRect = container.getBoundingClientRect();
    const rects: ItemRect[] = [];
    itemsRef.current.forEach((element, index) => {
      const rect = element.getBoundingClientRect();
      rects[index] = {
        top: rect.top - containerRect.top + container.scrollTop - container.clientTop,
        height: rect.height,
        left: rect.left - containerRect.left + container.scrollLeft - container.clientLeft,
        width: rect.width
      };
    });
    itemRectsRef.current = rects;
    setItemRects(rects);
  }, [containerRef]);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      const mouseY = e.clientY;
      if (rafIdRef.current !== null) cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = requestAnimationFrame(() => {
        rafIdRef.current = null;
        const container = containerRef.current;
        if (!container) return;
        const containerRect = container.getBoundingClientRect();
        let closestIndex: number | null = null;
        let closestDistance = Infinity;
        let containingIndex: number | null = null;
        const rects = itemRectsRef.current;
        for (let index = 0; index < rects.length; index++) {
          const r = rects[index];
          if (!r) continue;
          const itemStart =
            containerRect.top + container.clientTop + r.top - container.scrollTop;
          const itemEnd = itemStart + r.height;
          if (mouseY >= itemStart && mouseY <= itemEnd) containingIndex = index;
          const distance = Math.abs(mouseY - (itemStart + r.height / 2));
          if (distance < closestDistance) {
            closestDistance = distance;
            closestIndex = index;
          }
        }
        setActiveIndex(containingIndex ?? closestIndex);
      });
    },
    [containerRef]
  );

  const handleMouseEnter = useCallback(() => {
    sessionRef.current += 1;
  }, []);
  const handleMouseLeave = useCallback(() => {
    if (rafIdRef.current !== null) {
      cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
    }
    setActiveIndex(null);
  }, []);

  useEffect(() => {
    return () => {
      if (rafIdRef.current !== null) cancelAnimationFrame(rafIdRef.current);
    };
  }, []);

  return {
    activeIndex,
    setActiveIndex,
    itemRects,
    sessionRef,
    handlers: {
      onMouseMove: handleMouseMove,
      onMouseEnter: handleMouseEnter,
      onMouseLeave: handleMouseLeave
    },
    registerItem,
    measureItems
  };
}

// ─── Select Context ──────────────────────────────────────────────────────────

interface SelectContextValue {
  value: string;
  onChange: (value: string) => void;
  open: boolean;
  setOpen: (open: boolean) => void;
  disabled: boolean;
  triggerRef: React.RefObject<HTMLButtonElement | null>;
  labelMap: React.MutableRefObject<Map<string, string>>;
}

const SelectContext = createContext<SelectContextValue | null>(null);
function useSelectContext() {
  const ctx = useContext(SelectContext);
  if (!ctx) throw new Error("Select compound components must be inside <Select>");
  return ctx;
}

interface SelectContentContextValue {
  registerItem: (index: number, element: HTMLElement | null) => void;
  activeIndex: number | null;
  checkedIndex?: number;
}

const SelectContentContext = createContext<SelectContentContextValue | null>(null);

// ─── Select (root) ───────────────────────────────────────────────────────────

interface SelectProps {
  children: ReactNode;
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  disabled?: boolean;
  name?: string;
  required?: boolean;
}

function Select({
  children,
  value,
  defaultValue,
  onValueChange,
  disabled = false,
  name,
  required
}: SelectProps) {
  const [internalValue, setInternalValue] = useState(defaultValue ?? "");
  const [open, setOpen] = useState(false);
  const currentValue = value !== undefined ? value : internalValue;
  const triggerRef = useRef<HTMLButtonElement>(null);
  const labelMap = useRef(new Map<string, string>());
  const [, setReady] = useState(false);
  useEffect(() => setReady(true), []);

  const onChange = useCallback(
    (v: string) => {
      if (value === undefined) setInternalValue(v);
      onValueChange?.(v);
      setOpen(false);
      requestAnimationFrame(() => triggerRef.current?.focus());
    },
    [value, onValueChange]
  );

  return (
    <SelectContext.Provider
      value={{ value: currentValue, onChange, open, setOpen, disabled, triggerRef, labelMap }}
    >
      {children}
      {name && (
        <input type="hidden" name={name} value={currentValue} required={required} />
      )}
    </SelectContext.Provider>
  );
}

Select.displayName = "Select";

// ─── SelectTrigger ───────────────────────────────────────────────────────────

const triggerVariants = cva(
  [
    "group inline-flex items-center justify-between gap-2 outline-none cursor-pointer",
    "text-[14px] h-11 px-5 min-w-[200px] font-medium",
    "transition-all duration-200",
    "disabled:opacity-50 disabled:pointer-events-none",
    "focus-visible:ring-2 focus-visible:ring-[#c8842a]/30"
  ],
  {
    variants: {
      variant: {
        bordered:
          "border border-[#e8ddd0] bg-[#fdf8f0] text-[#3d2c1e] hover:bg-[#faf0e4] hover:border-[#d4c3ac] shadow-[0_2px_8px_rgba(61,44,30,0.06)]",
        borderless:
          "border border-transparent bg-[#f5ebe0] text-[#3d2c1e] hover:bg-[#efe3d5] shadow-none"
      }
    },
    defaultVariants: { variant: "bordered" }
  }
);

interface SelectTriggerProps
  extends Omit<HTMLAttributes<HTMLButtonElement>, "children">,
    VariantProps<typeof triggerVariants> {
  icon?: LucideIcon;
  placeholder?: string;
  error?: string;
}

const SelectTrigger = forwardRef<HTMLButtonElement, SelectTriggerProps>(
  ({ className, variant, icon: Icon, placeholder = "Select…", error, ...props }, ref) => {
    const { value, open, setOpen, disabled, triggerRef, labelMap } = useSelectContext();
    const label = value ? labelMap.current.get(value) ?? value : undefined;

    return (
      <div className="flex flex-col gap-1.5">
        <button
          ref={(node) => {
            (triggerRef as React.MutableRefObject<HTMLButtonElement | null>).current = node;
            if (typeof ref === "function") ref(node);
            else if (ref)
              (ref as React.MutableRefObject<HTMLButtonElement | null>).current = node;
          }}
          type="button"
          role="combobox"
          aria-expanded={open}
          aria-haspopup="listbox"
          disabled={disabled}
          onClick={() => setOpen(!open)}
          onKeyDown={(e) => {
            if (!open && ["ArrowDown", "ArrowUp", "Enter", " "].includes(e.key)) {
              e.preventDefault();
              setOpen(true);
            }
          }}
          aria-invalid={!!error || undefined}
          className={cn(
            triggerVariants({ variant }),
            shape.input,
            open && "border-[#c8842a] ring-3 ring-[#c8842a]/15 bg-[#faf0e4]",
            error && "border-red-400/60",
            className
          )}
          {...props}
        >
          <span className="flex items-center gap-2.5 min-w-0 flex-1">
            {Icon && (
              <Icon
                size={16}
                strokeWidth={1.5}
                className="shrink-0 text-[#a08060] transition-colors"
              />
            )}
            <span className="min-w-0 flex-1 text-left truncate">
              {label ?? <span className="text-[#a08060] font-normal">{placeholder}</span>}
            </span>
          </span>
          <motion.svg
            width={14}
            height={14}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            className="shrink-0 text-[#a08060]"
            animate={{ rotate: open ? 180 : 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
          >
            <path d="M6 9l6 6 6-6" />
          </motion.svg>
        </button>
        {error && <span className="text-[12px] text-red-500 font-medium pl-1">{error}</span>}
      </div>
    );
  }
);

SelectTrigger.displayName = "SelectTrigger";

// ─── SelectContent ───────────────────────────────────────────────────────────

interface SelectContentProps {
  className?: string;
  children: ReactNode;
}

const SelectContent = forwardRef<HTMLDivElement, SelectContentProps>(
  ({ className, children }, ref) => {
    const { open, setOpen, value, triggerRef } = useSelectContext();
    const containerRef = useRef<HTMLDivElement>(null);
    const [triggerRect, setTriggerRect] = useState<DOMRect | null>(null);

    const {
      activeIndex,
      setActiveIndex,
      itemRects,
      sessionRef,
      handlers,
      registerItem,
      measureItems
    } = useProximityHover(containerRef);
    const [focusedIndex, setFocusedIndex] = useState<number | null>(null);
    const [checkedIndex, setCheckedIndex] = useState<number | undefined>(undefined);

    useEffect(() => {
      if (!open) return;
      const updateRect = () => {
        const rect = triggerRef.current?.getBoundingClientRect();
        if (!rect) return;
        const outOfView = rect.bottom < 0 || rect.top > window.innerHeight;
        if (outOfView) {
          setOpen(false);
          return;
        }
        setTriggerRect(rect);
      };
      updateRect();
      window.addEventListener("resize", updateRect);
      window.addEventListener("scroll", updateRect, true);
      return () => {
        window.removeEventListener("resize", updateRect);
        window.removeEventListener("scroll", updateRect, true);
      };
    }, [open, setOpen, triggerRef]);

    useEffect(() => {
      if (!open || !triggerRect) return;
      let outer: number;
      let inner: number;
      outer = requestAnimationFrame(() => {
        inner = requestAnimationFrame(() => {
          measureItems();
          const container = containerRef.current;
          if (container) {
            const items = Array.from(
              container.querySelectorAll("[data-proximity-index]")
            ) as HTMLElement[];
            const idx = items.findIndex((el) => el.getAttribute("data-value") === value);
            setCheckedIndex(idx !== -1 ? idx : undefined);
            containerRef.current?.focus({ preventScroll: true });
          }
        });
      });
      return () => {
        cancelAnimationFrame(outer);
        cancelAnimationFrame(inner);
      };
    }, [open, triggerRect, measureItems, value]);

    useEffect(() => {
      if (!open) return;
      const onKey = (e: KeyboardEvent) => {
        if (e.key === "Escape") {
          setOpen(false);
          triggerRef.current?.focus();
        }
      };
      document.addEventListener("keydown", onKey);
      return () => document.removeEventListener("keydown", onKey);
    }, [open, setOpen, triggerRef]);

    useEffect(() => {
      if (!open) return;
      const onPointer = (e: MouseEvent) => {
        if (
          !containerRef.current?.contains(e.target as Node) &&
          !triggerRef.current?.contains(e.target as Node)
        )
          setOpen(false);
      };
      document.addEventListener("mousedown", onPointer);
      return () => document.removeEventListener("mousedown", onPointer);
    }, [open, setOpen, triggerRef]);

    const handleKeyDown = useCallback(
      (e: React.KeyboardEvent) => {
        const items = Array.from(
          containerRef.current?.querySelectorAll(
            '[role="option"]:not([data-disabled])'
          ) ?? []
        ) as HTMLElement[];
        const currentIdx = items.indexOf(e.target as HTMLElement);
        if (["ArrowDown", "ArrowUp", "ArrowRight", "ArrowLeft"].includes(e.key)) {
          e.preventDefault();
          if (currentIdx === -1) {
            const checked = checkedIndex != null ? items[checkedIndex] : null;
            (checked ?? items[0])?.focus();
          } else {
            const next = ["ArrowDown", "ArrowRight"].includes(e.key)
              ? (currentIdx + 1) % items.length
              : (currentIdx - 1 + items.length) % items.length;
            items[next]?.focus();
          }
        } else if (e.key === "Home") {
          e.preventDefault();
          items[0]?.focus();
        } else if (e.key === "End") {
          e.preventDefault();
          items[items.length - 1]?.focus();
        }
      },
      [checkedIndex]
    );

    if (!open) return <div hidden aria-hidden="true">{children}</div>;
    if (!triggerRect) return null;

    const activeRect = activeIndex !== null ? itemRects[activeIndex] : null;
    const checkedRect = checkedIndex != null ? itemRects[checkedIndex] : null;
    const focusRect = focusedIndex !== null ? itemRects[focusedIndex] : null;
    const isHoveringOther = activeIndex !== null && activeIndex !== checkedIndex;

    return createPortal(
      <SelectContentContext.Provider value={{ registerItem, activeIndex, checkedIndex }}>
        <div
          style={{
            position: "fixed",
            top: triggerRect.bottom + 8,
            left: triggerRect.left,
            minWidth: Math.max(triggerRect.width, 220),
            width: "max-content",
            maxWidth: `calc(100vw - ${triggerRect.left + 16}px)`,
            zIndex: 100
          }}
        >
          <motion.div
            ref={(node) => {
              (containerRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
              if (typeof ref === "function") ref(node);
              else if (ref)
                (ref as React.MutableRefObject<HTMLDivElement | null>).current = node;
            }}
            role="listbox"
            tabIndex={-1}
            onMouseEnter={() => {
              handlers.onMouseEnter();
              setFocusedIndex(null);
            }}
            onMouseMove={handlers.onMouseMove}
            onMouseLeave={handlers.onMouseLeave}
            onFocus={(e) => {
              const indexAttr = (e.target as HTMLElement)
                .closest("[data-proximity-index]")
                ?.getAttribute("data-proximity-index");
              if (indexAttr != null) {
                const idx = Number(indexAttr);
                setActiveIndex(idx);
                setFocusedIndex((e.target as HTMLElement).matches(":focus-visible") ? idx : null);
              }
            }}
            onBlur={(e) => {
              if (containerRef.current?.contains(e.relatedTarget as Node)) return;
              setFocusedIndex(null);
              setActiveIndex(null);
            }}
            onKeyDown={handleKeyDown}
            className={cn(
              `relative flex flex-col gap-0.5 max-h-[400px] overflow-y-auto ${shape.container} bg-[#fdf8f0] border border-[#e8ddd0] p-1.5 select-none outline-none`,
              className
            )}
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={springs.fast}
            style={{
              transformOrigin: "top left",
              boxShadow: "0 10px 40px rgba(61, 44, 30, 0.12), 0 2px 12px rgba(61, 44, 30, 0.06)"
            }}
          >
            <AnimatePresence>
              {checkedRect && (
                <motion.div
                  className={`absolute ${shape.bg} pointer-events-none`}
                  style={{ background: "linear-gradient(135deg, #f5ebe0, #faecd8)" }}
                  initial={false}
                  animate={{
                    top: checkedRect.top,
                    left: checkedRect.left,
                    width: checkedRect.width,
                    height: checkedRect.height,
                    opacity: isHoveringOther ? 0.4 : 1
                  }}
                  exit={{ opacity: 0, transition: { duration: 0.12 } }}
                  transition={{ ...springs.moderate, opacity: { duration: 0.08 } }}
                />
              )}
            </AnimatePresence>
            <AnimatePresence>
              {activeRect && (
                <motion.div
                  key={sessionRef.current}
                  className={`absolute ${shape.bg} bg-[#f5ebe0] pointer-events-none`}
                  initial={{
                    opacity: 0,
                    top: checkedRect?.top ?? activeRect.top,
                    left: checkedRect?.left ?? activeRect.left,
                    width: checkedRect?.width ?? activeRect.width,
                    height: checkedRect?.height ?? activeRect.height
                  }}
                  animate={{
                    opacity: 1,
                    top: activeRect.top,
                    left: activeRect.left,
                    width: activeRect.width,
                    height: activeRect.height
                  }}
                  exit={{ opacity: 0, transition: { duration: 0.06 } }}
                  transition={{ ...springs.fast, opacity: { duration: 0.08 } }}
                />
              )}
            </AnimatePresence>
            <AnimatePresence>
              {focusRect && (
                <motion.div
                  className={`absolute ${shape.focusRing} pointer-events-none z-20 border-2 border-[#c8842a]/25`}
                  initial={false}
                  animate={{
                    left: focusRect.left,
                    top: focusRect.top,
                    width: focusRect.width,
                    height: focusRect.height
                  }}
                  exit={{ opacity: 0, transition: { duration: 0.06 } }}
                  transition={{ ...springs.fast, opacity: { duration: 0.08 } }}
                />
              )}
            </AnimatePresence>
            {children}
          </motion.div>
        </div>
      </SelectContentContext.Provider>,
      document.body
    );
  }
);

SelectContent.displayName = "SelectContent";

// ─── SelectItem ──────────────────────────────────────────────────────────────

interface SelectItemProps extends HTMLAttributes<HTMLDivElement> {
  icon?: LucideIcon;
  index: number;
  value: string;
  disabled?: boolean;
}

const SelectItem = forwardRef<HTMLDivElement, SelectItemProps>(
  ({ className, children, icon: Icon, value, index, disabled = false, ...props }, ref) => {
    const selectCtx = useSelectContext();
    const contentCtx = useContext(SelectContentContext);
    const internalRef = useRef<HTMLDivElement>(null);
    const hasMounted = useRef(false);

    useEffect(() => {
      hasMounted.current = true;
    }, []);
    useEffect(() => {
      if (typeof children === "string") selectCtx.labelMap.current.set(value, children);
    }, [value, children, selectCtx.labelMap]);
    useEffect(() => {
      if (contentCtx) contentCtx.registerItem(index, internalRef.current);
      return () => {
        if (contentCtx) contentCtx.registerItem(index, null);
      };
    }, [index, contentCtx]);

    const isActive = contentCtx?.activeIndex === index;
    const isChecked = selectCtx.value === value;
    const skipAnimation = !hasMounted.current;

    return (
      <div
        ref={(node) => {
          (internalRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
          if (typeof ref === "function") ref(node);
          else if (ref) (ref as React.MutableRefObject<HTMLDivElement | null>).current = node;
        }}
        data-proximity-index={index}
        data-value={value}
        data-disabled={disabled || undefined}
        role="option"
        aria-selected={isChecked}
        aria-label={typeof children === "string" ? children : undefined}
        tabIndex={isChecked ? 0 : index === (contentCtx?.checkedIndex ?? 0) ? 0 : -1}
        onClick={() => {
          if (!disabled) selectCtx.onChange(value);
        }}
        onKeyDown={(e) => {
          if ((e.key === "Enter" || e.key === " ") && !disabled) {
            e.preventDefault();
            selectCtx.onChange(value);
          }
        }}
        className={cn(
          `relative z-10 flex items-center gap-3 ${shape.item} px-4 py-3 text-[14px] font-medium cursor-pointer outline-none select-none`,
          "transition-colors duration-150",
          isChecked ? "text-[#8b5e2f] font-semibold" : "text-[#5a4636]",
          isActive && !isChecked && "text-[#3d2c1e]",
          disabled && "opacity-40 cursor-not-allowed",
          className
        )}
        {...props}
      >
        {Icon && (
          <Icon
            size={16}
            strokeWidth={isChecked ? 2 : 1.5}
            className={cn(
              "shrink-0 transition-colors",
              isChecked ? "text-[#c8842a]" : "text-[#a08060]"
            )}
          />
        )}
        <span className="flex-1 min-w-0">{children}</span>
        <AnimatePresence>
          {isChecked && (
            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.5 }}
              transition={{ duration: 0.15 }}
            >
              <svg
                width={16}
                height={16}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2.5}
                strokeLinecap="round"
                strokeLinejoin="round"
                className="shrink-0 text-[#c8842a]"
              >
                <motion.path
                  d="M20 6L9 17L4 12"
                  initial={{ pathLength: skipAnimation ? 1 : 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 0.2 }}
                />
              </svg>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }
);

SelectItem.displayName = "SelectItem";

// ─── SelectGroup / SelectLabel / SelectSeparator ─────────────────────────────

function SelectGroup({ children, className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div role="group" className={cn("flex flex-col gap-0.5", className)} {...props}>
      {children}
    </div>
  );
}
SelectGroup.displayName = "SelectGroup";

const SelectLabel = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("px-4 py-1.5 text-[11px] font-bold text-[#a08060] uppercase tracking-wider", className)}
      {...props}
    />
  )
);
SelectLabel.displayName = "SelectLabel";

const SelectSeparator = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} role="separator" className={cn("my-1 mx-3 h-px bg-[#e8ddd0]", className)} {...props} />
  )
);
SelectSeparator.displayName = "SelectSeparator";

export {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectGroup,
  SelectLabel,
  SelectSeparator,
  triggerVariants
};
export type { SelectProps, SelectTriggerProps, SelectContentProps, SelectItemProps };
