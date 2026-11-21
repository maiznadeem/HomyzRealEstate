import React from 'react'
import { Link } from 'react-router'

import Heart from '../Heart/Heart'
import { propertyImageUrl, showPlaceholderOnError } from '../../utils/images'
import { formatPrice } from '../../utils/format'

import './PropertyCard.css'

const PropertyCard = ({ card, note }) => (
    <article className="r-card">
        <Heart id={card.id} className="r-card-heart" />
        <Link to={`/properties/${card.id}`} className="r-card-link">
            <img src={propertyImageUrl(card.image, "card")} alt={card.title} loading="lazy" onError={showPlaceholderOnError} />
            <div className="r-card-body">
                <span className="r-price">{formatPrice(card.price)}</span>
                <h3 className="r-title">{card.title}</h3>
                <p className="r-location">{[card.city, card.country].filter(Boolean).join(", ")}</p>
                {note && <p className="r-note">{note}</p>}
            </div>
        </Link>
    </article>
)

export default PropertyCard
