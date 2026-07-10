import { ReactNode } from "react";
import clsx from "clsx";

type CardProps = {
  title?: string;
  subtitle?: string;
  children: ReactNode;
  className?: string;
};

export const Card = ({ title, subtitle, children, className }: CardProps) => {
  return (
    <section className={clsx("rounded-2xl border border-[#eadca7] bg-white p-5 shadow-sm", className)}>
      {title ? <h3 className="text-base font-semibold text-[#241a02]">{title}</h3> : null}
      {subtitle ? <p className="mt-1 text-sm text-[#6f5c20]">{subtitle}</p> : null}
      <div className={title || subtitle ? "mt-4" : ""}>{children}</div>
    </section>
  );
};
