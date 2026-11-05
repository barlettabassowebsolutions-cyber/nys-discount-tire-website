// Business details shared by the scripts on every page.
window.SITE_CONFIG = {
  google: {
    // Optional Google Maps Platform API key for this website. Leave it empty and
    // the homepage shows the reviews saved from the old website instead of live
    // Google reviews. (The live star rating in the Google map works either way.)
    // The key needs "Maps JavaScript API" and "Places API (New)" turned on,
    // and should be restricted to this website's address.
    apiKey: "",

    // The shop's Google Business Profile.
    placeId: "ChIJhTiOsQbV6YkRNMz0ID-iFdA",
    reviewsUrl: "https://search.google.com/local/reviews?placeid=ChIJhTiOsQbV6YkRNMz0ID-iFdA",
    writeReviewUrl: "https://search.google.com/local/writereview?placeid=ChIJhTiOsQbV6YkRNMz0ID-iFdA",

    // Rating and count shown in the header and on buttons (checked October 20, 2026).
    // Update these now and then; the Google map on the homepage always shows the current ones.
    rating: 4.8,
    reviewCount: 400,

    // Lowest star rating to show in the testimonials box (1 shows every review).
    minRating: 1
  }
};
