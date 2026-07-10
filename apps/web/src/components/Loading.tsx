type LoadingProps = {
  message?: string;
};

export const Loading = ({ message = "Carregando..." }: LoadingProps) => {
  return (
    <div className="flex min-h-[200px] items-center justify-center gap-3 rounded-2xl border border-[#f1e4b0] bg-white p-6 text-[#6b5516]">
      <span className="h-5 w-5 animate-spin rounded-full border-2 border-[#c8102e] border-t-transparent" />
      <span className="text-sm font-medium">{message}</span>
    </div>
  );
};
