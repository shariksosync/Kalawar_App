import React from "react";
import { useApp } from "../../context/AppContext";
import Modal from "../common/Modal";
import { Dumbbell, MapPin, Phone, Mail, CheckCircle2 } from "lucide-react";

export default function GymDetailsModal() {
  const { activeModal, modalData, closeModal, showToast } = useApp();

  if (activeModal !== "gymDetails" || !modalData) return null;

  return (
    <Modal
      isOpen={activeModal === "gymDetails"}
      onClose={closeModal}
      title="Partner Club Details & Facilities"
      icon={Dumbbell}
    >
      <div className="space-y-5">
        <div className="relative h-56 rounded-xl overflow-hidden border border-gold-500/30">
          <img src={modalData.image} alt={modalData.name} className="w-full h-full object-cover" />
          <span className="absolute top-3 left-3 bg-gold-500 text-black text-xs font-bold uppercase px-3 py-1 rounded shadow">
            {modalData.category}
          </span>
        </div>

        <div>
          <div className="flex items-center justify-between gap-3 mb-1">
            <h3 className="font-heading font-bold text-xl text-white">{modalData.name}</h3>
            <span className="text-sm font-bold text-gold-400">★ {modalData.rating}</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-3">
            <MapPin size={13} className="text-gold-500" />
            <span>{modalData.address}, {modalData.city}</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">{modalData.description}</p>
        </div>

        <div>
          <h4 className="text-xs uppercase font-bold text-slate-400 mb-2">Equipped Amenities</h4>
          <div className="flex flex-wrap gap-2">
            {modalData.amenities.map((a) => (
              <span
                key={a}
                className="text-xs bg-dark-800 text-slate-200 border border-white/10 px-2.5 py-1 rounded-md flex items-center gap-1"
              >
                <CheckCircle2 size={12} className="text-gold-400" />
                <span>{a}</span>
              </span>
            ))}
          </div>
        </div>

        <div className="bg-dark-800 border border-white/10 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xs space-y-1 text-slate-300 w-full sm:w-auto">
            <div className="font-semibold text-white">Owner: {modalData.ownerName}</div>
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
              showToast(`Trial session reserved at ${modalData.name}!`, "success");
              closeModal();
            }}
            className="w-full sm:w-auto bg-gold-gradient text-black font-heading font-bold text-xs px-5 py-2.5 rounded-lg shadow-md hover:shadow-gold-500/30 transition-all shrink-0"
          >
            Book Free Trial Session
          </button>
        </div>
      </div>
    </Modal>
  );
}
