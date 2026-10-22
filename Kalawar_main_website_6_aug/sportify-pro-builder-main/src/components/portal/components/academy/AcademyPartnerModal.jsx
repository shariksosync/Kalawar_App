import React, { useState } from "react";
import { useApp } from "../../context/AppContext";
import Modal from "../common/Modal";
import { Trophy } from "lucide-react";

export default function AcademyPartnerModal() {
  const { activeModal, closeModal, registerAcademy } = useApp();
  const [formData, setFormData] = useState({
    name: "",
    director: "",
    sport: "Martial Arts & Taekwondo",
    city: "Pune",
    address: "",
    phone: "",
    email: "",
    monthlyFee: "2500",
    description: "",
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    registerAcademy(formData);
    setFormData({
      name: "",
      director: "",
      sport: "Martial Arts & Taekwondo",
      city: "Pune",
      address: "",
      phone: "",
      email: "",
      monthlyFee: "2500",
      description: "",
    });
  };

  return (
    <Modal
      isOpen={activeModal === "academyPartner" || activeModal === "academy_partner_register"}
      onClose={closeModal}
      title="Register Sports Academy as Partner"
      icon={Trophy}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <p className="text-xs text-slate-400 leading-relaxed">
          Affiliate your academy under Kalawar National Federation. After registration, your private{" "}
          <strong className="text-emerald-400">Sports Academy Admin Dashboard</strong> will be active to schedule training batches, track enrolled athletes, and manage tuition dues.
        </p>

        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5">Sports Academy Name *</label>
          <input
            type="text"
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g. Apex High Performance Badminton Center"
            className="w-full bg-dark-950 border border-white/10 rounded-lg px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-gold-500"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5">Head Coach / Director Name *</label>
          <input
            type="text"
            required
            value={formData.director}
            onChange={(e) => setFormData({ ...formData, director: e.target.value })}
            placeholder="e.g. Master Rajesh Sharma (8th Dan)"
            className="w-full bg-dark-950 border border-white/10 rounded-lg px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-gold-500"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Sport Discipline *</label>
            <select
              value={formData.sport}
              onChange={(e) => setFormData({ ...formData, sport: e.target.value })}
              className="w-full bg-dark-950 border border-white/10 rounded-lg px-3.5 py-2 text-xs text-white focus:outline-none focus:border-gold-500"
            >
              <option value="Martial Arts & Taekwondo">Martial Arts & Taekwondo</option>
              <option value="Badminton">Badminton</option>
              <option value="Cricket">Cricket</option>
              <option value="Football">Football</option>
              <option value="Wrestling & Combat">Wrestling & Combat</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">City *</label>
            <select
              value={formData.city}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              className="w-full bg-dark-950 border border-white/10 rounded-lg px-3.5 py-2 text-xs text-white focus:outline-none focus:border-gold-500"
            >
              <option value="Pune">Pune</option>
              <option value="Mumbai">Mumbai</option>
              <option value="Bangalore">Bangalore</option>
              <option value="Delhi">Delhi</option>
              <option value="Goa">Goa</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5">Facility / Arena Address *</label>
          <input
            type="text"
            required
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            placeholder="e.g. Shivajinagar Sports Complex Arena"
            className="w-full bg-dark-950 border border-white/10 rounded-lg px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-gold-500"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Contact Phone *</label>
            <input
              type="tel"
              required
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="+91 98000 00000"
              className="w-full bg-dark-950 border border-white/10 rounded-lg px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-gold-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Monthly Tuition Fee (₹) *</label>
            <input
              type="number"
              required
              value={formData.monthlyFee}
              onChange={(e) => setFormData({ ...formData, monthlyFee: e.target.value })}
              className="w-full bg-dark-950 border border-white/10 rounded-lg px-3.5 py-2 text-xs text-white focus:outline-none focus:border-gold-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5">Description & Coaching Background</label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Highlight coach credentials, past championship medals, and squad age groups..."
            rows={3}
            className="w-full bg-dark-950 border border-white/10 rounded-lg p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-gold-500"
          ></textarea>
        </div>

        <div className="pt-3 border-t border-white/10 flex justify-end gap-3">
          <button
            type="button"
            onClick={closeModal}
            className="bg-dark-800 text-slate-300 hover:text-white px-4 py-2 rounded-lg text-xs font-semibold border border-white/10"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="bg-gold-gradient text-black font-heading font-bold text-xs px-5 py-2 rounded-lg shadow-lg shadow-gold-500/20 hover:shadow-gold-500/40"
          >
            Register Academy & Open Admin
          </button>
        </div>
      </form>
    </Modal>
  );
}
