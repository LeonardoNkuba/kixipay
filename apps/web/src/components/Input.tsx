import { InputHTMLAttributes } from "react";
import clsx from "clsx";

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
};

export const Input = ({ label, className, ...props }: InputProps) => {
  return (
    <label className="block">
      {label ? <span className="mb-2 block text-sm font-medium text-[#5d4a14]">{label}</span> : null}
      <input
        className={clsx(
          "h-11 w-full rounded-xl border border-[#dccf9b] bg-white px-3 text-sm text-[#221900] outline-none transition focus:border-[#b58e26] focus:ring-2 focus:ring-[#ffce00]/40",
          className,
        )}
        {...props}
      />
    </label>
  );
};
