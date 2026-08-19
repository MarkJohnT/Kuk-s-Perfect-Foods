import { supabase } from "./supabaseClient";

const GRADIENTS = [
  "linear-gradient(135deg,#2a4a3a,#c9a24b)",
  "linear-gradient(135deg,#7a9b7e,#1e3a2f)",
  "linear-gradient(135deg,#c9a24b,#8a6d2f)",
  "linear-gradient(135deg,#1e3a2f,#3f6650)",
  "linear-gradient(135deg,#9c7b3a,#2b2621)",
  "linear-gradient(135deg,#7a9b7e,#c9a24b)",
];

/* ============================= MENU ============================= */

export async function fetchMenu() {
  const { data, error } = await supabase.from("menu_items").select("*").order("category").order("name");
  if (error) throw error;
  return data; // {id, category, name, price, description} — matches app shape 1:1
}

export async function addMenuItem(item) {
  const { data, error } = await supabase
    .from("menu_items")
    .insert({ category: item.category, name: item.name, price: item.price, description: item.description || "" })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateMenuItem(id, fields) {
  const { error } = await supabase.from("menu_items").update(fields).eq("id", id);
  if (error) throw error;
}

export async function deleteMenuItem(id) {
  const { error } = await supabase.from("menu_items").delete().eq("id", id);
  if (error) throw error;
}

/* ============================= GALLERY ============================= */

function galleryRowToApp(row, idx) {
  const gradient = GRADIENTS[idx % GRADIENTS.length];
  const base = { id: row.id, type: row.type, eventType: row.event_type, caption: row.caption, gradient };
  if (row.type === "video") {
    return { ...base, thumbnailUrl: row.media_url || undefined, videoUrl: row.external_url || undefined };
  }
  return { ...base, imageUrl: row.media_url || undefined };
}

export async function fetchGallery() {
  const { data, error } = await supabase.from("gallery_items").select("*").order("created_at", { ascending: false });
  if (error) throw error;
  return data.map(galleryRowToApp);
}

export async function addGalleryItem(draft) {
  const row = { type: draft.type, event_type: draft.eventType, caption: draft.caption };
  if (draft.type === "photo") row.media_url = draft.imageUrl || null;
  else {
    row.media_url = draft.thumbnailUrl || null;
    row.external_url = draft.videoUrl || null;
  }
  const { data, error } = await supabase.from("gallery_items").insert(row).select().single();
  if (error) throw error;
  return galleryRowToApp(data, 0);
}

export async function deleteGalleryItem(id) {
  const { error } = await supabase.from("gallery_items").delete().eq("id", id);
  if (error) throw error;
}

/** Upload a photo file to Supabase Storage and return its public URL. */
export async function uploadGalleryPhoto(file) {
  const ext = file.name.split(".").pop();
  const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const { error: uploadError } = await supabase.storage.from("gallery").upload(path, file);
  if (uploadError) throw uploadError;
  const { data } = supabase.storage.from("gallery").getPublicUrl(path);
  return data.publicUrl;
}

/* ============================= ORDERS ============================= */

export async function submitOrder({ customerName, phone, items, total }) {
  const { data, error } = await supabase
    .from("orders")
    .insert({ customer_name: customerName, phone, items, total })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function fetchOrders() {
  const { data, error } = await supabase.from("orders").select("*").order("created_at", { ascending: false });
  if (error) throw error;
  return data.map((o) => ({
    id: o.id, customerName: o.customer_name, phone: o.phone, items: o.items, total: o.total,
    status: o.status, createdAt: o.created_at,
  }));
}

/* ============================= BOOKINGS ============================= */

export async function submitBooking({ name, phone, eventType, eventDate, guests, message }) {
  const { data, error } = await supabase
    .from("booking_requests")
    .insert({
      name, phone, event_type: eventType,
      event_date: eventDate || null,
      guests: guests ? Number(guests) : null,
      message: message || "",
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function fetchBookings() {
  const { data, error } = await supabase.from("booking_requests").select("*").order("created_at", { ascending: false });
  if (error) throw error;
  return data.map((b) => ({
    id: b.id, name: b.name, phone: b.phone, eventType: b.event_type, eventDate: b.event_date,
    guests: b.guests, message: b.message, status: b.status, createdAt: b.created_at,
  }));
}

/* ============================= AUTH ============================= */

export async function signInAdmin(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data.session;
}

export async function signOutAdmin() {
  await supabase.auth.signOut();
}

export async function getSession() {
  const { data } = await supabase.auth.getSession();
  return data.session;
}

export function onAuthChange(callback) {
  const { data } = supabase.auth.onAuthStateChange((_event, session) => callback(session));
  return () => data.subscription.unsubscribe();
}
