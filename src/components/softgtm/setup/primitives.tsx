// Adapted from shadcn/ui Button and RadioGroup (MIT, https://github.com/shadcn-ui/ui,
// Copyright (c) 2023 shadcn). Variants restyled to the softgtm skin tokens: no
// default shadcn radius, shadow or neutral palette. RadioGroup keeps its keyboard
// model (roving tabindex, arrow keys) on native elements instead of Radix.
import { forwardRef, useRef, type ButtonHTMLAttributes, type KeyboardEvent, type ReactNode } from "react";
import { cn } from "@/lib/cn";

type Variant = "primary" | "link" | "back";
type Size = "md" | "sm";

export interface SetupButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

const VARIANT: Record<Variant, string> = {
  // the one quiet primary on each screen
  primary: "sf-btn sf-btn--primary",
  // every other action is a text link
  link: "sf-btn sf-btn--link",
  back: "sf-btn sf-btn--back",
};

// TODO(setup-flow): disabled and pressed-and-held states are not drawn; the flow
// avoids disabled buttons (Continue only appears once it can work).
export const SetupButton = forwardRef<HTMLButtonElement, SetupButtonProps>(function SetupButton(
  { variant = "primary", size = "md", className, type = "button", ...props },
  ref,
) {
  return <button ref={ref} type={type} className={cn(VARIANT[variant], size === "sm" && "sf-btn--sm", className)} {...props} />;
});

export interface RadioOption<T extends string> {
  value: T;
  render: (checked: boolean) => ReactNode;
  label: string;
}

/** Radio cards: role="radiogroup", one tab stop, arrows move the choice. */
export function RadioCards<T extends string>({
  labelledBy,
  value,
  options,
  onChange,
}: {
  labelledBy: string;
  value: T;
  options: RadioOption<T>[];
  onChange: (value: T) => void;
}) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const move = (event: KeyboardEvent, index: number) => {
    const delta = event.key === "ArrowDown" || event.key === "ArrowRight" ? 1 : event.key === "ArrowUp" || event.key === "ArrowLeft" ? -1 : 0;
    if (!delta) return;
    event.preventDefault();
    const next = (index + delta + options.length) % options.length;
    onChange(options[next]!.value);
    refs.current[next]?.focus();
  };
  return (
    <div role="radiogroup" aria-labelledby={labelledBy} className="sf-list">
      {options.map((option, index) => {
        const checked = option.value === value;
        return (
          <button
            key={option.value}
            ref={(el) => {
              refs.current[index] = el;
            }}
            type="button"
            role="radio"
            aria-checked={checked}
            aria-label={option.label}
            tabIndex={checked ? 0 : -1}
            className={cn("sf-option", checked && "is-selected")}
            onClick={() => onChange(option.value)}
            onKeyDown={(event) => move(event, index)}
          >
            {option.render(checked)}
          </button>
        );
      })}
    </div>
  );
}
