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
 * Renders HTML content with proper styling and formatting.
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

  // Decode HTML entities
  const decodeHtml = (text: string): string => {
    if (!text) return '';
    return text
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&mdash;/g, '—')
      .replace(/&ndash;/g, '–')
      .replace(/&nbsp;/g, ' ');
  };

  React.useEffect(() => {
    if (!ref.current) return;
    if (focused) return;
    const current = ref.current.innerHTML;
    const decoded = decodeHtml(html || "");
    if (current !== decoded) ref.current.innerHTML = decoded;
  }, [html, focused]);

  const handleInput = React.useCallback(() => {
    onChange(ref.current?.innerHTML ?? "");
  }, [onChange]);

  const isEmpty = !html || html.trim().length === 0;

  return (
    <div className={cn("space-y-2", className)}>
      <div className="relative">
        {isEmpty && !focused && (
          <div className="pointer-events-none absolute inset-0 p-6 text-sm text-muted-foreground">
            {placeholder}
          </div>
        )}
        <div
          ref={ref}
          className={cn(
            "min-h-[50vh] max-h-[60vh] overflow-y-auto rounded-lg border border-border bg-card p-6 outline-none",
            "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
            // Prose styling for rendered HTML content
            "[&_h1]:text-2xl [&_h1]:font-bold [&_h1]:mb-4 [&_h1]:mt-6 [&_h1]:text-foreground",
            "[&_h2]:text-xl [&_h2]:font-semibold [&_h2]:mb-3 [&_h2]:mt-5 [&_h2]:text-foreground",
            "[&_h3]:text-lg [&_h3]:font-semibold [&_h3]:mb-2 [&_h3]:mt-4 [&_h3]:text-foreground",
            "[&_h4]:text-base [&_h4]:font-medium [&_h4]:mb-2 [&_h4]:mt-3 [&_h4]:text-foreground",
            "[&_p]:mb-4 [&_p]:leading-relaxed [&_p]:text-foreground",
            "[&_ul]:list-disc [&_ul]:pl-6 [&_ul]:mb-4 [&_ul]:space-y-1",
            "[&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:mb-4 [&_ol]:space-y-1",
            "[&_li]:text-foreground",
            "[&_a]:text-primary [&_a]:underline [&_a]:hover:text-primary/80",
            "[&_strong]:font-bold [&_b]:font-bold",
            "[&_em]:italic [&_i]:italic",
            "[&_blockquote]:border-l-4 [&_blockquote]:border-primary/30 [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-muted-foreground [&_blockquote]:my-4",
            "[&_code]:bg-muted [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-sm [&_code]:font-mono",
            "[&_pre]:bg-muted [&_pre]:p-4 [&_pre]:rounded-lg [&_pre]:overflow-x-auto [&_pre]:my-4",
            "[&_hr]:border-border [&_hr]:my-6",
            "[&_table]:w-full [&_table]:border-collapse [&_table]:my-4",
            "[&_th]:border [&_th]:border-border [&_th]:bg-muted/50 [&_th]:px-3 [&_th]:py-2 [&_th]:text-left [&_th]:font-semibold",
            "[&_td]:border [&_td]:border-border [&_td]:px-3 [&_td]:py-2",
            "[&_img]:max-w-full [&_img]:h-auto [&_img]:rounded-lg [&_img]:my-4",
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
