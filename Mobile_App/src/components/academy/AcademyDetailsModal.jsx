import React from "react";
import { useApp } from "../../context/AppContext";
import Modal from "../common/Modal";
import { Trophy, MapPin, Phone, Mail, Clock, CheckCircle2 } from "lucide-react";

export default function AcademyDetailsModal() {
  const { activeModal, modalData, closeModal, showToast } = useApp();

  if (activeModal !== "academyDetails" || !modalData) return null;

  return (
    <Modal
      isOpen={activeModal === "academyDetails"}
      onClose={closeModal}
      title="Sports Academy Profile & Batches"
      icon={Trophy}
    >
      <div className="space-y-5">
        <div className="relative h-56 rounded-xl overflow-hidden border border-emerald-500/30">
          <img src={modalData.image} alt={modalData.name} className="w-full h-full object-cover" />
          <span className="absolute top-3 left-3 bg-gold-gradient text-black text-xs font-bold uppercase px-3 py-1 rounded shadow">
            {modalData.sport}
          </span>
        </div>

        <div>
          <h3 className="font-heading font-bold text-xl text-white mb-1">{modalData.name}</h3>
          <div className="text-xs font-semibold text-gold-400 mb-1">
            Director / Grandmaster: {modalData.director}
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-3">
            <MapPin size={13} className="text-emerald-400" />
            <span>{modalData.address}, {modalData.city}</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">{modalData.description}</p>
        </div>

        <div>
          <h4 className="text-xs uppercase font-bold text-slate-400 mb-2">Available Squad Batches</h4>
          <div className="space-y-2">
            {modalData.batches.map((b) => (
              <div
                key={b.name}
                className="bg-dark-800 border border-white/5 rounded-xl p-3 flex items-center justify-between"
              >
                <div>
                  <div className="font-semibold text-xs text-white">{b.name}</div>
                  <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                    <Clock size={11} />
                    <span>{b.time} ({b.days})</span>
                  </div>
                </div>
                <span className="text-[10px] font-bold bg-dark-700 text-emerald-400 px-2.5 py-1 rounded border border-emerald-500/20">
                  {b.enrolled}/{b.capacity} Enrolled
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-dark-800 border border-white/10 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xs space-y-1 text-slate-300 w-full sm:w-auto">
            <div className="font-semibold text-white">Admissions Desk</div>
            <div className="flex items-center gap-1 text-slate-400">
              <Phone size={12} />
              <span>{modalData.phone}</span>
            </div>
            <div className="flex items-center gap-1 text-slate-400">
              <Mail size={12} />
              <span>{modalData.email}</span>
            </div>
          </div>

          <button
            onClick={() => {
              showToast(`Trial admission request sent to ${modalData.name}!`, "success");
              closeModal();
            }}
            className="w-full sm:w-auto bg-gold-gradient text-black font-heading font-bold text-xs px-5 py-2.5 rounded-lg shadow-md hover:shadow-gold-500/30 transition-all shrink-0"
          >
            Register for Free Trial
          </button>
        </div>
      </div>
    </Modal>
  );
}
