import { SelectHTMLAttributes } from "react";
import clsx from "clsx";

type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  label?: string;
};

export const Select = ({ label, className, children, ...props }: SelectProps) => {
  return (
    <label className="block">
      {label ? <span className="mb-2 block text-sm font-medium text-[#5d4a14]">{label}</span> : null}
      <select
        className={clsx(
          "h-11 w-full rounded-xl border border-[#dccf9b] bg-white px-3 text-sm text-[#221900] outline-none transition focus:border-[#b58e26] focus:ring-2 focus:ring-[#ffce00]/40",
          className,
        )}
        {...props}
      >
        {children}
      </select>
    </label>
  );
};
