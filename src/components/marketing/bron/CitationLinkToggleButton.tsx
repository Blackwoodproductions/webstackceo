import { memo, useState } from "react";
import { Lock, Unlock } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { BronLink } from "@/hooks/use-bron-api";

function getLinkId(link: BronLink): string | number | undefined {
  return link.linkid ?? link.id ?? link.link_id;
}

export const CitationLinkToggleButton = memo(
  ({
    link,
    onToggle,
  }: {
    link: BronLink;
    onToggle?: (linkId: string | number, currentDisabled: string) => Promise<boolean>;
  }) => {
    const [pending, setPending] = useState(false);

    const linkId = getLinkId(link);
    const currentDisabled = link.disabled ?? "no";
    const isEnabled = currentDisabled !== "yes";

    const canToggle = Boolean(onToggle) && linkId !== undefined && linkId !== null;

    return (
      <Button
        type="button"
        size="sm"
        variant={isEnabled ? "default" : "destructive"}
        disabled={!canToggle || pending}
        onClick={async (e) => {
          e.stopPropagation();
          if (!onToggle || linkId === undefined || linkId === null) return;
          setPending(true);
          try {
            await onToggle(linkId, currentDisabled);
          } finally {
            setPending(false);
          }
        }}
        className="h-8 px-3 text-[11px] font-bold uppercase tracking-wide"
        title={
          !canToggle
            ? "This link cannot be toggled (missing link id from API)"
            : isEnabled
              ? "Click to disable"
              : "Click to enable"
        }
      >
        {isEnabled ? (
          <Lock className="w-3.5 h-3.5" />
        ) : (
          <Unlock className="w-3.5 h-3.5" />
        )}
        {pending ? "..." : isEnabled ? "ENABLED" : "DISABLED"}
      </Button>
    );
  },
);

CitationLinkToggleButton.displayName = "CitationLinkToggleButton";
