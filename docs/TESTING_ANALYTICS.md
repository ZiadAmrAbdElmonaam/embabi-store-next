# Testing analytics (Meta Pixel + order attribution)

Use this to verify the tracking we added works end-to-end.

---

## What you need

1. **`.env`** – `NEXT_PUBLIC_META_PIXEL_ID` set (e.g. your real Pixel ID or a test Pixel).
2. **Site running** – `npm run dev` (or your deployed URL).
3. **Optional:** [Meta Pixel Helper](https://chrome.google.com/webstore/detail/meta-pixel-helper/fdgfkebogiimcoedlicjlajpkdmockpc) (Chrome) to see events in the browser.
4. **Optional:** Meta Events Manager → **Test Events** to see events in real time (use your Pixel’s “Test events” tool).

---

## 1. Quick check: is the Pixel on the page?

With the app running (e.g. `http://localhost:3000`):

```bash
npm run check-analytics-pixel -- http://localhost:3000
```

This fetches the homepage and checks that the Pixel script is present and uses your env Pixel ID. No browser needed.

---

## 2. Manual test flow (do this in the browser)

Use one tab and follow in order. After each step you can check Meta Pixel Helper or Events Manager → Test Events.

| Step | What to do | Event that should fire |
|------|------------|------------------------|
| 1 | Open the site (homepage). | **PageView** (automatic) |
| 2 | Open any **product page** (e.g. click a product). | **ViewContent** (product id, name, value, currency) |
| 3 | Click **Add to cart** (choose options if needed). | **AddToCart** (content_ids, value, currency, num_items) |
| 4 | Go to **Cart** and click **Checkout**. | **InitiateCheckout** (value, content_ids, num_items) |
| 5 | Fill the form and **place an order** (e.g. COD). | **Purchase** (value, order_id, content_ids, num_items) |

- If you use **Pixel Helper**: the icon should show a number; click it to see the last events and parameters.
- If you use **Test Events**: open Events Manager → your Pixel → Test Events, then do the steps; events appear in the list with parameters.

---

## 3. Test order attribution (UTM + click ids)

1. **Clear** the site’s first-touch storage (or use an incognito window):
   - Open DevTools → Application → Local Storage → your site → delete key `analytics_first_touch_utm` and `analytics_first_touch_click_ids` (or clear all for the site).
2. **Land with UTM (and optionally fbclid):**
   - Visit:  
     `http://localhost:3000/?utm_source=test&utm_medium=test&utm_campaign=test`
   - Or add `&fbclid=test_fbclid_123` to simulate a Meta click.
3. **Without closing the tab**, go to a product → Add to cart → Checkout → **place an order** (e.g. COD).
4. **Check the order in the DB** (e.g. Prisma Studio or your admin):
   - `Order` should have `utmSource`, `utmMedium`, `utmCampaign` (and `fbclid` if you used it).
   - Run: `npx prisma studio` and open the last Order, or query in SQL.

---

## 4. What I need from you (if you want me to run the script)

- **Base URL** to test, e.g. `http://localhost:3000` or your staging URL.
- **Confirm** the dev (or staging) server is running when you run the script.

Then you can run:

```bash
npm run check-analytics-pixel -- http://localhost:3000
```

I won’t run scripts that need payment or real login; the rest you can do locally with the steps above.

---

## Summary

- **Script:** `npm run check-analytics-pixel -- <URL>` → checks Pixel is in the HTML.
- **Browser:** Follow the 5 steps and confirm each event in Pixel Helper or Test Events.
- **Attribution:** Visit with UTM (and optional fbclid), place one order, then check that Order row in the DB.

No theory—only these steps and the script.
