import { ReactNode } from "react";
import { Button } from "@/components/Button";

type EmptyStateProps = {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: ReactNode;
};

export const EmptyState = ({
  title,
  description,
  actionLabel,
  onAction,
  icon,
}: EmptyStateProps) => {
  return (
    <div className="rounded-2xl border border-dashed border-[#decf94] bg-[#fffdf2] p-8 text-center">
      {icon ? <div className="mx-auto mb-3 w-fit text-[#9a7f26]">{icon}</div> : null}
      <h3 className="text-lg font-semibold text-[#2a2106]">{title}</h3>
      <p className="mt-2 text-sm text-[#7c6720]">{description}</p>
      {actionLabel && onAction ? (
        <Button className="mt-5" onClick={onAction}>
          {actionLabel}
        </Button>
      ) : null}
    </div>
  );
};
