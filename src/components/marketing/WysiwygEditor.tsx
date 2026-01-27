import * as React from "react";

import { cn } from "@/lib/utils";

type WysiwygEditorProps = {
  html: string;
  onChange: (html: string) => void;
  placeholder?: string;
  className?: string;
  editorClassName?: string;
};

/**
 * Lightweight WYSIWYG editor using contentEditable.
 * Keeps the caret stable by not resetting innerHTML while focused.
 */
export default function WysiwygEditor({
  html,
  onChange,
  placeholder = "Start writing your article…",
  className,
  editorClassName,
}: WysiwygEditorProps) {
  const ref = React.useRef<HTMLDivElement | null>(null);
  const [focused, setFocused] = React.useState(false);

  React.useEffect(() => {
    if (!ref.current) return;
    if (focused) return;
    const current = ref.current.innerHTML;
    const next = html || "";
    if (current !== next) ref.current.innerHTML = next;
  }, [html, focused]);

  const handleInput = React.useCallback(() => {
    onChange(ref.current?.innerHTML ?? "");
  }, [onChange]);

  const isEmpty = !html || html.trim().length === 0;

  return (
    <div className={cn("space-y-2", className)}>
      <div className="relative">
        {isEmpty && (
          <div className="pointer-events-none absolute inset-0 p-6 text-sm text-muted-foreground">
            {placeholder}
          </div>
        )}
        <div
          ref={ref}
          className={cn(
            "min-h-[60vh] max-h-[65vh] overflow-y-auto rounded-lg border border-border bg-background p-6 outline-none",
            "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
            "prose prose-lg max-w-none",
            editorClassName,
          )}
          contentEditable
          suppressContentEditableWarning
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onInput={handleInput}
          role="textbox"
          aria-multiline="true"
        />
      </div>
    </div>
  );
}
