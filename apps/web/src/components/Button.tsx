import { ButtonHTMLAttributes } from "react";
import clsx from "clsx";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost";
};

export const Button = ({ variant = "primary", className, ...props }: ButtonProps) => {
  return (
    <button
      className={clsx(
        "h-10 rounded-xl px-4 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-70",
        variant === "primary" && "bg-[#c8102e] text-[#fff8df] hover:bg-[#aa0d27]",
        variant === "secondary" && "bg-[#ffce00] text-[#111111] hover:brightness-95",
        variant === "ghost" && "bg-transparent text-[#5b4a17] hover:bg-[#f9efc4]",
        className,
      )}
      {...props}
    />
  );
};
