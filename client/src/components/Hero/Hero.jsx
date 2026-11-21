import React, { useState } from 'react'
import CountUp from 'react-countup'
import { motion, useReducedMotion } from 'framer-motion'
import { useNavigate } from 'react-router'

import SearchBar from '../SearchBar/SearchBar'
import useProperties from '../../hooks/useProperties'

import './Hero.css'

const Hero = () => {
    const navigate = useNavigate()
    const [query, setQuery] = useState('')
    const reduceMotion = useReducedMotion()
    const { data } = useProperties()

    // Real numbers from the listings rather than made-up marketing figures.
    const listings = data ?? []
    const stats = [
        { value: listings.length, label: 'Homes listed' },
        { value: new Set(listings.map((p) => p.city?.trim().toLowerCase()).filter(Boolean)).size, label: 'Cities' },
        { value: new Set(listings.map((p) => p.country?.trim().toLowerCase()).filter(Boolean)).size, label: 'Countries' },
    ]

    const search = (q) => navigate(q ? `/properties?search=${encodeURIComponent(q)}` : '/properties')

    return (
        <section className="hero-wrapper">
            <div className="paddings innerWidth hero-container">
                <div className="flexColStart hero-left">
                    <div className="hero-title">
                        <div className="orange-circle" aria-hidden="true" />
                        <motion.h1
                            initial={reduceMotion ? false : { y: "2rem", opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ duration: 2, type: "spring" }}
                        >
                            Discover
                            <br />
                            your next
                            <br />
                            home
                        </motion.h1>
                    </div>
                    <p className="hero-description">
                        Browse homes for sale, save the ones you love and book a visit in a few clicks.
                    </p>
                    <SearchBar value={query} onChange={setQuery} onSubmit={search} />
                    {listings.length > 0 && (
                        <dl className="stats">
                            {stats.map((stat) => (
                                <div className="stat" key={stat.label}>
                                    <dt className="secondaryText">{stat.label}</dt>
                                    <dd><CountUp end={stat.value} duration={reduceMotion ? 0 : 2} /></dd>
                                </div>
                            ))}
                        </dl>
                    )}
                </div>
                <div className="flexCenter hero-right">
                    <motion.div
                        className="image-container"
                        initial={reduceMotion ? false : { x: "7rem", opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ duration: 2, type: "spring" }}
                    >
                        <img src="/hero-image.png" alt="Modern apartment building with tall windows" />
                    </motion.div>
                </div>
            </div>
        </section>
    )
}

export default Hero
