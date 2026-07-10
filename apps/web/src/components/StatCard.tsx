import { ReactNode } from "react";
import { Card } from "@/components/Card";

type StatCardProps = {
  title: string;
  value: string;
  caption?: string;
  icon?: ReactNode;
};

export const StatCard = ({ title, value, caption, icon }: StatCardProps) => {
  return (
    <Card className="border-[#f2e9be]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#8d7424]">{title}</p>
          <p className="mt-2 text-2xl font-bold text-[#201901]">{value}</p>
          {caption ? <p className="mt-2 text-xs text-[#725f20]">{caption}</p> : null}
        </div>
        {icon ? <div className="rounded-xl bg-[#fff4ce] p-2 text-[#6f101f]">{icon}</div> : null}
      </div>
    </Card>
  );
};
