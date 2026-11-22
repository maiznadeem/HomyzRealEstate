import React from 'react'
import { Link } from 'react-router'
import { FaShower } from 'react-icons/fa'
import { MdMeetingRoom } from 'react-icons/md'
import { AiTwotoneCar } from 'react-icons/ai'

import Heart from '../Heart/Heart'
import { propertyImageUrl, showPlaceholderOnError } from '../../utils/images'
import { formatPrice } from '../../utils/format'

import './PropertyCard.css'

// Bedrooms, bathrooms and parking, leaving out anything that is zero or missing.
const factsFor = (facilities) => [
    { key: 'bd', count: Number(facilities?.bedrooms) || 0, icon: <MdMeetingRoom size={16} aria-hidden="true" />, text: (n) => `${n} bd` },
    { key: 'ba', count: Number(facilities?.bathrooms) || 0, icon: <FaShower size={14} aria-hidden="true" />, text: (n) => `${n} ba` },
    { key: 'pk', count: Number(facilities?.parkings) || 0, icon: <AiTwotoneCar size={16} aria-hidden="true" />, text: (n) => `${n} parking` },
].filter((fact) => fact.count > 0)

const PropertyCard = ({ card, note }) => {
    const facts = factsFor(card.facilities)
    const price = formatPrice(card.price)
    return (
        <article className="r-card">
            <Heart id={card.id} className="r-card-heart" />
            <Link to={`/properties/${card.id}`} className="r-card-link" aria-label={[card.title, price].filter(Boolean).join(', ')}>
                <img src={propertyImageUrl(card.image, "card")} alt="" loading="lazy" onError={showPlaceholderOnError} />
                <div className="r-card-body">
                    <span className="r-price">{price}</span>
                    <h3 className="r-title">{card.title}</h3>
                    <p className="r-location">{[card.city, card.country].filter(Boolean).join(", ")}</p>
                    {facts.length > 0 && (
                        <p className="r-facts">
                            {facts.map((fact) => (
                                <span key={fact.key}>{fact.icon}{fact.text(fact.count)}</span>
                            ))}
                        </p>
                    )}
                    {note && <p className="r-note">{note}</p>}
                </div>
            </Link>
        </article>
    )
}

export default PropertyCard
