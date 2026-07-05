import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { supabase } from "./lib/supabase";
import {
  Calendar, Bell, Star, Cake, Newspaper, Trophy, Info, Lock, Search,
  HelpCircle, Heart, Sun, Moon, Menu, X, Plus, Pencil, Trash2, Pin,
  CheckCircle2, ChevronRight, ChevronDown, Award, Sparkles, PartyPopper,
  Clock, MapPin, Mail, Phone, LogOut, ShieldCheck, Send, ArrowUp, ArrowDown,
  Users, GraduationCap, MessageSquare, Archive, Eye, EyeOff
} from "lucide-react";

/* ============================== STORAGE ============================== */

const KEYS = {
  events: "flamingoes-events-v1",
  announcements: "flamingoes-announcements-v1",
  spotlights: "flamingoes-spotlights-v1",
  achievements: "flamingoes-achievements-v1",
  registrations: "flamingoes-registrations-v1",
  newsletters: "flamingoes-newsletters-v1",
  feedback: "flamingoes-feedback-v1",
  config: "flamingoes-config-v1",
};

async function loadKey(key, fallback) {
  try {
    const res = await window.storage.get(key, true);
    return res && res.value ? JSON.parse(res.value) : fallback;
  } catch (e) {
    return fallback;
  }
}
async function saveKey(key, value) {
  try {
    await window.storage.set(key, JSON.stringify(value), true);
  } catch (e) {
    console.error("Flamingoes Hub: storage save failed", key, e);
  }
}
function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}
function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

/* ============================== SEED DATA ============================== */

const seedEvents = [];
const seedAnnouncements = [];
const seedSpotlights = [];
const seedAchievements = [];
const seedNewsletters = [];
const seedConfig = { password: "flamingo2026", captain: "Satwik", viceCaptain: "Shreehitha" };

/* ============================== FLAMINGO MARK ============================== */

function FloatingFlamingoes() {
  const items = useMemo(
    () => Array.from({ length: 7 }).map((_, i) => ({
      id: i,
      top: 5 + ((i * 17) % 85),
      left: (i * 23) % 92,
      size: 46 + (i % 4) * 22,
      dur: 14 + (i % 5) * 4,
      delay: i * 1.3,
      flip: i % 2 === 0,
    })),
    []
  );
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      {items.map((it) => (
        <div
          key={it.id}
          className="absolute opacity-[0.10]"
          style={{
            top: `${it.top}%`,
            left: `${it.left}%`,
            fontSize: `${it.size}px`,
            transform: it.flip ? "scaleX(-1)" : "none",
            animation: `flamingoFloat ${it.dur}s ease-in-out ${it.delay}s infinite`,
          }}
        >
          🦩
        </div>
      ))}
    </div>
  );
}

/* ============================== THEME ============================== */

function useTheme() {
  const [dark, setDark] = useState(false);
  const t = dark
    ? {
        pageBg: "linear-gradient(160deg,#241621 0%,#301c2a 45%,#241621 100%)",
        cardBg: "rgba(51,35,46,0.72)",
        cardBorder: "rgba(255,180,205,0.14)",
        text: "#FBEAF1",
        textMuted: "#D8B7C6",
        navBg: "rgba(36,22,33,0.75)",
        primary: "#FF6FA0",
        primaryDeep: "#FF4D89",
        accent: "#FFC24B",
        inputBg: "rgba(255,255,255,0.06)",
      }
    : {
        pageBg: "linear-gradient(160deg,#FFF6F9 0%,#FFE7F0 45%,#FFF6F9 100%)",
        cardBg: "rgba(255,255,255,0.82)",
        cardBorder: "rgba(224,65,123,0.12)",
        text: "#3A2536",
        textMuted: "#8A6B78",
        navBg: "rgba(255,251,253,0.75)",
        primary: "#FF5A8A",
        primaryDeep: "#C23768",
        accent: "#F5A623",
        inputBg: "#FFFFFF",
      };
  return { dark, setDark, t };
}

/* ============================== SHARED UI ============================== */

function Card({ children, t, className = "", style = {} }) {
  return (
    <div
      className={`rounded-[26px] shadow-[0_8px_30px_rgba(224,65,123,0.10)] backdrop-blur-md border ${className}`}
      style={{ background: t.cardBg, borderColor: t.cardBorder, ...style }}
    >
      {children}
    </div>
  );
}

function PrimaryButton({ children, onClick, t, type = "button", className = "", disabled }) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center gap-2 rounded-full px-6 py-3 font-bold text-white transition-all duration-300 hover:scale-105 hover:shadow-[0_10px_30px_rgba(255,90,138,0.45)] active:scale-95 disabled:opacity-50 disabled:hover:scale-100 ${className}`}
      style={{ background: `linear-gradient(135deg, ${t.primary}, ${t.primaryDeep})` }}
    >
      {children}
    </button>
  );
}

function GhostButton({ children, onClick, t, className = "" }) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-2 rounded-full px-5 py-2.5 font-semibold transition-all duration-200 hover:scale-105 border ${className}`}
      style={{ color: t.primaryDeep, borderColor: t.primary + "55", background: "transparent" }}
    >
      {children}
    </button>
  );
}

function IconBtn({ icon: Icon, onClick, t, title, danger }) {
  return (
    <button
      onClick={onClick}
      title={title}
      className="inline-flex h-9 w-9 items-center justify-center rounded-full transition-transform hover:scale-110"
      style={{ background: danger ? "rgba(220,50,50,0.12)" : (t.primary + "18"), color: danger ? "#D64545" : t.primaryDeep }}
    >
      <Icon size={16} />
    </button>
  );
}

function Field({ label, children, required }) {
  return (
    <label className="block mb-4">
      <span className="mb-1.5 block text-sm font-bold tracking-wide" style={{ fontFamily: "'Baloo 2', sans-serif" }}>
        {label} {required && <span style={{ color: "#FF5A8A" }}>*</span>}
      </span>
      {children}
    </label>
  );
}

function inputStyle(t) {
  return {
    background: t.inputBg,
    color: t.text,
    borderColor: t.cardBorder,
  };
}

const inputClass = "w-full rounded-2xl border-2 px-4 py-3 text-[15px] outline-none transition-all focus:scale-[1.01]";

/* ============================== NAV ============================== */

const NAV_ITEMS = [
  { id: "home", label: "Home" },
  { id: "register", label: "Register" },
  { id: "newsletter", label: "Newsletter" },
  { id: "achievements", label: "Achievements" },
  { id: "about", label: "About" },
];

function NavBar({ view, setView, t, dark, setDark, isAdmin, onLogoutAdmin }) {
  const [open, setOpen] = useState(false);
  return (
    <div
      className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md border-b"
      style={{ background: t.navBg, borderColor: t.cardBorder }}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3">
        <button className="flex items-center gap-2" onClick={() => { setView("home"); setOpen(false); }}>
          <span className="text-2xl">🦩</span>
          <span className="text-lg font-extrabold" style={{ color: t.primaryDeep, fontFamily: "'Baloo 2', sans-serif" }}>
            Flamingoes Hub
          </span>
        </button>

        <div className="hidden items-center gap-1 md:flex">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              onClick={() => setView(item.id)}
              className="rounded-full px-4 py-2 text-sm font-bold transition-all"
              style={{
                color: view === item.id ? "#fff" : t.text,
                background: view === item.id ? `linear-gradient(135deg, ${t.primary}, ${t.primaryDeep})` : "transparent",
              }}
            >
              {item.label}
            </button>
          ))}
          <button
            onClick={() => setView(isAdmin ? "admin" : "adminLogin")}
            className="ml-1 flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-bold transition-all"
            style={{ color: view === "admin" || view === "adminLogin" ? "#fff" : t.text, background: view === "admin" || view === "adminLogin" ? `linear-gradient(135deg, ${t.primary}, ${t.primaryDeep})` : "transparent" }}
          >
            <Lock size={14} /> {isAdmin ? "Dashboard" : "Admin Login"}
          </button>
          {isAdmin && (
            <button onClick={onLogoutAdmin} title="Log out" className="ml-1 rounded-full p-2 transition-transform hover:scale-110" style={{ color: t.textMuted }}>
              <LogOut size={16} />
            </button>
          )}
          <button
            onClick={() => setDark(!dark)}
            className="ml-2 flex h-9 w-9 items-center justify-center rounded-full transition-transform hover:scale-110"
            style={{ background: t.primary + "18", color: t.primaryDeep }}
            title="Toggle dark mode"
          >
            {dark ? <Sun size={16} /> : <Moon size={16} />}
          </button>
        </div>

        <button className="md:hidden" onClick={() => setOpen(!open)} style={{ color: t.primaryDeep }}>
          {open ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {open && (
        <div className="flex flex-col gap-1 px-5 pb-4 md:hidden">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              onClick={() => { setView(item.id); setOpen(false); }}
              className="rounded-xl px-4 py-2.5 text-left text-sm font-bold"
              style={{ color: view === item.id ? "#fff" : t.text, background: view === item.id ? `linear-gradient(135deg, ${t.primary}, ${t.primaryDeep})` : t.cardBg }}
            >
              {item.label}
            </button>
          ))}
          <button
            onClick={() => { setView(isAdmin ? "admin" : "adminLogin"); setOpen(false); }}
            className="flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-left text-sm font-bold"
            style={{ color: t.text, background: t.cardBg }}
          >
            <Lock size={14} /> {isAdmin ? "Dashboard" : "Admin Login"}
          </button>
          {isAdmin && (
            <button onClick={() => { onLogoutAdmin(); setOpen(false); }} className="flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-left text-sm font-bold" style={{ color: t.text, background: t.cardBg }}>
              <LogOut size={14} /> Log out
            </button>
          )}
          <button
            onClick={() => setDark(!dark)}
            className="flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-left text-sm font-bold"
            style={{ color: t.text, background: t.cardBg }}
          >
            {dark ? <Sun size={14} /> : <Moon size={14} />} {dark ? "Light mode" : "Dark mode"}
          </button>
        </div>
      )}
    </div>
  );
}

/* ============================== COUNTDOWN ============================== */

function useCountdown(targetISO, targetTime) {
  const [remaining, setRemaining] = useState(null);
  useEffect(() => {
    if (!targetISO) return;
    function tick() {
      const target = new Date(`${targetISO}T${to24h(targetTime) || "09:00"}:00`);
      const diff = target.getTime() - Date.now();
      if (diff <= 0) {
        setRemaining({ done: true });
        return;
      }
      const d = Math.floor(diff / 86400000);
      const h = Math.floor((diff % 86400000) / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setRemaining({ d, h, m, s });
    }
    tick();
    const iv = setInterval(tick, 1000);
    return () => clearInterval(iv);
  }, [targetISO, targetTime]);
  return remaining;
}

function to24h(t) {
  if (!t) return null;
  const m = t.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
  if (!m) return null;
  let [, hh, mm, ap] = m;
  hh = parseInt(hh, 10);
  if (ap) {
    if (/pm/i.test(ap) && hh !== 12) hh += 12;
    if (/am/i.test(ap) && hh === 12) hh = 0;
  }
  return `${String(hh).padStart(2, "0")}:${mm}`;
}

function CountdownCard({ nextEvent, t }) {
  const remaining = useCountdown(nextEvent?.event_date, nextEvent?.event_time);
  if (!nextEvent) {
    return (
      <Card t={t} className="p-8 text-center">
        <Sparkles className="mx-auto mb-2" style={{ color: t.accent }} />
        <p className="font-bold" style={{ color: t.text }}>No upcoming events yet — check back soon!</p>
      </Card>
    );
  }
  return (
    <Card t={t} className="overflow-hidden p-8 text-center relative">
      <p className="mb-1 text-xs font-bold uppercase tracking-[0.2em]" style={{ color: t.primary }}>Next Event</p>
      <h3 className="mb-4 text-2xl font-extrabold" style={{ color: t.text, fontFamily: "'Baloo 2', sans-serif" }}>{nextEvent.title}</h3>
      {remaining?.done ? (
        <p className="text-lg font-bold" style={{ color: t.accent }}>Happening now! 🎉</p>
      ) : remaining ? (
        <div className="flex items-center justify-center gap-3 sm:gap-5">
          {[['Days', remaining.d], ['Hours', remaining.h], ['Mins', remaining.m], ['Secs', remaining.s]].map(([label, val]) => (
            <div key={label} className="flex flex-col items-center">
              <div
                className="flex h-16 w-16 items-center justify-center rounded-2xl text-2xl font-extrabold text-white sm:h-20 sm:w-20 sm:text-3xl"
                style={{ background: `linear-gradient(145deg, ${t.primary}, ${t.primaryDeep})` }}
              >
                {String(val).padStart(2, '0')}
              </div>
              <span className="mt-1.5 text-xs font-bold" style={{ color: t.textMuted }}>{label}</span>
            </div>
          ))}
        </div>
      ) : null}
      {(nextEvent.location || nextEvent.event_time) && (
        <p className="mt-4 flex items-center justify-center gap-3 text-sm font-semibold" style={{ color: t.textMuted }}>
          {nextEvent.event_time && <span className="flex items-center gap-1"><Clock size={14} />{nextEvent.event_time}</span>}
          {nextEvent.location && <span className="flex items-center gap-1"><MapPin size={14} />{nextEvent.location}</span>}
        </p>
      )}
    </Card>
  );
}

/* ============================== HOME SECTIONS ============================== */

function Hero({ setView, t }) {
  return (
    <section className="relative overflow-hidden px-5 pb-16 pt-32 text-center sm:pt-40">
      <FloatingFlamingoes />
      <div className="relative z-10 mx-auto max-w-3xl">
        <div className="mb-5 flex justify-center">
          <div
            className="flex h-24 w-24 items-center justify-center rounded-[32px] text-5xl shadow-lg"
            style={{ background: `linear-gradient(145deg, ${t.primary}, ${t.primaryDeep})` }}
          >
            🦩
          </div>
        </div>
        <h1 className="mb-2 text-4xl font-extrabold sm:text-6xl" style={{ color: t.text, fontFamily: "'Baloo 2', sans-serif" }}>
          Flamingoes Hub
        </h1>
        <p className="mb-8 text-xl font-bold sm:text-2xl" style={{ color: t.primaryDeep, fontFamily: "'Baloo 2', sans-serif" }}>
          Go Go Flamingo! 🦩
        </p>
        <PrimaryButton onClick={() => setView("register")} t={t} className="text-lg px-8 py-4 animate-pulse-slow">
          <PartyPopper size={20} /> Register for an Event
        </PrimaryButton>
      </div>
    </section>
  );
}

function HomePage({ setView, t, events, announcements, spotlights, achievements }) {
  const nextEvent = useMemo(() => {
    const upcoming = [...events].filter((e) => e.event_date >= todayISO()).sort((a,b)=>a.event_date.localeCompare(b.event_date));
    return upcoming[0] || null;
  }, [events]);

  return (
    <div className="space-y-8">
      <Hero setView={setView} t={t} />
      <div className="mx-auto grid max-w-6xl gap-6 px-5 lg:grid-cols-[1.2fr_0.8fr]">
        <CountdownCard nextEvent={nextEvent} t={t} />
        <Card t={t} className="p-8">
          <div className="mb-4 flex items-center gap-2">
            <Bell size={18} style={{ color: t.primaryDeep }} />
            <h2 className="text-xl font-extrabold" style={{ color: t.text, fontFamily: "'Baloo 2', sans-serif" }}>Announcements</h2>
          </div>
          {announcements.length === 0 ? (
            <p style={{ color: t.textMuted }}>No announcements yet.</p>
          ) : (
            <ul className="space-y-3">
              {announcements.map((a) => (
                <li key={a.id} className="rounded-2xl border p-3" style={{ borderColor: t.cardBorder, background: t.inputBg }}>
                  <div className="font-semibold" style={{ color: t.text }}>{a.title}</div>
                  <div className="text-sm" style={{ color: t.textMuted }}>{a.message}</div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <div className="mx-auto grid max-w-6xl gap-6 px-5 lg:grid-cols-3">
        <Card t={t} className="p-8">
          <div className="mb-4 flex items-center gap-2">
            <Calendar size={18} style={{ color: t.primaryDeep }} />
            <h2 className="text-xl font-extrabold" style={{ color: t.text, fontFamily: "'Baloo 2', sans-serif" }}>Upcoming Events</h2>
          </div>
          {events.length === 0 ? (
            <p style={{ color: t.textMuted }}>No events yet.</p>
          ) : (
            <div className="space-y-3">
              {events.slice(0, 3).map((e) => (
                <div key={e.id} className="rounded-2xl border p-3" style={{ borderColor: t.cardBorder, background: t.inputBg }}>
                  <div className="flex items-center justify-between gap-2">
                    <div className="font-semibold" style={{ color: t.text }}>{e.title}</div>
                    <span className="text-xs font-bold" style={{ color: t.primaryDeep }}>{e.event_date}</span>
                  </div>
                  <div className="text-sm" style={{ color: t.textMuted }}>{e.location || "TBA"}</div>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card t={t} className="p-8">
          <div className="mb-4 flex items-center gap-2">
            <Star size={18} style={{ color: t.primaryDeep }} />
            <h2 className="text-xl font-extrabold" style={{ color: t.text, fontFamily: "'Baloo 2', sans-serif" }}>Spotlights</h2>
          </div>
          {spotlights.length === 0 ? (
            <p style={{ color: t.textMuted }}>No spotlights yet.</p>
          ) : (
            <div className="space-y-3">
              {spotlights.map((s) => (
                <div key={s.id} className="rounded-2xl border p-3" style={{ borderColor: t.cardBorder, background: t.inputBg }}>
                  <div className="font-semibold" style={{ color: t.text }}>{s.student_name}</div>
                  <div className="text-sm" style={{ color: t.textMuted }}>{s.achievement}</div>
                  {s.grade && <div className="mt-1 text-xs font-semibold" style={{ color: t.primaryDeep }}>{s.grade}</div>}
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card t={t} className="p-8">
          <div className="mb-4 flex items-center gap-2">
            <Trophy size={18} style={{ color: t.primaryDeep }} />
            <h2 className="text-xl font-extrabold" style={{ color: t.text, fontFamily: "'Baloo 2', sans-serif" }}>Achievements</h2>
          </div>
          {achievements.length === 0 ? (
            <p style={{ color: t.textMuted }}>No achievements yet.</p>
          ) : (
            <div className="space-y-3">
              {achievements.map((a) => (
                <div key={a.id} className="rounded-2xl border p-3" style={{ borderColor: t.cardBorder, background: t.inputBg }}>
                  <div className="font-semibold" style={{ color: t.text }}>{a.student_name || a.title || "Achievement"}</div>
                  <div className="text-sm" style={{ color: t.textMuted }}>{a.achievement || a.desc || ""}</div>
                  {(a.grade || a.section || a.category) && (
                    <div className="mt-1 text-xs font-semibold" style={{ color: t.primaryDeep }}>
                      {a.grade ? `${a.grade}` : ""}{a.grade && a.section ? " • " : ""}{a.section ? `${a.section}` : ""}{(a.grade || a.section) && a.category ? " • " : ""}{a.category ? `${a.category}` : ""}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

/* ============================== FORMS ============================== */

function RegisterPage({ t, onSubmit, initialValues }) {
  const [form, setForm] = useState(initialValues || {
    name: "",
    email: "",
    phone: "",
    year: "",
    branch: "",
    event: "",
    message: "",
  });

  useEffect(() => {
    setForm(initialValues || {
      name: "",
      email: "",
      phone: "",
      year: "",
      branch: "",
      event: "",
      message: "",
    });
  }, [initialValues]);

  return (
    <div className="mx-auto max-w-5xl px-5 py-8 pt-24">
      <Card t={t} className="overflow-hidden">
        <div className="bg-gradient-to-r from-pink-500 to-rose-500 p-8 text-white">
          <h1 className="text-3xl font-extrabold" style={{ fontFamily: "'Baloo 2', sans-serif" }}>Register</h1>
          <p className="mt-2 text-pink-100">Reserve your spot for upcoming activities.</p>
        </div>
        <div className="p-8">
          <div className="grid gap-6 md:grid-cols-2">
            <Field label="Full Name" required>
              <input className={inputClass} style={inputStyle(t)} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Enter your name" />
            </Field>
            <Field label="Email" required>
              <input className={inputClass} style={inputStyle(t)} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="Enter your email" />
            </Field>
            <Field label="Phone" required>
              <input className={inputClass} style={inputStyle(t)} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="Enter phone number" />
            </Field>
            <Field label="Year" required>
              <input className={inputClass} style={inputStyle(t)} value={form.year} onChange={(e) => setForm({ ...form, year: e.target.value })} placeholder="e.g. 2nd Year" />
            </Field>
            <Field label="Branch" required>
              <input className={inputClass} style={inputStyle(t)} value={form.branch} onChange={(e) => setForm({ ...form, branch: e.target.value })} placeholder="e.g. CSE" />
            </Field>
            <Field label="Event Interested In" required>
              <input className={inputClass} style={inputStyle(t)} value={form.event} onChange={(e) => setForm({ ...form, event: e.target.value })} placeholder="e.g. Hackathon" />
            </Field>
            <div className="md:col-span-2">
              <Field label="Message">
                <textarea className={inputClass} rows={4} style={inputStyle(t)} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} placeholder="Tell us something" />
              </Field>
            </div>
          </div>
          <div className="mt-5 flex flex-wrap gap-3">
            <PrimaryButton onClick={() => onSubmit(form)} t={t}>Submit</PrimaryButton>
          </div>
        </div>
      </Card>
    </div>
  );
}

function NewsletterPage({ t, newsletters, onSubmit, initialValues }) {
  const [form, setForm] = useState(initialValues || { name: "", email: "", message: "" });
  useEffect(() => {
    setForm(initialValues || { name: "", email: "", message: "" });
  }, [initialValues]);
  return (
    <div className="mx-auto max-w-5xl px-5 py-8 pt-24">
      <Card t={t} className="overflow-hidden">
        <div className="bg-gradient-to-r from-amber-500 to-orange-500 p-8 text-white">
          <h1 className="text-3xl font-extrabold" style={{ fontFamily: "'Baloo 2', sans-serif" }}>Newsletter</h1>
          <p className="mt-2 text-orange-100">Subscribe and stay updated.</p>
        </div>
        <div className="p-8">
          <div className="grid gap-6 md:grid-cols-2">
            <Field label="Your Name" required>
              <input className={inputClass} style={inputStyle(t)} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Enter your name" />
            </Field>
            <Field label="Email" required>
              <input className={inputClass} style={inputStyle(t)} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="Enter your email" />
            </Field>
            <div className="md:col-span-2">
              <Field label="Message">
                <textarea className={inputClass} rows={4} style={inputStyle(t)} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} placeholder="Tell us what you want to hear about" />
              </Field>
            </div>
          </div>
          <div className="mt-5 flex flex-wrap gap-3">
            <PrimaryButton onClick={() => onSubmit(form)} t={t}>Subscribe</PrimaryButton>
          </div>

          {newsletters.length > 0 && (
            <div className="mt-8">
              <h2 className="mb-3 text-xl font-extrabold" style={{ color: t.text, fontFamily: "'Baloo 2', sans-serif" }}>Available Newsletters</h2>
              <div className="space-y-3">
                {newsletters.map((item) => (
                  <a
                    key={item.id}
                    href={item.file_url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2 rounded-2xl border px-4 py-3 text-sm font-semibold transition hover:scale-[1.01]"
                    style={{ borderColor: t.cardBorder, background: t.inputBg, color: t.primaryDeep }}
                  >
                    <span>📄</span>
                    <span>{item.title || "Download Newsletter"}</span>
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}

function FeedbackPage({ t, onSubmit, initialValues }) {
  const [form, setForm] = useState(initialValues || { name: "", email: "", message: "" });
  useEffect(() => {
    setForm(initialValues || { name: "", email: "", message: "" });
  }, [initialValues]);
  return (
    <div className="mx-auto max-w-5xl px-5 py-8 pt-24">
      <Card t={t} className="overflow-hidden">
        <div className="bg-gradient-to-r from-indigo-500 to-violet-500 p-8 text-white">
          <h1 className="text-3xl font-extrabold" style={{ fontFamily: "'Baloo 2', sans-serif" }}>Feedback</h1>
          <p className="mt-2 text-indigo-100">Share your thoughts and ideas.</p>
        </div>
        <div className="p-8">
          <div className="grid gap-6 md:grid-cols-2">
            <Field label="Your Name" required>
              <input className={inputClass} style={inputStyle(t)} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Enter your name" />
            </Field>
            <Field label="Email" required>
              <input className={inputClass} style={inputStyle(t)} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="Enter your email" />
            </Field>
            <div className="md:col-span-2">
              <Field label="Message" required>
                <textarea className={inputClass} rows={5} style={inputStyle(t)} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} placeholder="Tell us what you think" />
              </Field>
            </div>
          </div>
          <div className="mt-5 flex flex-wrap gap-3">
            <PrimaryButton onClick={() => onSubmit(form)} t={t}>Send Feedback</PrimaryButton>
          </div>
        </div>
      </Card>
    </div>
  );
}

/* ============================== ADMIN ============================== */

function AdminLoginPage({ t, onLogin, error }) {
  const [password, setPassword] = useState("");
  return (
    <div className="mx-auto max-w-xl px-5 py-8 pt-24">
      <Card t={t} className="overflow-hidden">
        <div className="bg-gradient-to-r from-slate-700 to-slate-900 p-8 text-white">
          <h1 className="text-3xl font-extrabold" style={{ fontFamily: "'Baloo 2', sans-serif" }}>Admin Login</h1>
          <p className="mt-2 text-slate-300">Access the management dashboard.</p>
        </div>
        <div className="p-8">
          <Field label="Password" required>
            <input type="password" className={inputClass} style={inputStyle(t)} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter admin password" />
          </Field>
          {error && <div className="mb-4 rounded-2xl border border-rose-300 bg-rose-50 p-3 text-sm font-semibold text-rose-600">{error}</div>}
          <PrimaryButton onClick={() => onLogin(password)} t={t}>Login</PrimaryButton>
        </div>
      </Card>
    </div>
  );
}

function AdminDashboard({ t, config, setConfig, events, setEvents, announcements, setAnnouncements, registrations, setRegistrations, spotlights, setSpotlights, achievements, setAchievements, newsletters, setNewsletters, feedback, setFeedback, reloadFeedback, reloadSpotlight, reloadAchievements, onLogout }) {
  const [tab, setTab] = useState("events");
  const [form, setForm] = useState({});
  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState("");

  const saveConfig = useCallback(() => {
    saveKey(KEYS.config, config);
  }, [config]);

  const resetForm = useCallback(() => {
    setForm({});
    setEditingId(null);
  }, []);

  const reloadEvents = useCallback(async () => {
    const { data, error } = await supabase
      .from("events")
      .select("*")
      .order("event_date", { ascending: true });

    if (error) throw error;
    setEvents(data ?? []);
  }, [setEvents]);

  const reloadNewsletters = useCallback(async () => {
    const { data, error } = await supabase
      .from("newsletters")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;
    setNewsletters(data ?? []);
  }, [setNewsletters]);

  const startEdit = useCallback((item) => {
    setForm(item);
    setEditingId(item.id);
  }, []);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    const type = tab;
    if (!form.title && !form.name && !form.student_name) return;

    if (type === "events") {
      try {
        if (editingId) {
          const { error } = await supabase
            .from("events")
            .update({
              title: form.title,
              description: form.description,
              location: form.location,
              event_date: form.event_date,
              event_time: form.event_time,
            })
            .eq("id", editingId);

          if (error) throw error;
        } else {
          const { error } = await supabase.from("events").insert({
            title: form.title,
            description: form.description,
            location: form.location,
            event_date: form.event_date,
            event_time: form.event_time,
          });

          if (error) throw error;
        }

        await reloadEvents();
        resetForm();
      } catch (error) {
        console.error("EVENT ERROR:", error);
        alert(error.message);
      }
      return;
    }

    if (type === "announcements") {
      try {
        const message = form.body ?? form.message ?? "";

        if (editingId) {
          const { error } = await supabase
            .from("announcements")
            .update({
              title: form.title,
              message,
            })
            .eq("id", editingId);

          if (error) throw error;
        } else {
          const { error } = await supabase
            .from("announcements")
            .insert({
              title: form.title,
              message,
            });

          if (error) throw error;
        }

        const { data, error: fetchError } = await supabase
          .from("announcements")
          .select("*")
          .order("created_at", { ascending: false });

        if (fetchError) throw fetchError;

        setAnnouncements(data || []);
        resetForm();
      } catch (error) {
        console.error(error);
        alert("Failed to save announcement.");
      }
      return;
    }

    if (type === "spotlights") {
      try {
        if (editingId) {
          const { error } = await supabase
            .from("student_spotlight")
            .update({
              student_name: form.student_name,
              achievement: form.achievement,
              grade: form.grade,
            })
            .eq("id", editingId);

          if (error) throw error;
        } else {
          const { error } = await supabase
            .from("student_spotlight")
            .insert({
              student_name: form.student_name,
              achievement: form.achievement,
              grade: form.grade,
            });

          if (error) throw error;
        }

        await reloadSpotlight();
        resetForm();
      } catch (error) {
        console.error("SPOTLIGHT ERROR:", error);
        alert(error.message);
      }
      return;
    }

    if (type === "achievements") {
      try {
        if (editingId) {
          const { error } = await supabase
            .from("achievements")
            .update({
              student_name: form.student_name,
              grade: form.grade,
              section: form.section,
              achievement: form.achievement,
              category: form.category,
              email: form.email,
            })
            .eq("id", editingId);

          if (error) throw error;
        } else {
          const { error } = await supabase.from("achievements").insert({
            student_name: form.student_name,
            grade: form.grade,
            section: form.section,
            achievement: form.achievement,
            category: form.category,
            email: form.email,
          });

          if (error) throw error;
        }

        await reloadAchievements();
        resetForm();
      } catch (error) {
        console.error("ACHIEVEMENTS ERROR:", error);
        alert(error.message);
      }
      return;
    }

    if (type === "newsletters") {
      try {
        const title = form.title?.trim();
        if (!title) {
          alert("Please enter a newsletter title.");
          return;
        }

        let fileUrl = null;
        if (form.file) {
          const filename = `${Date.now()}-${form.file.name}`;
          const { error: uploadError } = await supabase.storage
            .from("newsletters")
            .upload(filename, form.file);

          if (uploadError) throw uploadError;

          const { data } = supabase.storage
            .from("newsletters")
            .getPublicUrl(filename);

          fileUrl = data.publicUrl;
        }

        if (editingId) {
          const payload = { title };
          if (fileUrl) payload.file_url = fileUrl;

          const { error } = await supabase
            .from("newsletters")
            .update(payload)
            .eq("id", editingId);

          if (error) throw error;
        } else {
          if (!fileUrl) {
            alert("Please select a PDF file.");
            return;
          }

          const { error } = await supabase
            .from("newsletters")
            .insert({
              title,
              file_url: fileUrl,
            });

          if (error) throw error;
        }

        await reloadNewsletters();
        resetForm();
      } catch (error) {
        console.error("NEWSLETTER ERROR:", error);
        alert(error.message || "Failed to save newsletter.");
      }
      return;
    }

    if (type === "feedback") {
      const payload = { id: editingId || uid(), ...form };
      if (editingId) {
        setFeedback((prev) => prev.map((x) => x.id === editingId ? payload : x));
      } else {
        setFeedback((prev) => [payload, ...prev]);
      }
      resetForm();
      return;
    }
  }, [tab, form, editingId, resetForm, reloadEvents, reloadNewsletters, reloadSpotlight, reloadAchievements]);

  const filtered = useMemo(() => {
    const data = tab === "events" ? events : tab === "announcements" ? announcements : tab === "spotlights" ? spotlights : tab === "achievements" ? achievements : tab === "newsletters" ? newsletters : feedback;
    return data.filter((item) => JSON.stringify(item).toLowerCase().includes(search.toLowerCase()));
  }, [tab, events, announcements, spotlights, achievements, newsletters, feedback, search]);

  const reloadRegistrations = useCallback(async () => {
    const { data, error } = await supabase
      .from("registrations")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;
    setRegistrations(data ?? []);
  }, [setRegistrations]);

  return (
    <div className="mx-auto max-w-7xl px-5 py-8 pt-24">
      <Card t={t} className="overflow-hidden">
        <div className="bg-gradient-to-r from-slate-700 to-slate-900 p-8 text-white">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-3xl font-extrabold" style={{ fontFamily: "'Baloo 2', sans-serif" }}>Admin Dashboard</h1>
              <p className="mt-2 text-slate-300">Manage events, announcements, spotlights, achievements, newsletters and feedback.</p>
            </div>
            <PrimaryButton onClick={onLogout} t={t}>Logout</PrimaryButton>
          </div>
        </div>

        <div className="p-8">
          <div className="mb-6 flex flex-wrap gap-2">
            {[
              ["events", "Events"],
              ["announcements", "Announcements"],
              ["spotlights", "Spotlights"],
              ["achievements", "Achievements"],
              ["newsletters", "Newsletters"],
              ["feedback", "Feedback"],
            ].map(([key, label]) => (
              <button key={key} onClick={() => { setTab(key); resetForm(); }} className="rounded-full px-4 py-2 text-sm font-bold" style={{ color: tab === key ? "#fff" : t.text, background: tab === key ? `linear-gradient(135deg, ${t.primary}, ${t.primaryDeep})` : t.inputBg }}>
                {label}
              </button>
            ))}
          </div>

          <div className="mb-6 flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[220px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2" size={16} style={{ color: t.textMuted }} />
              <input className={inputClass} style={inputStyle(t)} value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search records" />
            </div>
            <PrimaryButton onClick={() => { setTab("events"); resetForm(); }} t={t}>Reset</PrimaryButton>
          </div>

          <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
            <Card t={t} className="p-5">
              <form onSubmit={handleSubmit} className="space-y-4">
                {tab === "events" && (
                  <>
                    <Field label="Title" required>
                      <input className={inputClass} style={inputStyle(t)} value={form.title || ""} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Event title" />
                    </Field>
                    <Field label="Description">
                      <textarea className={inputClass} rows={3} style={inputStyle(t)} value={form.description || ""} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Short description" />
                    </Field>
                    <Field label="Location">
                      <input className={inputClass} style={inputStyle(t)} value={form.location || ""} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="Location" />
                    </Field>
                    <Field label="Date" required>
                      <input type="date" className={inputClass} style={inputStyle(t)} value={form.event_date || ""} onChange={(e) => setForm({ ...form, event_date: e.target.value })} />
                    </Field>
                    <Field label="Time">
                      <input className={inputClass} style={inputStyle(t)} value={form.event_time || ""} onChange={(e) => setForm({ ...form, event_time: e.target.value })} placeholder="e.g. 10:00 AM" />
                    </Field>
                  </>
                )}

                {tab === "announcements" && (
                  <>
                    <Field label="Title" required>
                      <input className={inputClass} style={inputStyle(t)} value={form.title || ""} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Announcement title" />
                    </Field>
                    <Field label="Body" required>
                      <textarea className={inputClass} rows={4} style={inputStyle(t)} value={form.body || ""} onChange={(e) => setForm({ ...form, body: e.target.value })} placeholder="Announcement body" />
                    </Field>
                  </>
                )}

                {tab === "spotlights" && (
                  <>
                    <Field label="Student Name" required>
                      <input className={inputClass} style={inputStyle(t)} value={form.student_name || ""} onChange={(e) => setForm({ ...form, student_name: e.target.value })} placeholder="Student name" />
                    </Field>
                    <Field label="Achievement" required>
                      <textarea className={inputClass} rows={4} style={inputStyle(t)} value={form.achievement || ""} onChange={(e) => setForm({ ...form, achievement: e.target.value })} placeholder="Achievement details" />
                    </Field>
                    <Field label="Grade">
                      <input className={inputClass} style={inputStyle(t)} value={form.grade || ""} onChange={(e) => setForm({ ...form, grade: e.target.value })} placeholder="e.g. 2nd Year" />
                    </Field>
                  </>
                )}

                {tab === "achievements" && (
                  <>
                    <Field label="Student Name" required>
                      <input className={inputClass} style={inputStyle(t)} value={form.student_name || ""} onChange={(e) => setForm({ ...form, student_name: e.target.value })} placeholder="Student name" />
                    </Field>
                    <Field label="Achievement" required>
                      <textarea className={inputClass} rows={4} style={inputStyle(t)} value={form.achievement || ""} onChange={(e) => setForm({ ...form, achievement: e.target.value })} placeholder="Achievement details" />
                    </Field>
                    <Field label="Grade">
                      <input className={inputClass} style={inputStyle(t)} value={form.grade || ""} onChange={(e) => setForm({ ...form, grade: e.target.value })} placeholder="e.g. 2nd Year" />
                    </Field>
                    <Field label="Section">
                      <input className={inputClass} style={inputStyle(t)} value={form.section || ""} onChange={(e) => setForm({ ...form, section: e.target.value })} placeholder="e.g. A" />
                    </Field>
                    <Field label="Category">
                      <input className={inputClass} style={inputStyle(t)} value={form.category || ""} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="e.g. Sports" />
                    </Field>
                    <Field label="Email">
                      <input className={inputClass} style={inputStyle(t)} value={form.email || ""} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="student@email.com" />
                    </Field>
                  </>
                )}

                {tab === "newsletters" && (
                  <>
                    <Field label="Title" required>
                      <input className={inputClass} style={inputStyle(t)} value={form.title || ""} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Newsletter title" />
                    </Field>
                    <Field label="PDF File" required>
                      <input
                        type="file"
                        accept="application/pdf"
                        className={inputClass}
                        style={inputStyle(t)}
                        onChange={(e) => setForm({ ...form, file: e.target.files?.[0] || null })}
                      />
                    </Field>
                  </>
                )}

                {tab === "feedback" && (
                  <>
                    <Field label="Name" required>
                      <input className={inputClass} style={inputStyle(t)} value={form.name || ""} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Feedback name" />
                    </Field>
                    <Field label="Email" required>
                      <input className={inputClass} style={inputStyle(t)} value={form.email || ""} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="Feedback email" />
                    </Field>
                    <Field label="Message" required>
                      <textarea className={inputClass} rows={4} style={inputStyle(t)} value={form.message || ""} onChange={(e) => setForm({ ...form, message: e.target.value })} placeholder="Feedback message" />
                    </Field>
                  </>
                )}

                <div className="flex flex-wrap gap-3">
                  <PrimaryButton type="submit" t={t}>{editingId ? "Update" : "Add"}</PrimaryButton>
                  {editingId && <GhostButton onClick={resetForm} t={t}>Cancel</GhostButton>}
                </div>
              </form>
            </Card>

            <Card t={t} className="p-5">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-extrabold" style={{ color: t.text, fontFamily: "'Baloo 2', sans-serif" }}>Records</h3>
                <span className="rounded-full px-3 py-1 text-xs font-bold" style={{ background: t.primary + "18", color: t.primaryDeep }}>{filtered.length}</span>
              </div>
              <div className="space-y-3">
                {filtered.map((item) => (
                  <div key={item.id} className="rounded-2xl border p-3" style={{ borderColor: t.cardBorder, background: t.inputBg }}>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="font-semibold" style={{ color: t.text }}>{item.title || item.name || item.email || "Item"}</div>
                        <div className="text-sm" style={{ color: t.textMuted }}>{item.body || item.desc || item.message || item.venue || item.date || ""}</div>
                      </div>
                      <div className="flex gap-2">
                        <IconBtn icon={Pencil} onClick={() => startEdit(item)} t={t} title="Edit" />
                        <IconBtn icon={Trash2} onClick={async () => {
                          if (tab === "events") {
                            try {
                              const { error } = await supabase
                                .from("events")
                                .delete()
                                .eq("id", item.id);

                              if (error) throw error;
                              await reloadEvents();
                            } catch (error) {
                              console.error(error);
                              alert("Failed to delete event.");
                            }
                          } else if (tab === "announcements") {
                            try {
                              const { error } = await supabase
                                .from("announcements")
                                .delete()
                                .eq("id", item.id);

                              if (error) throw error;

                              const { data, error: fetchError } = await supabase
                                .from("announcements")
                                .select("*")
                                .order("created_at", { ascending: false });

                              if (fetchError) throw fetchError;
                              setAnnouncements(data || []);
                            } catch (error) {
                              console.error(error);
                              alert("Failed to delete announcement.");
                            }
                          } else if (tab === "spotlights") {
                            try {
                              const { error } = await supabase
                                .from("student_spotlight")
                                .delete()
                                .eq("id", item.id);

                              if (error) throw error;
                              await reloadSpotlight();
                            } catch (error) {
                              console.error(error);
                              alert("Failed to delete spotlight.");
                            }
                          } else if (tab === "achievements") {
                            try {
                              const { error } = await supabase
                                .from("achievements")
                                .delete()
                                .eq("id", item.id);

                              if (error) throw error;
                              await reloadAchievements();
                            } catch (error) {
                              console.error(error);
                              alert("Failed to delete achievement.");
                            }
                          } else if (tab === "newsletters") {
                            try {
                              const { error } = await supabase
                                .from("newsletters")
                                .delete()
                                .eq("id", item.id);

                              if (error) throw error;
                              await reloadNewsletters();
                            } catch (error) {
                              console.error(error);
                              alert("Failed to delete newsletter.");
                            }
                          } else if (tab === "feedback") {
                            try {
                              const { error } = await supabase
                                .from("feedback")
                                .delete()
                                .eq("id", item.id);

                              if (error) throw error;
                              await reloadFeedback();
                            } catch (error) {
                              console.error(error);
                              alert("Failed to delete feedback.");
                            }
                          }
                        }} t={t} title="Delete" danger />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          <Card t={t} className="mt-6 p-5">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-extrabold" style={{ color: t.text, fontFamily: "'Baloo 2', sans-serif" }}>Registrations</h3>
              <span className="rounded-full px-3 py-1 text-xs font-bold" style={{ background: t.primary + "18", color: t.primaryDeep }}>{registrations.length}</span>
            </div>
            <div className="space-y-3">
              {registrations.length === 0 ? (
                <p className="text-sm" style={{ color: t.textMuted }}>No registrations yet.</p>
              ) : registrations.map((item) => (
                <div key={item.id} className="rounded-2xl border p-3" style={{ borderColor: t.cardBorder, background: t.inputBg }}>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="font-semibold" style={{ color: t.text }}>{item.name || "Registration"}</div>
                      <div className="text-sm" style={{ color: t.textMuted }}>{item.event || item.email || ""}</div>
                    </div>
                    <IconBtn icon={Trash2} onClick={async () => {
                      try {
                        const { error } = await supabase
                          .from("registrations")
                          .delete()
                          .eq("id", item.id);

                        if (error) throw error;
                        await reloadRegistrations();
                      } catch (error) {
                        console.error(error);
                        alert("Failed to delete registration.");
                      }
                    }} t={t} title="Delete" danger />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </Card>
    </div>
  );
}

/* ============================== ABOUT ============================== */

function AboutPage({ t }) {
  return (
    <div className="mx-auto max-w-5xl px-5 py-8 pt-24">
      <Card t={t} className="overflow-hidden">
        <div className="bg-gradient-to-r from-pink-500 to-rose-500 p-8 text-white">
          <h1 className="text-3xl font-extrabold" style={{ fontFamily: "'Baloo 2', sans-serif" }}>About Flamingoes Hub</h1>
          <p className="mt-2 text-pink-100">A vibrant community portal for reminders, updates, and registrations.</p>
        </div>
        <div className="p-8 space-y-6">
          <div className="grid gap-6 md:grid-cols-3">
            <Card t={t} className="p-6">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl" style={{ background: t.primary + "18", color: t.primaryDeep }}>
                <Calendar size={20} />
              </div>
              <h3 className="mb-2 text-lg font-extrabold" style={{ color: t.text, fontFamily: "'Baloo 2', sans-serif" }}>Events</h3>
              <p style={{ color: t.textMuted }}>Track upcoming activities and important dates.</p>
            </Card>
            <Card t={t} className="p-6">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl" style={{ background: t.primary + "18", color: t.primaryDeep }}>
                <Bell size={20} />
              </div>
              <h3 className="mb-2 text-lg font-extrabold" style={{ color: t.text, fontFamily: "'Baloo 2', sans-serif" }}>Announcements</h3>
              <p style={{ color: t.textMuted }}>Share important updates instantly.</p>
            </Card>
            <Card t={t} className="p-6">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl" style={{ background: t.primary + "18", color: t.primaryDeep }}>
                <ShieldCheck size={20} />
              </div>
              <h3 className="mb-2 text-lg font-extrabold" style={{ color: t.text, fontFamily: "'Baloo 2', sans-serif" }}>Secure Admin</h3>
              <p style={{ color: t.textMuted }}>Manage content safely with password-protected access.</p>
            </Card>
          </div>
        </div>
      </Card>
    </div>
  );
}

/* ============================== APP ============================== */

export default function App() {
  const { dark, setDark, t } = useTheme();
  const [view, setView] = useState("home");
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminError, setAdminError] = useState("");
  const [events, setEvents] = useState(seedEvents);
  const [announcements, setAnnouncements] = useState(seedAnnouncements);
  const [registrations, setRegistrations] = useState([]);
  const [spotlights, setSpotlights] = useState(seedSpotlights);
  const [achievements, setAchievements] = useState(seedAchievements);
  const [newsletters, setNewsletters] = useState(seedNewsletters);
  const [feedback, setFeedback] = useState([]);
  const [config, setConfig] = useState(seedConfig);

  const reloadSpotlight = useCallback(async () => {
    const { data, error } = await supabase
      .from("student_spotlight")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
      return;
    }

    setSpotlights(data ?? []);
  }, [setSpotlights]);

  const reloadAchievements = useCallback(async () => {
    const { data, error } = await supabase
      .from("achievements")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
      return;
    }

    setAchievements(data ?? []);
  }, [setAchievements]);

  useEffect(() => {
    async function hydrate() {
      const [{ data: eventData }, a, r, { data: newsletterData }, f, c] = await Promise.all([
        supabase.from("events").select("*").order("event_date", { ascending: true }),
        supabase.from("announcements").select("*").order("created_at", { ascending: false }),
        supabase.from("registrations").select("*").order("created_at", { ascending: false }),
        supabase.from("newsletters").select("*").order("created_at", { ascending: false }),
        supabase.from("feedback").select("*").order("created_at", { ascending: false }),
        loadKey(KEYS.config, seedConfig),
      ]);
      setEvents(eventData ?? []);
      setAnnouncements(a?.data ?? seedAnnouncements);
      setRegistrations(r?.data ?? []);
      setNewsletters(newsletterData ?? []);
      setFeedback(f?.data ?? []);
      setConfig(c || seedConfig);
      await reloadSpotlight();
    }
    hydrate();
  }, [reloadSpotlight]);

  useEffect(() => {
    reloadAchievements();
  }, [reloadAchievements]);

  const handleRegister = useCallback(async (values) => {
    try {
      const { error } = await supabase.from("registrations").insert({
        name: values.name,
        email: values.email,
        phone: values.phone,
        grade: values.year,
        section: values.branch,
        event: values.event,
        message: values.message,
      });

      if (error) {
        console.error(error);
        alert(error.message);
        return;
      }

      const { data, error: reloadError } = await supabase
        .from("registrations")
        .select("*")
        .order("created_at", { ascending: false });

      if (reloadError) throw reloadError;
      setRegistrations(data ?? []);
      alert("Registration received! We'll contact you soon.");
    } catch (error) {
      console.error("REGISTRATION ERROR:", error);
      alert(error.message || "Failed to submit registration.");
    }
  }, []);

  const handleNewsletter = useCallback(async (values) => {
    alert("Subscribed! We'll keep you updated.");
  }, []);

  const reloadFeedback = useCallback(async () => {
    const { data, error } = await supabase
      .from("feedback")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
      return;
    }

    setFeedback(data ?? []);
  }, [setFeedback]);

  const handleFeedback = useCallback(async (values) => {
    try {
      const { error } = await supabase.from("feedback").insert({
        name: values.name,
        email: values.email,
        message: values.message,
      });

      if (error) {
        console.error(error);
        alert(error.message);
        return;
      }

      await reloadFeedback();
      alert("Thanks for your feedback!");
    } catch (error) {
      console.error("FEEDBACK ERROR:", error);
      alert(error.message || "Failed to submit feedback.");
    }
  }, [reloadFeedback]);

  const handleAdminLogin = useCallback(async (password) => {
    if (password === config.password) {
      setIsAdmin(true);
      setView("admin");
      setAdminError("");
    } else {
      setAdminError("Incorrect password.");
    }
  }, [config.password, setView]);

  const handleAdminLogout = useCallback(() => {
    setIsAdmin(false);
    setView("home");
    setAdminError("");
  }, [setView]);

  return (
    <div className="min-h-screen" style={{ background: t.pageBg, color: t.text }}>
      <NavBar view={view} setView={setView} t={t} dark={dark} setDark={setDark} isAdmin={isAdmin} onLogoutAdmin={handleAdminLogout} />
      {view === "home" && <HomePage setView={setView} t={t} events={events} announcements={announcements} spotlights={spotlights} achievements={achievements} />}
      {view === "register" && <RegisterPage t={t} onSubmit={handleRegister} initialValues={{}} />}
      {view === "newsletter" && <NewsletterPage t={t} newsletters={newsletters} onSubmit={handleNewsletter} initialValues={{}} />}
      {view === "about" && <AboutPage t={t} />}
      {view === "achievements" && <div className="mx-auto max-w-5xl px-5 py-8 pt-24"><Card t={t} className="p-8"><h1 className="text-3xl font-extrabold" style={{ fontFamily: "'Baloo 2', sans-serif" }}>Achievements</h1><div className="mt-4 space-y-3">{achievements.map((a) => <div key={a.id} className="rounded-2xl border p-3" style={{ borderColor: t.cardBorder, background: t.inputBg }}><div className="font-semibold" style={{ color: t.text }}>{a.title}</div><div className="text-sm" style={{ color: t.textMuted }}>{a.desc}</div></div>)}</div></Card></div>}
      {view === "adminLogin" && <AdminLoginPage t={t} onLogin={handleAdminLogin} error={adminError} />}
      {view === "admin" && isAdmin && <AdminDashboard t={t} config={config} setConfig={setConfig} events={events} setEvents={setEvents} announcements={announcements} setAnnouncements={setAnnouncements} registrations={registrations} setRegistrations={setRegistrations} spotlights={spotlights} setSpotlights={setSpotlights} achievements={achievements} setAchievements={setAchievements} newsletters={newsletters} setNewsletters={setNewsletters} feedback={feedback} setFeedback={setFeedback} reloadFeedback={reloadFeedback} reloadSpotlight={reloadSpotlight} reloadAchievements={reloadAchievements} onLogout={handleAdminLogout} />}
    </div>
  );
}
