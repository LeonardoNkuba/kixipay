import { ReactNode } from "react";

type TableProps = {
  headers: string[];
  children: ReactNode;
};

export const Table = ({ headers, children }: TableProps) => {
  return (
    <div className="overflow-x-auto rounded-2xl border border-[#eadca7] bg-white">
      <table className="min-w-full text-left text-sm">
        <thead className="bg-[#fff7d9] text-[#6f5818]">
          <tr>
            {headers.map((header) => (
              <th key={header} className="px-4 py-3 font-semibold">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-[#f2e7c2] text-[#241d06]">{children}</tbody>
      </table>
    </div>
  );
};
