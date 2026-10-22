import React, { useState } from "react";
import { useApp } from "../../context/AppContext";
import Modal from "../common/Modal";
import { Dumbbell } from "lucide-react";

export default function GymPartnerModal() {
  const { activeModal, closeModal, registerGym } = useApp();
  const [formData, setFormData] = useState({
    name: "",
    ownerName: "",
    city: "Mumbai",
    category: "CrossFit & Combat",
    address: "",
    phone: "",
    email: "",
    monthlyPrice: "3500",
    description: "",
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    registerGym(formData);
    setFormData({
      name: "",
      ownerName: "",
      city: "Mumbai",
      category: "CrossFit & Combat",
      address: "",
      phone: "",
      email: "",
      monthlyPrice: "3500",
      description: "",
    });
  };

  return (
    <Modal
      isOpen={activeModal === "gymPartner" || activeModal === "gym_partner_register"}
      onClose={closeModal}
      title="Register as a Gym Partner"
      icon={Dumbbell}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <p className="text-xs text-slate-400 leading-relaxed">
          Join the Kalawar national network. After registering, you will immediately receive your personal{" "}
          <strong className="text-gold-400">Gym Partner Admin Dashboard</strong> to manage members, subscriptions, staff shifts, and revenue.
        </p>

        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5">Gym / Fitness Club Name *</label>
          <input
            type="text"
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g. Ironclad Performance Arena"
            className="w-full bg-dark-950 border border-white/10 rounded-lg px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-gold-500"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5">Owner / Managing Director Name *</label>
          <input
            type="text"
            required
            value={formData.ownerName}
            onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
            placeholder="e.g. Vikram Malhotra"
            className="w-full bg-dark-950 border border-white/10 rounded-lg px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-gold-500"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">City *</label>
            <select
              value={formData.city}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              className="w-full bg-dark-950 border border-white/10 rounded-lg px-3.5 py-2 text-xs text-white focus:outline-none focus:border-gold-500"
            >
              <option value="Mumbai">Mumbai</option>
              <option value="Delhi">Delhi</option>
              <option value="Pune">Pune</option>
              <option value="Bangalore">Bangalore</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Discipline / Category *</label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full bg-dark-950 border border-white/10 rounded-lg px-3.5 py-2 text-xs text-white focus:outline-none focus:border-gold-500"
            >
              <option value="CrossFit & Combat">CrossFit & Combat</option>
              <option value="Powerlifting">Powerlifting</option>
              <option value="MMA & Combat">MMA & Combat</option>
              <option value="Yoga & Wellness">Yoga & Wellness</option>
              <option value="Strength & Conditioning">Strength & Conditioning</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5">Street Address *</label>
          <input
            type="text"
            required
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            placeholder="e.g. Bandra West, Linking Road"
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
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Monthly Membership Fee (₹) *</label>
            <input
              type="number"
              required
              value={formData.monthlyPrice}
              onChange={(e) => setFormData({ ...formData, monthlyPrice: e.target.value })}
              className="w-full bg-dark-950 border border-white/10 rounded-lg px-3.5 py-2 text-xs text-white focus:outline-none focus:border-gold-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5">Club Description & Facilities</label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Describe your equipment, trainers, and training environment..."
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
            Complete Registration & Open Admin
          </button>
        </div>
      </form>
    </Modal>
  );
}
