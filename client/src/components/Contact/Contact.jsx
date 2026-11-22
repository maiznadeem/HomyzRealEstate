import React from 'react'
import { FaEnvelope } from 'react-icons/fa'
import { MdOutlineHomeWork } from 'react-icons/md'
import { Link } from 'react-router'

import './Contact.css'

const CONTACT_EMAIL = 'contact.maiznadeem@gmail.com'

const Contact = () => (
    <section className="c-wrapper">
        <div className="paddings innerWidth flexCenter c-container">
            <div className="flexColStart c-left">
                <span className='orangeText'>Contact</span>
                <h2 className='primaryText'>Questions about a home?</h2>
                <p className='secondaryText c-intro'>
                    Have a question about a listing, a visit you’ve booked or putting your own home on Homyz? Send us an email.
                </p>
                <div className="contactModes">
                    <div className="mode">
                        <div className="mode-head">
                            <div className="flexCenter icon" aria-hidden="true"><FaEnvelope size={22} /></div>
                            <div className="detail">
                                <h3 className='primaryText'>Email</h3>
                                <span className='secondaryText mode-email'>{CONTACT_EMAIL.split('@')[0]}<wbr />@{CONTACT_EMAIL.split('@')[1]}</span>
                            </div>
                        </div>
                        <a className="flexCenter button" href={`mailto:${CONTACT_EMAIL}`}>Send an email</a>
                    </div>
                    <div className="mode">
                        <div className="mode-head">
                            <div className="flexCenter icon" aria-hidden="true"><MdOutlineHomeWork size={22} /></div>
                            <div className="detail">
                                <h3 className='primaryText'>Book a visit</h3>
                                <span className='secondaryText'>Open any listing and pick a date. Your visits appear under Bookings.</span>
                            </div>
                        </div>
                        <Link className="flexCenter button" to="/properties">Browse properties</Link>
                    </div>
                </div>
            </div>
            <div className="flexColEnd c-right">
                <div className="image-container">
                    <img src="/contact.jpg" alt="House with large windows surrounded by trees" />
                </div>
            </div>
        </div>
    </section>
)

export default Contact
