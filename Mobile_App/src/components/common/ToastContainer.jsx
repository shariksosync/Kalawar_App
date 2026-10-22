import React from "react";
import { useApp } from "../../context/AppContext";
import { CheckCircle2, AlertTriangle, XCircle, Info } from "lucide-react";

export default function ToastContainer() {
  const { toasts } = useApp();

  if (!toasts.length) return null;

  const iconMap = {
    success: <CheckCircle2 size={18} className="text-emerald-400 shrink-0" />,
    warning: <AlertTriangle size={18} className="text-amber-400 shrink-0" />,
    danger: <XCircle size={18} className="text-rose-400 shrink-0" />,
    info: <Info size={18} className="text-sky-400 shrink-0" />,
  };

  const borderMap = {
    success: "border-l-4 border-l-emerald-400",
    warning: "border-l-4 border-l-amber-400",
    danger: "border-l-4 border-l-rose-400",
    info: "border-l-4 border-l-sky-400",
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2.5 max-w-sm pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`pointer-events-auto bg-dark-850/95 backdrop-blur-xl border border-white/10 ${
            borderMap[t.type] || borderMap.info
          } rounded-lg p-3.5 shadow-2xl flex items-center gap-3 animate-[slideIn_0.25s_ease-out]`}
        >
          {iconMap[t.type] || iconMap.info}
          <span className="text-xs font-medium text-slate-100 leading-snug">{t.message}</span>
        </div>
      ))}
    </div>
  );
}
