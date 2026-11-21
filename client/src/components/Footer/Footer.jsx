import React from 'react'
import { Link } from 'react-router-dom'

import './Footer.css'

const Footer = () => (
    <footer className="f-wrapper">
        <div className="paddings innerWidth f-container">
            <div className="f-brand">
                <img src="/logo2.png" alt="Homyz" width={120} height={45} />
                <p>Find a home, save the ones you like and book a visit, all in one place.</p>
            </div>
            <nav className="f-menu" aria-label="Footer">
                <Link to="/properties">Properties</Link>
                <Link to="/favourites">Favourites</Link>
                <Link to="/bookings">Bookings</Link>
                <a href="mailto:contact.maiznadeem@gmail.com">Contact</a>
            </nav>
        </div>
        <div className="innerWidth f-bottom">
            <span>© {new Date().getFullYear()} Homyz Real Estate</span>
        </div>
    </footer>
)

export default Footer
