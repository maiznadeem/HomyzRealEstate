import { MdSearch, MdOutlineFavoriteBorder, MdOutlineEventAvailable } from "react-icons/md";

// What the site actually does for someone looking for a home.
const data = [
    {
        icon: <MdSearch />,
        heading: "Every listing in one place",
        detail:
            "Search homes by title, city or country, then open any listing to see its rooms, price and location on a map.",
    },
    {
        icon: <MdOutlineFavoriteBorder />,
        heading: "Save the homes you like",
        detail:
            "Tap the heart on a listing to keep it in your favourites, so you can compare homes and come back to them on any device.",
    },
    {
        icon: <MdOutlineEventAvailable />,
        heading: "Book visits online",
        detail:
            "Pick a date on any listing to book a visit. Your visits are listed under Bookings, where you can cancel one at any time.",
    },
];

export default data;
