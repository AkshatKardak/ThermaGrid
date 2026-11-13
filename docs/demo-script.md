# ThermaGrid 3-Minute Live Evaluation Demo Script

Follow this scripted 3-minute click path to evaluate all core user-facing and authority features in ThermaGrid.

---

### Step 1 · Public Landing (`/`)
1. Open [`http://localhost:5173/`](http://localhost:5173/).
2. Notice the Public Navbar: Brand, "How it works", "Sign in" (ghost), and "Get started" (amethyst).
3. Inspect the **Hero section**:
   - 3D interactive Earth globe displaying live city thermal points.
   - Live KPI rail: Peak WBGT, Max Ward Risk, and Active Ward Coverage.
4. Scroll down to:
   - **Two Wards Benchmark** (`/#two-wards`): 36.4°C in both Ward M/East (Govandi) and Ward A (Churchgate) produces High (78/100) vs Safe (22/100) risk due to informal housing and tree canopy deficit.
   - **How It Works** (`/#how-it-works`): 5-stage computational pipeline.
5. Click **Get Started** in the top navigation.

---

### Step 2 · Sign-Up & Sign-In (`/sign-up` & `/sign-in`)
1. On `/sign-up`, see Clerk's component customized in ThermaGrid editorial palette (`#14181A` panel-dark, `#1F3A5F` accent).
2. Click "Sign in" link or navigate to `/sign-in`.
3. Sign in using your Google account or email code.
4. Municipal access notice confirms that authority access is provisioned by administrators after verification.

---

### Step 3 · Overview Hub (`/app`)
1. Post-login redirects directly to `/app`.
2. See the **App Navbar**: Brand → `/app`, Overview, Heat risk, Worker, Analytics, Account, City selector, and Clerk `<UserButton />`.
   *(Notice: Authority console is hidden for the citizen role).*
3. Overview Hub highlights:
   - Personalized greeting with first name.
   - Hero Card: Today's thermal risk in your ward (e.g. 78/100 Very High) with 4-factor biometeorological breakdown.
   - Care Circle strip: "People you watch" summary.
   - Tonight's preview card.
   - 2×2 feature grid.

---

### Step 4 · Safe-Window Planner (`/app/heat-risk`)
1. Click **Heat Risk** in the navbar or click "View Full Citizen Advisory".
2. Scroll to the **"When Can I Go Out?"** card:
   - Select **Walk**, **Commute**, or **Exercise** (threshold drops to 45/100).
   - Drag the duration slider from 45 min to 90 min: watch the window chips re-layout with FLIP animation.
   - Expand any window chip to view the biometeorological reason.
   - Notice the single-pulse red block warning of peak afternoon danger.

---

### Step 5 · Tonight Card & Tropical Nights (`/app/heat-risk`)
1. Review the **"Tonight's Heat Recovery"** card:
   - Smooth 20:00 → 06:00 overnight temperature curve with the 25°C tropical night threshold line.
   - Tropical night badge active when overnight minimum temperature stays $\ge 25.0^\circ\text{C}$.
   - Check the targeted nocturnal cross-ventilation sleep guidance list.

---

### Step 6 · Indoor Heat by Building Type (`/app/heat-risk`)
1. Review the **"Inside Your Home"** card:
   - Switch between **Tin Roof (Top Floor)** (+6.0°C), **RCC Top Floor** (+4.0°C), and **Ground Floor** (+1.5°C).
   - Observe the dual numerals: outdoor vs indoor temperature.
   - Note the **thermal lag insight**: indoor peak occurs 2–2.5 hours after outdoor peak.
   - Verified audit chip: "Estimated, not measured (method: archetype_delta)".

---

### Step 7 · Usable Cooling Centres (`/app/heat-risk`)
1. Review the **Designated Cooling Centres** list:
   - Distance in kilometers and estimated walk time.
   - Factual Open/Closed badge.
   - Click **Directions** to verify Google Maps link generation.

---

### Step 8 · Self-Serve Alert Subscriptions (`/app/account`)
1. Navigate to **Account** via the navbar icon or link.
2. Under **Alerts**:
   - Choose channel: WhatsApp or Email.
   - Enter your destination phone or email.
   - Drag the threshold slider: watch the band pill update color in real-time.
   - Click **Save Subscription**: notice the inline green success confirmation.
   - Click **Send test alert**: verify simulated dispatch feedback.
3. Under **People You Watch (Care Circle)**:
   - Add a dependent (e.g., "Amma", Ward 1, Elderly).
   - Review consent notice; click "Add to Care Circle".
   - Return to `/app` to see the live alert strip updated on Overview.

---

### Step 9 · Worker Shift Card (`/app/worker`)
1. Navigate to **Worker**.
2. Select 6.0 MET (Heavy Manual), Direct Sunlight, 09:00 to 18:00.
3. Review the **Printable Shift Card**:
   - Hourly hydration quota (750–1000 mL/hr).
   - Scheduled ISO 7243 rest intervals.
   - Click **Copy text** or **Print A5 card** (`Ctrl+P` previews a clean, print-optimized single-page document).

---

### Step 10 · Switch to Authority Account (`/app/authority`)
1. In Clerk Dashboard → Users → your user → Metadata → Public, set:
   ```json
   { "role": "authority" }
   ```
2. Sign out and back in to reissue the session token with the updated role.
3. In the App Navbar, see the **Authority** link unlocked.
4. Click **Authority** to view:
   - 3D City extruded block mesh.
   - Ward intervention queue and priority ranking.
   - Municipal broadcast dispatch console.
