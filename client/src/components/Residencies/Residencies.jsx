import React, { useState } from 'react'
import { Swiper, SwiperSlide, useSwiper } from 'swiper/react'
import { FaArrowRight, FaArrowLeft } from 'react-icons/fa';
import { Link } from 'react-router';

import 'swiper/css'
import './Residencies.css'

import PropertyCard from '../PropertyCard/PropertyCard';
import useProperties from '../../hooks/useProperties';

// One card plus a peek of the next on phones; more cards as the screen widens.
const sliderSettings = {
    slidesPerView: 1.15,
    spaceBetween: 16,
    breakpoints: {
        600: { slidesPerView: 2, spaceBetween: 24 },
        750: { slidesPerView: 3, spaceBetween: 32 },
        1100: { slidesPerView: 4, spaceBetween: 50 },
    },
}

const Residencies = () => {

    const { data, isError, isLoading } = useProperties()

    // The home page stays useful without this strip; the Properties page explains any error.
    if (isError || isLoading || !data?.length) return null

    return (
        <section className="r-wrapper">
            <div className="paddings innerWidth r-container">
                <div className="r-head">
                    <div>
                        <h2 className='primaryText'>Latest listings</h2>
                        <p className='secondaryText'>The newest homes on Homyz.</p>
                    </div>
                    <Link to="/properties" className="r-all">View all properties</Link>
                </div>
                <Swiper {...sliderSettings} >
                    <SliderButtons />
                    {data.slice(0, 8).map((card) => (
                            <SwiperSlide key={card.id}>
                                <PropertyCard card={card} />
                            </SwiperSlide>
                        ))
                    }
                </Swiper>
            </div>
        </section>
    )
}

export default Residencies


const SliderButtons = () => {
    const swiper = useSwiper();
    const [isBeginning, setIsBeginning] = useState(true);
    const [isEnd, setIsEnd] = useState(false);

    const handleSlideChange = () => {
      setIsBeginning(swiper.isBeginning);
      setIsEnd(swiper.isEnd);
    };

    swiper.on('slideChange', handleSlideChange);
  
    return (
        <div className="flexCenter r-buttons">
            <button type="button" aria-label="Previous listings" onClick={() => swiper.slidePrev()} disabled={isBeginning}>
                <FaArrowLeft aria-hidden="true" />
            </button>
            <button type="button" aria-label="Next listings" onClick={() => swiper.slideNext()} disabled={isEnd}>
                <FaArrowRight aria-hidden="true" />
            </button>
        </div>
    );
};