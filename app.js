// CampusCars — Final (Firebase). No admin/favorites/messaging; email contact only.
// Super-simple, commented, and matches proposal/prototype styling.
// IMPORTANT: Replace firebaseConfig below with your Firebase web app config (NOT service account).

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendEmailVerification,
  updateProfile,
} from "https://www.gstatic.com/firebasejs/10.13.1/firebase-auth.js";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  limit,
  updateDoc,
  doc,
  deleteDoc,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/10.13.1/firebase-firestore.js";
import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL,
} from "https://www.gstatic.com/firebasejs/10.13.1/firebase-storage.js";

// === Firebase Web SDK (client) ===
// NOTE: Do NOT paste the Node.js Admin SDK/serviceAccount in a website. That is for server code only.
// Get your web config from Firebase Console → Project settings → Web app.
const firebaseConfig = {
  apiKey: "AIzaSyBRJa4MTddmv9UyJZDMccxg0lk6_XmTLHQ",
  authDomain: "campuscars-e63d7.firebaseapp.com",
  projectId: "campuscars-e63d7",
  storageBucket: "campuscars-e63d7.firebasestorage.app",
  messagingSenderId: "483198189567",
  appId: "1:483198189567:web:33512f1e261cfd7fa671ca",
  measurementId: "G-J4L37CR7P8",
};

// Init Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// DOM helpers
const $ = (s) => document.querySelector(s);
let editingId = null;

// Simple .edu check (client-side convenience, not security)
const emailIsEdu = (email) => /\.(edu)$/i.test(email);

// Render sign-in / sign-up UI
function renderAuth(user) {
  const area = $("#authArea");
  area.innerHTML = "";
  if (!user) {
    area.innerHTML = `
      <input id="email" class="pill" placeholder="school email (.edu)" />
      <input id="pw" class="pill" placeholder="password" type="password" />
      <button id="btnIn" class="btn solid">Sign In</button>
      <button id="btnUp" class="btn ghost">Sign Up</button>
    `;
    $("#btnIn").onclick = async () => {
      const email = $("#email").value.trim();
      const pw = $("#pw").value.trim();
      try {
        await signInWithEmailAndPassword(auth, email, pw);
      } catch (e) {
        alert(e.message);
      }
    };
    $("#btnUp").onclick = async () => {
      const email = $("#email").value.trim();
      const pw = $("#pw").value.trim();
      if (!emailIsEdu(email)) {
        alert("Please use a .edu email");
        return;
      }
      try {
        const cred = await createUserWithEmailAndPassword(auth, email, pw);
        await sendEmailVerification(cred.user);
        alert("Account created. Please verify your email (check inbox).");
      } catch (e) {
        alert(e.message);
      }
    };
  } else {
    const span = document.createElement("span");
    span.className = "pill";
    span.textContent =
      user.email + (user.emailVerified ? "" : " (verify email)");
    const out = document.createElement("button");
    out.className = "btn ghost";
    out.textContent = "Sign Out";
    out.onclick = () => signOut(auth);
    area.append(span, out);
  }
}

// Profile modal (saved partly in Firebase user profile, partly local for simplicity)
$("#openProfile").addEventListener("click", (e) => {
  e.preventDefault();
  const u = auth.currentUser;
  if (!u) {
    alert("Sign in first.");
    return;
  }
  $("#profName").value = u.displayName || "";
  $("#profSchool").value = localStorage.getItem("cc_school") || "";
  $("#profGrad").value = localStorage.getItem("cc_grad") || "";
  $("#profileDlg").showModal();
});
$("#saveProfile").addEventListener("click", async () => {
  const u = auth.currentUser;
  if (!u) return;
  try {
    await updateProfile(u, { displayName: $("#profName").value.trim() });
    localStorage.setItem("cc_school", $("#profSchool").value.trim());
    localStorage.setItem("cc_grad", $("#profGrad").value.trim());
    $("#profNote").textContent = "Saved!";
    setTimeout(() => $("#profileDlg").close(), 600);
  } catch (e) {
    alert(e.message);
  }
});

// Enable/disable form based on auth + email verification
function refreshFormState(user, editing) {
  const disabled = !user || !user.emailVerified;
  [
    "title",
    "price",
    "make",
    "model",
    "year",
    "mileage",
    "condition",
    "location",
    "photo",
    "description",
  ].forEach((id) => {
    const el = document.getElementById(id);
    if (el) {
      el.disabled = disabled;
    }
  });
  document.getElementById("postBtn").disabled = disabled;
  document.getElementById("cancelEditBtn").classList.toggle("hide", !editing);
  document.getElementById("postHint").textContent = !user
    ? "Sign in with your .edu email to post."
    : !user.emailVerified
    ? "Please verify your email (check inbox)."
    : editing
    ? "Editing this listing"
    : "";
}

// Upload photo to Storage and get URL
async function uploadImage(ownerUid, listingId, file) {
  if (!file) return "";
  const storagePath = `cars/${ownerUid}/${listingId}/${file.name}`;
  const r = ref(storage, storagePath);
  await uploadBytes(r, file);
  return await getDownloadURL(r);
}

// Create listing
async function createListing() {
  const u = auth.currentUser;
  if (!u) return alert("Sign in first");
  const required = ["title", "price", "make", "model", "year"];
  for (const id of required) {
    if (!document.getElementById(id).value.trim()) {
      return alert("Please fill in title, price, make, model, and year.");
    }
  }
  const file = document.getElementById("photo").files[0];
  const data = {
    ownerUid: u.uid,
    ownerEmail: u.email,
    title: document.getElementById("title").value.trim(),
    price: Number(document.getElementById("price").value || 0),
    make: document.getElementById("make").value.trim(),
    model: document.getElementById("model").value.trim(),
    year: Number(document.getElementById("year").value || 0),
    mileage: Number(document.getElementById("mileage").value || 0),
    condition: document.getElementById("condition").value,
    location: document.getElementById("location").value.trim(),
    description: document.getElementById("description").value.trim(),
    photoURL: "",
    isSold: false,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  const docRef = await addDoc(collection(db, "listings"), data);
  if (file) {
    const url = await uploadImage(u.uid, docRef.id, file);
    await updateDoc(docRef, { photoURL: url, updatedAt: serverTimestamp() });
  }
  clearForm();
  await loadAndRender();
}

// Edit existing listing
async function saveEdit() {
  if (!editingId) return createListing();
  const u = auth.currentUser;
  if (!u) return alert("Sign in first");
  const file = document.getElementById("photo").files[0];
  let data = {
    title: document.getElementById("title").value.trim(),
    price: Number(document.getElementById("price").value || 0),
    make: document.getElementById("make").value.trim(),
    model: document.getElementById("model").value.trim(),
    year: Number(document.getElementById("year").value || 0),
    mileage: Number(document.getElementById("mileage").value || 0),
    condition: document.getElementById("condition").value,
    location: document.getElementById("location").value.trim(),
    description: document.getElementById("description").value.trim(),
    updatedAt: serverTimestamp(),
  };
  if (file) {
    const url = await uploadImage(u.uid, editingId, file);
    data.photoURL = url;
  }
  await updateDoc(doc(db, "listings", editingId), data);
  clearForm();
  await loadAndRender();
}

// Mark as sold / Delete
async function markSold(id, value) {
  await updateDoc(doc(db, "listings", id), {
    isSold: value,
    updatedAt: serverTimestamp(),
  });
  await loadAndRender();
}
async function deleteListing(id) {
  if (!confirm("Delete this listing?")) return;
  await deleteDoc(doc(db, "listings", id));
  await loadAndRender();
}

// Clear form
function clearForm() {
  [
    "title",
    "price",
    "make",
    "model",
    "year",
    "mileage",
    "condition",
    "location",
    "photo",
    "description",
  ].forEach((id) => {
    const el = document.getElementById(id);
    if (!el) return;
    if (el.tagName === "SELECT") el.selectedIndex = 0;
    else if (el.type === "file") el.value = "";
    else el.value = "";
  });
  document.getElementById("postHint").textContent = "";
  editingId = null;
  refreshFormState(auth.currentUser, false);
}

// Search filters (client-side)
function filterInMemory(list) {
  const qTxt = document.getElementById("q").value.trim().toLowerCase();
  const min = Number(document.getElementById("minPrice").value || 0);
  const max = Number(document.getElementById("maxPrice").value || 0);
  return list.filter((x) => {
    const t = (
      (x.title || "") +
      " " +
      (x.make || "") +
      " " +
      (x.model || "")
    ).toLowerCase();
    const okTxt = qTxt ? t.includes(qTxt) : true;
    const okMin = min ? (x.price || 0) >= min : true;
    const okMax = max ? (x.price || 0) <= max : true;
    return okTxt && okMin && okMax;
  });
}

// Render cards
async function loadAndRender() {
  const qRef = query(
    collection(db, "listings"),
    orderBy("createdAt", "desc"),
    limit(100)
  );
  const snap = await getDocs(qRef);
  const rows = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  const filtered = filterInMemory(rows);
  document.getElementById("count").textContent = filtered.length
    ? filtered.length + " results"
    : "No results";
  const grid = document.getElementById("grid");
  grid.innerHTML = "";
  const user = auth.currentUser;

  filtered.forEach((item) => {
    const card = document.createElement("div");
    card.className = "card";
    const img = document.createElement("img");
    img.src =
      item.photoURL ||
      "data:image/svg+xml;utf8," +
        encodeURIComponent(
          `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="450"><rect width="100%" height="100%" fill="#0b1020"/><text x="50%" y="50%" fill="#9fb3d9" font-family="Arial" font-size="22" text-anchor="middle">No Photo</text></svg>`
        );
    const pad = document.createElement("div");
    pad.className = "pad";
    const title = document.createElement("div");
    title.style.fontWeight = "800";
    title.textContent = item.title || "(untitled)";
    const meta = document.createElement("div");
    meta.className = "muted";
    meta.textContent = `$${(item.price || 0).toLocaleString()} • ${(
      item.mileage || 0
    ).toLocaleString()} mi • ${item.condition || "—"}`;
    const loc = document.createElement("div");
    loc.className = "muted small";
    loc.textContent = item.location || "Near campus";
    const actions = document.createElement("div");
    actions.className = "actions";

    const emailLink = document.createElement("a");
    emailLink.href = `mailto:${item.ownerEmail}?subject=${encodeURIComponent(
      "Inquiry: " + (item.title || "Car")
    )}`;
    emailLink.textContent = "Email Seller";
    actions.append(emailLink);

    if (item.isSold) {
      const sold = document.createElement("span");
      sold.className = "pill";
      sold.textContent = "SOLD";
      actions.append(sold);
    }

    if (user && user.uid === item.ownerUid) {
      const edit = document.createElement("button");
      edit.className = "btn ghost small";
      edit.textContent = "Edit";
      edit.onclick = () => {
        editingId = item.id;
        document.getElementById("title").value = item.title || "";
        document.getElementById("price").value = item.price || "";
        document.getElementById("make").value = item.make || "";
        document.getElementById("model").value = item.model || "";
        document.getElementById("year").value = item.year || "";
        document.getElementById("mileage").value = item.mileage || 0;
        document.getElementById("condition").value = item.condition || "";
        document.getElementById("location").value = item.location || "";
        document.getElementById("description").value = item.description || "";
        document.getElementById("postHint").textContent =
          "Editing this listing";
        refreshFormState(auth.currentUser, true);
        window.scrollTo({ top: 0, behavior: "smooth" });
      };
      const toggleSold = document.createElement("button");
      toggleSold.className = "btn ghost small";
      toggleSold.textContent = item.isSold ? "Mark Unsold" : "Mark Sold";
      toggleSold.onclick = () => markSold(item.id, !item.isSold);
      const del = document.createElement("button");
      del.className = "btn ghost small";
      del.textContent = "Delete";
      del.onclick = () => deleteListing(item.id);
      actions.append(edit, toggleSold, del);
    }

    pad.append(title, meta, loc, actions);
    card.append(img, pad);
    grid.append(card);
  });
}

// Wire up
document
  .getElementById("postBtn")
  .addEventListener("click", () => (editingId ? saveEdit() : createListing()));
document.getElementById("cancelEditBtn").addEventListener("click", () => {
  editingId = null;
  clearForm();
  refreshFormState(auth.currentUser, false);
});
document
  .getElementById("applyFilters")
  .addEventListener("click", loadAndRender);
document.getElementById("clearFilters").addEventListener("click", () => {
  document.getElementById("q").value = "";
  document.getElementById("minPrice").value = "";
  document.getElementById("maxPrice").value = "";
  loadAndRender();
});

// Auth state
onAuthStateChanged(auth, (user) => {
  renderAuth(user);
  refreshFormState(user, !!editingId);
  loadAndRender();
});
