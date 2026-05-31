// app.jsx — Sats Dansala faucet flow

// PHP backend base URL — no trailing slash
const API_BASE = "/api";

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "accent": "#F7931A",
  "bgMode": "lanterns",
  "ambient": true,
  "headline": "Sats Dansala",
  "tagline": "Free Vesak sats for the Bitcoin Deepa community. Light a lantern, claim your blessing.",
  "eventLabel": "Vesak 2026 · Free Sats Faucet",
  "luckTitle": "How the lantern is lit",
  "luckDesc": "Every claim draws a random gift. The odds favour many small blessings — but the brightest lamps shine for a lucky few."
}/*EDITMODE-END*/;

const TELEGRAM_URL = "https://t.me/bitcoindeepabot";
const LUMA_URL = "https://luma.com/bitcoindeepa?period=past";
const STORE_KEY = "sats-dansala-v1";

const CONFIG_DEFAULTS = {
  tiers: {
    stingy:   [[0.78, 100, 999, "Common"], [0.95, 1000, 2499, "Generous"], [0.992, 2500, 5999, "Lucky"], [1, 6000, 10000, "Jackpot"]],
    balanced: [[0.62, 100, 999, "Common"], [0.88, 1000, 2999, "Generous"], [0.975, 3000, 6999, "Lucky"], [1, 7000, 10000, "Jackpot"]],
    generous: [[0.45, 100, 999, "Common"], [0.78, 1000, 3999, "Generous"], [0.95, 4000, 7499, "Lucky"], [1, 7500, 10000, "Jackpot"]],
  },
  maxAmount: 10000,
  generosity: "balanced",
};
const CONFIG_CACHE_KEY = "sats-dansala-config-v1";

// derive probability % for each tier from the cumulative table
function tierBars(tiers, generosity) {
  const table = tiers[generosity] || tiers.balanced;
  return table.map(([thr, min, max, tier], i) => {
    const prev = i === 0 ? 0 : table[i - 1][0];
    const w    = +((thr - prev) * 100).toFixed(1);
    return { tier, range: `${fmt(min)} – ${fmt(max)} sats`, w };
  });
}

const TIER_META = {
  Common:   { label: "A warm blessing", color: "#FFC76A" },
  Generous: { label: "A generous pour", color: "#FF8A1F" },
  Lucky:    { label: "A lucky lantern!", color: "#FF6B2C" },
  Jackpot:  { label: "JACKPOT — the brightest lamp!", color: "#FF3C00" },
};

function fmt(n) { return n.toLocaleString("en-US"); }

function buildShareText(amt, tier) {
  const msgs = {
    Jackpot:  `🎆 JACKPOT! Just received ${fmt(amt)} sats at the Bitcoin Deepa Sats Dansala! ⚡🪔 @bitcoindeepa`,
    Lucky:    `✨ Lucky lantern! Just received ${fmt(amt)} sats at the Bitcoin Deepa Sats Dansala! ⚡🪔 @bitcoindeepa`,
    Generous: `🪔 A generous pour! Just received ${fmt(amt)} sats at the Bitcoin Deepa Sats Dansala! ⚡ @bitcoindeepa`,
    Common:   `🪔 Just lit a lantern & claimed ${fmt(amt)} sats at the Bitcoin Deepa Sats Dansala! ⚡ @bitcoindeepa`,
  };
  return (msgs[tier] || msgs.Common) + '\n\n#Bitcoin #SatsDansala #Bitcoindeepa #Vesak2026';
}

function ShareButtons({ amt, tier }) {
  const url  = window.location.origin + window.location.pathname;
  const text = buildShareText(amt, tier);
  const enc  = encodeURIComponent;
  const [imgBusy, setImgBusy] = React.useState(false);

  const handleShareImage = () => {
    if (imgBusy || typeof html2canvas === 'undefined') return;
    setImgBusy(true);
    const el = document.getElementById('share-receipt');
    html2canvas(el, { scale: 2, useCORS: true, backgroundColor: '#FBF7EE', logging: false })
      .then(canvas => canvas.toBlob(blob => {
        const file = new File([blob], 'sats-dansala-receipt.png', { type: 'image/png' });
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          navigator.share({ files: [file], title: 'Sats Dansala Receipt', text }).catch(() => {});
        } else {
          const a = document.createElement('a');
          a.href = URL.createObjectURL(blob);
          a.download = 'sats-dansala-receipt.png';
          a.click();
          URL.revokeObjectURL(a.href);
        }
        setImgBusy(false);
      }, 'image/png'))
      .catch(() => setImgBusy(false));
  };

  const canShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function';

  return (
    <div className="share-row">
      <span className="share-label">Share your blessing</span>
      <div className="share-btns">
        <button className="share-btn share-img-btn" onClick={handleShareImage} disabled={imgBusy}>
          <Icon name="share" size={14} /><span>{imgBusy ? 'Capturing…' : 'Share Receipt Image'}</span>
        </button>
        {canShare && (
          <button className="share-btn" onClick={() => navigator.share({ title: 'Sats Dansala', text, url }).catch(() => {})}>
            <Icon name="share" size={13} /><span>Share text</span>
          </button>
        )}
        <a className="share-btn" href={`https://twitter.com/intent/tweet?text=${enc(text + '\n' + url)}`} target="_blank" rel="noopener">
          <Icon name="twitter" size={13} /><span>Post</span>
        </a>
        <a className="share-btn" href={`https://wa.me/?text=${enc(text + '\n' + url)}`} target="_blank" rel="noopener">
          <Icon name="whatsapp" size={13} /><span>WhatsApp</span>
        </a>
        <a className="share-btn" href={`https://t.me/share/url?url=${enc(url)}&text=${enc(text)}`} target="_blank" rel="noopener">
          <Icon name="telegram" size={13} /><span>Telegram</span>
        </a>
        <a className="share-btn" href={`https://www.facebook.com/sharer/sharer.php?u=${enc(url)}&quote=${enc(text)}`} target="_blank" rel="noopener">
          <Icon name="facebook" size={13} /><span>Facebook</span>
        </a>
      </div>
    </div>
  );
}

// ── Step row ──────────────────────────────────────────────
function Step({ n, done, locked, verifying, title, desc, actionLabel, icon, onAction }) {
  return (
    <div className={"step" + (done ? " done" : "") + (locked ? " locked" : "")}>
      <div className="step-badge">
        {done ? <Icon name="check" size={20} /> : verifying ? <span className="spin-ring" /> : n}
      </div>
      <div className="step-body">
        <div className="step-title">{title}</div>
        <div className="step-desc">{desc}</div>
      </div>
      <button className="step-btn" disabled={locked} onClick={onAction}>
        {done ? <Icon name="check" size={16} /> : <Icon name={icon} size={16} />}
        <span>{done ? "Done" : actionLabel}</span>
      </button>
    </div>
  );
}

// ── Result receipt ────────────────────────────────────────
function Receipt({ result, username, onReset }) {
  const meta = TIER_META[result.tier];
  return (
    <div id="share-receipt" className={"receipt-card tier-" + result.tier.toLowerCase()}>
      <div className="rc-head">
        <span className="rc-kicker">Sats Dansala · Vesak 2026</span>
        <span className="rc-tier" style={{ color: meta.color }}>{result.tier}</span>
      </div>
      <div className="rc-dotted" />
      <div className="rc-blessing">{meta.label}</div>
      <div className="rc-amount">
        <span className="rc-num">{fmt(result.amt)}</span>
        <span className="rc-unit">sats</span>
      </div>
      <div className="rc-to">
        <span>Sent to</span>
        <strong>{username ? username : "your Bitcoin Deepa wallet"}</strong>
      </div>
      <div className="rc-dotted" />
      <div className="rc-rows">
        <div><span>Date</span><span>{new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}</span></div>
        <div><span>Network</span><span>Lightning ⚡</span></div>
        <div><span>Status</span><span className="rc-ok">Delivered</span></div>
      </div>
      <ShareButtons amt={result.amt} tier={result.tier} />
      <div className="rc-foot">
        <DeepaMark size={16} ink />
        <button className="rc-reset" onClick={onReset}>Claim again ↺</button>
      </div>
    </div>
  );
}

// ── Already claimed notice ────────────────────────────────
function AlreadyClaimed({ username, onReset }) {
  return (
    <div className="already-card">
      <div className="ac-icon"><Icon name="shield" size={32} /></div>
      <div className="ac-title">Already claimed</div>
      {username && (
        <div className="ac-user">
          <span className="ac-at">@</span>{username}
        </div>
      )}
      <div className="ac-msg">
        This Telegram account has already received sats from this faucet.
        Each account can only claim once.
      </div>
      <button className="rc-reset" onClick={onReset}>Try a different account ↺</button>
    </div>
  );
}

// ── Pending admin approval ────────────────────────────────
function PendingApproval({ data, onReset }) {
  const terminal = data?.terminal;
  return (
    <div className={"pending-card" + (terminal ? " pa-terminal" : "")}>
      <div className="pa-icon">
        {terminal ? <Icon name="shield" size={32} /> : <span className="spin-ring lg" />}
      </div>
      <div className="pa-title">
        {terminal === "rejected" ? "Transaction rejected"
          : terminal === "expired" ? "Approval expired"
          : "Awaiting admin approval"}
      </div>
      <div className="pa-amount">{fmt(data.amount)} <span className="pa-unit">sats</span></div>
      {data.amountLkr && <div className="pa-lkr">LKR {data.amountLkr}</div>}
      <div className="pa-msg">
        {terminal === "rejected"
          ? "The admin declined this transaction. Please contact support if you think this is an error."
          : terminal === "expired"
          ? "The approval request was not acted on within 24 hours. Please contact support to retry."
          : "This transfer exceeds the auto-approval limit. An admin has been notified via Telegram and will approve it shortly."}
      </div>
      {!terminal && <div className="pa-waiting"><span className="spin-ring sm" /> Checking every 10 seconds…</div>}
      <button className="rc-reset" onClick={onReset}>← Back</button>
    </div>
  );
}

// ── Luma subscription verify step ─────────────────────────
function LumaStep({ locked, opened, onOpen, email, setEmail, state, err, onVerify, lumaUrl }) {
  const verified = state === "verified";
  const verifying = state === "verifying";
  return (
    <div className={"step luma-step" + (verified ? " done" : "") + (locked ? " locked" : "")}>
      <div className="step-badge">
        {verified ? <Icon name="check" size={20} /> : verifying ? <span className="spin-ring" /> : "2"}
      </div>
      <div className="step-body luma-body">
        <div className="step-title">Subscribe &amp; verify on Luma</div>
        <div className="step-desc">
          {opened
            ? "Now enter the email you subscribed with so we can confirm it."
            : "Open the Bitcoin Deepa page and subscribe — then come back to verify."}
        </div>

        {!opened && !verified && (
          <button className="step-btn luma-open" disabled={locked} onClick={onOpen}>
            <Icon name="luma" size={16} /><span>Subscribe on Luma</span>
          </button>
        )}

        {opened && !verified && (
          <React.Fragment>
            <div className="luma-row">
              <input className="luma-input" type="email" inputMode="email" placeholder="you@email.com"
                value={email} disabled={verifying || locked} autoFocus
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") onVerify(); }} />
              <button className="luma-verify" disabled={verifying || locked} onClick={onVerify}>
                {verifying ? "Checking…" : "Verify"}
              </button>
            </div>
            <a className="luma-link" onClick={onOpen}>Didn't subscribe yet? Open Luma again →</a>
          </React.Fragment>
        )}

        {verifying && <div className="luma-status"><span className="spin-ring sm" />Checking with Luma…</div>}
        {state === "error" && <div className="luma-msg err">{err}</div>}
        {verified && <div className="luma-msg ok"><Icon name="check" size={14} /> Subscription confirmed · {email}</div>}
      </div>
    </div>
  );
}

// ── Claim card (centerpiece) ──────────────────────────────
function ClaimCard({ t, maxAmount }) {
  const [sessionId, setSessionId] = React.useState(null);
  // telegramState: idle | opened | verified
  const [telegramState, setTelegramState] = React.useState("idle");
  const s1 = telegramState === "verified";
  const [email, setEmail] = React.useState("");
  const [lumaOpened, setLumaOpened] = React.useState(false);
  const [lumaState, setLumaState] = React.useState("idle"); // idle | verifying | verified | error
  const [lumaErr, setLumaErr] = React.useState("");
  const [username, setUsername] = React.useState("");
  const s2 = lumaState === "verified";
  const [phase, setPhase] = React.useState("idle"); // idle | rolling | done | pending
  const [display, setDisplay] = React.useState(0);
  const [result, setResult] = React.useState(null);
  const [pendingData, setPendingData] = React.useState(null);
  const [claimErr, setClaimErr] = React.useState("");

  // ── fetch or restore session ID ──────────────────────────
  React.useEffect(() => {
    try {
      const raw = JSON.parse(localStorage.getItem(STORE_KEY) || "{}");
      if (raw.sessionId) {
        setSessionId(raw.sessionId);
        if (raw.telegramState) setTelegramState(raw.telegramState);
        if (raw.email) setEmail(raw.email);
        if (raw.lumaOpened) setLumaOpened(true);
        if (raw.lumaVerified) setLumaState("verified");
        if (raw.username) setUsername(raw.username);
        if (raw.result) { setResult(raw.result); setPhase("done"); setDisplay(raw.result.amt); }
        else if (raw.pendingData) { setPendingData(raw.pendingData); setPhase("pending"); }
        return;
      }
    } catch (e) {}
    fetch(API_BASE + "/session.php", { method: "POST" })
      .then(r => r.json())
      .then(d => { if (d.session_id) setSessionId(d.session_id); })
      .catch(() => {});
  }, []);

  // ── persist state ────────────────────────────────────────
  React.useEffect(() => {
    const payload = {
      sessionId, telegramState, email, lumaOpened,
      lumaVerified: s2, username,
      result: phase === "done" ? result : null,
      pendingData: phase === "pending" ? pendingData : null,
    };
    try { localStorage.setItem(STORE_KEY, JSON.stringify(payload)); } catch (e) {}
  }, [sessionId, telegramState, email, lumaOpened, s2, username, result, phase, pendingData]);

  // ── 5-second ping to check if user started the bot ───────
  const [telegramErr, setTelegramErr] = React.useState("");
  React.useEffect(() => {
    if (telegramState !== "opened" || !sessionId) return;
    const ping = () => {
      fetch(API_BASE + "/ping-telegram.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: sessionId }),
      })
        .then(r => r.json())
        .then(d => {
          if (d.verified) {
            setTelegramState("verified");
            if (d.username) setUsername(d.username);
          } else if (d.already_claimed) {
            setTelegramState("blocked");
            if (d.username) setUsername(d.username);
            setTelegramErr(d.message || "This Telegram account has already claimed.");
          }
        })
        .catch(() => {});
    };
    ping(); // immediate first check
    const id = setInterval(ping, 5000);
    return () => clearInterval(id);
  }, [telegramState, sessionId]);

  // ── 10-second poll while awaiting admin approval ─────────
  React.useEffect(() => {
    if (phase !== "pending" || !sessionId) return;
    const poll = () => {
      fetch(API_BASE + "/poll-claim.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: sessionId }),
      })
        .then(r => r.json())
        .then(d => {
          if (d.approved) {
            setResult({ amt: d.amount, tier: d.tier || "Common" });
            setPhase("done");
          } else if (d.terminal) {
            setPendingData(prev => ({ ...prev, terminal: d.terminal }));
          }
        })
        .catch(() => {});
    };
    poll();
    const id = setInterval(poll, 10000);
    return () => clearInterval(id);
  }, [phase, sessionId]);

  const openTelegram = () => {
    if (!sessionId) return;
    window.open(TELEGRAM_URL + "?start=" + sessionId, "_blank", "noopener");
    if (telegramState === "idle") setTelegramState("opened");
  };

  const openLuma = () => {
    window.open(LUMA_URL, "_blank", "noopener");
    setLumaOpened(true);
    if (lumaState === "error") setLumaState("idle");
  };

  const ready = s1 && s2 && phase === "idle";

  const verifyLuma = () => {
    if (lumaState === "verifying" || lumaState === "verified") return;
    const ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
    if (!ok) { setLumaErr("Enter the email you used to subscribe on Luma."); setLumaState("error"); return; }
    setLumaErr(""); setLumaState("verifying");
    fetch(API_BASE + "/verify-luma.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ session_id: sessionId, email: email.trim() }),
    })
      .then(r => r.json())
      .then(d => {
        if (d.verified) setLumaState("verified");
        else { setLumaErr(d.error || "Verification failed. Please try again."); setLumaState("error"); }
      })
      .catch(() => { setLumaErr("Network error. Please try again."); setLumaState("error"); });
  };

  // ── claim — backend rolls the amount, frontend animates ──
  const claim = () => {
    if (!ready) return;
    setPhase("rolling");

    let spins = 0;
    let lastSpun = 0;
    const spinTimer = setInterval(() => {
      spins++;
      lastSpun = Math.floor(100 + Math.random() * (maxAmount - 100));
      setDisplay(lastSpun);
      if (spins >= 13) clearInterval(spinTimer);
    }, 55);

    fetch(API_BASE + "/claim.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ session_id: sessionId }),
    })
      .then(async r => { const d = await r.json(); return { _http: r.status, ...d }; })
      .then(d => {
        if (d._http === 202) {
          clearInterval(spinTimer);
          setPendingData({ message: d.message, amount: d.amount, amountLkr: d.amount_lkr, memo: d.memo });
          setPhase("pending");
          return;
        }
        if (!d.amount || d.error) {
          clearInterval(spinTimer);
          const raw = d.error || d.message || "Claim failed.";
          setClaimErr(raw.toLowerCase().startsWith("insufficient balance")
            ? "The Daane faucet is temporarily empty — please check back soon!"
            : raw);
          setPhase("idle");
          return;
        }
        setClaimErr("");
        const countUp = (targetAmt, targetTier) => {
          if (spins < 13) { setTimeout(() => countUp(targetAmt, targetTier), 100); return; }
          const startAmt = lastSpun;
          const t0 = Date.now();
          const up = setInterval(() => {
            const p = Math.min(1, (Date.now() - t0) / 650);
            const e = 1 - Math.pow(1 - p, 3);
            setDisplay(Math.floor(startAmt + (targetAmt - startAmt) * e));
            if (p >= 1) {
              clearInterval(up);
              setDisplay(targetAmt);
              setResult({ amt: targetAmt, tier: targetTier });
              setPhase("done");
            }
          }, 40);
        };
        countUp(d.amount, d.tier);
      })
      .catch(() => { clearInterval(spinTimer); setClaimErr("Network error. Please try again."); setPhase("idle"); });
  };

  const reset = () => {
    setResult(null); setPhase("idle"); setDisplay(0); setPendingData(null); setClaimErr("");
    setTelegramState("idle"); setSessionId(null);
    setEmail(""); setLumaOpened(false); setLumaState("idle"); setLumaErr(""); setUsername("");
    try { localStorage.removeItem(STORE_KEY); } catch (e) {}
    fetch(API_BASE + "/session.php", { method: "POST" })
      .then(r => r.json())
      .then(d => { if (d.session_id) setSessionId(d.session_id); })
      .catch(() => {});
  };

  return (
    <div className="claim-card">
      <SparkBurst run={phase === "done"} />
      <div className="cc-glow" />
      <div className="cc-header">
        <img className="cc-coin" src="assets/btc-animated.webp" alt="" width={44} height={44} aria-hidden="true" />
        <div>
          <div className="cc-title">Sats Dansala Faucet</div>
          <div className="cc-sub">Three steps to your free sats</div>
        </div>
      </div>

      {phase === "done" ? (
        <Receipt result={result} username={username || email} onReset={reset} />
      ) : phase === "pending" ? (
        <PendingApproval data={pendingData} onReset={reset} />
      ) : telegramState === "blocked" ? (
        <AlreadyClaimed username={username} onReset={reset} />
      ) : (
        <React.Fragment>
          <div className="steps">
            <Step n="1" done={s1}
              verifying={telegramState === "opened"}
              locked={telegramState === "blocked"}
              title="Open the Bitcoin Deepa bot"
              desc={telegramState === "opened"
                ? "Waiting for you to tap Start in the bot…"
                : telegramState === "blocked"
                  ? telegramErr
                  : "Start the bot on Telegram to link your wallet."}
              actionLabel="Open Telegram" icon="telegram"
              onAction={openTelegram} />
            <LumaStep locked={!s1} opened={lumaOpened} onOpen={openLuma} email={email} setEmail={setEmail}
              state={lumaState} err={lumaErr} onVerify={verifyLuma} lumaUrl={LUMA_URL} />
            <div className={"step claim-step" + (ready ? " ready" : " locked")}>
              <div className="step-badge">{ready ? <Icon name="gift" size={20} /> : "3"}</div>
              <div className="step-body">
                <div className="step-title">Claim your sats</div>
                <div className="step-desc">A random gift between 100 and 10,000 sats.</div>
              </div>
            </div>
          </div>

          <input className="cc-input" placeholder="Bitcoin Deepa username or @telegram (optional)"
            value={username} onChange={(e) => setUsername(e.target.value)} />

          <button className={"claim-btn" + (phase === "rolling" ? " rolling" : "")}
            disabled={!ready} onClick={claim}>
            {phase === "rolling"
              ? (<React.Fragment><span className="cb-num">{fmt(display)}</span><span className="cb-spin">lighting your lantern…</span></React.Fragment>)
              : (<React.Fragment><Icon name="bolt" size={20} /><span>{ready ? "Claim my sats" : "Complete steps 1 & 2"}</span></React.Fragment>)}
          </button>

          {claimErr && <div className="claim-err"><Icon name="shield" size={14} /><span>{claimErr}</span></div>}

          <div className="cc-fineprint">
            <Icon name="shield" size={14} />
            <span>Provably random. Most gifts land in the hundreds — a lucky few reach 10,000 sats.</span>
          </div>
        </React.Fragment>
      )}
    </div>
  );
}

// ── App ───────────────────────────────────────────────────
function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const [cfg, setCfg] = React.useState(() => {
    try { const c = JSON.parse(localStorage.getItem(CONFIG_CACHE_KEY)); if (c) return c; } catch (e) {}
    return CONFIG_DEFAULTS;
  });

  React.useEffect(() => {
    fetch(API_BASE + "/config-public.php")
      .then(r => r.json())
      .then(d => {
        const next = {
          tiers: d.tiers || CONFIG_DEFAULTS.tiers,
          maxAmount: d.max_amount || CONFIG_DEFAULTS.maxAmount,
          generosity: d.generosity || CONFIG_DEFAULTS.generosity,
        };
        setCfg(next);
        try { localStorage.setItem(CONFIG_CACHE_KEY, JSON.stringify(next)); } catch (e) {}
      })
      .catch(() => {});
  }, []);

  React.useEffect(() => {
    document.documentElement.style.setProperty("--orange", t.accent);
    document.body.dataset.bg = t.bgMode;
  }, [t.accent, t.bgMode]);

  const showAmbient = t.ambient && t.bgMode !== "plain";

  return (
    <div className="page">
      {showAmbient && (
        <div className="ambient" aria-hidden="true">
          <Lantern size={150} className="amb a1" />
          <Lantern size={100} className="amb a2" hue="ember" />
          <Lantern size={120} className="amb a3" />
          <Lantern size={84} className="amb a4" hue="gold" />
          <Lantern size={64} className="amb a5" hue="ember" />
        </div>
      )}

      <header className="nav">
        <DeepaMark size={46} />
        <div className="nav-right">
          <span className="nav-event">{t.eventLabel}</span>
          <a className="nav-link" href={LUMA_URL} target="_blank" rel="noopener">Events <Icon name="external" size={14} /></a>
        </div>
      </header>

      <main className="hero">
        <div className="hero-copy">
          <div className="kicker">
            <svg className="kicker-ic" viewBox="0 0 512 512" width="14" height="14" aria-hidden="true">
              <path fill="currentColor" d="M256 512A256 256 0 1 0 256 0a256 256 0 1 0 0 512zm50.7-186.9L162.4 380.6c-19.4 7.5-38.5-11.6-31-31l55.5-144.3c3.3-8.5 9.9-15.1 18.4-18.4l144.3-55.5c19.4-7.5 38.5 11.6 31 31L325.1 306.7c-3.2 8.5-9.9 15.1-18.4 18.4zM288 256a32 32 0 1 0 -64 0 32 32 0 1 0 64 0z" />
            </svg>
            Pearl of Satoshi · Bitcoin Deepa · Sri Lanka
          </div>
          <h1 className="display">{t.headline}</h1>
          <p className="lede">{t.tagline}</p>
          <ul className="hero-points">
            <li><Icon name="users" size={18} /> Open to every Bitcoin Deepa wallet holder</li>
            <li><Icon name="bolt" size={18} /> Paid instantly over the Lightning Network</li>
            <li><Icon name="gift" size={18} /> Random 100–10,000 sats — give like a dansala</li>
          </ul>
          <div className="hero-meta">
            <div><span className="hm-num">100–10k</span><span className="hm-lbl">sats per claim</span></div>
            <div className="hm-div" />
            <div><span className="hm-num">⚡ instant</span><span className="hm-lbl">lightning payout</span></div>
            <div className="hm-div" />
            <div><span className="hm-num">Vesak</span><span className="hm-lbl">limited time</span></div>
          </div>
        </div>

        <div className="hero-claim">
          <ClaimCard t={t} maxAmount={cfg.maxAmount} />
        </div>
      </main>

      <section className="luck">
        <div className="luck-head">
          <h2>{t.luckTitle}</h2>
          <p>{t.luckDesc}</p>
        </div>
        <div className="luck-bars">
          {tierBars(cfg.tiers, cfg.generosity).map((b) => (
            <div className="luck-bar" key={b.tier}>
              <div className="lb-top"><span className="lb-tier" style={{ color: TIER_META[b.tier].color }}>{b.tier}</span><span className="lb-pct">{b.w.toFixed(1)}%</span></div>
              <div className="lb-track"><div className="lb-fill" style={{ width: b.w + "%", background: TIER_META[b.tier].color }} /></div>
              <div className="lb-range">{b.range}</div>
            </div>
          ))}
        </div>
      </section>

      <footer className="foot">
        <DeepaMark size={40} />
        <span className="foot-tag">A Vesak dansala of sats · Stay humble, stack sats, share the light.</span>
      </footer>

      <TweaksPanel>
        <TweakSection label="Brand" />
        <TweakColor label="Accent" value={t.accent}
          options={["#F7931A", "#FF8A1F", "#FF6B00", "#FFB300", "#E8472B"]}
          onChange={(v) => setTweak("accent", v)} />
        <TweakSection label="Atmosphere" />
        <TweakRadio label="Background" value={t.bgMode}
          options={["lanterns", "ember", "plain"]}
          onChange={(v) => setTweak("bgMode", v)} />
        <TweakToggle label="Floating lanterns" value={t.ambient}
          onChange={(v) => setTweak("ambient", v)} />
        <TweakSection label="Copy" />
        <TweakText label="Headline" value={t.headline} onChange={(v) => setTweak("headline", v)} />
        <TweakText label="Tagline" value={t.tagline} onChange={(v) => setTweak("tagline", v)} />
        <TweakText label="Event label" value={t.eventLabel} onChange={(v) => setTweak("eventLabel", v)} />
        <TweakText label="Luck title" value={t.luckTitle} onChange={(v) => setTweak("luckTitle", v)} />
        <TweakText label="Luck desc" value={t.luckDesc} onChange={(v) => setTweak("luckDesc", v)} />
      </TweaksPanel>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
