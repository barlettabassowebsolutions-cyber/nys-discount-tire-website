# NYS Discount Tire & Auto website

The website for NYS Discount Tire & Auto, 199 County Line Rd., Amityville, NY 11701, (631) 264-8473.
It replaces the old site at nysdiscounttire.com and is hosted on GoDaddy.

It's plain HTML, CSS and JavaScript with no build step, so any web host can serve it as is.

## Pages

| File | Page |
| --- | --- |
| `index.html` | Home, with the testimonials slider and the live Google rating |
| `services.html` | Services, including free towing |
| `vehicles.html` | Vehicles we work on |
| `tires.html` | Tires |
| `about-us.html` | About Us, with the photo gallery |
| `reviews.html` | Customer reviews |
| `appointments.html` | Appointments & Contact, with the Google Calendar booking page |
| `directions.html` | Directions and map |

## Where things are changed

- **Phone, address and hours** are written into each page's header and footer.
- **Google rating, review count and links** live in `js/site-config.js`.
- **Booking times and the booking form** are set in the shop's Google Calendar ("Service Appointment" schedule), not in this code.
- **Saved reviews** are kept in `data/reviews.json`. After editing it, run `node tools/build-reviews.js` to write them into `index.html` and `reviews.html`.

## Preview on your computer

Open `index.html` in a browser, or serve the folder with any static server, for example:

```
npx serve .
```

## Preview link to share

https://barlettabassowebsolutions-cyber.github.io/nys-discount-tire-website/

GitHub Pages rebuilds this preview a minute or two after each change to `main`
(see `.github/workflows/preview.yml`). It asks search engines not to list it, so it
won't compete with the real site. The booking calendar on it is the real one.

## Putting it on GoDaddy

Upload everything except `tools/`, `data/`, `.github/`, `README.md` and `.gitignore` into the hosting account's `public_html` folder.
