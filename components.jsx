// components.jsx — Vesak visual vocabulary for Sats Dansala
// All components exported to window at the end.

// ── Bitcoin Deepa wordmark ────────────────────────────────
// "Deepa" = lamp/light. The dot of the 'i' is a lit flame.
function DeepaMark({ size = 26, ink = false }) {
  // Real brand wordmark — "bitcoinදීප". `ink` renders a monochrome version
  // for light surfaces (e.g. the parchment receipt).
  return (
    <img
      className={"deepa-logo" + (ink ? " ink" : "")}
      src="assets/DeepaLogo_WnO.svg"
      alt="Bitcoin Deepa"
      style={{ height: size }}
    />
  );
}

// ── Vesak star lantern (kuudu) — two overlaid triangles ───
function Lantern({ size = 120, hue = "warm", className = "", style = {} }) {
  return (
    <div className={"lantern " + className} style={{ width: size, height: size * 1.55, ...style }}>
      <div className="lan-string" />
      <div className={"lan-star hue-" + hue} style={{ width: size, height: size }}>
        <span className="tri up" />
        <span className="tri down" />
        <span className="lan-core" />
      </div>
      <div className="lan-tassels">
        {Array.from({ length: 5 }).map((_, i) => (
          <span className="tassel" key={i} style={{ animationDelay: (i * 0.18) + "s" }} />
        ))}
      </div>
    </div>
  );
}

// ── Oil-lamp flame (the "deepa") ──────────────────────────
function Flame({ size = 64, lit = true }) {
  return (
    <span className={"flame " + (lit ? "is-lit" : "")} style={{ width: size, height: size * 1.35 }}>
      <span className="flame-body" />
      <span className="flame-core" />
    </span>
  );
}

// ── small line icons ──────────────────────────────────────
function Icon({ name, size = 22 }) {
  const p = {
    width: size, height: size, viewBox: "0 0 24 24", fill: "none",
    stroke: "currentColor", strokeWidth: 1.7, strokeLinecap: "round", strokeLinejoin: "round",
  };
  switch (name) {
    case "telegram":
      return (<svg {...p}><path d="M21.5 4.3 2.8 11.2c-.9.34-.88 1.62.03 1.93l4.7 1.6 1.8 5.5c.25.74 1.2.9 1.68.28l2.5-3.1 4.7 3.45c.62.46 1.5.12 1.66-.64L23 5.4c.2-.95-.7-1.7-1.5-1.1z" /><path d="M8 14.7 17.5 7" /></svg>);
    case "luma":
      return (<svg {...p}><rect x="3" y="4.5" width="18" height="16" rx="2.4" /><path d="M3 9h18" /><path d="M8 3v3M16 3v3" /><circle cx="12" cy="14.5" r="2.4" /></svg>);
    case "gift":
      return (<svg {...p}><rect x="3.5" y="9" width="17" height="11.5" rx="1.6" /><path d="M2.5 9h19M12 9v11.5" /><path d="M12 9C12 6 10.5 4 8.5 4S6 7 8 9zM12 9c0-3 1.5-5 3.5-5S18 7 16 9z" /></svg>);
    case "check":
      return (<svg {...p}><path d="M20 6 9 17l-5-5" /></svg>);
    case "bolt":
      return (<svg {...p}><path d="M13 2 4 14h7l-1 8 9-12h-7z" fill="currentColor" stroke="none" /></svg>);
    case "shield":
      return (<svg {...p}><path d="M12 3 5 6v5c0 4.2 2.9 7.6 7 9 4.1-1.4 7-4.8 7-9V6z" /><path d="M9.2 12l2 2 3.6-4" /></svg>);
    case "users":
      return (<svg {...p}><circle cx="9" cy="8" r="3.2" /><path d="M3.5 18.5c.4-2.7 2.7-4.5 5.5-4.5s5.1 1.8 5.5 4.5" /><circle cx="16.2" cy="9" r="2.5" /><path d="M14 14.7c.7-.4 1.5-.7 2.4-.7 2.4 0 4.3 1.5 4.6 3.8" /></svg>);
    case "arrow":
      return (<svg {...p}><path d="M5 12h14M13 6l6 6-6 6" /></svg>);
    case "external":
      return (<svg {...p}><path d="M14 4h6v6M20 4l-9 9M19 14v5a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h5" /></svg>);
    case "twitter": {
      const fp = { ...p, fill: "currentColor", stroke: "none" };
      return (<svg {...fp}><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.259 5.633 5.905-5.633zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>);
    }
    case "whatsapp":
      return (<svg {...p}><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" /></svg>);
    case "facebook":
      return (<svg {...p}><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" /></svg>);
    case "share":
      return (<svg {...p}><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" /><polyline points="16 6 12 2 8 6" /><line x1="12" y1="2" x2="12" y2="15" /></svg>);
    default:
      return null;
  }
}

// ── spark burst on claim ──────────────────────────────────
function SparkBurst({ run }) {
  const sparks = React.useMemo(
    () => Array.from({ length: 26 }).map((_, i) => {
      const ang = (i / 26) * Math.PI * 2 + Math.random() * 0.3;
      const dist = 120 + Math.random() * 220;
      return {
        x: Math.cos(ang) * dist, y: Math.sin(ang) * dist,
        d: 0.05 + Math.random() * 0.25, s: 4 + Math.random() * 7,
        c: ["#FF8A1F", "#FFC76A", "#FF6B2C", "#FFE3B0"][i % 4],
      };
    }), [run]
  );
  if (!run) return null;
  return (
    <div className="spark-burst" aria-hidden="true">
      {sparks.map((s, i) => (
        <span key={i} className="spark" style={{
          "--tx": s.x + "px", "--ty": s.y + "px",
          width: s.s, height: s.s, background: s.c, animationDelay: s.d + "s",
        }} />
      ))}
    </div>
  );
}

Object.assign(window, { DeepaMark, Lantern, Flame, Icon, SparkBurst });
