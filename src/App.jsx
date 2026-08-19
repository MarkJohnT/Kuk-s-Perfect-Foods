import { useState, useEffect, useCallback, useMemo } from "react";
import {
  ShoppingCart, Menu as MenuIcon, X, Phone, MapPin, Music2,
  Image as ImageIcon, PlayCircle, Lock, Plus, Minus, Trash2,
  Send, Calendar, Users, Check, ArrowRight, Leaf
} from "lucide-react";
import {
  fetchMenu, addMenuItem, updateMenuItem, deleteMenuItem,
  fetchGallery, addGalleryItem, deleteGalleryItem, uploadGalleryPhoto,
  submitOrder, submitBooking, fetchOrders, fetchBookings,
  signInAdmin, signOutAdmin, getSession, onAuthChange,
} from "./lib/db";

/* lucide-react has no Instagram/LinkedIn icons — small inline substitutes */
const Instagram = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
  </svg>
);
const Linkedin = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M4.98 3.5C4.98 4.88 3.94 6 2.5 6S0 4.88 0 3.5 1.06 1 2.5 1s2.48 1.12 2.48 2.5zM.5 8h4V23h-4V8zm7.5 0h3.8v2.05h.05c.53-1 1.83-2.05 3.77-2.05 4.03 0 4.78 2.65 4.78 6.1V23h-4v-6.9c0-1.65-.03-3.77-2.3-3.77-2.3 0-2.65 1.8-2.65 3.65V23h-4V8z" />
  </svg>
);
const Facebook = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
  </svg>
);

/* ============================= CONSTANTS ============================= */

const WHATSAPP_NUMBER = "233554322874"; // 055 432 2874

const CATEGORIES = [
  "Sandwiches", "Burgers", "Drinks", "Food Baskets",
  "Bulk Packs", "Freezer Meals", "Pastries",
];

const EVENT_TYPES = ["Wedding", "Corporate Event", "Birthday", "Anniversary", "Funeral", "Other"];

const GRADIENTS = [
  "linear-gradient(135deg,#2a4a3a,#c9a24b)",
  "linear-gradient(135deg,#7a9b7e,#1e3a2f)",
  "linear-gradient(135deg,#c9a24b,#8a6d2f)",
  "linear-gradient(135deg,#1e3a2f,#3f6650)",
  "linear-gradient(135deg,#9c7b3a,#2b2621)",
  "linear-gradient(135deg,#7a9b7e,#c9a24b)",
];

/* ============================= HELPERS ============================= */

const cedis = (n) => `GH₵${Number(n).toFixed(2)}`;

function buildWhatsAppLink(message) {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}

/* ============================= SMALL UI PIECES ============================= */

function LeafDivider() {
  return (
    <div className="leaf-divider" aria-hidden="true">
      <svg width="90" height="28" viewBox="0 0 90 28" fill="none">
        <path d="M45 24 C 40 10, 20 6, 4 4" stroke="#C9A24B" strokeWidth="1.4" fill="none" strokeLinecap="round" />
        <path d="M45 24 C 50 10, 70 6, 86 4" stroke="#C9A24B" strokeWidth="1.4" fill="none" strokeLinecap="round" />
        <path d="M45 24 L45 2" stroke="#C9A24B" strokeWidth="1.4" strokeLinecap="round" />
        <path d="M18 8 C 22 12, 24 15, 22 19" stroke="#C9A24B" strokeWidth="1.1" fill="none" strokeLinecap="round" />
        <path d="M72 8 C 68 12, 66 15, 68 19" stroke="#C9A24B" strokeWidth="1.1" fill="none" strokeLinecap="round" />
        <circle cx="45" cy="3" r="2.6" fill="#C9A24B" />
      </svg>
    </div>
  );
}

function Eyebrow({ children }) {
  return <div className="eyebrow">{children}</div>;
}

function SectionTitle({ eyebrow, title, subtitle, light }) {
  return (
    <div className={`section-title ${light ? "on-dark" : ""}`}>
      {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
      <h2>{title}</h2>
      {subtitle && <p className="section-subtitle">{subtitle}</p>}
      <LeafDivider />
    </div>
  );
}

function Badge({ children }) {
  return <span className="badge">{children}</span>;
}

/* Shared gallery tile — used on Home, the Gallery page, and Admin.
   Shows a real photo/video thumbnail when the item has one, otherwise
   falls back to the original gradient placeholder card. */
function GalleryCard({ item, large, onRemove }) {
  const media = item.type === "video" ? item.thumbnailUrl : item.imageUrl;
  const bgStyle = media
    ? { backgroundImage: `url(${media})`, backgroundSize: "cover", backgroundPosition: "center" }
    : { background: item.gradient };

  const inner = (
    <div className={`gallery-card ${large ? "large" : ""}`} style={bgStyle}>
      {item.type === "video" && <PlayCircle className="gallery-play" size={large ? 40 : 34} />}
      {item.type === "photo" && !item.imageUrl && <ImageIcon className="gallery-icon" size={26} />}
      <div className="gallery-card-footer">
        <Badge>{item.eventType}</Badge>
        <p>{item.caption}</p>
      </div>
      {onRemove && (
        <button
          className="icon-btn gallery-remove"
          onClick={(e) => { e.preventDefault(); onRemove(); }}
          aria-label="Remove"
        >
          <Trash2 size={15} />
        </button>
      )}
    </div>
  );

  if (!onRemove && item.type === "video" && item.videoUrl) {
    return (
      <a className="gallery-card-link" href={item.videoUrl} target="_blank" rel="noreferrer">
        {inner}
      </a>
    );
  }
  return inner;
}

/* ============================= HEADER / FOOTER ============================= */

function Header({ page, setPage, cartCount }) {
  const [open, setOpen] = useState(false);
  const links = [
    ["home", "Home"],
    ["gallery", "Gallery"],
    ["menu", "Menu"],
    ["catering", "Catering & Events"],
    ["about", "About"],
    ["contact", "Contact"],
  ];
  const go = (p) => { setPage(p); setOpen(false); window.scrollTo({ top: 0, behavior: "smooth" }); };
  return (
    <header className="site-header">
      <div className="header-inner">
        <button className="brand" onClick={() => go("home")} aria-label="Kuks Perfect Foods — Home">
          <span className="brand-mark">
            <img src="https://i.postimg.cc/tTF7F5cH/586688808-18434170732096806-8584316859288828923-n.jpg" alt="Kuks Perfect Foods logo" />
          </span>
          <span className="brand-word">
            <strong>Kuks</strong> Perfect Foods
          </span>
        </button>

        <nav className="nav-desktop">
          {links.map(([key, label]) => (
            <button key={key} className={`nav-link ${page === key ? "active" : ""}`} onClick={() => go(key)}>
              {label}
            </button>
          ))}
        </nav>

        <div className="header-actions">
          <button className="icon-btn cart-btn" onClick={() => go("cart")} aria-label="View cart">
            <ShoppingCart size={20} />
            {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
          </button>
          <button className="icon-btn mobile-toggle" onClick={() => setOpen((o) => !o)} aria-label="Toggle menu">
            {open ? <X size={22} /> : <MenuIcon size={22} />}
          </button>
        </div>
      </div>

      {open && (
        <div className="nav-mobile">
          {links.map(([key, label]) => (
            <button key={key} className={`nav-link ${page === key ? "active" : ""}`} onClick={() => go(key)}>
              {label}
            </button>
          ))}
        </div>
      )}
    </header>
  );
}

function Footer({ setPage }) {
  return (
    <footer className="site-footer">
      <div className="footer-inner">
        <div className="footer-brand">
          <span className="brand-mark">
            <img src="https://i.postimg.cc/tTF7F5cH/586688808-18434170732096806-8584316859288828923-n.jpg" alt="Kuks Perfect Foods logo" />
          </span>
          <div>
            <div className="footer-title">Kuks Perfect Foods</div>
            <p>Catering, food baskets, bulk packs and freezer-friendly meals — Cape Coast &amp; Accra.</p>
          </div>
        </div>

        <div className="footer-col">
          <h4>Explore</h4>
          <button onClick={() => setPage("gallery")}>Gallery</button>
          <button onClick={() => setPage("menu")}>Menu &amp; Order</button>
          <button onClick={() => setPage("catering")}>Catering &amp; Events</button>
          <button onClick={() => setPage("about")}>About Us</button>
        </div>

        <div className="footer-col">
          <h4>Get in touch</h4>
          <a href={`tel:+${WHATSAPP_NUMBER}`}><Phone size={15} /> 055 432 2874</a>
          <span><MapPin size={15} /> Abura New Town, Cape Coast</span>
          <div className="socials">
            <a href="https://www.instagram.com/kuksperfectfoods" target="_blank" rel="noreferrer" aria-label="Instagram"><Instagram size={17} /></a>
            <a href="https://www.facebook.com/profile.php?id=100063714424167&__tn__=%2Cd" target="_blank" rel="noreferrer" aria-label="Facebook"><Facebook size={17} /></a>
            <a href="https://www.tiktok.com/@kuks_perfect_foods" target="_blank" rel="noreferrer" aria-label="TikTok"><Music2 size={17} /></a>
            <a href="https://gh.linkedin.com" target="_blank" rel="noreferrer" aria-label="LinkedIn"><Linkedin size={17} /></a>
          </div>
        </div>
      </div>
      <div className="footer-bottom">
        <span>© {new Date().getFullYear()} Kuks Perfect Foods. All rights reserved.</span>
        <button className="admin-link" onClick={() => setPage("admin")}>Admin</button>
      </div>
    </footer>
  );
}

/* ============================= HOME ============================= */

function Home({ setPage, menu, gallery, addToCart }) {
  const featured = menu.filter((m) => ["Burgers", "Sandwiches"].includes(m.category)).slice(0, 4);
  const galleryPreview = gallery.slice(0, 3);
  const heroPhoto = gallery.find((g) => g.type === "photo" && g.imageUrl)?.imageUrl;
  const heroStyle = heroPhoto
    ? { backgroundImage: `url(${heroPhoto})`, backgroundSize: "cover", backgroundPosition: "center" }
    : { background: GRADIENTS[0] };
  return (
    <div>
      <section className="hero">
        <div className="hero-inner">
          <Eyebrow>Cape Coast &amp; Accra · Available to travel</Eyebrow>
          <h1>Food that makes the whole event <em>feel</em> perfect.</h1>
          <p className="hero-sub">
            From gold-dressed wedding buffets to freezer-friendly soups for a busy week,
            Kuks Perfect Foods brings restaurant-quality food and full-service catering to
            your table.
          </p>
          <div className="hero-actions">
            <button className="btn btn-primary" onClick={() => setPage("catering")}>
              Book Catering <ArrowRight size={16} />
            </button>
            <button className="btn btn-outline" onClick={() => setPage("menu")}>
              Order from the Menu
            </button>
          </div>
          <div className="hero-stats">
            <div><strong>7.6K+</strong><span>Followers</span></div>
            <div><strong>5.0★</strong><span>Rated service</span></div>
            <div><strong>2</strong><span>Cities served</span></div>
          </div>
        </div>
        <button className="hero-visual" style={heroStyle} onClick={() => setPage("gallery")} aria-label="See full gallery">
          <div className="hero-visual-caption">
            <PlayCircle size={22} />
            <span>See our latest event setups</span>
          </div>
        </button>
      </section>

      <section className="section">
        <SectionTitle eyebrow="What we do" title="Services built around your table" />
        <div className="services-grid">
          {[
            ["Catering for All Events", "Weddings, corporate events, birthdays and more — full-service setup, gold chafing dishes included."],
            ["Food Baskets", "Beautifully arranged gift baskets for breakfast, fruit or snacks."],
            ["Bulk Food Packs", "Party-size packs of jollof, waakye and fried rice — ready to feed a crowd."],
            ["Freezer-Friendly Meals", "Soups and stews packed for the freezer, ready whenever you need them."],
          ].map(([title, desc]) => (
            <div className="service-card" key={title}>
              <div className="service-card-icon"><Leaf size={18} /></div>
              <h3>{title}</h3>
              <p>{desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="section alt">
        <SectionTitle eyebrow="From the menu" title="A few favorites" subtitle="Order these and more from our full menu." />
        <div className="menu-grid">
          {featured.map((item) => (
            <div className="menu-card" key={item.id}>
              <div className="menu-card-top">
                <h4>{item.name}</h4>
                <span className="price">{cedis(item.price)}</span>
              </div>
              {item.description && <p>{item.description}</p>}
              <button className="btn btn-small btn-outline" onClick={() => addToCart(item)}>
                <Plus size={14} /> Add to order
              </button>
            </div>
          ))}
        </div>
        <div className="center-btn">
          <button className="btn btn-primary" onClick={() => setPage("menu")}>View Full Menu <ArrowRight size={16} /></button>
        </div>
      </section>

      <section className="section">
        <SectionTitle eyebrow="Our work" title="A peek at recent events" />
        <div className="gallery-preview-grid">
          {galleryPreview.map((g) => (
            <GalleryCard item={g} key={g.id} />
          ))}
        </div>
        <div className="center-btn">
          <button className="btn btn-outline" onClick={() => setPage("gallery")}>See Full Gallery <ArrowRight size={16} /></button>
        </div>
      </section>
    </div>
  );
}

/* ============================= GALLERY ============================= */

function Gallery({ gallery }) {
  const [filter, setFilter] = useState("All");
  const filters = ["All", ...EVENT_TYPES];
  const shown = filter === "All" ? gallery : gallery.filter((g) => g.eventType === filter);
  return (
    <div className="page-wrap">
      <SectionTitle eyebrow="Portfolio" title="Moments we've catered" subtitle="Photos and videos from real Kuks Perfect Foods events." />
      <div className="filter-row">
        {filters.map((f) => (
          <button key={f} className={`pill ${filter === f ? "pill-active" : ""}`} onClick={() => setFilter(f)}>{f}</button>
        ))}
      </div>
      <div className="gallery-grid">
        {shown.map((g) => (
          <GalleryCard item={g} large key={g.id} />
        ))}
        {shown.length === 0 && <p className="empty-note">No items yet for this filter.</p>}
      </div>
    </div>
  );
}

/* ============================= MENU / ORDER ============================= */

function MenuOrder({ menu, addToCart }) {
  const [active, setActive] = useState(CATEGORIES[0]);
  const items = menu.filter((m) => m.category === active);
  return (
    <div className="page-wrap">
      <SectionTitle eyebrow="Menu" title="Order what you need" subtitle="Add items to your order, then review and send it to us on WhatsApp." />
      <div className="filter-row">
        {CATEGORIES.map((c) => (
          <button key={c} className={`pill ${active === c ? "pill-active" : ""}`} onClick={() => setActive(c)}>{c}</button>
        ))}
      </div>
      <div className="menu-grid">
        {items.map((item) => (
          <div className="menu-card" key={item.id}>
            <div className="menu-card-top">
              <h4>{item.name}</h4>
              <span className="price">{cedis(item.price)}</span>
            </div>
            {item.description && <p>{item.description}</p>}
            <button className="btn btn-small btn-outline" onClick={() => addToCart(item)}>
              <Plus size={14} /> Add to order
            </button>
          </div>
        ))}
        {items.length === 0 && <p className="empty-note">No items in this category yet.</p>}
      </div>
    </div>
  );
}

/* ============================= CATERING & EVENTS ============================= */

function Catering({ addBooking }) {
  const [form, setForm] = useState({ name: "", phone: "", eventType: EVENT_TYPES[0], otherEventType: "", eventDate: "", guests: "", message: "" });
  const [sent, setSent] = useState(false);
  const update = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const [error, setError] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.phone) return;
    const eventTypeFinal = form.eventType === "Other" && form.otherEventType ? form.otherEventType : form.eventType;
    try {
      await addBooking({
        name: form.name, phone: form.phone, eventType: eventTypeFinal,
        eventDate: form.eventDate, guests: form.guests, message: form.message,
      });
    } catch {
      setError("Couldn't save your request — please try again.");
      return;
    }

    const msg =
      `New Catering Booking Request\n` +
      `Name: ${form.name}\n` +
      `Phone: ${form.phone}\n` +
      `Event type: ${eventTypeFinal}\n` +
      `Event date: ${form.eventDate || "Not specified"}\n` +
      `Guests: ${form.guests || "Not specified"}\n` +
      `Message: ${form.message || "-"}`;
    window.open(buildWhatsAppLink(msg), "_blank");
    setSent(true);
  };

  return (
    <div className="page-wrap narrow">
      <SectionTitle eyebrow="Catering & Events" title="Let's plan your event" subtitle="Tell us a little about it and we'll follow up on WhatsApp with pricing and details." />
      {sent ? (
        <div className="confirm-box">
          <Check size={22} />
          <h3>Request sent</h3>
          <p>Your booking details were sent to us on WhatsApp. We'll be in touch shortly to confirm.</p>
          <button className="btn btn-outline btn-small" onClick={() => { setSent(false); setForm({ name: "", phone: "", eventType: EVENT_TYPES[0], otherEventType: "", eventDate: "", guests: "", message: "" }); }}>
            Send another request
          </button>
        </div>
      ) : (
        <form className="form-card" onSubmit={submit}>
          <div className="form-row two">
            <label>Full name
              <input required value={form.name} onChange={(e) => update("name", e.target.value)} placeholder="Your name" />
            </label>
            <label>Phone number
              <input required value={form.phone} onChange={(e) => update("phone", e.target.value)} placeholder="e.g. 024 000 0000" />
            </label>
          </div>
          <div className="form-row two">
            <label>Event type
              <select value={form.eventType} onChange={(e) => update("eventType", e.target.value)}>
                {EVENT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </label>
            {form.eventType === "Other" ? (
              <label>Please specify
                <input value={form.otherEventType} onChange={(e) => update("otherEventType", e.target.value)} placeholder="Tell us the event type" />
              </label>
            ) : (
              <label>Event date
                <input type="date" value={form.eventDate} onChange={(e) => update("eventDate", e.target.value)} />
              </label>
            )}
          </div>
          {form.eventType === "Other" && (
            <div className="form-row two">
              <label>Event date
                <input type="date" value={form.eventDate} onChange={(e) => update("eventDate", e.target.value)} />
              </label>
              <label>Expected guests
                <input type="number" min="1" value={form.guests} onChange={(e) => update("guests", e.target.value)} placeholder="e.g. 80" />
              </label>
            </div>
          )}
          {form.eventType !== "Other" && (
            <div className="form-row">
              <label>Expected guests
                <input type="number" min="1" value={form.guests} onChange={(e) => update("guests", e.target.value)} placeholder="e.g. 80" />
              </label>
            </div>
          )}
          <label>Tell us more
            <textarea rows={4} value={form.message} onChange={(e) => update("message", e.target.value)} placeholder="Menu preferences, location, budget range, anything else we should know" />
          </label>
          {error && <p className="form-error">{error}</p>}
          <button className="btn btn-primary" type="submit"><Send size={16} /> Send Booking Request</button>
        </form>
      )}
    </div>
  );
}

/* ============================= ABOUT ============================= */

function About() {
  return (
    <div className="page-wrap narrow">
      <SectionTitle eyebrow="Our story" title="Perfect food, made personal" />
      <div className="founder-block">
        <img
          src="https://i.postimg.cc/FzZRBKNX/CEO.png"
          alt="Founder of Kuks Perfect Foods"
          className="founder-photo"
        />
        <strong>Founder &amp; CEO</strong>
        <span>Kuks Perfect Foods</span>
      </div>
      <div className="about-content">
        <p>
          Kuks Perfect Foods started with a simple belief: food at an event should feel as
          considered as everything else in the room. What began as home cooking for family
          and friends in Cape Coast has grown into a full catering operation trusted for
          weddings, corporate events and everyday food orders across Cape Coast and Accra.
        </p>
        <p>
          Every buffet is dressed with care — gold chafing dishes, fresh flowers, and a menu
          built around real Ghanaian flavors alongside familiar favorites like burgers and
          sandwiches. Whether it's a 200-guest wedding or a single freezer-friendly soup pack
          for the week, the same standard applies: perfect food, every time.
        </p>
        <div className="about-highlights">
          <div><strong>Breakfast · Lunch · Snacks</strong><span>Everyday menu, delivered</span></div>
          <div><strong>Full event catering</strong><span>Setup, service and styling</span></div>
          <div><strong>Freezer-friendly meals</strong><span>Soups and stews, ready when you are</span></div>
        </div>
      </div>
    </div>
  );
}

/* ============================= CONTACT ============================= */

function Contact() {
  return (
    <div className="page-wrap narrow">
      <SectionTitle eyebrow="Get in touch" title="We'd love to hear from you" />
      <div className="contact-grid">
        <a className="contact-card" href={`tel:+${WHATSAPP_NUMBER}`}>
          <Phone size={20} />
          <div><strong>Call or WhatsApp</strong><span>055 432 2874</span></div>
        </a>
        <a className="contact-card" href="https://maps.google.com/?q=Abura+New+Town,+Cape+Coast" target="_blank" rel="noreferrer">
          <MapPin size={20} />
          <div><strong>Location</strong><span>Abura New Town, Cape Coast · Also serving Accra</span></div>
        </a>
        <a className="contact-card" href="https://www.instagram.com/kuksperfectfoods" target="_blank" rel="noreferrer">
          <Instagram size={20} />
          <div><strong>Instagram</strong><span>@kuksperfectfoods</span></div>
        </a>
        <a className="contact-card" href="https://www.facebook.com/profile.php?id=100063714424167&__tn__=%2Cd" target="_blank" rel="noreferrer">
          <Facebook size={20} />
          <div><strong>Facebook</strong><span>Kuks Perfect Foods</span></div>
        </a>
        <a className="contact-card" href="https://www.tiktok.com/@kuks_perfect_foods" target="_blank" rel="noreferrer">
          <Music2 size={20} />
          <div><strong>TikTok</strong><span>@kuks_perfect_foods</span></div>
        </a>
      </div>
    </div>
  );
}

/* ============================= CART ============================= */

function Cart({ cart, updateQty, removeItem, clearCart, addOrder, setPage }) {
  const [form, setForm] = useState({ name: "", phone: "" });
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const total = cart.reduce((s, i) => s + i.price * i.qty, 0);

  const submit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.phone || cart.length === 0) return;
    try {
      await addOrder({ customerName: form.name, phone: form.phone, items: cart, total });
    } catch {
      setError("Couldn't save your order — please try again.");
      return;
    }

    const lines = cart.map((i) => `- ${i.name} x${i.qty} (${cedis(i.price * i.qty)})`).join("\n");
    const msg =
      `New Order\n` +
      `Name: ${form.name}\n` +
      `Phone: ${form.phone}\n\n` +
      `${lines}\n\n` +
      `Total: ${cedis(total)}`;
    window.open(buildWhatsAppLink(msg), "_blank");
    setSent(true);
    clearCart();
  };

  if (sent) {
    return (
      <div className="page-wrap narrow">
        <div className="confirm-box">
          <Check size={22} />
          <h3>Order sent</h3>
          <p>Your order was sent to us on WhatsApp. We'll confirm availability and arrange payment there.</p>
          <button className="btn btn-primary btn-small" onClick={() => setPage("menu")}>Order more</button>
        </div>
      </div>
    );
  }

  return (
    <div className="page-wrap narrow">
      <SectionTitle eyebrow="Your order" title="Review & send" />
      {cart.length === 0 ? (
        <div className="empty-note center">
          <p>Your cart is empty.</p>
          <button className="btn btn-outline btn-small" onClick={() => setPage("menu")}>Browse the menu</button>
        </div>
      ) : (
        <>
          <div className="cart-list">
            {cart.map((item) => (
              <div className="cart-row" key={item.id}>
                <div className="cart-row-info">
                  <strong>{item.name}</strong>
                  <span>{cedis(item.price)} each</span>
                </div>
                <div className="qty-control">
                  <button onClick={() => updateQty(item.id, item.qty - 1)}><Minus size={14} /></button>
                  <span>{item.qty}</span>
                  <button onClick={() => updateQty(item.id, item.qty + 1)}><Plus size={14} /></button>
                </div>
                <span className="cart-row-total">{cedis(item.price * item.qty)}</span>
                <button className="icon-btn" onClick={() => removeItem(item.id)} aria-label="Remove item"><Trash2 size={16} /></button>
              </div>
            ))}
          </div>
          <div className="cart-total-row"><span>Total</span><strong>{cedis(total)}</strong></div>

          <form className="form-card" onSubmit={submit}>
            <div className="form-row two">
              <label>Full name
                <input required value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Your name" />
              </label>
              <label>Phone number
                <input required value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} placeholder="e.g. 024 000 0000" />
              </label>
            </div>
            <p className="fine-print">No online payment — we'll confirm your order and arrange payment directly on WhatsApp.</p>
            {error && <p className="form-error">{error}</p>}
            <button className="btn btn-primary" type="submit"><Send size={16} /> Send Order via WhatsApp</button>
          </form>
        </>
      )}
    </div>
  );
}

/* ============================= ADMIN ============================= */

function Admin({ menu, refreshMenu, gallery, refreshGallery }) {
  const [session, setSession] = useState(undefined); // undefined = still checking
  const [email, setEmail] = useState("");
  const [pwInput, setPwInput] = useState("");
  const [error, setError] = useState("");
  const [tab, setTab] = useState("menu");
  const [orders, setOrders] = useState(null);
  const [bookings, setBookings] = useState(null);

  useEffect(() => {
    getSession().then(setSession);
    const unsubscribe = onAuthChange(setSession);
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!session) return;
    if (tab === "orders" && orders === null) fetchOrders().then(setOrders).catch(() => setOrders([]));
    if (tab === "bookings" && bookings === null) fetchBookings().then(setBookings).catch(() => setBookings([]));
  }, [session, tab, orders, bookings]);

  const tryLogin = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await signInAdmin(email, pwInput);
    } catch {
      setError("Incorrect email or password.");
    }
  };

  if (session === undefined) {
    return <div className="page-wrap"><p className="empty-note">Loading…</p></div>;
  }

  if (!session) {
    return (
      <div className="page-wrap narrow">
        <SectionTitle eyebrow="Admin" title="Sign in" />
        <form className="form-card" onSubmit={tryLogin} style={{ maxWidth: 380, margin: "0 auto" }}>
          <label>Email
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
          </label>
          <label>Password
            <input type="password" value={pwInput} onChange={(e) => setPwInput(e.target.value)} placeholder="Enter password" />
          </label>
          {error && <p className="form-error">{error}</p>}
          <button className="btn btn-primary" type="submit"><Lock size={16} /> Sign In</button>
        </form>
      </div>
    );
  }

  return (
    <div className="page-wrap">
      <SectionTitle eyebrow="Admin" title="Manage Kuks Perfect Foods" />
      <div className="filter-row">
        {[["menu", "Menu"], ["gallery", "Gallery"], ["orders", `Orders${orders ? ` (${orders.length})` : ""}`], ["bookings", `Bookings${bookings ? ` (${bookings.length})` : ""}`]].map(([k, label]) => (
          <button key={k} className={`pill ${tab === k ? "pill-active" : ""}`} onClick={() => setTab(k)}>{label}</button>
        ))}
        <button className="pill" onClick={signOutAdmin}>Sign Out</button>
      </div>

      {tab === "menu" && <AdminMenu menu={menu} refreshMenu={refreshMenu} />}
      {tab === "gallery" && <AdminGallery gallery={gallery} refreshGallery={refreshGallery} />}
      {tab === "orders" && <AdminOrders orders={orders} />}
      {tab === "bookings" && <AdminBookings bookings={bookings} />}
    </div>
  );
}

function AdminMenu({ menu, refreshMenu }) {
  const blank = { category: CATEGORIES[0], name: "", price: "", description: "" };
  const [draft, setDraft] = useState(blank);
  const [busy, setBusy] = useState(false);

  const addItem = async (e) => {
    e.preventDefault();
    if (!draft.name || !draft.price) return;
    setBusy(true);
    try {
      await addMenuItem({ ...draft, price: Number(draft.price) });
      await refreshMenu();
      setDraft(blank);
    } catch (err) {
      alert("Couldn't add item: " + err.message);
    } finally {
      setBusy(false);
    }
  };
  const removeItem = async (id) => {
    try { await deleteMenuItem(id); await refreshMenu(); }
    catch (err) { alert("Couldn't delete item: " + err.message); }
  };
  const updateField = async (id, field, value) => {
    try { await updateMenuItem(id, { [field]: field === "price" ? Number(value) : value }); await refreshMenu(); }
    catch (err) { alert("Couldn't update item: " + err.message); }
  };

  return (
    <div>
      <form className="form-card" onSubmit={addItem}>
        <h4 style={{ marginTop: 0 }}>Add menu item</h4>
        <div className="form-row two">
          <label>Category
            <select value={draft.category} onChange={(e) => setDraft((d) => ({ ...d, category: e.target.value }))}>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </label>
          <label>Price (GH₵)
            <input type="number" min="0" step="0.5" value={draft.price} onChange={(e) => setDraft((d) => ({ ...d, price: e.target.value }))} />
          </label>
        </div>
        <label>Name
          <input value={draft.name} onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))} placeholder="Item name" />
        </label>
        <label>Description (optional)
          <input value={draft.description} onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))} placeholder="Short description" />
        </label>
        <button className="btn btn-primary btn-small" type="submit" disabled={busy}><Plus size={14} /> {busy ? "Adding…" : "Add item"}</button>
      </form>

      <div className="admin-table">
        {CATEGORIES.map((cat) => {
          const items = menu.filter((m) => m.category === cat);
          if (items.length === 0) return null;
          return (
            <div key={cat} className="admin-table-group">
              <h4>{cat}</h4>
              {items.map((item) => (
                <div className="admin-row" key={item.id}>
                  <input defaultValue={item.name} onBlur={(e) => e.target.value !== item.name && updateField(item.id, "name", e.target.value)} />
                  <input type="number" defaultValue={item.price} onBlur={(e) => Number(e.target.value) !== item.price && updateField(item.id, "price", e.target.value)} style={{ width: 90 }} />
                  <button className="icon-btn" onClick={() => removeItem(item.id)} aria-label="Delete item"><Trash2 size={16} /></button>
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function AdminGallery({ gallery, refreshGallery }) {
  const blank = { type: "photo", eventType: EVENT_TYPES[0], caption: "", imageUrl: "", videoUrl: "", thumbnailUrl: "" };
  const [draft, setDraft] = useState(blank);
  const [busy, setBusy] = useState(false);
  const [file, setFile] = useState(null);

  const addItem = async (e) => {
    e.preventDefault();
    if (!draft.caption) return;
    setBusy(true);
    try {
      let finalDraft = { ...draft };
      if (draft.type === "photo" && file) {
        finalDraft.imageUrl = await uploadGalleryPhoto(file);
      }
      await addGalleryItem(finalDraft);
      await refreshGallery();
      setDraft(blank);
      setFile(null);
    } catch (err) {
      alert("Couldn't add gallery item: " + err.message);
    } finally {
      setBusy(false);
    }
  };
  const removeItem = async (id) => {
    try { await deleteGalleryItem(id); await refreshGallery(); }
    catch (err) { alert("Couldn't delete item: " + err.message); }
  };

  return (
    <div>
      <form className="form-card" onSubmit={addItem}>
        <h4 style={{ marginTop: 0 }}>Add gallery item</h4>
        <p className="fine-print">
          For photos, upload a file directly (stored securely) or paste an image link instead.
          For videos, paste the TikTok/Instagram/YouTube link and, optionally, a thumbnail image URL.
        </p>
        <div className="form-row two">
          <label>Type
            <select value={draft.type} onChange={(e) => setDraft((d) => ({ ...d, type: e.target.value }))}>
              <option value="photo">Photo</option>
              <option value="video">Video</option>
            </select>
          </label>
          <label>Event type
            <select value={draft.eventType} onChange={(e) => setDraft((d) => ({ ...d, eventType: e.target.value }))}>
              {EVENT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </label>
        </div>
        <label>Caption
          <input value={draft.caption} onChange={(e) => setDraft((d) => ({ ...d, caption: e.target.value }))} placeholder="Describe the photo or video" />
        </label>
        {draft.type === "photo" ? (
          <>
            <label>Upload photo
              <input type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] || null)} />
            </label>
            <label>...or paste an image URL instead
              <input value={draft.imageUrl} onChange={(e) => setDraft((d) => ({ ...d, imageUrl: e.target.value }))} placeholder="https://..." disabled={!!file} />
            </label>
          </>
        ) : (
          <div className="form-row two">
            <label>Video URL
              <input value={draft.videoUrl} onChange={(e) => setDraft((d) => ({ ...d, videoUrl: e.target.value }))} placeholder="TikTok / YouTube link" />
            </label>
            <label>Thumbnail URL (optional)
              <input value={draft.thumbnailUrl} onChange={(e) => setDraft((d) => ({ ...d, thumbnailUrl: e.target.value }))} placeholder="https://..." />
            </label>
          </div>
        )}
        <button className="btn btn-primary btn-small" type="submit" disabled={busy}><Plus size={14} /> {busy ? "Adding…" : "Add to gallery"}</button>
      </form>

      <div className="gallery-grid">
        {gallery.map((g) => (
          <GalleryCard item={g} key={g.id} onRemove={() => removeItem(g.id)} />
        ))}
      </div>
    </div>
  );
}

function AdminOrders({ orders }) {
  if (orders === null) return <p className="empty-note">Loading orders…</p>;
  if (orders.length === 0) return <p className="empty-note">No orders submitted yet.</p>;
  return (
    <div className="admin-list">
      {orders.map((o) => (
        <div className="admin-card" key={o.id}>
          <div className="admin-card-head">
            <strong>{o.customerName}</strong>
            <span>{cedis(o.total)}</span>
          </div>
          <span className="fine-print">{o.phone} · {new Date(o.createdAt).toLocaleString()}</span>
          <ul>
            {o.items.map((i, idx) => <li key={idx}>{i.name} x{i.qty}</li>)}
          </ul>
        </div>
      ))}
    </div>
  );
}

function AdminBookings({ bookings }) {
  if (bookings === null) return <p className="empty-note">Loading bookings…</p>;
  if (bookings.length === 0) return <p className="empty-note">No booking requests yet.</p>;
  return (
    <div className="admin-list">
      {bookings.map((b) => (
        <div className="admin-card" key={b.id}>
          <div className="admin-card-head">
            <strong>{b.name}</strong>
            <span>{b.eventType}</span>
          </div>
          <span className="fine-print">{b.phone} · {new Date(b.createdAt).toLocaleString()}</span>
          <p><Calendar size={13} /> {b.eventDate || "No date given"} &nbsp; <Users size={13} /> {b.guests || "?"} guests</p>
          {b.message && <p>"{b.message}"</p>}
        </div>
      ))}
    </div>
  );
}

/* ============================= APP ROOT ============================= */

export default function App() {
  const [page, setPage] = useState("home");
  const [cart, setCart] = useState([]);

  const [menu, setMenu] = useState([]);
  const [gallery, setGallery] = useState([]);
  const [ready, setReady] = useState(false);
  const [loadError, setLoadError] = useState("");

  const refreshMenu = useCallback(async () => {
    const data = await fetchMenu();
    setMenu(data);
  }, []);
  const refreshGallery = useCallback(async () => {
    const data = await fetchGallery();
    setGallery(data);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [m, g] = await Promise.all([fetchMenu(), fetchGallery()]);
        if (!cancelled) { setMenu(m); setGallery(g); }
      } catch {
        if (!cancelled) setLoadError("Couldn't load the menu/gallery. Check your connection and try refreshing.");
      } finally {
        if (!cancelled) setReady(true);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const addToCart = (item) => {
    setCart((prev) => {
      const existing = prev.find((p) => p.id === item.id);
      if (existing) return prev.map((p) => (p.id === item.id ? { ...p, qty: p.qty + 1 } : p));
      return [...prev, { ...item, qty: 1 }];
    });
  };
  const updateQty = (id, qty) => {
    if (qty <= 0) { setCart((prev) => prev.filter((p) => p.id !== id)); return; }
    setCart((prev) => prev.map((p) => (p.id === id ? { ...p, qty } : p)));
  };
  const removeItem = (id) => setCart((prev) => prev.filter((p) => p.id !== id));
  const clearCart = () => setCart([]);

  const addOrder = (record) => submitOrder(record);
  const addBooking = (record) => submitBooking(record);

  const cartCount = useMemo(() => cart.reduce((s, i) => s + i.qty, 0), [cart]);

  return (
    <div className="kuks-app">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;600;700&family=Inter:wght@400;500;600;700&display=swap');

        .kuks-app {
          --primary: #1E3A2F;
          --accent: #C9A24B;
          --bg: #FBF7EE;
          --text: #2B2621;
          --support: #7A9B7E;
          --card: #FFFFFF;
          font-family: 'Inter', sans-serif;
          background: var(--bg);
          color: var(--text);
          min-height: 100vh;
          line-height: 1.5;
        }
        .kuks-app * { box-sizing: border-box; }
        .kuks-app h1, .kuks-app h2, .kuks-app h3, .kuks-app h4 {
          font-family: 'Cormorant Garamond', serif;
          font-weight: 600;
          margin: 0;
          color: var(--primary);
        }
        .kuks-app button { font-family: inherit; cursor: pointer; }
        .kuks-app a { text-decoration: none; color: inherit; }
        .kuks-app input, .kuks-app select, .kuks-app textarea {
          font-family: inherit; font-size: 0.95rem;
          border: 1px solid #E3DCC9; border-radius: 8px;
          padding: 10px 12px; background: #fff; color: var(--text);
          width: 100%;
        }
        .kuks-app input:focus, .kuks-app select:focus, .kuks-app textarea:focus {
          outline: 2px solid var(--accent); outline-offset: 1px; border-color: var(--accent);
        }

        /* ---- Buttons ---- */
        .btn {
          display: inline-flex; align-items: center; gap: 8px;
          padding: 12px 22px; border-radius: 999px; border: 1.5px solid transparent;
          font-weight: 600; font-size: 0.95rem; transition: all .18s ease;
        }
        .btn-primary { background: var(--primary); color: #FBF7EE; }
        .btn-primary:hover { background: #142a20; }
        .btn-outline { background: transparent; border-color: var(--primary); color: var(--primary); }
        .btn-outline:hover { background: var(--primary); color: #fff; }
        .btn-small { padding: 8px 16px; font-size: 0.85rem; }
        .icon-btn { background: transparent; border: none; color: var(--primary); padding: 6px; border-radius: 50%; position: relative; display: inline-flex; }
        .icon-btn:hover { background: rgba(30,58,47,0.08); }

        /* ---- Header ---- */
        .site-header { position: sticky; top: 0; z-index: 40; background: rgba(251,247,238,0.96); backdrop-filter: blur(6px); border-bottom: 1px solid #E9E1CC; }
        .header-inner { max-width: 1180px; margin: 0 auto; display: flex; align-items: center; justify-content: space-between; padding: 14px 24px; }
        .brand { display: flex; align-items: center; gap: 8px; background: none; border: none; }
        .brand-mark { width: 34px; height: 34px; border-radius: 50%; background: var(--primary); color: var(--accent); display: flex; align-items: center; justify-content: center; overflow: hidden; flex-shrink: 0; }
        .brand-mark img { width: 100%; height: 100%; object-fit: cover; }
        .brand-mark.light { background: var(--accent); color: var(--primary); }
        .brand-word { font-family: 'Cormorant Garamond', serif; font-size: 1.25rem; color: var(--primary); }
        .nav-desktop { display: flex; gap: 6px; }
        .nav-link { background: none; border: none; padding: 8px 12px; font-size: 0.92rem; color: var(--text); border-radius: 999px; font-weight: 500; }
        .nav-link:hover { background: rgba(201,162,75,0.15); }
        .nav-link.active { background: var(--primary); color: #fff; }
        .header-actions { display: flex; align-items: center; gap: 4px; }
        .cart-btn { }
        .cart-badge { position: absolute; top: -2px; right: -2px; background: var(--accent); color: var(--primary); font-size: 0.65rem; font-weight: 700; border-radius: 50%; width: 17px; height: 17px; display: flex; align-items: center; justify-content: center; }
        .mobile-toggle { display: none; }
        .nav-mobile { display: none; flex-direction: column; padding: 8px 20px 16px; gap: 4px; }
        @media (max-width: 860px) {
          .nav-desktop { display: none; }
          .mobile-toggle { display: inline-flex; }
          .nav-mobile { display: flex; }
          .nav-mobile .nav-link { text-align: left; }
        }

        /* ---- Eyebrow / titles ---- */
        .eyebrow { font-size: 0.75rem; letter-spacing: 0.14em; text-transform: uppercase; color: var(--support); font-weight: 600; margin-bottom: 8px; }
        .section-title { text-align: center; max-width: 640px; margin: 0 auto 40px; }
        .section-title h2 { font-size: 2.1rem; }
        .section-title.on-dark h2, .section-title.on-dark .eyebrow { color: var(--bg); }
        .section-subtitle { color: #5c554a; margin-top: 10px; font-size: 0.98rem; }
        .leaf-divider { display: flex; justify-content: center; margin-top: 14px; }

        /* ---- Layout ---- */
        .section { max-width: 1180px; margin: 0 auto; padding: 70px 24px; }
        .section.alt { background: #F2EBD8; max-width: none; }
        .section.alt > * { max-width: 1180px; margin-left: auto; margin-right: auto; }
        .page-wrap { max-width: 1180px; margin: 0 auto; padding: 60px 24px 90px; }
        .page-wrap.narrow { max-width: 720px; }
        .center-btn { display: flex; justify-content: center; margin-top: 32px; }

        /* ---- Hero ---- */
        .hero { display: grid; grid-template-columns: 1.1fr 0.9fr; gap: 40px; max-width: 1180px; margin: 0 auto; padding: 60px 24px 40px; align-items: center; }
        .hero h1 { font-size: 3rem; line-height: 1.08; }
        .hero h1 em { color: var(--accent); font-style: normal; }
        .hero-sub { margin: 20px 0 26px; color: #4a4438; font-size: 1.05rem; max-width: 480px; }
        .hero-actions { display: flex; gap: 12px; flex-wrap: wrap; }
        .hero-stats { display: flex; gap: 28px; margin-top: 36px; }
        .hero-stats strong { font-family: 'Cormorant Garamond', serif; font-size: 1.4rem; color: var(--primary); display: block; }
        .hero-stats span { font-size: 0.78rem; color: #6b6455; }
        .hero-visual { height: 380px; border-radius: 22px; position: relative; overflow: hidden; display: flex; align-items: flex-end; padding: 20px; border: none; text-align: left; width: 100%; }
        .hero-visual-caption { background: rgba(0,0,0,0.35); color: #fff; padding: 10px 14px; border-radius: 999px; display: flex; align-items: center; gap: 8px; font-size: 0.85rem; }
        @media (max-width: 860px) { .hero { grid-template-columns: 1fr; } .hero h1 { font-size: 2.2rem; } .hero-visual { height: 260px; } }

        /* ---- Services / Menu cards ---- */
        .services-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; }
        .service-card { background: var(--card); border: 1px solid #EDE5D0; border-radius: 16px; padding: 24px; transition: border-color .2s; }
        .service-card:hover { border-color: var(--accent); }
        .service-card-icon { width: 36px; height: 36px; border-radius: 10px; background: rgba(201,162,75,0.18); color: var(--accent); display: flex; align-items: center; justify-content: center; margin-bottom: 14px; }
        .service-card h3 { font-size: 1.15rem; margin-bottom: 8px; }
        .service-card p { font-size: 0.88rem; color: #5c554a; }
        @media (max-width: 900px) { .services-grid { grid-template-columns: repeat(2, 1fr); } }

        .menu-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 18px; }
        .menu-card { background: var(--card); border: 1px solid #EDE5D0; border-radius: 14px; padding: 18px; display: flex; flex-direction: column; gap: 8px; }
        .menu-card-top { display: flex; justify-content: space-between; align-items: baseline; gap: 10px; }
        .menu-card-top h4 { font-size: 1.05rem; }
        .menu-card .price { color: var(--accent); font-weight: 700; white-space: nowrap; }
        .menu-card p { font-size: 0.85rem; color: #6b6455; flex-grow: 1; margin: 0; }
        @media (max-width: 900px) { .menu-grid { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 560px) { .menu-grid { grid-template-columns: 1fr; } }

        /* ---- Filter pills ---- */
        .filter-row { display: flex; flex-wrap: wrap; gap: 8px; justify-content: center; margin-bottom: 34px; }
        .pill { border: 1.5px solid #DFD5B8; background: #fff; padding: 8px 16px; border-radius: 999px; font-size: 0.85rem; color: var(--text); }
        .pill-active { background: var(--primary); border-color: var(--primary); color: #fff; }

        /* ---- Gallery ---- */
        .gallery-preview-grid, .gallery-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 18px; }
        .gallery-card-link { display: block; border-radius: 16px; }
        .gallery-card { position: relative; border-radius: 16px; min-height: 210px; padding: 16px; display: flex; flex-direction: column; justify-content: flex-end; color: #fff; overflow: hidden; background-size: cover; background-position: center; transition: transform .4s ease; }
        .gallery-card-link:hover .gallery-card { transform: scale(1.03); }
        .gallery-card.large { min-height: 240px; }
        .gallery-card::before { content: ""; position: absolute; inset: 0; background: linear-gradient(0deg, rgba(20,16,8,0.78) 0%, rgba(20,16,8,0.08) 55%, transparent 100%); pointer-events: none; }
        .gallery-play, .gallery-icon { position: absolute; top: 16px; right: 16px; opacity: 0.9; z-index: 1; }
        .gallery-card-footer { position: relative; z-index: 1; }
        .gallery-card-footer p { margin: 4px 0 0; font-size: 0.85rem; }
        .gallery-remove { position: absolute; top: 10px; left: 10px; background: rgba(0,0,0,0.35); color: #fff; z-index: 2; }
        .badge { background: rgba(255,255,255,0.25); backdrop-filter: blur(2px); font-size: 0.68rem; text-transform: uppercase; letter-spacing: 0.06em; padding: 3px 9px; border-radius: 999px; font-weight: 700; }
        @media (max-width: 900px) { .gallery-preview-grid, .gallery-grid { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 560px) { .gallery-preview-grid, .gallery-grid { grid-template-columns: 1fr; } }

        /* ---- Forms ---- */
        .form-card { background: var(--card); border: 1px solid #EDE5D0; border-radius: 16px; padding: 26px; display: flex; flex-direction: column; gap: 16px; }
        .form-card label { display: flex; flex-direction: column; gap: 6px; font-size: 0.85rem; font-weight: 600; color: #4a4438; }
        .form-row { display: flex; flex-direction: column; gap: 16px; }
        .form-row.two { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
        @media (max-width: 560px) { .form-row.two { grid-template-columns: 1fr; } }
        .form-error { color: #a33; font-size: 0.85rem; margin: -8px 0 0; }
        .fine-print { font-size: 0.78rem; color: #7a7361; }
        .confirm-box { text-align: center; background: var(--card); border: 1px solid #EDE5D0; border-radius: 16px; padding: 44px 24px; display: flex; flex-direction: column; align-items: center; gap: 10px; color: var(--primary); }
        .confirm-box svg { background: var(--accent); border-radius: 50%; padding: 8px; color: var(--primary); width: 38px; height: 38px; }

        /* ---- Cart ---- */
        .cart-list { display: flex; flex-direction: column; gap: 10px; margin-bottom: 18px; }
        .cart-row { display: grid; grid-template-columns: 1fr auto auto auto; align-items: center; gap: 14px; background: var(--card); border: 1px solid #EDE5D0; border-radius: 12px; padding: 12px 16px; }
        .cart-row-info { display: flex; flex-direction: column; }
        .cart-row-info span { font-size: 0.78rem; color: #7a7361; }
        .qty-control { display: flex; align-items: center; gap: 8px; background: #F2EBD8; border-radius: 999px; padding: 4px 8px; }
        .qty-control button { background: none; border: none; color: var(--primary); display: flex; }
        .cart-row-total { font-weight: 700; color: var(--primary); white-space: nowrap; }
        .cart-total-row { display: flex; justify-content: space-between; padding: 14px 4px; font-size: 1.1rem; border-top: 1.5px dashed #DFD5B8; margin-bottom: 20px; }
        @media (max-width: 560px) { .cart-row { grid-template-columns: 1fr auto; grid-template-rows: auto auto; } }

        /* ---- About / Contact ---- */
        .founder-block { display: flex; flex-direction: column; align-items: center; text-align: center; gap: 3px; margin-bottom: 34px; }
        .founder-photo { width: 140px; height: 140px; border-radius: 50%; object-fit: cover; border: 3px solid var(--accent); margin-bottom: 12px; }
        .founder-block strong { font-family: 'Cormorant Garamond', serif; font-size: 1.15rem; color: var(--primary); }
        .founder-block span { font-size: 0.85rem; color: #6b6455; }
        .about-content p { color: #4a4438; margin-bottom: 16px; font-size: 1rem; }
        .about-highlights { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-top: 28px; }
        .about-highlights div { background: var(--card); border: 1px solid #EDE5D0; border-radius: 12px; padding: 16px; text-align: center; }
        .about-highlights strong { display: block; color: var(--primary); font-family: 'Cormorant Garamond', serif; font-size: 1.1rem; }
        .about-highlights span { font-size: 0.8rem; color: #6b6455; }
        @media (max-width: 700px) { .about-highlights { grid-template-columns: 1fr; } }

        .contact-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
        .contact-card { display: flex; align-items: center; gap: 14px; background: var(--card); border: 1px solid #EDE5D0; border-radius: 14px; padding: 18px; color: var(--primary); }
        .contact-card:hover { border-color: var(--accent); }
        .contact-card strong { display: block; font-size: 0.95rem; }
        .contact-card span { font-size: 0.82rem; color: #6b6455; }
        @media (max-width: 600px) { .contact-grid { grid-template-columns: 1fr; } }

        /* ---- Admin ---- */
        .admin-table-group { margin-bottom: 22px; }
        .admin-table-group h4 { margin-bottom: 10px; }
        .admin-row { display: grid; grid-template-columns: 1fr auto auto; align-items: center; gap: 10px; margin-bottom: 8px; }
        .admin-list { display: flex; flex-direction: column; gap: 12px; }
        .admin-card { background: var(--card); border: 1px solid #EDE5D0; border-radius: 12px; padding: 16px; }
        .admin-card-head { display: flex; justify-content: space-between; font-family: 'Cormorant Garamond', serif; font-size: 1.1rem; color: var(--primary); }
        .admin-card ul { margin: 8px 0 0; padding-left: 18px; font-size: 0.85rem; color: #4a4438; }
        .admin-card p { font-size: 0.85rem; color: #4a4438; margin: 6px 0 0; display: flex; gap: 6px; align-items: center; }

        .empty-note { text-align: center; color: #7a7361; padding: 30px 0; }
        .empty-note.center { display: flex; flex-direction: column; gap: 14px; align-items: center; }

        /* ---- Footer ---- */
        .site-footer { background: var(--primary); color: #E9E3D2; margin-top: 40px; }
        .footer-inner { max-width: 1180px; margin: 0 auto; padding: 56px 24px 30px; display: grid; grid-template-columns: 1.4fr 1fr 1fr; gap: 36px; }
        .footer-brand { display: flex; gap: 12px; }
        .footer-title { font-family: 'Cormorant Garamond', serif; font-size: 1.3rem; color: #fff; margin-bottom: 6px; }
        .footer-brand p { font-size: 0.85rem; color: #C9C2AC; max-width: 300px; }
        .footer-col h4 { color: #fff; font-family: 'Inter', sans-serif; font-size: 0.78rem; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 14px; }
        .footer-col button, .footer-col a { display: block; background: none; border: none; text-align: left; color: #C9C2AC; font-size: 0.88rem; margin-bottom: 10px; display: flex; align-items: center; gap: 8px; }
        .footer-col button:hover, .footer-col a:hover { color: var(--accent); }
        .socials { display: flex; gap: 10px; margin-top: 6px; }
        .socials a { background: rgba(255,255,255,0.1); padding: 8px; border-radius: 50%; }
        .socials a:hover { background: var(--accent); color: var(--primary); }
        .footer-bottom { border-top: 1px solid rgba(255,255,255,0.12); padding: 16px 24px; display: flex; justify-content: space-between; max-width: 1180px; margin: 0 auto; font-size: 0.78rem; color: #A9A18A; }
        .admin-link { background: none; border: none; color: #A9A18A; font-size: 0.78rem; }
        .admin-link:hover { color: var(--accent); }
        @media (max-width: 800px) { .footer-inner { grid-template-columns: 1fr; } }
      `}</style>

      <Header page={page} setPage={setPage} cartCount={cartCount} />

      {!ready ? (
        <div className="page-wrap"><p className="empty-note">Loading…</p></div>
      ) : loadError ? (
        <div className="page-wrap"><p className="empty-note">{loadError}</p></div>
      ) : (
        <>
          {page === "home" && <Home setPage={setPage} menu={menu} gallery={gallery} addToCart={addToCart} />}
          {page === "gallery" && <Gallery gallery={gallery} />}
          {page === "menu" && <MenuOrder menu={menu} addToCart={addToCart} />}
          {page === "catering" && <Catering addBooking={addBooking} />}
          {page === "about" && <About />}
          {page === "contact" && <Contact />}
          {page === "cart" && <Cart cart={cart} updateQty={updateQty} removeItem={removeItem} clearCart={clearCart} addOrder={addOrder} setPage={setPage} />}
          {page === "admin" && <Admin menu={menu} refreshMenu={refreshMenu} gallery={gallery} refreshGallery={refreshGallery} />}
        </>
      )}

      <Footer setPage={setPage} />
    </div>
  );
}
