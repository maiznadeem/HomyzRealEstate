import React from 'react'
import { Link } from 'react-router-dom'

import './GetStarted.css'

const GetStarted = () => (
    <section className="g-wrapper">
        <div className="paddings innerWidth g-container">
            <div className="flexColCenter inner-container">
                <h2 className='primaryText'>Ready to find your next home?</h2>
                <p className='secondaryText'>
                    Browse every listing, save your favourites and book a visit when you’re ready.
                </p>
                <Link className="button" to="/properties">Browse properties</Link>
            </div>
        </div>
    </section>
)

export default GetStarted
