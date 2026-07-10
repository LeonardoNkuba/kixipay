type AvatarProps = {
  name: string;
  initials: string;
  className?: string;
};

export const Avatar = ({ name, initials, className = "" }: AvatarProps) => {
  return (
    <div
      className={`inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#c8102e] text-sm font-bold text-[#fff9e8] ${className}`.trim()}
      title={name}
    >
      {initials}
    </div>
  );
};
