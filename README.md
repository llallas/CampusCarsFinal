# CampusCars — Final (Firebase/Web4)

A simple, student-friendly used-car marketplace for campus communities. Matches the submitted **proposal/prototype** design. Fully responsive, clean styling, and easy to explain.

- ✅ Looks like the proposal (same header, cards, search, create form, email contact)
- ✅ Professional styling (mobile-first, accessible colors, clear spacing)
- ✅ Runs on **Firebase** (Firestore + Storage + Auth) or can be hosted on **Web4** (static hosting)
- ✅ GitHub-ready structure with this full README
- ✅ Email-only contact (no in-app messaging), no admin

---

## 1) What the app does (Plain English)
- Students sign up with a `.edu` email and verify it.
- Sellers post car listings (title, price, make/model/year, mileage, condition, location, description, photo).
- Listings appear in a responsive grid with search/price filters.
- Buyers click **Email Seller** to contact the owner via their school email (mailto link).
- Sellers can **Edit**, **Delete**, or **Mark Sold** on their own listings.

---

## 2) How it works (High level)
- **Auth:** Firebase Authentication (Email/Password) with email verification.
- **Database:** Firestore `listings` collection stores listing fields.
- **Storage:** Firebase Storage holds car images. The listing stores the image URL.
- **Frontend:** Plain HTML/CSS/JS with Firebase Web SDK (no framework).

**Important:** The provided Node “admin SDK” code (service account) is **server-side only** and **not used** in a public website. Here we use the **client Web SDK** and your public `firebaseConfig` from Project Settings → Web app.

---

## 3) Data Model
**Firestore collection:** `listings`

```
{
  ownerUid: string,
  ownerEmail: string,
  title: string,
  price: number,
  make: string,
  model: string,
  year: number,
  mileage: number,
  condition: string,
  location: string,
  description: string,
  photoURL: string,
  isSold: boolean,
  createdAt: timestamp,
  updatedAt: timestamp
}
```

**Storage paths:** `cars/{ownerUid}/{listingId}/{filename}`

---

## 4) Setup (Firebase) — 5 minutes
1. Go to **Firebase Console** → create a project.
2. **Enable Authentication** → Sign-in method → Email/Password (on).
3. **Enable Firestore** (production) and **Storage**.
4. In **Project Settings → Your apps → Web app**, copy your web config and paste into `app.js` (the `firebaseConfig` object).
5. In **Firestore Rules**, paste the contents of `firestore.rules` and **Publish**.
6. In **Storage Rules**, paste the contents of `storage.rules` and **Publish**.

**Run locally** (for ES module imports):
- Use VS Code Live Server or `npx serve` from the project folder.

**Deploy (Firebase Hosting):**
```
npm i -g firebase-tools
firebase login
firebase init hosting     # select your project; public: .
firebase deploy
```
Add the Firebase Hosting URL to this README.

---

## 5) Setup (Web4 server) — static hosting
If your Web4 is a basic static host:
- Upload `index.html`, `styles.css`, and `app.js` to your Web4 public folder.
- Since `app.js` uses ES module imports and talks to Firebase over HTTPS, it should work.
- Add your Web4 URL to this README.

> You still need a Firebase project for Auth/Firestore/Storage. Web4 is only the file host.

---

## 6) Dev Notes (keep it simple)
- Code uses **vanilla JS** and is heavily commented.
- No heavy libraries or build step.
- UI matches the wireframes: header, search panel, create panel, grid cards, clean spacing.
- Accessibility: semantic markup, focusable controls, high-contrast palette.

---

## 7) Links
- **Live (Firebase or Web4):** _add your deployed URL here_
- **GitHub repo:** https://llallas.github.io/CampusCarsFinal/ 

---

## 8) Screens / Instructor Checklist
- Auth with .edu email and email verification ✔
- Listings CRUD (create/read/update/delete) ✔
- Photo upload to Storage ✔
- Search + price filter ✔
- Email Seller (mailto) ✔
- Mark as Sold ✔
- Responsive + styled ✔
- README includes deploy link(s) ✔

---

## 9) Security Notes
- Rules restrict write/edit/delete to the listing owner.
- Email domain checks in the client are for UX only—do not treat as security.
- Never put your **service account** or **admin SDK** in frontend code.

---

## 10) File Map
```
index.html         # UI structure (header, panels, grid, dialog)
styles.css         # styling (mobile-first)
app.js             # Firebase Web SDK + CRUD logic
firestore.rules    # Firestore security rules (publish in console)
storage.rules      # Storage security rules (publish in console)
firebase.json      # optional: Firebase Hosting config
README.md          # this doc
```
