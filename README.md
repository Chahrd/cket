# CKET — Luxury Demo Prototype

A responsive front-end prototype with:
- Sign-up using name, phone/email, password and confirm password
- Login using the registered phone/email and password
- A personal dashboard with a demo wallet
- A sample +30 CKET reward interaction
- Preview cards for the market, spin-and-win and redeem-code concepts

## Run locally
Open `index.html` in a modern browser, or use GitHub Pages after uploading the files.

## Publish with GitHub Pages
1. Create a new GitHub repository named `cket-demo`.
2. Upload `index.html`, `styles.css`, `app.js`, and `README.md` to the repository root.
3. Open **Settings → Pages**.
4. Under **Build and deployment**, choose **Deploy from a branch**.
5. Select the `main` branch and `/ (root)`, then save.
6. Wait for GitHub Pages to publish the site. Your public URL will appear in the Pages section.

## Important safety and technical limits
This is a front-end demonstration, not a production financial service.
- User records and password hashes are stored in the visitor's browser `localStorage`. They are not shared between devices and can be cleared by the visitor.
- Passwords are hashed with the browser Web Crypto API, but this is **not** a substitute for server-side authentication, secure sessions, rate limiting, account recovery, or a production database.
- The wallet points are simulated and have no cash value.
- No real deposits, transfers, trading, paid spins, cash-valued vouchers, or withdrawals are implemented.
- Do not collect bank account details or real payment credentials in this prototype.
- Before any real-money launch, obtain qualified Nigerian legal/compliance advice and use a regulated payment provider with server-side verification, fraud controls, privacy protections and proper payout processes.
