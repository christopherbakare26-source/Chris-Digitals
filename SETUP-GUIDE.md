# Chris Digitals — Enquiry Form & Booking Setup Guide

This guide covers the **two things only you can do**, because they need access to
your own accounts. Everything else is already built into the site.

| Part | Status |
|---|---|
| Form no longer opens the visitor's email app | ✅ Done in code |
| Form validation, spam protection, duplicate guard | ✅ Done in code |
| Calendly popup + inline embed wired to your booking URL | ✅ Done in code |
| Calendly → Google Calendar → Google Meet | ⚠️ **You must do this** (Part 1 below) |
| Booking notification emails | ⚠️ **You must do this** (Part 2 below) |
| Form delivery to `christopherbakare014@gmail.com` | ⚠️ **You must do this** (Part 3 below) |

---

## Part 3 — Connect the enquiry form (5 minutes)

The form now submits directly from the page. It needs one free service to
deliver the email. **Web3Forms** is already wired up; you only need an access key.

### Steps

1. Go to **https://web3forms.com**
2. Enter **`christopherbakare014@gmail.com`** and click *Create Access Key*.
3. Check that inbox — you'll receive an **Access Key** (a long string of letters
   and numbers).
4. Open **`assets/js/config.js`** and paste it between the quotes:

   ```js
   FORM_ACCESS_KEY: "paste-your-key-here",
   ```

5. Save, re-upload the file, and submit a test enquiry.

### Is that key safe in the frontend?

Yes. A Web3Forms access key is a **public form identifier**, not a secret. It can
only deliver to the inbox it was created for — it cannot read your email, send as
you, or be used for anything else. This is the same model Formspree uses.

**Never** put an SMTP password, a Google service-account key, or a private API
secret in `config.js` — that file is downloaded by every visitor.

### Prefer Formspree instead?

1. Sign up at **https://formspree.io** with `christopherbakare014@gmail.com`.
2. Create a form; copy its endpoint (looks like `https://formspree.io/f/abcdwxyz`).
3. In `config.js` set:

   ```js
   FORM_ENDPOINT: "https://formspree.io/f/abcdwxyz",
   FORM_ACCESS_KEY: "",
   ```

4. In `assets/js/app.js`, the payload sends `access_key` — Formspree ignores
   unknown fields, so it works unchanged.

### What the form does now

- **Validates** name, email, service, budget, description (min 20 chars) and consent.
- **Honeypot** field (`company_website`) — invisible to people, catches bots.
- **Time trap** — rejects submissions completed in under 3 seconds.
- **Duplicate guard** — the same enquiry can't be sent twice within 10 minutes.
- **Success message** confirms delivery and offers a Calendly link.
- **Error message** names the problem and gives your email as a fallback.
- **Honest failure** — if no access key is configured, it says the form isn't
  connected yet rather than pretending to send.

---

## Part 1 — Calendly, Google Calendar and Google Meet

Your booking URL is already live on the site:
`https://calendly.com/christopherbakare26/30min`

The popup and the inline calendar on the contact page both load it. What remains
is connecting the **right Google account** and turning on **Google Meet**.

### 1a. Connect the correct Google account

1. Sign in to **https://calendly.com** as **`christopherbakare26@gmail.com`**.
2. Go to **Account → Calendar Connection** (or *Connected Calendars*).
3. Click **Connect** next to Google Calendar.
4. In the Google consent screen, choose **`christopherbakare26@gmail.com`** —
   not any other Google account that may be signed in on that browser.
5. Approve access to **Calendar events** and **Video conferencing**.
6. Confirm the connected calendar shows as
   `christopherbakare26@gmail.com` and is marked **default**.

> If a different Google account is already connected, click **Disconnect** first,
> then reconnect with the correct one. Calendly only writes to the calendar it is
> connected to.

### 1b. Set Google Meet as the meeting location

1. Go to **Event Types** and open **30 Minute Meeting** (the `/30min` event).
2. Click **Edit**.
3. Under **Location**, choose **Google Meet**.
   - If Google Meet is greyed out, the Google connection in step 1a is missing
     the video-conferencing permission — disconnect and reconnect, approving
     the conferencing scope.
4. Set **Duration** to 30 minutes and confirm the event is **Active**.
5. Click **Save**.

### 1c. What happens on a booking

Calendly creates a **unique Google Meet link per booking** automatically — you do
not generate or paste links. The link is added to:

- the calendar event on `christopherbakare26@gmail.com`,
- the client's confirmation email,
- your own booking notification email.

### 1d. Verify it works

1. Open `https://calendly.com/christopherbakare26/30min` in a private window.
2. Book a slot using a different email address you can check.
3. Confirm the event appears on the **`christopherbakare26@gmail.com`** calendar.
4. Confirm the event has a **Google Meet** link.
5. Confirm the client inbox received a confirmation containing the date, time,
   timezone and Meet link.

---

## Part 2 — Booking notification emails

These are sent by **Calendly**, not by the website. The website does not send
booking emails and should not be expected to.

1. In Calendly, go to **Account → Notifications**.
2. Under **Email notifications**, set the notification address to
   **`christopherbakare26@gmail.com`**.
3. Enable:
   - **New event booked** — you get an email for every booking.
   - **Event cancelled** — you're told when a client cancels.
   - **Event rescheduled** — you're told when a client moves the slot.
4. Under **Calendar invitations**, keep **Send calendar invitations** on so the
   event lands in Google Calendar with the Meet link.
5. Under the event type's **Notifications** tab, confirm the
   **Confirmation email to invitee** is enabled — this is what sends the client
   their date, time, timezone, Meet link and reschedule/cancel links.

### Two separate inboxes — by design

| Purpose | Address |
|---|---|
| Website project enquiries | `christopherbakare014@gmail.com` |
| Calendly bookings & calendar | `christopherbakare26@gmail.com` |

Keeping them apart means a booking confirmation never gets lost among form
enquiries, and vice versa.

---

## Part 5 — The two client options

Both are on the **Contact** page and reachable from every page's header button:

- **Option A — Send a project enquiry** (left column): the form. Delivered to
  `christopherbakare014@gmail.com`.
- **Option B — Pick a slot yourself** (right column): the live Calendly calendar
  plus a *Book a Free Discovery Call* button that opens the popup.

Every "Book a Free Call" / "Book a Free Discovery Call" button across the site now
opens Calendly directly. If the Calendly script is blocked (ad-blocker, offline),
the button falls back to opening the booking page in a new tab — it never dead-ends.

---

## Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| "The form is not connected yet" | `FORM_ACCESS_KEY` is empty | Complete Part 3 |
| Form says "too quick" | Submitted in under 3 seconds | Normal for bots; a person just resubmits |
| "This enquiry has already been sent" | Same details within 10 minutes | Expected duplicate protection |
| Calendly popup is blank | Script blocked by an extension | The button falls back to a new tab |
| No Google Meet link on bookings | Meet not set as location | Complete step 1b |
| Booking on the wrong calendar | Wrong Google account connected | Complete step 1a |
| No booking emails | Notifications off | Complete Part 2 |

---

## Files changed in this version

| File | Change |
|---|---|
| `assets/js/config.js` | **New.** Public config: form endpoint, Calendly URL, owner email |
| `assets/js/app.js` | Real form POST, validation, honeypot, time trap, duplicate guard, Calendly popup + inline embed. `mailto` fallback removed |
| `assets/css/styles.css` | Calendly embed theming, honeypot hiding |
| `contact.html` | Honeypot field, Option A / Option B labels, Calendly booking panel |
| `index/about/services/work.html` | Booking CTAs rewired to Calendly |
| All pages | `config.js` script tag added |

Design, layout, branding, animations, content and navigation are unchanged.
