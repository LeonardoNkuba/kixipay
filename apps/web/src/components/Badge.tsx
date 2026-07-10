import clsx from "clsx";

type BadgeProps = {
  children: string;
  tone?: "success" | "warning" | "info" | "danger" | "neutral";
};

export const Badge = ({ children, tone = "neutral" }: BadgeProps) => {
  return (
    <span
      className={clsx(
        "inline-flex rounded-full px-2 py-1 text-xs font-semibold",
        tone === "success" && "bg-[#e7f9eb] text-[#176637]",
        tone === "warning" && "bg-[#fff7dc] text-[#835f05]",
        tone === "info" && "bg-[#e7f2ff] text-[#0c4a88]",
        tone === "danger" && "bg-[#ffe8ec] text-[#8d122a]",
        tone === "neutral" && "bg-[#f1f1f1] text-[#4f4f4f]",
      )}
    >
      {children}
    </span>
  );
};
