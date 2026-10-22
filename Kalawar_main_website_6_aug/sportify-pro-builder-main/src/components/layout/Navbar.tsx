"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import {
  Menu,
  X,
  ChevronDown,
  Shield,
  LayoutDashboard,
  User,
  LogOut,
  Sparkles,
  ShoppingBag,
  Package,
  Heart,
  UserCheck,
  Users,
  CheckCircle2,
  Award,
  CreditCard,
  Receipt,
  ChevronRight,
  Scale,
} from "lucide-react";
import { toast } from "sonner";
import { mainNav, federation } from "@/constants/navigation";
import { useAuth } from "@/lib/auth-context";
import { useCart } from "@/lib/cart-context";
import { useWishlist } from "@/lib/wishlist-context";
import { useSettings } from "@/lib/settings-context";
import { CartDrawer } from "@/components/shop/CartDrawer";
import { WishlistDrawer } from "@/components/shop/WishlistDrawer";
import { AnnouncementBanner } from "@/components/layout/AnnouncementBanner";
import { cn } from "@/lib/utils";

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [openMega, setOpenMega] = useState<string | null>(null);
  const [openMemberDropdown, setOpenMemberDropdown] = useState(false);
  const [mobileExpanded, setMobileExpanded] = useState<string | null>(null);
  const memberDropdownRef = useRef<HTMLDivElement>(null);

  const pathname = usePathname();
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuth();
  const { totalItems, openCart } = useCart();
  const { totalWishlistItems, openWishlist } = useWishlist();
  const { settings } = useSettings();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 15);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setOpen(false);
    setOpenMega(null);
    setOpenMemberDropdown(false);
    setMobileExpanded(null);
  }, [pathname]);

  // Click outside listener for member dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        memberDropdownRef.current &&
        !memberDropdownRef.current.contains(event.target as Node)
      ) {
        setOpenMemberDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    setOpenMemberDropdown(false);
    setOpen(false);
    await logout();
    toast.success("Logged out successfully");
    router.push("/");
    router.refresh();
  };

  const fullFederationName =
    settings.federationName || federation.name || "KALAWAR Sports & Martial Arts Federation of India";

  const isStateAssociationUser =
    isAuthenticated &&
    (user?.memberType === "StateAssociation" ||
      user?.id?.startsWith("KSM-SA-") ||
      user?.id?.startsWith("WSF-SA-"));

  const isDistrictAssociationUser =
    isAuthenticated &&
    (user?.memberType === "DistrictAssociation" ||
      user?.id?.startsWith("KSM-DA-") ||
      user?.id?.startsWith("WSF-DA-"));

  const isClubUser =
    isAuthenticated &&
    !isStateAssociationUser &&
    !isDistrictAssociationUser &&
    (user?.memberType === "Club" || user?.id?.startsWith("KSM-CL-") || user?.id?.startsWith("WSF-CL-"));

  const isCoachUser =
    isAuthenticated &&
    !isStateAssociationUser &&
    !isDistrictAssociationUser &&
    (user?.memberType === "Coach" || user?.id?.startsWith("KSM-CO-") || user?.id?.startsWith("WSF-CO-"));

  const clubNav = [
    { label: "Club Dashboard", to: "/dashboard" },
    { label: "Confirm Coach", to: "/club/confirm-coach", highlight: true },
    { label: "Coach List", to: "/club/coaches" },
    { label: "Events", to: "/events" },
    { label: "Downloads", to: "/downloads" },
    { label: "Contact", to: "/contact" },
  ];

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-50 w-full pointer-events-auto">
        <AnnouncementBanner />
        <div
          className={cn(
            "w-full transition-all duration-300",
            scrolled
              ? "bg-background/95 backdrop-blur-2xl border-b border-primary/20 py-2 shadow-[0_10px_35px_rgba(0,0,0,0.85)]"
              : "bg-background/90 backdrop-blur-xl border-b border-border/40 py-2.5 sm:py-3 lg:py-3.5",
          )}
        >
          <div className="w-full max-w-[105rem] mx-auto px-3 sm:px-5 lg:px-6 2xl:px-8 flex items-center justify-between gap-2 lg:gap-4">
          
          {/* Brand Logo & Organization Name */}
          <Link
            href="/"
            className="flex items-center gap-1.5 xs:gap-2 sm:gap-3 group shrink-0 min-w-0 transition-all duration-200"
            title={fullFederationName}
          >
            <div
              className={cn(
                "relative shrink-0 overflow-hidden rounded-full bg-white shadow-gold transition-all duration-300 group-hover:scale-105 group-hover:shadow-[0_0_22px_rgba(234,179,8,0.5)] flex items-center justify-center",
                scrolled
                  ? "size-8 xs:size-9 sm:size-11 lg:size-13"
                  : "size-9 xs:size-10 sm:size-12 lg:size-14",
              )}
            >
              <img
                src="/logo.png"
                alt={fullFederationName}
                className="size-full object-contain"
              />
            </div>

            <div className="flex flex-col leading-tight min-w-0">
              <span className="block text-[11px] xs:text-xs sm:text-base lg:text-[17px] 2xl:text-lg font-black tracking-wider uppercase text-gold-gradient drop-shadow-sm whitespace-nowrap">
                KALAWAR SPORTS
              </span>
              <span className="text-[7px] xs:text-[8px] sm:text-[9.5px] lg:text-[10.5px] 2xl:text-[11px] font-bold tracking-tight text-amber-200/90 whitespace-nowrap drop-shadow-xs">
                &amp; Martial Arts Federation of India
              </span>
            </div>
          </Link>

          {/* Center Desktop Navigation Pill (Visible on lg: 1024px+) */}
          <nav className="hidden lg:flex items-center justify-center shrink-0">
            <div className="bg-card/75 backdrop-blur-2xl border border-primary/25 rounded-full p-1 shadow-[0_4px_25px_rgba(0,0,0,0.5)] flex items-center gap-0.5 xl:gap-1">
              {mainNav
                .filter((item) => settings.enableShop !== false || item.label !== "Shop")
                .map((item) => {
                  const groups = "groups" in item ? item.groups : undefined;
                  const children = "children" in item ? item.children : undefined;
                  const allItems = groups ? groups.flatMap((g) => g.items) : (children || []);
                  const hasDropdown = Boolean(groups?.length || children?.length);
                  const active =
                    pathname === item.to ||
                    (item.to !== "/" && pathname.startsWith(item.to)) ||
                    allItems.some((c) => pathname === c.to);

                  return (
                    <div
                      key={item.label}
                      className="relative"
                      onMouseEnter={() => setOpenMega(hasDropdown ? item.label : null)}
                      onMouseLeave={() => setOpenMega(null)}
                    >
                      <Link
                        href={item.to}
                        className={cn(
                          "flex items-center gap-1 rounded-full px-2.5 xl:px-3.5 py-1.5 text-xs xl:text-[13px] font-semibold transition-all duration-200 whitespace-nowrap",
                          active
                            ? "text-primary font-bold bg-primary/20 border border-primary/40 shadow-[0_0_14px_rgba(234,179,8,0.2)]"
                            : "text-foreground/80 hover:text-foreground hover:bg-white/[0.08] border border-transparent",
                        )}
                      >
                        {item.label}
                        {hasDropdown && (
                          <ChevronDown
                            className={cn(
                              "size-3 opacity-70 transition-transform duration-200",
                              openMega === item.label && "rotate-180 text-primary opacity-100",
                            )}
                          />
                        )}
                      </Link>

                      {/* Dropdown Menu */}
                      <AnimatePresence>
                        {hasDropdown && openMega === item.label && (
                          <motion.div
                            initial={{ opacity: 0, y: 8, scale: 0.96 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 4, scale: 0.96 }}
                            transition={{ duration: 0.15 }}
                            className={cn(
                              "bg-card/95 backdrop-blur-2xl border border-primary/30 absolute top-full mt-2 rounded-2xl p-3 shadow-[0_20px_50px_rgba(0,0,0,0.75)] z-50",
                              groups ? "w-[560px] -left-36" : "w-56 -left-6",
                            )}
                          >
                            {groups ? (
                              <div className="grid grid-cols-2 gap-3 relative z-10">
                                {groups.map((g) => (
                                  <div key={g.groupTitle} className="space-y-1">
                                    <h4 className="text-[10px] font-extrabold uppercase tracking-widest text-primary/80 px-2.5 py-1">
                                      {g.groupTitle}
                                    </h4>
                                    {g.items.map((it) => {
                                      const isChildActive = pathname === it.to;
                                      return (
                                        <Link
                                          key={it.to}
                                          href={it.to}
                                          className={cn(
                                            "group/item block rounded-xl px-2.5 py-1.5 transition-all",
                                            isChildActive
                                              ? "bg-primary/20 border-l-2 border-primary"
                                              : "hover:bg-accent/60 hover:border-l-2 hover:border-primary/70",
                                          )}
                                        >
                                          <span
                                            className={cn(
                                              "block text-xs font-bold transition-colors",
                                              isChildActive
                                                ? "text-primary"
                                                : "text-foreground group-hover/item:text-primary",
                                            )}
                                          >
                                            {it.label}
                                          </span>
                                          <span className="text-muted-foreground block text-[10px] mt-0.5 leading-snug line-clamp-1">
                                            {it.desc}
                                          </span>
                                        </Link>
                                      );
                                    })}
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="space-y-1 relative z-10">
                                {children?.map((c) => {
                                  const isChildActive = pathname === c.to;
                                  return (
                                    <Link
                                      key={c.to}
                                      href={c.to}
                                      className={cn(
                                        "group/item block rounded-xl px-3 py-2 transition-all",
                                        isChildActive
                                          ? "bg-primary/20 border-l-2 border-primary"
                                          : "hover:bg-accent/60 hover:border-l-2 hover:border-primary/70",
                                      )}
                                    >
                                      <span
                                        className={cn(
                                          "block text-xs sm:text-[13px] font-bold transition-colors",
                                          isChildActive
                                            ? "text-primary"
                                            : "text-foreground group-hover/item:text-primary",
                                        )}
                                      >
                                        {c.label}
                                      </span>
                                      <span className="text-muted-foreground block text-[11px] mt-0.5 leading-snug">
                                        {c.desc}
                                      </span>
                                    </Link>
                                  );
                                })}
                              </div>
                            )}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
            </div>
          </nav>

          {/* Right Action Group */}
          <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
            {isAuthenticated ? (
              /* Authenticated Member Profile Pill & Dropdown */
              <div className="relative" ref={memberDropdownRef}>
                <button
                  type="button"
                  onClick={() => setOpenMemberDropdown((v) => !v)}
                  className={cn(
                    "border-border/70 hover:border-primary flex items-center gap-1 xs:gap-1.5 sm:gap-2 rounded-full border px-1.5 xs:px-2 sm:px-2.5 py-1 sm:py-1.5 text-xs font-semibold transition-all shadow-sm shrink-0 cursor-pointer",
                    openMemberDropdown
                      ? "border-primary bg-primary/15 shadow-[0_0_15px_rgba(234,179,8,0.2)]"
                      : "bg-card/70 hover:bg-accent/50",
                  )}
                >
                  <div className="size-5 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center text-[9.5px] font-black text-primary overflow-hidden shrink-0">
                    {user?.avatar && !user.avatar.includes("1500648767791-00dcc994a43e") && !user.avatar.includes("avatar-1.jpg") ? (
                      <img src={user.avatar} alt={user.name} className="size-full object-cover" />
                    ) : user?.name ? (
                      user.name.slice(0, 2).toUpperCase()
                    ) : (
                      <User className="size-3" />
                    )}
                  </div>
                  <span className="hidden xs:inline max-w-[45px] sm:max-w-[85px] truncate font-bold text-[10px] xs:text-[11px] sm:text-xs">
                    {user?.name?.split(" ")[0] || "Member"}
                  </span>
                  <ChevronDown
                    className={cn(
                      "size-3 opacity-70 transition-transform duration-200 shrink-0",
                      openMemberDropdown && "rotate-180 text-primary opacity-100",
                    )}
                  />
                </button>

                <AnimatePresence>
                  {openMemberDropdown && (
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 6, scale: 0.96 }}
                      transition={{ duration: 0.15 }}
                      className="bg-card/95 backdrop-blur-2xl border border-primary/30 absolute right-0 top-full mt-2 w-64 rounded-2xl p-2.5 shadow-[0_20px_50px_rgba(0,0,0,0.75)] z-50"
                    >
                      {/* User Info Header */}
                      <div className="border-border/60 border-b p-3 bg-accent/20 rounded-xl mb-1.5">
                        <p className="truncate text-xs font-bold text-foreground">{user?.name}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-gold-gradient font-mono text-[11px] font-semibold">
                            {user?.id}
                          </span>
                          {user?.role === "admin" ? (
                            <span className="rounded-full bg-primary/20 text-primary border border-primary/30 px-1.5 py-0.2 text-[9px] font-bold uppercase tracking-wider">
                              Admin
                            </span>
                          ) : isStateAssociationUser ? (
                            <span className="rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 px-1.5 py-0.2 text-[9px] font-extrabold uppercase tracking-wider shadow-xs">
                              State Association
                            </span>
                          ) : isDistrictAssociationUser ? (
                            <span className="rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 px-1.5 py-0.2 text-[9px] font-extrabold uppercase tracking-wider shadow-xs">
                              District Association
                            </span>
                          ) : isClubUser ? (
                            <span className="rounded-full bg-gold-gradient text-background px-1.5 py-0.2 text-[9px] font-extrabold uppercase tracking-wider shadow-xs">
                              Club
                            </span>
                          ) : isCoachUser ? (
                            <span className="rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 px-1.5 py-0.2 text-[9px] font-extrabold uppercase tracking-wider shadow-xs">
                              Accredited Coach
                            </span>
                          ) : user?.memberType === "Referee" || user?.id?.startsWith("KSM-REF-") || user?.id?.startsWith("KSM-RF-") || user?.id?.startsWith("WSF-REF-") || user?.id?.startsWith("WSF-RF-") ? (
                            <span className="rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/40 px-1.5 py-0.2 text-[9px] font-bold uppercase tracking-wider">
                              Licensed Referee
                            </span>
                          ) : (
                            <span className="rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 px-1.5 py-0.2 text-[9px] font-bold uppercase tracking-wider">
                              Athlete
                            </span>
                          )}
                        </div>
                        {user?.email && (
                          <p className="truncate text-[10px] text-muted-foreground mt-1">{user.email}</p>
                        )}
                      </div>

                      {/* Dropdown Options */}
                      <div className="space-y-1">
                        {/* Shop Specific Quick Actions - Wishlist & Cart under User Dropdown */}
                        {(() => {
                          const isShopRoute =
                            pathname.startsWith("/shop") ||
                            pathname.startsWith("/cart") ||
                            pathname.startsWith("/checkout") ||
                            pathname.startsWith("/orders");

                          if (!isShopRoute) return null;

                          return (
                            <div className="border-b border-border/50 pb-1.5 mb-1.5 space-y-1">
                              <div className="px-3 py-0.5 text-[9.5px] font-black uppercase tracking-wider text-primary">
                                Federation Store
                              </div>

                              <button
                                type="button"
                                onClick={() => {
                                  setOpenMemberDropdown(false);
                                  openWishlist();
                                }}
                                className="hover:bg-rose-500/15 hover:text-rose-300 text-foreground flex w-full items-center justify-between rounded-xl px-3 py-2 text-xs font-semibold transition-colors cursor-pointer"
                              >
                                <div className="flex items-center gap-2.5">
                                  <Heart className="size-4 text-rose-400 fill-rose-500/20" />
                                  <span>My Wishlist</span>
                                </div>
                                {totalWishlistItems > 0 && (
                                  <span className="bg-rose-500 text-white rounded-full px-2 py-0.5 text-[9.5px] font-black shadow-sm">
                                    {totalWishlistItems > 99 ? "99+" : totalWishlistItems}
                                  </span>
                                )}
                              </button>

                              {settings.enableShop !== false && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setOpenMemberDropdown(false);
                                    openCart();
                                  }}
                                  className="hover:bg-accent/60 hover:text-primary text-foreground flex w-full items-center justify-between rounded-xl px-3 py-2 text-xs font-semibold transition-colors cursor-pointer"
                                >
                                  <div className="flex items-center gap-2.5">
                                    <ShoppingBag className="size-4 text-primary" />
                                    <span>Shopping Cart / Bag</span>
                                  </div>
                                  {totalItems > 0 && (
                                    <span className="bg-gold-gradient text-background rounded-full px-2 py-0.5 text-[9.5px] font-black shadow-gold">
                                      {totalItems > 99 ? "99+" : totalItems}
                                    </span>
                                  )}
                                </button>
                              )}
                            </div>
                          );
                        })()}

                        <Link
                          href={user?.role === "admin" ? "/admin" : "/dashboard"}
                          onClick={() => setOpenMemberDropdown(false)}
                          className="hover:bg-accent/60 hover:text-primary flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold transition-colors"
                        >
                          <User className="size-4 text-primary" />
                          <span>My Profile</span>
                        </Link>

                        <Link
                          href="/my-id-card"
                          onClick={() => setOpenMemberDropdown(false)}
                          className="hover:bg-accent/60 hover:text-primary flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold transition-colors"
                        >
                          <CreditCard className="size-4 text-primary" />
                          <span>My ID Card</span>
                        </Link>

                        <Link
                          href="/my-certificates"
                          onClick={() => setOpenMemberDropdown(false)}
                          className="hover:bg-accent/60 hover:text-primary flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold transition-colors"
                        >
                          <Award className="size-4 text-primary" />
                          <span>My Certificates</span>
                        </Link>

                        <Link
                          href="/orders"
                          onClick={() => setOpenMemberDropdown(false)}
                          className="hover:bg-accent/60 hover:text-primary flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold transition-colors"
                        >
                          <Package className="size-4 text-primary" />
                          <span>My Orders</span>
                        </Link>

                        <Link
                          href="/my-receipts"
                          onClick={() => setOpenMemberDropdown(false)}
                          className="hover:bg-accent/60 hover:text-primary flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold transition-colors"
                        >
                          <Receipt className="size-4 text-primary" />
                          <span>Registration Receipts</span>
                        </Link>

                        {isStateAssociationUser && (
                          <div className="border-t border-border/40 pt-1 mt-1 space-y-1">
                            <Link
                              href="/state-association/confirm-club"
                              onClick={() => setOpenMemberDropdown(false)}
                              className="hover:bg-amber-500/15 hover:text-amber-300 text-amber-200 flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold transition-colors"
                            >
                              <UserCheck className="size-4 text-amber-400" />
                              <span>Confirm Club Requests</span>
                            </Link>

                            <Link
                              href="/state-association/clubs"
                              onClick={() => setOpenMemberDropdown(false)}
                              className="hover:bg-emerald-500/15 hover:text-emerald-300 text-emerald-200 flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold transition-colors"
                            >
                              <Users className="size-4 text-emerald-400" />
                              <span>Affiliated Club List</span>
                            </Link>

                            <Link
                              href="/state-association/confirm-referee"
                              onClick={() => setOpenMemberDropdown(false)}
                              className="hover:bg-amber-500/15 hover:text-amber-300 text-amber-200 flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold transition-colors"
                            >
                              <UserCheck className="size-4 text-amber-400" />
                              <span>Confirm Referee Requests</span>
                            </Link>

                            <Link
                              href="/state-association/referees"
                              onClick={() => setOpenMemberDropdown(false)}
                              className="hover:bg-emerald-500/15 hover:text-emerald-300 text-emerald-200 flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold transition-colors"
                            >
                              <Users className="size-4 text-emerald-400" />
                              <span>Affiliated Referee List</span>
                            </Link>

                            <Link
                              href="/state-association/confirm-coach"
                              onClick={() => setOpenMemberDropdown(false)}
                              className="hover:bg-amber-500/15 hover:text-amber-300 text-amber-200 flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold transition-colors"
                            >
                              <UserCheck className="size-4 text-amber-400" />
                              <span>Confirm Coach Requests</span>
                            </Link>

                            <Link
                              href="/state-association/coaches"
                              onClick={() => setOpenMemberDropdown(false)}
                              className="hover:bg-emerald-500/15 hover:text-emerald-300 text-emerald-200 flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold transition-colors"
                            >
                              <Users className="size-4 text-emerald-400" />
                              <span>Affiliated Coach List</span>
                            </Link>

                            <Link
                              href="/state-association/confirm-player"
                              onClick={() => setOpenMemberDropdown(false)}
                              className="hover:bg-amber-500/15 hover:text-amber-300 text-amber-200 flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold transition-colors"
                            >
                              <UserCheck className="size-4 text-amber-400" />
                              <span>Confirm Player Requests</span>
                            </Link>

                            <Link
                              href="/state-association/players"
                              onClick={() => setOpenMemberDropdown(false)}
                              className="hover:bg-emerald-500/15 hover:text-emerald-300 text-emerald-200 flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold transition-colors"
                            >
                              <Users className="size-4 text-emerald-400" />
                              <span>Affiliated Player List</span>
                            </Link>
                          </div>
                        )}

                        {isDistrictAssociationUser && (
                          <div className="border-t border-border/40 pt-1 mt-1 space-y-1">
                            <Link
                              href="/district-association/confirm-club"
                              onClick={() => setOpenMemberDropdown(false)}
                              className="hover:bg-amber-500/15 hover:text-amber-300 text-amber-200 flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold transition-colors"
                            >
                              <UserCheck className="size-4 text-amber-400" />
                              <span>Confirm Club Requests</span>
                            </Link>

                            <Link
                              href="/district-association/clubs"
                              onClick={() => setOpenMemberDropdown(false)}
                              className="hover:bg-emerald-500/15 hover:text-emerald-300 text-emerald-200 flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold transition-colors"
                            >
                              <Users className="size-4 text-emerald-400" />
                              <span>Affiliated Club List</span>
                            </Link>

                            <Link
                              href="/district-association/confirm-referee"
                              onClick={() => setOpenMemberDropdown(false)}
                              className="hover:bg-amber-500/15 hover:text-amber-300 text-amber-200 flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold transition-colors"
                            >
                              <UserCheck className="size-4 text-amber-400" />
                              <span>Confirm Referee Requests</span>
                            </Link>

                            <Link
                              href="/district-association/referees"
                              onClick={() => setOpenMemberDropdown(false)}
                              className="hover:bg-emerald-500/15 hover:text-emerald-300 text-emerald-200 flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold transition-colors"
                            >
                              <Users className="size-4 text-emerald-400" />
                              <span>Affiliated Referee List</span>
                            </Link>

                            <Link
                              href="/district-association/confirm-coach"
                              onClick={() => setOpenMemberDropdown(false)}
                              className="hover:bg-amber-500/15 hover:text-amber-300 text-amber-200 flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold transition-colors"
                            >
                              <UserCheck className="size-4 text-amber-400" />
                              <span>Confirm Coach Requests</span>
                            </Link>

                            <Link
                              href="/district-association/coaches"
                              onClick={() => setOpenMemberDropdown(false)}
                              className="hover:bg-emerald-500/15 hover:text-emerald-300 text-emerald-200 flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold transition-colors"
                            >
                              <Users className="size-4 text-emerald-400" />
                              <span>Affiliated Coach List</span>
                            </Link>

                            <Link
                              href="/district-association/confirm-player"
                              onClick={() => setOpenMemberDropdown(false)}
                              className="hover:bg-amber-500/15 hover:text-amber-300 text-amber-200 flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold transition-colors"
                            >
                              <UserCheck className="size-4 text-amber-400" />
                              <span>Confirm Player Requests</span>
                            </Link>

                            <Link
                              href="/district-association/players"
                              onClick={() => setOpenMemberDropdown(false)}
                              className="hover:bg-emerald-500/15 hover:text-emerald-300 text-emerald-200 flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold transition-colors"
                            >
                              <Users className="size-4 text-emerald-400" />
                              <span>Affiliated Player List</span>
                            </Link>
                          </div>
                        )}

                        {isClubUser && (
                          <div className="border-t border-border/40 pt-1 mt-1 space-y-1">
                            <Link
                              href="/club/confirm-coach"
                              onClick={() => setOpenMemberDropdown(false)}
                              className="hover:bg-amber-500/15 hover:text-amber-300 text-amber-200 flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold transition-colors"
                            >
                              <UserCheck className="size-4 text-amber-400" />
                              <span>Confirm Coach Requests</span>
                            </Link>

                            <Link
                              href="/club/coaches"
                              onClick={() => setOpenMemberDropdown(false)}
                              className="hover:bg-emerald-500/15 hover:text-emerald-300 text-emerald-200 flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold transition-colors"
                            >
                              <Users className="size-4 text-emerald-400" />
                              <span>Affiliated Coach List</span>
                            </Link>

                            <Link
                              href="/club/confirm-player"
                              onClick={() => setOpenMemberDropdown(false)}
                              className="hover:bg-amber-500/15 hover:text-amber-300 text-amber-200 flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold transition-colors"
                            >
                              <UserCheck className="size-4 text-amber-400" />
                              <span>Confirm Player Requests</span>
                            </Link>

                            <Link
                              href="/club/players"
                              onClick={() => setOpenMemberDropdown(false)}
                              className="hover:bg-emerald-500/15 hover:text-emerald-300 text-emerald-200 flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold transition-colors"
                            >
                              <Users className="size-4 text-emerald-400" />
                              <span>Affiliated Player List</span>
                            </Link>
                          </div>
                        )}

                        {isCoachUser && (
                          <div className="border-t border-border/40 pt-1 mt-1 space-y-1">
                            <Link
                              href="/coach/confirm-player"
                              onClick={() => setOpenMemberDropdown(false)}
                              className="hover:bg-amber-500/15 hover:text-amber-300 text-amber-200 flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold transition-colors"
                            >
                              <UserCheck className="size-4 text-amber-400" />
                              <span>Confirm Player Requests</span>
                            </Link>

                            <Link
                              href="/coach/players"
                              onClick={() => setOpenMemberDropdown(false)}
                              className="hover:bg-emerald-500/15 hover:text-emerald-300 text-emerald-200 flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold transition-colors"
                            >
                              <Users className="size-4 text-emerald-400" />
                              <span>Affiliated Player List</span>
                            </Link>
                          </div>
                        )}

                        <button
                          type="button"
                          onClick={handleLogout}
                          className="hover:bg-destructive/15 text-destructive hover:text-destructive flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold transition-colors text-left cursor-pointer mt-1 border-t border-border/40 pt-2"
                        >
                          <LogOut className="size-4 text-destructive" />
                          <span>Log out</span>
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              /* Non-authenticated: Member Login & High-Attention Register Now CTA */
              <>
                <Link
                  href="/login"
                  className="border-border/70 hover:border-primary/60 hidden sm:inline-flex items-center gap-1.5 rounded-full border px-2.5 sm:px-3 py-1 sm:py-1.5 text-[11px] sm:text-xs font-bold transition-all bg-card/75 hover:bg-accent/50 shadow-sm shrink-0"
                >
                  <LayoutDashboard className="size-3.5 text-primary" />
                  <span>Member</span>
                </Link>

                {settings.acceptRegistrations !== false ? (
                  <Link
                    href="/register"
                    className="relative group/btn overflow-hidden bg-gradient-to-r from-amber-400 via-yellow-200 to-amber-500 text-stone-950 font-black rounded-full px-2.5 sm:px-4 py-1 sm:py-1.8 text-[10px] xs:text-[11px] sm:text-xs shadow-[0_0_12px_rgba(245,158,11,0.4)] register-cta-glow transition-all duration-300 hover:scale-[1.03] hover:shadow-[0_0_18px_rgba(245,158,11,0.7)] flex items-center gap-1 sm:gap-1.5 shrink-0"
                  >
                    {/* Shimmer light sweep reflection */}
                    <span className="absolute inset-0 w-1/2 h-full bg-gradient-to-r from-transparent via-white/60 to-transparent pointer-events-none animate-[shimmer-slide_2.8s_cubic-bezier(0.4,0,0.2,1)_infinite]" />
                    <Sparkles className="size-2.5 sm:size-3 text-stone-950 fill-stone-950 relative z-10 shrink-0" />
                    <span className="relative z-10 font-black tracking-wide uppercase">
                      <span className="hidden xs:inline">Register Now</span>
                      <span className="inline xs:hidden">Register</span>
                    </span>
                  </Link>
                ) : (
                  <Link
                    href="/contact"
                    className="border-border/70 hover:border-primary hidden sm:inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-bold transition-colors whitespace-nowrap bg-card/70 shrink-0"
                  >
                    Contact
                  </Link>
                )}
              </>
            )}

            {/* Mobile Menu Hamburger Trigger */}
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              className="lg:hidden border-border/70 hover:border-primary/60 bg-card/70 grid size-8 sm:size-9 place-items-center rounded-full border transition-colors shrink-0"
              aria-label="Toggle Navigation Menu"
            >
              {open ? <X className="size-4 sm:size-5 text-primary" /> : <Menu className="size-4 sm:size-5" />}
            </button>
          </div>
        </div>
      </div>

        {/* Mobile Slide-Out / Dropdown Drawer */}
        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="lg:hidden bg-card/95 backdrop-blur-2xl border-b border-primary/30 max-h-[calc(100vh-4.5rem)] overflow-y-auto overscroll-contain shadow-2xl"
            >
              <div className="shell py-4 space-y-4">
                {/* Mobile Nav Links */}
                <div className="space-y-1">
                  {mainNav
                    .filter((item) => settings.enableShop !== false || item.label !== "Shop")
                    .map((item) => {
                      const groups = "groups" in item ? item.groups : undefined;
                      const children = "children" in item ? item.children : undefined;
                      const allItems = groups ? groups.flatMap((g) => g.items) : (children || []);
                      const hasChildren = allItems.length > 0;
                      const isExpanded = mobileExpanded === item.label;
                      const isActive =
                        pathname === item.to ||
                        (item.to !== "/" && pathname.startsWith(item.to)) ||
                        allItems.some((c) => pathname === c.to);

                      if (!hasChildren) {
                        return (
                          <Link
                            key={item.label}
                            href={item.to}
                            onClick={() => setOpen(false)}
                            className={cn(
                              "flex items-center justify-between rounded-xl px-3.5 py-2.5 text-sm font-bold transition-colors",
                              isActive
                                ? "bg-primary/20 text-primary border border-primary/30 font-black"
                                : "text-foreground hover:bg-accent/40 hover:text-primary",
                            )}
                          >
                            <span>{item.label}</span>
                            <ChevronRight className="size-4 opacity-40" />
                          </Link>
                        );
                      }

                      return (
                        <div key={item.label} className="rounded-xl border border-border/40 overflow-hidden bg-accent/10">
                          <button
                            type="button"
                            onClick={() => setMobileExpanded(isExpanded ? null : item.label)}
                            className="w-full flex items-center justify-between px-3.5 py-2.5 text-sm font-bold text-foreground hover:text-primary transition-colors text-left"
                          >
                            <span className={cn(isActive && "text-primary font-black")}>{item.label}</span>
                            <ChevronDown
                              className={cn(
                                "size-4 opacity-70 transition-transform duration-200",
                                isExpanded && "rotate-180 text-primary opacity-100",
                              )}
                            />
                          </button>
                          
                          <AnimatePresence>
                            {isExpanded && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                className="border-t border-border/30 bg-background/50 px-2 py-2 space-y-3"
                              >
                                {groups ? (
                                   groups.map((group, gIdx) => (
                                    <div key={gIdx} className="space-y-1">
                                      <div className="px-2.5 py-1 rounded-md bg-primary/10 text-[10px] font-black uppercase tracking-wider text-primary">
                                        {group.groupTitle}
                                      </div>
                                      {group.items.map((c) => (
                                        <Link
                                          key={c.to}
                                          href={c.to}
                                          onClick={() => setOpen(false)}
                                          className={cn(
                                            "block rounded-lg px-3 py-2 text-xs font-semibold transition-colors",
                                            pathname === c.to
                                              ? "text-primary bg-primary/15 font-bold"
                                              : "text-muted-foreground hover:text-foreground hover:bg-accent/40",
                                          )}
                                        >
                                          <span className="block text-foreground font-semibold">{c.label}</span>
                                          <span className="block text-[10.5px] text-muted-foreground mt-0.5">{c.desc}</span>
                                        </Link>
                                      ))}
                                    </div>
                                  ))
                                ) : (
                                  children?.map((c) => (
                                    <Link
                                      key={c.to}
                                      href={c.to}
                                      onClick={() => setOpen(false)}
                                      className={cn(
                                        "block rounded-lg px-3 py-2 text-xs font-semibold transition-colors",
                                        pathname === c.to
                                          ? "text-primary bg-primary/15 font-bold"
                                          : "text-muted-foreground hover:text-foreground hover:bg-accent/40",
                                      )}
                                    >
                                      <span className="block text-foreground font-semibold">{c.label}</span>
                                      <span className="block text-[10.5px] text-muted-foreground mt-0.5">{c.desc}</span>
                                    </Link>
                                  ))
                                )}
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      );
                    })}
                </div>

                {/* Mobile Authentication For Guests */}
                {!isAuthenticated && (
                  <div className="pt-3 border-t border-border/60 mt-4 flex flex-col sm:flex-row gap-2.5">
                    <Link
                      href="/login"
                      onClick={() => setOpen(false)}
                      className="border-border/80 hover:border-primary bg-card/70 flex-1 rounded-full border py-2.5 text-center text-xs font-bold transition-colors flex items-center justify-center gap-1.5 shadow-sm"
                    >
                      <LayoutDashboard className="size-3.5 text-primary" /> Member Login
                    </Link>
                    <Link
                      href="/register"
                      onClick={() => setOpen(false)}
                      className="relative group/reg overflow-hidden bg-gradient-to-r from-amber-400 via-yellow-200 to-amber-500 text-stone-950 flex-1 rounded-full py-2.5 text-center text-xs font-black shadow-[0_0_14px_rgba(245,158,11,0.5)] register-cta-glow transition-transform hover:scale-[1.02] flex items-center justify-center gap-1.5"
                    >
                      <span className="absolute inset-0 w-1/2 h-full bg-gradient-to-r from-transparent via-white/60 to-transparent pointer-events-none animate-[shimmer-slide_2.8s_cubic-bezier(0.4,0,0.2,1)_infinite]" />
                      <Sparkles className="size-3.5 text-stone-950 relative z-10" />
                      <span className="relative z-10 font-black">Register Now</span>
                    </Link>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      <CartDrawer />
      <WishlistDrawer />
    </>
  );
}
