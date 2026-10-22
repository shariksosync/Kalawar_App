"use client";

import { useState, useRef, useEffect, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  Bot,
  Send,
  X,
  Sparkles,
  RefreshCw,
  ChevronDown,
  ArrowRight,
  Calendar,
  PhoneCall,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  CheckCircle2,
  Phone,
  Mail,
  ShieldCheck,
  Award,
  Trophy,
  GraduationCap,
  ShoppingBag,
  FileText,
  Layers,
  Loader2,
  Search,
  ExternalLink,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/lib/utils";
import { useSettings } from "@/lib/settings-context";

type ChatMessage = {
  id: string;
  sender: "user" | "assistant";
  text: string;
  timestamp: string;
  quickReplies?: string[];
  action?: {
    type: "navigate" | "open_callback" | "open_link" | string;
    url?: string;
    label?: string;
  };
};

const initialMessages: ChatMessage[] = [
  {
    id: "welcome-kalawar",
    sender: "assistant",
    text: `🥋 **Welcome to KALAWAR Sports & Martial Arts Federation of India!**

I am your **AI Federation Assistant**. How can I assist you with martial arts events, registrations, certifications, or gear today?

⚡ **Popular Inquiries & Quick Actions:**
• 🥋 **The 5 Flagship Disciplines** (Kaya Yuddha, Charana Yuddha, Santulana, Sparsha Yuddha, Sangama Kala)
• ⚔️ **Sangama Kala Sub-Events** (Malla Yuddha - Wrestling & Danda Yuddha - Stick Combat)
• 🏆 **Championships & Events** (Upcoming national & state tournaments)
• 🥋 **Player / Athlete Registration** (Register online for national ID & records)
• 🎗️ **11 Anukkama Color Belts** (Official 11-level grading from Yellow to Junior Black Belt)
• 🥋 **Black Belt & Dan Grading** (Official National & Kukkiwon Dan recognition)
• 🔍 **Certificate & Member Verification** (Verify belt, license, and dojo status)
• 🏛️ **Dojo & Club Affiliation** (Accredit your martial arts club/academy)
• 🛍️ **Equipment & Uniform Store** (Order certified uniforms, belts & gear)
• 📞 **Request Instant Callback** (Direct consultation with federation officials)`,
    timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    quickReplies: [
      "The 5 Flagship Disciplines",
      "Kaya Yuddha (Hand Striking)",
      "Charana Yuddha (Kicking)",
      "Santulana (Balance & Agility)",
      "Sparsha Yuddha (Semi-Contact)",
      "Sangama Kala & Sub-Events",
      "Malla Yuddha (Wrestling)",
      "Danda Yuddha (Stick Combat)",
      "How do I register as a player?",
      "Upcoming championships",
      "11 Anukkama Color Belts",
      "Black Belt & Dan Grading",
      "Request Callback",
    ],
  },
];

export function AIChatBot() {
  const router = useRouter();
  const { settings } = useSettings();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [unreadCount, setUnreadCount] = useState(1);
  const [showTooltip, setShowTooltip] = useState(false);

  // Audio Voice States
  const [isVoiceListening, setIsVoiceListening] = useState(false);
  const [isSpeechEnabled, setIsSpeechEnabled] = useState(false);

  // Callback Lead Form Drawer State
  const [showCallbackForm, setShowCallbackForm] = useState(false);
  const [cbName, setCbName] = useState("");
  const [cbPhone, setCbPhone] = useState("");
  const [cbEmail, setCbEmail] = useState("");
  const [cbTime, setCbTime] = useState("ASAP");
  const [cbNotes, setCbNotes] = useState("");
  const [cbSubmitting, setCbSubmitting] = useState(false);
  const [cbSuccess, setCbSuccess] = useState(false);
  const [cbPhoneError, setCbPhoneError] = useState("");

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      setUnreadCount(0);
      setShowTooltip(false);
      setTimeout(() => inputRef.current?.focus(), 250);
    }
  }, [isOpen, messages]);

  // Text-to-Speech Output
  const speakText = (text: string) => {
    if (!isSpeechEnabled || typeof window === "undefined" || !("speechSynthesis" in window)) return;
    try {
      window.speechSynthesis.cancel();
      const cleanText = text
        .replace(/[*#_•-]/g, " ")
        .replace(/https?:\/\/\S+/g, "")
        .trim();
      const utterance = new SpeechSynthesisUtterance(cleanText.slice(0, 280));
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.error("Speech synthesis error:", e);
    }
  };

  // Voice Recognition (Speech-to-Text) Toggle
  const toggleVoiceInput = () => {
    if (typeof window === "undefined") return;

    if (isVoiceListening && recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
      setIsVoiceListening(false);
      return;
    }

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("Voice input is not supported in this browser. Please type your query or use Google Chrome / Edge.");
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = "en-IN";

      recognition.onstart = () => {
        setIsVoiceListening(true);
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results?.[0]?.[0]?.transcript;
        if (transcript) {
          setInput(transcript);
          handleSend(transcript);
        }
      };

      recognition.onerror = (event: any) => {
        const errType = event?.error || "unknown";
        if (errType !== "no-speech" && errType !== "aborted") {
          console.warn("Voice recognition message:", errType);
        }
        setIsVoiceListening(false);
      };

      recognition.onend = () => {
        setIsVoiceListening(false);
      };

      recognition.start();
    } catch (e) {
      console.warn("Failed to start voice recognition:", e);
      setIsVoiceListening(false);
    }
  };

  const handleSend = async (customMessage?: string) => {
    const textToSend = customMessage || input;
    if (!textToSend.trim() || isTyping) return;

    const userMsg: ChatMessage = {
      id: `user_${Date.now()}`,
      sender: "user",
      text: textToSend.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!customMessage) setInput("");
    setIsTyping(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: textToSend.trim(),
          history: messages.slice(-6).map((m) => ({ role: m.sender, content: m.text })),
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const botMsg: ChatMessage = {
          id: `bot_${Date.now()}`,
          sender: "assistant",
          text: data.reply || "Thank you for reaching out! How else can I assist you with KALAWAR Sports?",
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          quickReplies: data.quickReplies,
          action: data.action,
        };
        setMessages((prev) => [...prev, botMsg]);
        speakText(botMsg.text);
      } else {
        throw new Error("Failed to receive response");
      }
    } catch (e) {
      const phoneStr = settings?.contactPhone || "+91 70833 14435 / +91 95614 27125";
      const emailStr = settings?.contactEmail || "kalawarmartialartsindia@gmail.com";
      const fallbackMsg = `I am having trouble connecting to the federation server right now. You can reach the National Secretariat directly at **${phoneStr}** or email **${emailStr}**.`;
      const fallbackBotMsg: ChatMessage = {
        id: `err_${Date.now()}`,
        sender: "assistant",
        text: fallbackMsg,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        action: { type: "open_callback", label: "Request Phone Callback" },
      };
      setMessages((prev) => [...prev, fallbackBotMsg]);
      speakText(fallbackMsg);
    } finally {
      setIsTyping(false);
    }
  };

  const handleQuickReply = (text: string) => {
    if (text === "Request Callback" || text === "Request Call Back") {
      setShowCallbackForm(true);
      return;
    }
    handleSend(text);
  };

  const handleActionClick = (action?: { type: string; url?: string; label?: string }) => {
    if (!action) return;
    if (action.type === "open_callback") {
      setShowCallbackForm(true);
    } else if (action.type === "navigate" && action.url) {
      router.push(action.url);
      setIsOpen(false);
    } else if (action.type === "open_link" && action.url) {
      window.open(action.url, "_blank");
    }
  };

  const validateCbPhone = (p: string): string | undefined => {
    const digits = p.replace(/\D/g, "");
    if (!digits) return "10-digit mobile number is required.";
    if (digits.length !== 10) return "Please enter a valid 10-digit mobile number.";
    if (!/^[6-9]/.test(digits)) return "Mobile number must start with 6, 7, 8, or 9.";
    if (/^(\d)\1+$/.test(digits)) return "Please enter a valid, non-repeating phone number.";
    const dummyPatterns = ["1234567890", "0123456789", "9876543210", "0987654321"];
    if (dummyPatterns.some((pat) => digits.includes(pat))) {
      return "Please enter a genuine mobile number.";
    }
    return undefined;
  };

  const handleCbPhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = e.target.value.replace(/\D/g, "").slice(0, 10);
    setCbPhone(digits);
    setCbPhoneError("");
  };

  const handleCallbackSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!cbName.trim() || !cbEmail.trim()) return;
    const err = validateCbPhone(cbPhone);
    if (err) {
      setCbPhoneError(err);
      return;
    }

    setCbSubmitting(true);
    const formattedPhone = cbPhone.startsWith("+91") ? cbPhone : `+91 ${cbPhone.trim()}`;
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: cbName.trim(),
          phone: formattedPhone,
          email: cbEmail.trim(),
          subject: `Chatbot Callback Request: ${cbName.trim()} (${cbTime})`,
          message: `Preferred Contact Time: ${cbTime}\nNotes/Query: ${cbNotes.trim() || "Requested general callback via KALAWAR AI Assistant"}`,
          category: "Chatbot Callback Request",
        }),
      });

      if (res.ok) {
        setCbSuccess(true);
        setCbPhoneError("");
        setTimeout(() => {
          setShowCallbackForm(false);
          setCbSuccess(false);
          setCbName("");
          setCbPhone("");
          setCbEmail("");
          setCbNotes("");
          setCbTime("ASAP");
        }, 3500);
      } else {
        const errData = await res.json().catch(() => ({}));
        setCbPhoneError(errData.error || "Failed to submit request.");
      }
    } catch (err) {
      console.error("Callback submission error:", err);
      setCbPhoneError("Something went wrong. Please try again.");
    } finally {
      setCbSubmitting(false);
    }
  };

  const handleResetChat = () => {
    setMessages(initialMessages);
    setShowCallbackForm(false);
  };

  const toggleBot = () => {
    const next = !isOpen;
    setIsOpen(next);
    if (next) {
      setUnreadCount(0);
      setShowTooltip(false);
    } else {
      if (typeof window !== "undefined") {
        window.speechSynthesis?.cancel();
      }
    }
  };

  // Render text with interactive clickable phone numbers, email addresses, and bold badges
  const renderFormattedText = (text: string) => {
    const lines = text.split("\n");
    return lines.map((line, idx) => {
      const parts = line.split(/(\*\*.*?\*\*)/g);

      return (
        <div
          key={idx}
          className={cn(
            line.startsWith("•") || line.startsWith("-") ? "pl-2 py-0.5" : "py-0.5",
            line.trim() === "" ? "h-2" : ""
          )}
        >
          {parts.map((part, pIdx) => {
            if (part.startsWith("**") && part.endsWith("**")) {
              const val = part.slice(2, -2);

              // Clickable Phone Number Badge
              if (
                val.includes("+91") ||
                val.includes("70833") ||
                val.includes("95614") ||
                /\b\d{10}\b/.test(val)
              ) {
                const cleanPhone = val.replace(/[^\d+]/g, "");
                return (
                  <a
                    key={pIdx}
                    href={`tel:${cleanPhone}`}
                    className="inline-flex items-center gap-1 font-bold text-primary hover:text-white bg-primary/15 hover:bg-primary/30 px-1.5 py-0.5 rounded transition-colors cursor-pointer border border-primary/20"
                  >
                    <Phone className="h-3 w-3" /> {val}
                  </a>
                );
              }

              // Clickable Email Badge
              if (val.includes("@") && (val.includes(".com") || val.includes(".org") || val.includes(".in"))) {
                return (
                  <a
                    key={pIdx}
                    href={`mailto:${val.trim()}`}
                    className="inline-flex items-center gap-1 font-bold text-primary hover:text-white bg-primary/15 hover:bg-primary/30 px-1.5 py-0.5 rounded transition-colors cursor-pointer border border-primary/20 break-all"
                  >
                    <Mail className="h-3 w-3 shrink-0" /> {val}
                  </a>
                );
              }

              return (
                <strong key={pIdx} className="font-bold text-white">
                  {val}
                </strong>
              );
            }
            return part;
          })}
        </div>
      );
    });
  };

  return (
    <>
      {/* Chat Window Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.96 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="fixed inset-0 sm:inset-auto sm:right-6 sm:bottom-[5.5rem] z-50 flex h-[100dvh] sm:h-[630px] sm:max-h-[85vh] sm:w-[430px] max-w-full flex-col overflow-hidden bg-[#0c1017] sm:rounded-3xl border border-primary/30 shadow-[0_20px_60px_rgba(0,0,0,0.85)] text-foreground"
          >
            {/* Executive Luxury Header */}
            <div className="flex items-center justify-between bg-gradient-to-r from-[#111726] via-[#1a2236] to-[#111726] px-4 py-3 sm:px-5 sm:py-3.5 border-b border-primary/25 shrink-0 pt-[max(0.75rem,env(safe-area-inset-top))] sm:pt-3.5">
              <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                <div className="relative grid h-9 w-9 sm:h-10 sm:w-10 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/40 shadow-inner">
                  <Bot className="h-5 w-5 text-primary" />
                  <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-400 ring-2 ring-[#111726] animate-pulse" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-xs sm:text-sm font-bold tracking-wide flex items-center gap-1.5 text-white truncate">
                    <span>KALAWAR AI Assistant</span>
                    <Sparkles className="h-3.5 w-3.5 text-primary shrink-0" />
                  </h3>
                  <p className="text-[10px] font-medium text-muted-foreground truncate">
                    Official Federation Guide • Online 24/7
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                {/* Callback Request Button */}
                <button
                  type="button"
                  onClick={() => setShowCallbackForm((prev) => !prev)}
                  title="Request Instant Callback"
                  className={cn(
                    "p-1.5 sm:p-2 rounded-full transition cursor-pointer",
                    showCallbackForm
                      ? "bg-primary text-black"
                      : "text-muted-foreground hover:text-white hover:bg-white/10"
                  )}
                >
                  <PhoneCall className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                </button>

                {/* Text-to-Speech Toggle Button */}
                <button
                  type="button"
                  onClick={() => {
                    setIsSpeechEnabled((prev) => !prev);
                    if (isSpeechEnabled && typeof window !== "undefined") {
                      window.speechSynthesis?.cancel();
                    }
                  }}
                  title={isSpeechEnabled ? "Disable Voice Audio" : "Enable Voice Audio"}
                  className={cn(
                    "p-1.5 sm:p-2 rounded-full transition cursor-pointer",
                    isSpeechEnabled
                      ? "bg-primary text-black"
                      : "text-muted-foreground hover:text-white hover:bg-white/10"
                  )}
                >
                  {isSpeechEnabled ? (
                    <Volume2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  ) : (
                    <VolumeX className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  )}
                </button>

                {/* Reset Chat Button */}
                <button
                  type="button"
                  onClick={handleResetChat}
                  title="Reset Conversation"
                  className="p-1.5 sm:p-2 text-muted-foreground hover:text-white hover:bg-white/10 rounded-full transition cursor-pointer"
                >
                  <RefreshCw className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                </button>

                {/* Close Button */}
                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    if (typeof window !== "undefined") {
                      window.speechSynthesis?.cancel();
                    }
                  }}
                  title="Close Assistant"
                  className="p-1.5 sm:p-2 text-muted-foreground hover:text-white hover:bg-white/10 rounded-full transition cursor-pointer"
                >
                  <X className="h-4 w-4 sm:h-5 sm:w-5" />
                </button>
              </div>
            </div>

            {/* Persistent Quick Action Bar */}
            <div className="flex items-center gap-1.5 overflow-x-auto bg-[#090d14] px-3 py-2 text-[11px] font-semibold text-muted-foreground no-scrollbar border-b border-primary/15 shrink-0 flex-nowrap">
              <button
                type="button"
                onClick={() => handleSend("How do I register as a player?")}
                className="flex items-center gap-1.5 rounded-lg bg-[#141b2a] px-2.5 py-1 text-slate-200 border border-primary/20 hover:border-primary hover:text-primary transition shrink-0 cursor-pointer whitespace-nowrap"
              >
                <ShieldCheck className="h-3 w-3 text-primary shrink-0" /> Player Reg
              </button>
              <button
                type="button"
                onClick={() => handleSend("Tell me about upcoming championships")}
                className="flex items-center gap-1.5 rounded-lg bg-[#141b2a] px-2.5 py-1 text-slate-200 border border-primary/20 hover:border-primary hover:text-primary transition shrink-0 cursor-pointer whitespace-nowrap"
              >
                <Trophy className="h-3 w-3 text-amber-400 shrink-0" /> Events
              </button>
              <button
                type="button"
                onClick={() => handleSend("Tell me about the 11 Anukkama Color Belts")}
                className="flex items-center gap-1.5 rounded-lg bg-[#141b2a] px-2.5 py-1 text-slate-200 border border-primary/20 hover:border-primary hover:text-primary transition shrink-0 cursor-pointer whitespace-nowrap"
              >
                <Award className="h-3 w-3 text-yellow-400 shrink-0" /> Color Belts (11 Levels)
              </button>
              <button
                type="button"
                onClick={() => handleSend("Black Belt and Dan Grading details")}
                className="flex items-center gap-1.5 rounded-lg bg-[#141b2a] px-2.5 py-1 text-slate-200 border border-primary/20 hover:border-primary hover:text-primary transition shrink-0 cursor-pointer whitespace-nowrap"
              >
                <GraduationCap className="h-3 w-3 text-indigo-400 shrink-0" /> Dan Grading
              </button>
              <button
                type="button"
                onClick={() => handleSend("How can I verify a certificate or member?")}
                className="flex items-center gap-1.5 rounded-lg bg-[#141b2a] px-2.5 py-1 text-slate-200 border border-primary/20 hover:border-primary hover:text-primary transition shrink-0 cursor-pointer whitespace-nowrap"
              >
                <Search className="h-3 w-3 text-emerald-400 shrink-0" /> Verification
              </button>
              <button
                type="button"
                onClick={() => handleSend("Dojo & Club Affiliation details")}
                className="flex items-center gap-1.5 rounded-lg bg-[#141b2a] px-2.5 py-1 text-slate-200 border border-primary/20 hover:border-primary hover:text-primary transition shrink-0 cursor-pointer whitespace-nowrap"
              >
                <Layers className="h-3 w-3 text-cyan-400 shrink-0" /> Affiliation
              </button>
              <button
                type="button"
                onClick={() => handleSend("What equipment and uniforms are in the shop?")}
                className="flex items-center gap-1.5 rounded-lg bg-[#141b2a] px-2.5 py-1 text-slate-200 border border-primary/20 hover:border-primary hover:text-primary transition shrink-0 cursor-pointer whitespace-nowrap"
              >
                <ShoppingBag className="h-3 w-3 text-rose-400 shrink-0" /> Gear Store
              </button>
              <button
                type="button"
                onClick={() => setShowCallbackForm(true)}
                className="flex items-center gap-1.5 rounded-lg bg-primary/20 px-2.5 py-1 text-primary border border-primary/40 hover:bg-primary hover:text-black transition shrink-0 cursor-pointer whitespace-nowrap font-bold"
              >
                <PhoneCall className="h-3 w-3 shrink-0" /> Request Callback
              </button>
            </div>

            {/* In-Chat Request Callback Drawer */}
            <AnimatePresence>
              {showCallbackForm && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="border-b border-primary/30 bg-[#121927] p-3.5 sm:p-4 shrink-0 overflow-y-auto max-h-[50vh]"
                >
                  <div className="flex items-center justify-between mb-2.5">
                    <span className="text-xs font-bold text-primary flex items-center gap-1.5 truncate">
                      <PhoneCall className="h-3.5 w-3.5 shrink-0" /> Direct Secretariat Callback
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowCallbackForm(false)}
                      className="text-xs text-muted-foreground hover:text-white p-1 shrink-0"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  {cbSuccess ? (
                    <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 bg-emerald-950/40 p-3 rounded-xl border border-emerald-500/30">
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
                      Callback request received! A federation officer will call you shortly. Check your email for confirmation.
                    </div>
                  ) : (
                    <form onSubmit={handleCallbackSubmit} className="space-y-2">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <input
                          type="text"
                          required
                          placeholder="Your Full Name *"
                          value={cbName}
                          onChange={(e) => setCbName(e.target.value)}
                          className="w-full rounded-lg border border-primary/20 bg-[#090d14] px-2.5 py-1.5 text-xs text-white outline-none focus:border-primary placeholder:text-muted-foreground"
                        />
                        <input
                          type="tel"
                          required
                          maxLength={10}
                          placeholder="10-Digit Mobile *"
                          value={cbPhone}
                          onChange={handleCbPhoneChange}
                          className="w-full rounded-lg border border-primary/20 bg-[#090d14] px-2.5 py-1.5 text-xs text-white outline-none focus:border-primary placeholder:text-muted-foreground"
                        />
                      </div>
                      {cbPhoneError && (
                        <p className="text-[10px] text-destructive font-semibold">{cbPhoneError}</p>
                      )}
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="email"
                          required
                          placeholder="Email Address *"
                          value={cbEmail}
                          onChange={(e) => setCbEmail(e.target.value)}
                          className="w-full rounded-lg border border-primary/20 bg-[#090d14] px-2.5 py-1.5 text-xs text-white outline-none focus:border-primary placeholder:text-muted-foreground"
                        />
                        <select
                          value={cbTime}
                          onChange={(e) => setCbTime(e.target.value)}
                          className="w-full rounded-lg border border-primary/20 bg-[#090d14] px-2 py-1.5 text-xs text-white outline-none focus:border-primary"
                        >
                          <option value="ASAP">Call Me ASAP</option>
                          <option value="Morning (9 AM - 12 PM)">Morning (9 - 12 PM)</option>
                          <option value="Afternoon (12 PM - 4 PM)">Afternoon (12 - 4 PM)</option>
                          <option value="Evening (4 PM - 7 PM)">Evening (4 - 7 PM)</option>
                        </select>
                      </div>
                      <input
                        type="text"
                        placeholder="Inquiry Topic / Notes (Optional)"
                        value={cbNotes}
                        onChange={(e) => setCbNotes(e.target.value)}
                        className="w-full rounded-lg border border-primary/20 bg-[#090d14] px-2.5 py-1.5 text-xs text-white outline-none focus:border-primary placeholder:text-muted-foreground"
                      />
                      <button
                        type="submit"
                        disabled={cbSubmitting}
                        className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-gold-gradient py-2 text-xs font-bold text-black shadow-gold hover:opacity-90 transition cursor-pointer disabled:opacity-50"
                      >
                        {cbSubmitting ? (
                          <>
                            <Loader2 className="h-3.5 w-3.5 animate-spin" /> Submitting Request...
                          </>
                        ) : (
                          "Request Federation Phone Callback"
                        )}
                      </button>
                    </form>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Messages Feed */}
            <div className="flex-1 overflow-y-auto p-3.5 sm:p-4 space-y-3.5 bg-[#090d14]/70 min-h-0">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={cn(
                    "flex flex-col max-w-[92%] sm:max-w-[88%]",
                    msg.sender === "user" ? "ml-auto items-end" : "mr-auto items-start"
                  )}
                >
                  <div
                    className={cn(
                      "rounded-2xl px-3.5 py-2.5 sm:px-4 sm:py-3 text-xs sm:text-sm leading-relaxed break-words shadow-sm",
                      msg.sender === "user"
                        ? "bg-gradient-to-r from-primary/90 to-primary text-black font-medium rounded-br-none"
                        : "bg-[#141b29] border border-primary/25 text-slate-200 rounded-bl-none shadow-gold/5"
                    )}
                  >
                    {renderFormattedText(msg.text)}

                    {/* Action Button inside bot message */}
                    {msg.action && (
                      <button
                        type="button"
                        onClick={() => handleActionClick(msg.action)}
                        className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gold-gradient px-4 py-2 text-xs font-bold text-black shadow-gold hover:opacity-95 transition-all cursor-pointer"
                      >
                        {msg.action.label || "Explore Details"}
                        <ArrowRight className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>

                  <span className="mt-1 px-1 text-[10px] text-muted-foreground">{msg.timestamp}</span>

                  {/* Quick replies option buttons */}
                  {msg.sender === "assistant" && msg.quickReplies && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {msg.quickReplies.map((replyText, rIdx) => (
                        <button
                          key={rIdx}
                          type="button"
                          onClick={() => handleQuickReply(replyText)}
                          className="rounded-full border border-primary/30 bg-[#121824] px-2.5 sm:px-3 py-1 text-[11px] font-medium text-slate-300 transition-all hover:border-primary hover:bg-primary/20 hover:text-primary cursor-pointer shadow-xs max-w-full truncate"
                        >
                          {replyText}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}

              {isTyping && (
                <div className="mr-auto flex items-center gap-2 rounded-2xl rounded-bl-none border border-primary/20 bg-[#141b29] px-4 py-3 text-xs text-muted-foreground">
                  <Bot className="h-4 w-4 animate-spin text-primary shrink-0" />
                  <span>KALAWAR AI is formulating response...</span>
                </div>
              )}

              {isVoiceListening && (
                <div className="mx-auto flex items-center gap-2 rounded-full border border-red-500/40 bg-red-950/40 px-4 py-1.5 text-xs font-semibold text-red-400 animate-pulse">
                  <Mic className="h-3.5 w-3.5 shrink-0" /> Listening to your speech... Speak now
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input Bar */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="border-t border-primary/20 bg-[#0c1017] p-2.5 sm:p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:pb-3 flex items-center gap-1.5 sm:gap-2 shrink-0"
            >
              {/* Voice Input Button */}
              <button
                type="button"
                onClick={toggleVoiceInput}
                title="Voice Input (Speech-to-Text)"
                className={cn(
                  "grid h-9 w-9 sm:h-10 sm:w-10 shrink-0 place-items-center rounded-full transition-all cursor-pointer border",
                  isVoiceListening
                    ? "bg-red-600 text-white border-red-400 animate-bounce"
                    : "bg-[#141b29] text-muted-foreground border-primary/20 hover:border-primary hover:text-primary"
                )}
              >
                {isVoiceListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
              </button>

              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about registration, 11 Anukkama belts, rules, events..."
                className="flex-1 min-w-0 rounded-full border border-primary/25 bg-[#080c13] px-3.5 py-2 sm:px-4 sm:py-2.5 text-xs sm:text-sm text-foreground outline-none transition focus:border-primary focus:ring-1 focus:ring-primary/30 placeholder:text-muted-foreground"
              />

              <button
                type="submit"
                disabled={!input.trim() || isTyping}
                className="grid h-9 w-9 sm:h-10 sm:w-10 shrink-0 place-items-center rounded-full bg-gold-gradient text-black shadow-gold transition-all hover:opacity-90 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
                aria-label="Send query"
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Trigger & Tooltip Container */}
      <div className="fixed bottom-6 right-4 sm:bottom-7 sm:right-6 z-40 flex flex-col items-end pointer-events-none print:hidden">
        {/* Welcome Tooltip Popup Bubble */}
        <AnimatePresence>
          {!isOpen && showTooltip && (
            <motion.div
              initial={{ opacity: 0, y: 12, scale: 0.94 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.25 }}
              className="pointer-events-auto mb-3 w-[calc(100vw-2.5rem)] max-w-xs rounded-2xl border border-primary/30 bg-[#0c1017]/95 backdrop-blur-xl p-3.5 shadow-2xl"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-gold-gradient text-black shadow-gold">
                    <Bot className="h-4 w-4" />
                  </div>
                  <span className="text-xs font-bold text-white truncate">
                    KALAWAR AI Assistant
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowTooltip(false)}
                  className="text-muted-foreground hover:text-white transition cursor-pointer shrink-0"
                  aria-label="Dismiss message"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
              <p className="mt-2 text-xs leading-relaxed text-slate-300">
                👋 Need help with Player Registration, 11 Anukkama Color Belts, Dan Gradings, Verification, or Championships? Chat with me!
              </p>
              <button
                type="button"
                onClick={toggleBot}
                className="mt-2.5 inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-gold-gradient py-1.5 text-xs font-bold text-black shadow-gold hover:opacity-90 transition-all cursor-pointer"
              >
                Start Chatting <ArrowRight className="h-3 w-3" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Floating Trigger Button */}
        <button
          type="button"
          onClick={toggleBot}
          className={cn(
            "pointer-events-auto relative group h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-full bg-[#0c1017] text-white shadow-[0_10px_35px_rgba(0,0,0,0.6)] transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer border border-primary/40",
            isOpen ? "hidden sm:flex" : "flex"
          )}
          aria-label="Toggle KALAWAR AI Assistant"
        >
          {/* Glowing Aura */}
          <span className="absolute -inset-1 rounded-full bg-gold-gradient opacity-30 blur-md transition group-hover:opacity-70 animate-pulse" />

          {isOpen ? (
            <ChevronDown className="relative z-10 h-6 w-6 sm:h-7 sm:w-7 text-primary transition-transform duration-300" />
          ) : (
            <Bot className="relative z-10 h-6 w-6 sm:h-7 sm:w-7 text-primary transition-transform duration-300" />
          )}

          {!isOpen && unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 z-20 flex h-5 w-5 items-center justify-center rounded-full bg-gold-gradient text-[10px] font-extrabold text-black ring-2 ring-[#0c1017]">
              {unreadCount}
            </span>
          )}
        </button>
      </div>
    </>
  );
}
