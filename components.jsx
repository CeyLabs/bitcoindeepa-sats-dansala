// components.jsx — Vesak visual vocabulary for Sats Dansala
// All components exported to window at the end.

// ── Bitcoin Deepa wordmark ────────────────────────────────
// "Deepa" = lamp/light. The dot of the 'i' is a lit flame.
function DeepaMark({ size = 26, ink = false }) {
  // Real brand wordmark — "bitcoinදීප". `ink` renders a monochrome version
  // for light surfaces (e.g. the parchment receipt).
  // Two html2canvas (shareable receipt) quirks handled here:
  //  1. It ignores CSS filters, so the light surfaces use the black brand
  //     edition (BnO) directly instead of filter:brightness(0) on the
  //     white logo — which left the wordmark invisible on the parchment.
  //  2. For an SVG <img> sized only via CSS, html2canvas draws it at its
  //     natural size and clips — cropping the wordmark to "bit". Pinning
  //     explicit width+height attributes makes it scale correctly.
  const width = Math.round(size * (539.2 / 196.77)); // brand SVG viewBox ratio
  return (
    <img
      className={"deepa-logo" + (ink ? " ink" : "")}
      src={ink ? "assets/DeepaLogo_BnO.svg" : "assets/DeepaLogo_WnO.svg"}
      alt="Bitcoin Deepa"
      width={width}
      height={size}
      style={{ width, height: size }}
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
    case "telegram-brand": {
      const fp = { ...p, fill: "currentColor", stroke: "none" };
      return (<svg {...fp}><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" /></svg>);
    }
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
    case "whatsapp": {
      const fp = { ...p, fill: "currentColor", stroke: "none" };
      return (<svg {...fp}><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" /></svg>);
    }
    case "facebook": {
      const fp = { ...p, fill: "currentColor", stroke: "none" };
      return (<svg {...fp}><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" /></svg>);
    }
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
