import React from 'react'
import { AiFillHeart } from 'react-icons/ai'
import { truncate } from 'lodash'
import { useNavigate } from 'react-router-dom'

import Heart from '../Heart/Heart'

import { PROPERTY_PLACEHOLDER, showPlaceholderOnError } from '../../utils/images'

import './PropertyCard.css'

const PropertyCard = ({card}) => {

    const navigate = useNavigate()

    return (
        <div 
            className="flexCenter r-card"
            onClick={() => navigate(`../properties/${card.id}`)}
        >
            <Heart id={card?.id} />
            <img src={card.image || PROPERTY_PLACEHOLDER} alt="home" loading="lazy" onError={showPlaceholderOnError} />
            <div className='flexColStart'>
                <span className="secondaryText r-price">
                    <span style={{ color: "orange" }}>$</span>
                    <span>{card.price}</span>
                </span>
                <span className="primaryText">{truncate(card.title, {length: 20})}</span>
                <span className="secondaryText">{truncate(card.description, {length: 80})}</span>
            </div>
        </div>
    )
}

export default PropertyCard