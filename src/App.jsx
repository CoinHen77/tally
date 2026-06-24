import React, { useState, useEffect, useRef } from "react";
import { Search, Plus, X, ChevronLeft, Check, Trash2, Tv, Film, Pencil, Minus, Loader2 } from "lucide-react";
import { initializeApp } from "firebase/app";
import { getDatabase, ref, onValue, set, get, remove } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyApP0tlDnKFzEKmBHD3dRw0P9fsqFlxiDA",
  authDomain: "tally-41760.firebaseapp.com",
  databaseURL: "https://tally-41760-default-rtdb.firebaseio.com",
  projectId: "tally-41760",
  storageBucket: "tally-41760.firebasestorage.app",
  messagingSenderId: "729360845352",
  appId: "1:729360845352:web:0cedd79e1573936f54431d"
};

const firebaseApp = initializeApp(firebaseConfig);
const db = getDatabase(firebaseApp);
const PROFILES = [
  { id: "shay-susan", label: "Shay & Susan", color: "#C2492F" },
  { id: "zach",       label: "Zach",         color: "#4F7959" },
];

function profileItemsRef(profileId) {
  return ref(db, `users/${profileId}/items`);
}

/* ---------- design tokens ---------- */
const C = {
  paper: "#FAF6EC",
  paperEdge: "#F1EAD9",
  ink: "#2B2A28",
  inkSoft: "#6B6356",
  line: "#C9C2B0",
  rule: "#A9B8D6",
  margin: "#C2492F",
  amber: "#B9842A",
  amberBg: "#F4E6CE",
  sage: "#4F7959",
  sageBg: "#E1ECE3",
  card: "#FFFFFF",
  shadow: "0 2px 10px rgba(43,42,40,0.08)",
};

const SERVICES = [
  { name: "Netflix",     color: "#C7141B", domain: "netflix.com" },
  { name: "Hulu",        color: "#1A8F5E", domain: "hulu.com" },
  { name: "Max",         color: "#5A2BB8", domain: "max.com" },
  { name: "Disney+",     color: "#0F3FB0", domain: "disneyplus.com" },
  { name: "Prime Video", color: "#007FA8", domain: "primevideo.com" },
  { name: "Apple TV+",   color: "#1D1D1F", domain: "tv.apple.com" },
  { name: "Paramount+",  color: "#0050C8", domain: "paramountplus.com" },
  { name: "Peacock",     color: "#5B4B8A", domain: "peacocktv.com" },
  { name: "Starz",       color: "#8B1A1A", domain: "starz.com" },
  { name: "Other",       color: "#8A8578", domain: null },
];

// Map TVMaze network/webChannel names to our SERVICES list
function matchService(tvmazeName) {
  if (!tvmazeName) return null;
  const n = tvmazeName.toLowerCase();
  if (n.includes("netflix")) return "Netflix";
  if (n.includes("hulu")) return "Hulu";
  if (n.includes("max") || n.includes("hbo")) return "Max";
  if (n.includes("disney")) return "Disney+";
  if (n.includes("amazon") || n.includes("prime")) return "Prime Video";
  if (n.includes("apple")) return "Apple TV+";
  if (n.includes("paramount")) return "Paramount+";
  if (n.includes("peacock")) return "Peacock";
  if (n.includes("starz")) return "Starz";
  return null;
}

function faviconUrl(domain) {
  return `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
}

function serviceMeta(name) {
  return SERVICES.find((s) => s.name.toLowerCase() === String(name || "").toLowerCase()) || { color: "#8A8578", domain: null };
}

function ServiceLogo({ name, logoUrl, size = 20, style: extraStyle = {} }) {
  const meta = serviceMeta(name);
  const [failed, setFailed] = React.useState(false);
  const src = logoUrl || (meta.domain ? faviconUrl(meta.domain) : null);
  if (src && !failed) {
    return (
      <img
        src={src}
        alt={name}
        onError={() => setFailed(true)}
        style={{ width: size, height: size, objectFit: "contain", borderRadius: 4, flexShrink: 0, ...extraStyle }}
      />
    );
  }
  return <span style={{ width: size * 0.5, height: size * 0.5, borderRadius: 99, background: meta.color, display: "inline-block", flexShrink: 0, ...extraStyle }} />;
}

function serviceColor(name) {
  return serviceMeta(name).color;
}

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function stripHtml(html) {
  if (!html) return "";
  return html.replace(/<[^>]*>/g, "").replace(/&amp;/g,"&").replace(/&lt;/g,"<").replace(/&gt;/g,">").replace(/&#39;/g,"'").replace(/&quot;/g,'"').trim();
}

/* ---------- tally mark control ---------- */
const BAR_BTN_W = 30;
const BAR_BTN_H = 38;
const BAR_GAP = 3;
const GROUP_W = 5 * BAR_BTN_W + 4 * BAR_GAP;

function TallyGroup({ startIndex, count, watched, onTap }) {
  const complete = count === 5 && watched >= startIndex + 5;
  return (
    <div style={{ position: "relative", width: count === 5 ? GROUP_W : count * BAR_BTN_W + (count - 1) * BAR_GAP, height: BAR_BTN_H }}>
      <div style={{ display: "flex", gap: BAR_GAP }}>
        {Array.from({ length: count }).map((_, i) => {
          const idx = startIndex + i;
          const filled = idx < watched;
          return (
            <button
              key={idx}
              onClick={() => onTap(idx)}
              aria-label={`Episode ${idx + 1}${filled ? ", watched" : ", not watched"}`}
              style={{
                width: BAR_BTN_W,
                height: BAR_BTN_H,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "transparent",
                border: "none",
                padding: 0,
                cursor: "pointer",
              }}
            >
              <span
                style={{
                  width: 4,
                  height: 28,
                  borderRadius: 2,
                  background: filled ? C.ink : C.line,
                  display: "block",
                  transition: "background 120ms ease",
                }}
              />
            </button>
          );
        })}
      </div>
      {complete && (
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            left: -6,
            top: "50%",
            width: GROUP_W + 12,
            height: 3,
            background: C.ink,
            transform: "translateY(-50%) rotate(-16deg)",
            pointerEvents: "none",
            borderRadius: 2,
          }}
        />
      )}
    </div>
  );
}

function TallyTracker({ total, watched, onChange }) {
  if (!total || total <= 0) return <div style={{ color: C.inkSoft, fontSize: 14 }}>No episode count yet</div>;
  const groups = [];
  for (let g = 0; g * 5 < total; g++) {
    groups.push({ start: g * 5, count: Math.min(5, total - g * 5) });
  }
  const handleTap = (idx) => {
    let next;
    if (watched === idx + 1) next = idx; // tap the last filled stroke to undo it
    else next = idx + 1;
    onChange(Math.max(0, Math.min(total, next)));
  };
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 10, rowGap: 6 }}>
      {groups.map((gr) => (
        <TallyGroup key={gr.start} startIndex={gr.start} count={gr.count} watched={watched} onTap={handleTap} />
      ))}
    </div>
  );
}

/* ---------- small ui bits ---------- */
function Chip({ label, color, domain, selected, onClick }) {
  const [logoFailed, setLogoFailed] = React.useState(false);
  const src = domain ? faviconUrl(domain) : null;
  return (
    <button
      onClick={onClick}
      style={{
        padding: "9px 14px",
        borderRadius: 999,
        border: selected ? `2px solid ${color}` : `1.5px solid ${C.line}`,
        background: selected ? color + "1f" : C.card,
        color: selected ? C.ink : C.inkSoft,
        fontSize: 15,
        fontWeight: selected ? 700 : 500,
        display: "flex",
        alignItems: "center",
        gap: 7,
        cursor: "pointer",
      }}
    >
      {src && !logoFailed
        ? <img src={src} alt="" onError={() => setLogoFailed(true)} style={{ width: 18, height: 18, objectFit: "contain", borderRadius: 3, flexShrink: 0 }} />
        : <span style={{ width: 9, height: 9, borderRadius: 99, background: color, display: "inline-block" }} />
      }
      {label}
    </button>
  );
}

function Stepper({ value, onChange, min = 1, max = 60 }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
      <button
        onClick={() => onChange(Math.max(min, value - 1))}
        style={{ width: 44, height: 44, borderRadius: 12, border: `1.5px solid ${C.line}`, background: C.card, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
        aria-label="Decrease"
      >
        <Minus size={20} color={C.ink} />
      </button>
      <div style={{ minWidth: 40, textAlign: "center", fontSize: 22, fontWeight: 800, color: C.ink }}>{value}</div>
      <button
        onClick={() => onChange(Math.min(max, value + 1))}
        style={{ width: 44, height: 44, borderRadius: 12, border: `1.5px solid ${C.line}`, background: C.card, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
        aria-label="Increase"
      >
        <Plus size={20} color={C.ink} />
      </button>
    </div>
  );
}

function PrimaryButton({ children, onClick, disabled, color = C.margin }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        width: "100%",
        padding: "16px 18px",
        borderRadius: 14,
        border: "none",
        background: disabled ? C.line : color,
        color: "#FFF",
        fontSize: 17,
        fontWeight: 800,
        cursor: disabled ? "default" : "pointer",
        boxShadow: disabled ? "none" : C.shadow,
      }}
    >
      {children}
    </button>
  );
}

function Poster({ url, title, type, size = 56 }) {
  if (url) {
    return <img src={url} alt="" style={{ width: size, height: size * 1.45, objectFit: "cover", borderRadius: 10, flexShrink: 0, boxShadow: C.shadow }} />;
  }
  return (
    <div
      style={{
        width: size,
        height: size * 1.45,
        borderRadius: 10,
        background: C.amberBg,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        boxShadow: C.shadow,
      }}
    >
      {type === "movie" ? <Film size={22} color={C.amber} /> : <Tv size={22} color={C.amber} />}
    </div>
  );
}

/* ---------- star rating ---------- */
function StarRating({ value = 0, onChange, size = 32, readonly = false }) {
  const [hovered, setHovered] = React.useState(0);
  return (
    <div style={{ display: "flex", gap: 4 }}>
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = (hovered || value) >= star;
        return (
          <button
            key={star}
            onClick={() => !readonly && onChange(value === star ? 0 : star)}
            onMouseEnter={() => !readonly && setHovered(star)}
            onMouseLeave={() => !readonly && setHovered(0)}
            aria-label={`${star} star${star !== 1 ? "s" : ""}`}
            style={{
              width: size + 8,
              height: size + 8,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "transparent",
              border: "none",
              cursor: readonly ? "default" : "pointer",
              padding: 0,
              fontSize: size,
              lineHeight: 1,
              color: filled ? "#E8A020" : C.line,
              transition: "color 100ms ease",
            }}
          >
            ★
          </button>
        );
      })}
    </div>
  );
}

function StarDisplay({ value = 0, size = 14 }) {
  if (!value) return null;
  return (
    <span style={{ fontSize: size, letterSpacing: -1, color: "#E8A020" }}>
      {"★".repeat(value)}{"☆".repeat(5 - value)}
    </span>
  );
}

/* ---------- progress helpers ---------- */
function isFinished(item) {
  if (item.type === "movie") return !!item.watched;
  if (!item.seasons || item.seasons.length === 0) return false;
  return item.seasons.every((s) => s.total > 0 && s.watched >= s.total);
}

function progressLabel(item) {
  if (item.type === "movie") return item.watched ? "Watched" : "Not started yet";
  if (!item.seasons || item.seasons.length === 0) return "No episodes added";
  const activeSeason = item.seasons.find((s) => s.watched < s.total) || item.seasons[item.seasons.length - 1];
  const totalEp = item.seasons.reduce((a, s) => a + s.total, 0);
  const watchedEp = item.seasons.reduce((a, s) => a + s.watched, 0);
  if (watchedEp >= totalEp && totalEp > 0) return `All ${item.seasons.length} season${item.seasons.length > 1 ? "s" : ""} finished`;
  return `Season ${activeSeason.number} · ${activeSeason.watched} of ${activeSeason.total} episodes`;
}

/* ---------- profile selection screen ---------- */
function ProfileScreen({ onSelect }) {
  const [migrationCount, setMigrationCount] = React.useState(0);

  React.useEffect(() => {
    get(ref(db, "items")).then((snap) => {
      const raw = snap.val();
      if (raw) {
        const arr = Array.isArray(raw) ? raw : Object.values(raw);
        setMigrationCount(arr.length);
      }
    }).catch(() => {});
  }, []);

  return (
    <div style={{ minHeight: "100vh", background: C.paper, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 28, fontFamily: "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif" }}>
      <div style={{ position: "relative", marginBottom: 8 }}>
        <div style={{ position: "absolute", left: -14, top: 0, bottom: 0, width: 2, background: C.margin, opacity: 0.55 }} />
        <h1 style={{ margin: 0, fontSize: 38, fontWeight: 900, color: C.ink, letterSpacing: -0.5 }}>Tally</h1>
      </div>
      <p style={{ margin: "0 0 48px", color: C.inkSoft, fontSize: 17 }}>Who's watching?</p>

      {migrationCount > 0 && (
        <div style={{ width: "100%", maxWidth: 360, background: C.amberBg, borderRadius: 14, padding: "12px 16px", marginBottom: 24, fontSize: 14, color: C.amber, fontWeight: 600, textAlign: "center" }}>
          Found {migrationCount} existing show{migrationCount !== 1 ? "s" : ""} — they'll move to whichever profile you pick first.
        </div>
      )}

      <div style={{ width: "100%", maxWidth: 360, display: "flex", flexDirection: "column", gap: 16 }}>
        {PROFILES.map((p) => (
          <button
            key={p.id}
            onClick={() => onSelect(p.id)}
            style={{
              padding: "22px 24px",
              borderRadius: 18,
              border: `2px solid ${p.color}`,
              background: p.color + "12",
              color: C.ink,
              fontSize: 22,
              fontWeight: 800,
              cursor: "pointer",
              textAlign: "left",
              boxShadow: C.shadow,
            }}
          >
            {p.label}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ---------- family tab ---------- */
function FamilyTab({ currentProfileId }) {
  const [otherData, setOtherData] = React.useState({});

  React.useEffect(() => {
    const others = PROFILES.filter((p) => p.id !== currentProfileId);
    const unsubs = others.map((p) => {
      return onValue(profileItemsRef(p.id), (snap) => {
        const raw = snap.val();
        const items = raw ? (Array.isArray(raw) ? raw : Object.values(raw)) : [];
        setOtherData((prev) => ({ ...prev, [p.id]: items }));
      });
    });
    return () => unsubs.forEach((u) => u());
  }, [currentProfileId]);

  const others = PROFILES.filter((p) => p.id !== currentProfileId);

  return (
    <div style={{ padding: "0 20px 40px" }}>
      {others.map((p) => {
        const items = (otherData[p.id] || []).filter((it) => !isFinished(it)).sort((a, b) => b.updatedAt - a.updatedAt);
        return (
          <div key={p.id} style={{ marginBottom: 28 }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: p.color, letterSpacing: 0.5, marginBottom: 12 }}>
              {p.label.toUpperCase()}
            </div>
            {items.length === 0 ? (
              <div style={{ color: C.inkSoft, fontSize: 15 }}>Nothing in progress yet.</div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {items.map((it) => (
                  <div key={it.id} style={{ display: "flex", gap: 12, alignItems: "center", background: C.card, borderRadius: 14, padding: 10, boxShadow: C.shadow }}>
                    <Poster url={it.posterUrl} title={it.title} type={it.type} size={44} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 15, fontWeight: 800, color: C.ink, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{it.title}</div>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 3 }}>
                        <ServiceLogo name={it.service} logoUrl={it.networkLogoUrl} size={14} />
                        <span style={{ fontSize: 12.5, color: C.inkSoft }}>{progressLabel(it)}</span>
                      </div>
                      {it.rating > 0 && <StarDisplay value={it.rating} size={12} />}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ---------- main app ---------- */
export default function Tally() {
  const [profile, setProfile] = useState(() => localStorage.getItem("tally-profile") || null);
  const [items, setItems] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [tab, setTab] = useState("watching");
  const [view, setView] = useState("home");
  const [selectedId, setSelectedId] = useState(null);
  const [pendingAdd, setPendingAdd] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const remoteSnapshot = useRef(null);

  function handleSelectProfile(profileId) {
    localStorage.setItem("tally-profile", profileId);
    setProfile(profileId);
  }

  // Firebase sync — re-runs when profile changes
  useEffect(() => {
    if (!profile) return;
    setLoaded(false);
    remoteSnapshot.current = null;
    const dbRef = profileItemsRef(profile);

    const unsubscribe = onValue(dbRef, async (snapshot) => {
      const raw = snapshot.val();
      const data = raw ? (Array.isArray(raw) ? raw : Object.values(raw)) : null;
      if (data && data.length > 0) {
        remoteSnapshot.current = JSON.stringify(data);
        setItems(data);
        setLoaded(true);
      } else {
        // Check if there is legacy /items data to migrate
        try {
          const oldSnap = await get(ref(db, "items"));
          const oldRaw = oldSnap.val();
          const oldData = oldRaw ? (Array.isArray(oldRaw) ? oldRaw : Object.values(oldRaw)) : null;
          if (oldData && oldData.length > 0) {
            remoteSnapshot.current = JSON.stringify(oldData);
            setItems(oldData);
            await set(dbRef, oldData);
            await remove(ref(db, "items"));
          } else {
            // Also check localStorage
            try {
              const saved = localStorage.getItem("tally-items");
              if (saved) {
                const parsed = JSON.parse(saved);
                remoteSnapshot.current = saved;
                setItems(parsed);
                await set(dbRef, parsed);
                localStorage.removeItem("tally-items");
              }
            } catch (e) {}
          }
        } catch (e) {}
        setLoaded(true);
      }
    });
    return () => unsubscribe();
  }, [profile]);

  // Write to Firebase when items change locally
  useEffect(() => {
    if (!loaded || !profile) return;
    const current = JSON.stringify(items);
    if (current === remoteSnapshot.current) return;
    remoteSnapshot.current = current;
    set(profileItemsRef(profile), items).catch((e) => console.error("Firebase write failed", e));
  }, [items, loaded, profile]);

  function updateItem(id, patch) {
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, ...patch, updatedAt: Date.now() } : it)));
  }

  function updateSeason(itemId, seasonNumber, patch) {
    setItems((prev) =>
      prev.map((it) => {
        if (it.id !== itemId) return it;
        const seasons = it.seasons.map((s) => (s.number === seasonNumber ? { ...s, ...patch } : s));
        return { ...it, seasons, updatedAt: Date.now() };
      })
    );
  }

  function addItem(newItem) {
    setItems((prev) => [{ ...newItem, id: uid(), addedAt: Date.now(), updatedAt: Date.now() }, ...prev]);
  }

  function deleteItem(id) {
    setItems((prev) => prev.filter((it) => it.id !== id));
  }

  const selectedItem = items.find((it) => it.id === selectedId) || null;
  const visibleItems = items
    .filter((it) => (tab === "watching" ? !isFinished(it) : isFinished(it)))
    .sort((a, b) => b.updatedAt - a.updatedAt);

  if (!profile) {
    return <ProfileScreen onSelect={handleSelectProfile} />;
  }

  if (!loaded) {
    return (
      <div style={{ minHeight: "100vh", background: C.paper, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Loader2 className="spin" size={28} color={C.margin} />
        <style>{`.spin{animation:spin 1s linear infinite}@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: C.paperEdge, display: "flex", justifyContent: "center", fontFamily: "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif" }}>
      <div style={{ width: "100%", maxWidth: 480, minHeight: "100vh", background: C.paper, position: "relative", boxShadow: "0 0 30px rgba(0,0,0,0.06)" }}>
        <style>{`
          @media (prefers-reduced-motion: no-preference) {
            .fade-in { animation: fadeIn 280ms ease both; }
          }
          @keyframes fadeIn { from { opacity:0; transform: translateY(6px);} to { opacity:1; transform: translateY(0);} }
          button { font-family: inherit; }
          input { font-family: inherit; }
        `}</style>

        {view === "home" && (
          <HomeScreen
            items={visibleItems}
            tab={tab}
            setTab={setTab}
            profile={profile}
            onSwitchProfile={() => {
              localStorage.removeItem("tally-profile");
              setProfile(null);
              setItems([]);
              setLoaded(false);
              setTab("watching");
              setView("home");
            }}
            onOpen={(id) => { setSelectedId(id); setView("detail"); }}
            onAdd={() => setView("addSheet")}
          />
        )}

        {view === "addSheet" && (
          <AddSheet
            onClose={() => setView("home")}
            onSearch={() => setView("search")}
            onManual={() => setView("manualAdd")}
          />
        )}

        {view === "search" && (
          <SearchScreen
            onBack={() => setView("addSheet")}
            onManualFallback={() => setView("manualAdd")}
            onSelectShow={(pending) => { setPendingAdd(pending); setView("confirmAdd"); }}
          />
        )}

        {view === "confirmAdd" && pendingAdd && (
          <ConfirmAddScreen
            pending={pendingAdd}
            onBack={() => setView("search")}
            onCancel={() => { setPendingAdd(null); setView("home"); }}
            onSave={(service, networkLogoUrl) => {
              addItem({ ...pendingAdd, service, networkLogoUrl: networkLogoUrl || null });
              setPendingAdd(null);
              setTab("watching");
              setView("home");
            }}
          />
        )}

        {view === "manualAdd" && (
          <ManualAddScreen
            onBack={() => setView("addSheet")}
            onSave={(newItem) => { addItem(newItem); setTab("watching"); setView("home"); }}
          />
        )}

        {view === "detail" && selectedItem && (
          <DetailScreen
            item={selectedItem}
            onBack={() => { setSelectedId(null); setView("home"); }}
            onUpdate={(patch) => updateItem(selectedItem.id, patch)}
            onUpdateSeason={(num, patch) => updateSeason(selectedItem.id, num, patch)}
            onAddSeason={(total) => {
              const nextNum = selectedItem.seasons.length ? Math.max(...selectedItem.seasons.map((s) => s.number)) + 1 : 1;
              updateItem(selectedItem.id, { seasons: [...selectedItem.seasons, { number: nextNum, total, watched: 0 }] });
            }}
            onDelete={() => setConfirmDelete(selectedItem.id)}
          />
        )}

        {confirmDelete && (
          <ConfirmDeleteModal
            onCancel={() => setConfirmDelete(null)}
            onConfirm={() => {
              deleteItem(confirmDelete);
              setConfirmDelete(null);
              setSelectedId(null);
              setView("home");
            }}
          />
        )}
      </div>
    </div>
  );
}

/* ---------- home ---------- */
function HomeScreen({ items, tab, setTab, profile, onSwitchProfile, onOpen, onAdd }) {
  const profileMeta = PROFILES.find((p) => p.id === profile) || PROFILES[0];
  return (
    <div style={{ paddingBottom: 110 }}>
      <div style={{ padding: "26px 20px 14px", position: "relative", display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
        <div style={{ position: "absolute", left: 12, top: 0, bottom: 0, width: 2, background: C.margin, opacity: 0.55 }} />
        <div style={{ marginLeft: 14 }}>
          <h1 style={{ margin: 0, fontSize: 32, fontWeight: 900, color: C.ink, letterSpacing: -0.5 }}>Tally</h1>
          <p style={{ margin: "4px 0 0", color: C.inkSoft, fontSize: 15 }}>Shows & movies we're watching</p>
        </div>
        <button
          onClick={onSwitchProfile}
          style={{ marginTop: 4, padding: "7px 14px", borderRadius: 99, border: `1.5px solid ${profileMeta.color}`, background: profileMeta.color + "15", color: profileMeta.color, fontSize: 13, fontWeight: 800, cursor: "pointer", flexShrink: 0 }}
        >
          {profileMeta.label}
        </button>
      </div>

      <div style={{ display: "flex", gap: 8, padding: "6px 20px 18px" }}>
        {[
          { key: "watching", label: "Watching" },
          { key: "finished", label: "Finished" },
          { key: "family",   label: "Family" },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            style={{
              flex: 1,
              padding: "13px 0",
              borderRadius: 12,
              border: "none",
              background: tab === t.key ? C.ink : C.card,
              color: tab === t.key ? "#FFF" : C.inkSoft,
              fontSize: 15,
              fontWeight: 700,
              cursor: "pointer",
              boxShadow: tab === t.key ? C.shadow : "none",
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "family" ? (
        <FamilyTab currentProfileId={profile} />
      ) : (
      <div style={{ padding: "0 20px", display: "flex", flexDirection: "column", gap: 12 }}>
        {items.length === 0 && (
          <div style={{ textAlign: "center", padding: "50px 10px", color: C.inkSoft }}>
            <p style={{ fontSize: 17, fontWeight: 600, color: C.ink, margin: "0 0 6px" }}>
              {tab === "watching" ? "Nothing here yet" : "No finished shows yet"}
            </p>
            <p style={{ fontSize: 15, margin: 0 }}>
              {tab === "watching" ? "Tap the + button to add a show or movie." : "Finished shows will show up here automatically."}
            </p>
          </div>
        )}
        {items.map((it, i) => {
          const finished = isFinished(it);
          return (
            <button
              key={it.id}
              className="fade-in"
              style={{
                animationDelay: `${Math.min(i, 6) * 40}ms`,
                display: "flex",
                gap: 14,
                alignItems: "center",
                textAlign: "left",
                background: C.card,
                border: "none",
                borderRadius: 16,
                padding: 12,
                boxShadow: C.shadow,
                cursor: "pointer",
              }}
              onClick={() => onOpen(it.id)}
            >
              <Poster url={it.posterUrl} title={it.title} type={it.type} />
              <div style={{ flex: 1, minWidth: 0 }}>
                {it.finalSeason && !finished && (
                  <div style={{ display: "inline-block", fontSize: 11, fontWeight: 800, color: C.margin, letterSpacing: 0.4, marginBottom: 3 }}>FINAL SEASON</div>
                )}
                <div style={{ fontSize: 17, fontWeight: 800, color: C.ink, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{it.title}</div>
                <div style={{ display: "flex", alignItems: "center", gap: 7, margin: "4px 0 6px" }}>
                  <ServiceLogo name={it.service} logoUrl={it.networkLogoUrl} size={18} />
                  <span style={{ fontSize: 13, color: C.inkSoft, fontWeight: 600 }}>{it.service || "No service set"}</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                  <div
                    style={{
                      display: "inline-block",
                      fontSize: 12.5,
                      fontWeight: 700,
                      padding: "3px 9px",
                      borderRadius: 999,
                      background: finished ? C.sageBg : C.amberBg,
                      color: finished ? C.sage : C.amber,
                    }}
                  >
                    {progressLabel(it)}
                  </div>
                  {it.rating > 0 && <StarDisplay value={it.rating} size={13} />}
                </div>
              </div>
            </button>
          );
        })}
      </div>
      )}

      <button
        onClick={onAdd}
        aria-label="Add a show or movie"
        style={{
          position: "fixed",
          right: "max(24px, calc(50% - 240px + 24px))",
          bottom: 28,
          width: 62,
          height: 62,
          borderRadius: 99,
          background: C.margin,
          border: "none",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 6px 18px rgba(194,73,47,0.45)",
          cursor: "pointer",
        }}
      >
        <Plus size={28} color="#FFF" />
      </button>
    </div>
  );
}

/* ---------- add sheet ---------- */
function AddSheet({ onClose, onSearch, onManual }) {
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 20, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
      <div onClick={onClose} style={{ position: "absolute", inset: 0, background: "rgba(43,42,40,0.45)" }} />
      <div className="fade-in" style={{ position: "relative", width: "100%", maxWidth: 480, background: C.paper, borderRadius: "22px 22px 0 0", padding: "10px 20px 30px", boxShadow: "0 -6px 24px rgba(0,0,0,0.18)" }}>
        <div style={{ width: 40, height: 4, borderRadius: 99, background: C.line, margin: "8px auto 18px" }} />
        <h2 style={{ margin: "0 0 16px", fontSize: 20, fontWeight: 800, color: C.ink }}>Add a show or movie</h2>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <button onClick={onSearch} style={sheetRowStyle}>
            <div style={sheetIconStyle}><Search size={20} color={C.margin} /></div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 16, color: C.ink }}>Search to add</div>
              <div style={{ fontSize: 13.5, color: C.inkSoft }}>Find a TV show and fill in seasons automatically</div>
            </div>
          </button>
          <button onClick={onManual} style={sheetRowStyle}>
            <div style={sheetIconStyle}><Pencil size={19} color={C.margin} /></div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 16, color: C.ink }}>Add manually</div>
              <div style={{ fontSize: 13.5, color: C.inkSoft }}>Type in a show or movie yourself</div>
            </div>
          </button>
        </div>
        <button onClick={onClose} style={{ marginTop: 18, width: "100%", padding: "14px 0", borderRadius: 12, border: "none", background: "transparent", color: C.inkSoft, fontSize: 15, fontWeight: 700, cursor: "pointer" }}>
          Cancel
        </button>
      </div>
    </div>
  );
}
const sheetRowStyle = { display: "flex", alignItems: "center", gap: 14, textAlign: "left", background: C.card, border: "none", borderRadius: 16, padding: 14, boxShadow: C.shadow, cursor: "pointer" };
const sheetIconStyle = { width: 42, height: 42, borderRadius: 12, background: C.amberBg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 };

/* ---------- top bar shared ---------- */
function TopBar({ title, onBack, right }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "20px 16px 14px", position: "sticky", top: 0, background: C.paper, zIndex: 5 }}>
      <button onClick={onBack} aria-label="Back" style={{ width: 40, height: 40, borderRadius: 99, border: "none", background: C.card, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: C.shadow, cursor: "pointer" }}>
        <ChevronLeft size={22} color={C.ink} />
      </button>
      <h2 style={{ flex: 1, margin: 0, fontSize: 19, fontWeight: 800, color: C.ink }}>{title}</h2>
      {right}
    </div>
  );
}

/* ---------- search screen (TVMaze) ---------- */
function SearchScreen({ onBack, onSelectShow, onManualFallback }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState(null);
  const [loadingId, setLoadingId] = useState(null);
  const inputRef = useRef(null);
  const debounceRef = useRef(null);

  useEffect(() => {
    inputRef.current && inputRef.current.focus();
  }, []);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    if (!query.trim()) { setResults([]); setError(null); return; }
    setSearching(true);
    setError(null);
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`https://api.tvmaze.com/search/shows?q=${encodeURIComponent(query)}`);
        if (!res.ok) throw new Error();
        const data = await res.json();
        setResults(data.slice(0, 8));
      } catch {
        setError("Couldn't reach search right now. Try again or add manually.");
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 400);
    return () => clearTimeout(debounceRef.current);
  }, [query]);

  async function pick(show) {
    setLoadingId(show.id);
    try {
      const res = await fetch(`https://api.tvmaze.com/shows/${show.id}/episodes`);
      if (!res.ok) throw new Error();
      const eps = await res.json();
      const map = {};
      eps.forEach((ep) => { if (ep.season >= 1) map[ep.season] = (map[ep.season] || 0) + 1; });
      const seasons = Object.keys(map).map(Number).sort((a, b) => a - b)
        .map((n) => ({ number: n, total: map[n], watched: 0 }));

      // Extract network/channel info from TVMaze
      const channel = show.webChannel || show.network || null;
      const networkName = channel?.name || null;
      const networkLogoUrl = channel?.image?.medium || null;
      const matchedService = matchService(networkName);

      onSelectShow({
        type: "show",
        title: show.name,
        posterUrl: show.image ? show.image.medium : null,
        tvmazeId: show.id,
        synopsis: stripHtml(show.summary),
        service: matchedService || networkName || "",
        networkLogoUrl: matchedService ? null : networkLogoUrl,
        seasons: seasons.length ? seasons : [{ number: 1, total: 1, watched: 0 }],
        finalSeason: show.status === "Ended",
      });
    } catch {
      setError("Couldn't load episodes for that show. Try again or add manually.");
    } finally {
      setLoadingId(null);
    }
  }

  return (
    <div>
      <TopBar title="Search shows" onBack={onBack} />
      <div style={{ padding: "0 20px 16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, background: C.card, borderRadius: 14, padding: "12px 16px", boxShadow: C.shadow }}>
          <Search size={19} color={C.inkSoft} />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a show title..."
            style={{ flex: 1, border: "none", outline: "none", fontSize: 17, background: "transparent", color: C.ink }}
          />
          {searching && <Loader2 size={18} color={C.inkSoft} className="spin" />}
        </div>
        <style>{`.spin{animation:spin 1s linear infinite}@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>

      <div style={{ padding: "0 20px", display: "flex", flexDirection: "column", gap: 10 }}>
        {error && (
          <div style={{ background: "#FBEAE5", padding: 14, borderRadius: 12, color: C.margin, fontSize: 14.5, fontWeight: 600 }}>
            {error}
          </div>
        )}
        {!error && query.trim() && !searching && results.length === 0 && (
          <div style={{ color: C.inkSoft, fontSize: 15, padding: "10px 4px" }}>No shows found for "{query}".</div>
        )}
        {results.map((r) => (
          <button
            key={r.show.id}
            onClick={() => pick(r.show)}
            disabled={loadingId !== null}
            style={{ display: "flex", gap: 14, alignItems: "center", textAlign: "left", background: C.card, border: "none", borderRadius: 16, padding: 10, boxShadow: C.shadow, cursor: loadingId ? "default" : "pointer" }}
          >
            <Poster url={r.show.image ? r.show.image.medium : null} title={r.show.name} type="show" size={48} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 700, fontSize: 16, color: C.ink }}>{r.show.name}</div>
              <div style={{ fontSize: 13, color: C.inkSoft, marginBottom: r.show.summary ? 4 : 0 }}>
                {r.show.premiered ? r.show.premiered.slice(0, 4) : "Year unknown"}{r.show.status ? ` · ${r.show.status}` : ""}
              </div>
              {r.show.summary && (
                <div style={{ fontSize: 13, color: C.inkSoft, lineHeight: 1.4, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                  {stripHtml(r.show.summary)}
                </div>
              )}
            </div>
            {loadingId === r.show.id && <Loader2 size={18} color={C.margin} className="spin" />}
          </button>
        ))}
      </div>

      <div style={{ padding: "26px 20px 30px" }}>
        <button onClick={onManualFallback} style={{ width: "100%", padding: "14px 0", borderRadius: 12, border: `1.5px solid ${C.line}`, background: "transparent", color: C.inkSoft, fontSize: 15, fontWeight: 700, cursor: "pointer" }}>
          Can't find it? Add manually
        </button>
      </div>
    </div>
  );
}

/* ---------- confirm add (from search) ---------- */
function ConfirmAddScreen({ pending, onBack, onCancel, onSave }) {
  const [service, setService] = useState(pending.service || "");
  const [customService, setCustomService] = useState(
    pending.service && !SERVICES.find(s => s.name === pending.service) ? pending.service : ""
  );
  const totalEp = pending.seasons.reduce((a, s) => a + s.total, 0);
  const finalService = service === "Other" ? customService.trim() : service;

  return (
    <div>
      <TopBar title="Add show" onBack={onBack} />
      <div style={{ padding: "0 20px 30px" }}>
        <div style={{ display: "flex", gap: 16, alignItems: "center", marginBottom: 22 }}>
          <Poster url={pending.posterUrl} title={pending.title} type="show" size={70} />
          <div>
            <div style={{ fontSize: 20, fontWeight: 800, color: C.ink }}>{pending.title}</div>
            <div style={{ fontSize: 14, color: C.inkSoft, marginTop: 4 }}>
              {pending.seasons.length} season{pending.seasons.length > 1 ? "s" : ""} · {totalEp} episodes
            </div>
            {pending.finalSeason && <div style={{ fontSize: 12, fontWeight: 800, color: C.margin, marginTop: 4 }}>SERIES ENDED</div>}
          </div>
        </div>

        <div style={{ fontSize: 14, fontWeight: 800, color: C.inkSoft, letterSpacing: 0.4, marginBottom: 10 }}>WHERE WILL YOU WATCH IT?</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 9, marginBottom: service === "Other" ? 12 : 26 }}>
          {SERVICES.map((s) => (
            <Chip key={s.name} label={s.name} color={s.color} domain={s.domain} selected={service === s.name} onClick={() => setService(s.name)} />
          ))}
        </div>
        {service === "Other" && (
          <input
            value={customService}
            onChange={(e) => setCustomService(e.target.value)}
            placeholder="Type streaming service name"
            style={{ width: "100%", boxSizing: "border-box", padding: "13px 14px", borderRadius: 12, border: `1.5px solid ${C.line}`, fontSize: 16, marginBottom: 26, color: C.ink }}
          />
        )}

        <PrimaryButton disabled={!finalService} onClick={() => onSave(finalService)}>
          Add to my list
        </PrimaryButton>
        <button onClick={onCancel} style={{ width: "100%", marginTop: 12, padding: "12px 0", border: "none", background: "transparent", color: C.inkSoft, fontSize: 15, fontWeight: 700, cursor: "pointer" }}>
          Cancel
        </button>
      </div>
    </div>
  );
}

/* ---------- manual add ---------- */
function ManualAddScreen({ onBack, onSave }) {
  const [type, setType] = useState("show");
  const [title, setTitle] = useState("");
  const [service, setService] = useState("");
  const [customService, setCustomService] = useState("");
  const [seasons, setSeasons] = useState([{ number: 1, total: 10, watched: 0 }]);

  const finalService = service === "Other" ? customService.trim() : service;
  const canSave = title.trim() && finalService;

  function addSeasonRow() {
    setSeasons((s) => [...s, { number: s.length + 1, total: 10, watched: 0 }]);
  }
  function removeSeasonRow(number) {
    setSeasons((s) => s.filter((x) => x.number !== number).map((x, i) => ({ ...x, number: i + 1 })));
  }
  function setSeasonTotal(number, total) {
    setSeasons((s) => s.map((x) => (x.number === number ? { ...x, total } : x)));
  }

  function save() {
    onSave({
      type,
      title: title.trim(),
      service: finalService,
      posterUrl: null,
      tvmazeId: null,
      finalSeason: false,
      watched: type === "movie" ? false : undefined,
      seasons: type === "show" ? seasons : [],
    });
  }

  return (
    <div>
      <TopBar title="Add manually" onBack={onBack} />
      <div style={{ padding: "0 20px 40px" }}>
        <div style={{ display: "flex", gap: 10, marginBottom: 22 }}>
          {[
            { key: "show", label: "TV Show", icon: Tv },
            { key: "movie", label: "Movie", icon: Film },
          ].map((t) => (
            <button
              key={t.key}
              onClick={() => setType(t.key)}
              style={{
                flex: 1,
                padding: "13px 0",
                borderRadius: 12,
                border: "none",
                background: type === t.key ? C.ink : C.card,
                color: type === t.key ? "#FFF" : C.inkSoft,
                fontSize: 15.5,
                fontWeight: 700,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                cursor: "pointer",
                boxShadow: type === t.key ? C.shadow : "none",
              }}
            >
              <t.icon size={17} />
              {t.label}
            </button>
          ))}
        </div>

        <div style={{ fontSize: 14, fontWeight: 800, color: C.inkSoft, letterSpacing: 0.4, marginBottom: 8 }}>TITLE</div>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={type === "movie" ? "Movie title" : "Show title"}
          style={{ width: "100%", boxSizing: "border-box", padding: "13px 14px", borderRadius: 12, border: `1.5px solid ${C.line}`, fontSize: 16, marginBottom: 22, color: C.ink }}
        />

        <div style={{ fontSize: 14, fontWeight: 800, color: C.inkSoft, letterSpacing: 0.4, marginBottom: 10 }}>WHERE WILL YOU WATCH IT?</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 9, marginBottom: service === "Other" ? 12 : 26 }}>
          {SERVICES.map((s) => (
            <Chip key={s.name} label={s.name} color={s.color} domain={s.domain} selected={service === s.name} onClick={() => setService(s.name)} />
          ))}
        </div>
        {service === "Other" && (
          <input
            value={customService}
            onChange={(e) => setCustomService(e.target.value)}
            placeholder="Type streaming service name"
            style={{ width: "100%", boxSizing: "border-box", padding: "13px 14px", borderRadius: 12, border: `1.5px solid ${C.line}`, fontSize: 16, marginBottom: 26, color: C.ink }}
          />
        )}

        {type === "show" && (
          <>
            <div style={{ fontSize: 14, fontWeight: 800, color: C.inkSoft, letterSpacing: 0.4, marginBottom: 10 }}>SEASONS</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 14, marginBottom: 16 }}>
              {seasons.map((s) => (
                <div key={s.number} style={{ background: C.card, borderRadius: 14, padding: 14, boxShadow: C.shadow, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 15, color: C.ink, marginBottom: 8 }}>Season {s.number}</div>
                    <div style={{ fontSize: 12.5, color: C.inkSoft }}>episodes</div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <Stepper value={s.total} onChange={(v) => setSeasonTotal(s.number, v)} />
                    {seasons.length > 1 && (
                      <button onClick={() => removeSeasonRow(s.number)} aria-label="Remove season" style={{ border: "none", background: "transparent", cursor: "pointer", padding: 6 }}>
                        <Trash2 size={18} color={C.margin} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <button onClick={addSeasonRow} style={{ width: "100%", padding: "12px 0", borderRadius: 12, border: `1.5px dashed ${C.line}`, background: "transparent", color: C.inkSoft, fontSize: 14.5, fontWeight: 700, cursor: "pointer", marginBottom: 26 }}>
              + Add another season
            </button>
          </>
        )}

        <PrimaryButton disabled={!canSave} onClick={save}>
          Add to my list
        </PrimaryButton>
      </div>
    </div>
  );
}

/* ---------- episode ratings ---------- */
function EpisodeRatings({ total, ratings = [], onChange }) {
  const [open, setOpen] = React.useState(false);
  if (!total || total <= 0) return null;

  function setEpRating(ep, rating) {
    const next = ratings.filter((r) => r.ep !== ep);
    if (rating > 0) next.push({ ep, rating });
    onChange(next);
  }

  function getRating(ep) {
    return (ratings.find((r) => r.ep === ep) || {}).rating || 0;
  }

  const ratedCount = ratings.filter((r) => r.rating > 0).length;

  return (
    <div style={{ marginTop: 10 }}>
      <button
        onClick={() => setOpen((o) => !o)}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: "transparent",
          border: "none",
          padding: "8px 0 4px",
          cursor: "pointer",
        }}
      >
        <span style={{ fontSize: 12, fontWeight: 800, color: C.inkSoft, letterSpacing: 0.4 }}>
          EPISODE RATINGS {ratedCount > 0 ? `(${ratedCount} rated)` : ""}
        </span>
        <span style={{ fontSize: 13, color: C.inkSoft }}>{open ? "▲" : "▼"}</span>
      </button>
      {open && (
        <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 8 }}>
          {Array.from({ length: total }).map((_, i) => {
            const ep = i + 1;
            const rating = getRating(ep);
            return (
              <div key={ep} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: 14, fontWeight: 600, color: C.inkSoft, minWidth: 56 }}>Ep {ep}</span>
                <StarRating value={rating} onChange={(r) => setEpRating(ep, r)} size={20} />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ---------- detail screen ---------- */
function DetailScreen({ item, onBack, onUpdate, onUpdateSeason, onAddSeason, onDelete }) {
  const [editingService, setEditingService] = useState(false);
  const [customService, setCustomService] = useState("");
  const [addingSeason, setAddingSeason] = useState(false);
  const [newSeasonTotal, setNewSeasonTotal] = useState(10);
  const [editingSeasonTotal, setEditingSeasonTotal] = useState(null);

  return (
    <div style={{ paddingBottom: 50 }}>
      <TopBar
        title=""
        onBack={onBack}
        right={
          <button onClick={onDelete} aria-label="Delete" style={{ width: 40, height: 40, borderRadius: 99, border: "none", background: C.card, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: C.shadow, cursor: "pointer" }}>
            <Trash2 size={18} color={C.margin} />
          </button>
        }
      />

      <div style={{ padding: "0 20px" }}>
        <div style={{ display: "flex", gap: 16, marginBottom: 16 }}>
          <Poster url={item.posterUrl} title={item.title} type={item.type} size={84} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 22, fontWeight: 900, color: C.ink, lineHeight: 1.2 }}>{item.title}</div>
            {item.finalSeason && <div style={{ fontSize: 12, fontWeight: 800, color: C.margin, marginTop: 6 }}>FINAL SEASON</div>}
          </div>
        </div>

        {item.synopsis && (
          <p style={{ margin: "0 0 16px", fontSize: 14.5, color: C.inkSoft, lineHeight: 1.55 }}>{item.synopsis}</p>
        )}

        <div style={{ background: C.card, borderRadius: 14, padding: "14px 16px", boxShadow: C.shadow, marginBottom: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: C.inkSoft, letterSpacing: 0.4, marginBottom: 10 }}>YOUR RATING</div>
          <StarRating value={item.rating || 0} onChange={(r) => onUpdate({ rating: r })} size={30} />
          {item.rating > 0 && (
            <div style={{ marginTop: 6, fontSize: 13, color: C.inkSoft }}>
              {["","Didn't enjoy it","It was okay","Pretty good","Really liked it","Loved it!"][item.rating]}
            </div>
          )}
        </div>

        {!editingService ? (
          <button onClick={() => setEditingService(true)} style={{ display: "flex", alignItems: "center", gap: 10, background: "transparent", border: "none", padding: "6px 0 22px", cursor: "pointer" }}>
            <ServiceLogo name={item.service} logoUrl={item.networkLogoUrl} size={24} />
            <span style={{ fontSize: 15.5, fontWeight: 700, color: C.ink }}>{item.service || "Set streaming service"}</span>
            <Pencil size={14} color={C.inkSoft} />
          </button>
        ) : (
          <div style={{ paddingBottom: 22 }}>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 9, marginBottom: 10 }}>
              {SERVICES.map((s) => (
                <Chip
                  key={s.name}
                  label={s.name}
                  color={s.color}
                  selected={item.service === s.name || (s.name === "Other" && customService)}
                  onClick={() => {
                    if (s.name !== "Other") {
                      onUpdate({ service: s.name });
                      setEditingService(false);
                    }
                  }}
                />
              ))}
            </div>
            <input
              value={customService}
              onChange={(e) => setCustomService(e.target.value)}
              placeholder="Or type a custom service"
              style={{ width: "100%", boxSizing: "border-box", padding: "12px 14px", borderRadius: 12, border: `1.5px solid ${C.line}`, fontSize: 15, marginBottom: 10 }}
            />
            <button
              onClick={() => {
                if (customService.trim()) onUpdate({ service: customService.trim() });
                setEditingService(false);
              }}
              style={{ padding: "10px 16px", borderRadius: 10, border: "none", background: C.ink, color: "#FFF", fontWeight: 700, fontSize: 14, cursor: "pointer" }}
            >
              Done
            </button>
          </div>
        )}

        {item.type === "movie" ? (
          <button
            onClick={() => onUpdate({ watched: !item.watched })}
            style={{
              width: "100%",
              padding: "18px 0",
              borderRadius: 14,
              border: "none",
              background: item.watched ? C.sage : C.card,
              color: item.watched ? "#FFF" : C.ink,
              fontSize: 17,
              fontWeight: 800,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              boxShadow: C.shadow,
              cursor: "pointer",
            }}
          >
            {item.watched && <Check size={20} />}
            {item.watched ? "Watched" : "Mark as watched"}
          </button>
        ) : (
          <>
            {item.seasons.map((s) => {
              const seasonDone = s.total > 0 && s.watched >= s.total;
              return (
                <div key={s.number} style={{ background: C.card, borderRadius: 16, padding: 16, boxShadow: C.shadow, marginBottom: 14 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: 16, color: C.ink }}>Season {s.number}</div>
                      <div style={{ fontSize: 13, color: seasonDone ? C.sage : C.inkSoft, fontWeight: 600 }}>
                        {seasonDone ? "Season complete" : `${s.watched} of ${s.total} watched`}
                      </div>
                    </div>
                    <button onClick={() => setEditingSeasonTotal(editingSeasonTotal === s.number ? null : s.number)} aria-label="Edit episode count" style={{ border: "none", background: "transparent", cursor: "pointer", padding: 6 }}>
                      <Pencil size={16} color={C.inkSoft} />
                    </button>
                  </div>
                  {editingSeasonTotal === s.number ? (
                    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 6 }}>
                      <span style={{ fontSize: 13.5, color: C.inkSoft }}>Total episodes</span>
                      <Stepper
                        value={s.total}
                        onChange={(v) => onUpdateSeason(s.number, { total: v, watched: Math.min(s.watched, v) })}
                      />
                    </div>
                  ) : (
                    <TallyTracker total={s.total} watched={s.watched} onChange={(w) => onUpdateSeason(s.number, { watched: w })} />
                  )}
                  <button
                    onClick={() => onUpdateSeason(s.number, { watched: seasonDone ? 0 : s.total })}
                    style={{
                      marginTop: 14,
                      width: "100%",
                      padding: "11px 0",
                      borderRadius: 10,
                      border: `1.5px solid ${seasonDone ? C.line : C.sage}`,
                      background: seasonDone ? "transparent" : C.sageBg,
                      color: seasonDone ? C.inkSoft : C.sage,
                      fontSize: 14.5,
                      fontWeight: 700,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 6,
                    }}
                  >
                    {seasonDone ? <><Minus size={15} /> Mark unwatched</> : <><Check size={15} /> Mark season watched</>}
                  </button>

                  <div style={{ marginTop: 14, paddingTop: 14, borderTop: `1px solid ${C.line}` }}>
                    <div style={{ fontSize: 12, fontWeight: 800, color: C.inkSoft, letterSpacing: 0.4, marginBottom: 8 }}>SEASON RATING</div>
                    <StarRating
                      value={s.rating || 0}
                      onChange={(r) => onUpdateSeason(s.number, { rating: r })}
                      size={24}
                    />
                  </div>

                  <EpisodeRatings
                    total={s.total}
                    ratings={s.episodeRatings || []}
                    onChange={(episodeRatings) => onUpdateSeason(s.number, { episodeRatings })}
                  />
                </div>
              );
            })}

            {!addingSeason ? (
              <button onClick={() => setAddingSeason(true)} style={{ width: "100%", padding: "13px 0", borderRadius: 12, border: `1.5px dashed ${C.line}`, background: "transparent", color: C.inkSoft, fontSize: 14.5, fontWeight: 700, cursor: "pointer" }}>
                + Add another season
              </button>
            ) : (
              <div style={{ background: C.card, borderRadius: 16, padding: 16, boxShadow: C.shadow }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: C.ink, marginBottom: 12 }}>New season episodes</div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <Stepper value={newSeasonTotal} onChange={setNewSeasonTotal} />
                  <button
                    onClick={() => {
                      onAddSeason(newSeasonTotal);
                      setAddingSeason(false);
                      setNewSeasonTotal(10);
                    }}
                    style={{ padding: "12px 18px", borderRadius: 10, border: "none", background: C.ink, color: "#FFF", fontWeight: 700, fontSize: 14.5, cursor: "pointer" }}
                  >
                    Add season
                  </button>
                </div>
              </div>
            )}

            <div style={{ marginTop: 18 }}>
              <button
                onClick={() => onUpdate({ finalSeason: !item.finalSeason })}
                style={{ fontSize: 14, fontWeight: 700, color: item.finalSeason ? C.margin : C.inkSoft, background: "transparent", border: "none", cursor: "pointer", padding: 0 }}
              >
                {item.finalSeason ? "✓ Marked as final season" : "Mark as final season"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/* ---------- delete confirm ---------- */
function ConfirmDeleteModal({ onCancel, onConfirm }) {
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 30, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div onClick={onCancel} style={{ position: "absolute", inset: 0, background: "rgba(43,42,40,0.5)" }} />
      <div style={{ position: "relative", background: C.paper, borderRadius: 18, padding: 24, maxWidth: 360, width: "100%", boxShadow: "0 10px 30px rgba(0,0,0,0.25)" }}>
        <h3 style={{ margin: "0 0 8px", fontSize: 18, fontWeight: 800, color: C.ink }}>Remove this title?</h3>
        <p style={{ margin: "0 0 20px", fontSize: 14.5, color: C.inkSoft }}>This will delete it and all its watched progress. This can't be undone.</p>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={onCancel} style={{ flex: 1, padding: "13px 0", borderRadius: 12, border: `1.5px solid ${C.line}`, background: "transparent", color: C.ink, fontWeight: 700, fontSize: 15, cursor: "pointer" }}>
            Cancel
          </button>
          <button onClick={onConfirm} style={{ flex: 1, padding: "13px 0", borderRadius: 12, border: "none", background: C.margin, color: "#FFF", fontWeight: 700, fontSize: 15, cursor: "pointer" }}>
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
