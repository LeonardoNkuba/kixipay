import { ReactNode } from "react";
import { X } from "lucide-react";

type ModalProps = {
  title: string;
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
};

export const Modal = ({ title, isOpen, onClose, children }: ModalProps) => {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#220f12]/50 p-4">
      <div className="w-full max-w-xl rounded-2xl border border-[#ecdca6] bg-white shadow-xl">
        <header className="flex items-center justify-between border-b border-[#f2e7c2] px-5 py-4">
          <h2 className="text-lg font-semibold text-[#231902]">{title}</h2>
          <button onClick={onClose} type="button" className="rounded-lg p-1 text-[#8d7424] hover:bg-[#fdf5d7]">
            <X size={18} />
          </button>
        </header>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
};
