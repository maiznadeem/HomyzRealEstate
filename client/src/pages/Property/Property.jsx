import React, { useContext, useEffect, useState } from 'react'
import { useQuery } from 'react-query'
import { Link, useParams, useSearchParams } from 'react-router'
import { useAuth0 } from '@auth0/auth0-react'
import { Skeleton } from '@mantine/core'
import { FaShower } from 'react-icons/fa'
import { MdMeetingRoom, MdLocationPin, MdOutlineHomeWork, MdOutlineErrorOutline, MdArrowBack } from 'react-icons/md'
import { AiTwotoneCar } from 'react-icons/ai'

import Map from '../../components/Map/Map'
import useAuthCheck from '../../hooks/useAuthCheck'
import useDocumentTitle from '../../hooks/useDocumentTitle'
import BookingModal from '../../components/BookingModal/BookingModal'
import EmptyState from '../../components/EmptyState/EmptyState'
import CancelVisitModal from '../../components/BookingModal/CancelVisitModal'
import UserDetailsContext from '../../context/UserDetailsContext'
import { errorMessage, getProperty } from '../../utils/api'
import Heart from '../../components/Heart/Heart'
import { propertyImageUrl, showPlaceholderOnError } from '../../utils/images'
import { formatPrice, formatVisitDate, plural } from '../../utils/format'

import './Property.css'

const parkingLabel = (count) => {
    const n = Number(count) || 0
    return n === 0 ? 'No parking' : plural(n, 'parking space')
}

const PropertySkeleton = () => (
    <div className="wrapper" role="status" aria-label="Loading property">
        <div className="paddings innerWidth property-container">
            <Skeleton height={20} width={120} />
            <Skeleton style={{ aspectRatio: '16 / 9', maxHeight: '35rem' }} radius="lg" />
            <div className="property-details">
                <div className="property-info">
                    <Skeleton height={36} width="70%" />
                    <div className="property-skeleton-facts">
                        <Skeleton height={24} width={110} />
                        <Skeleton height={24} width={110} />
                        <Skeleton height={24} width={110} />
                    </div>
                    <Skeleton height={14} />
                    <Skeleton height={14} />
                    <Skeleton height={14} width="60%" />
                </div>
                <Skeleton height={280} radius="md" />
            </div>
        </div>
    </div>
)

const Property = () => {

    const { propertyID: id } = useParams()
    const { data, isLoading, isError, error, refetch } = useQuery(["residency", id], () => getProperty(id), {
        // A missing property won't appear on retry; anything else gets one more try.
        retry: (count, err) => err?.response?.status !== 404 && count < 1,
    })
    const notFound = isError && error?.response?.status === 404
    useDocumentTitle(data?.title ?? (isLoading ? 'Loading property…' : notFound ? 'Property not found' : 'Property'))

    const [ modalOpened, setModalOpened ] = useState(false)
    const [ cancelOpened, setCancelOpened ] = useState(false)
    const { validateLogin } = useAuthCheck()
    const { isAuthenticated, isLoading: authLoading } = useAuth0()
    const [ searchParams, setSearchParams ] = useSearchParams()

    const { userDetails: { bookings, bookingsLoaded } } = useContext(UserDetailsContext)
    const booking = bookings?.find((b) => b?.id === id)

    // "Book a visit" while logged out returns here with ?book=1: open the booking modal once
    // the person is signed in and their bookings are known, then drop the param.
    const wantsBooking = searchParams.get('book') === '1'
    useEffect(() => {
        if (!wantsBooking || authLoading) return
        if (isAuthenticated && !(bookingsLoaded && data)) return
        if (isAuthenticated && !booking) setModalOpened(true)
        const next = new URLSearchParams(searchParams)
        next.delete('book')
        setSearchParams(next, { replace: true })
    }, [wantsBooking, authLoading, isAuthenticated, bookingsLoaded, data, booking, searchParams, setSearchParams])

    if (isLoading) {
        return <PropertySkeleton />
    }

    if (isError) {
        return (
            <div className="wrapper">
                {notFound ? (
                    <EmptyState
                        icon={<MdOutlineHomeWork />}
                        title="This property isn't available"
                        action={{ label: 'Browse properties', to: '/properties' }}
                    >
                        It may have been removed, or the link may be wrong.
                    </EmptyState>
                ) : (
                    <EmptyState
                        icon={<MdOutlineErrorOutline />}
                        title="This property couldn't be loaded"
                        action={{ label: 'Try again', onClick: () => refetch() }}
                    >
                        {errorMessage(error, "Check your connection and try again.")}
                    </EmptyState>
                )}
            </div>
        )
    }

    const facilities = data?.facilities ?? {}

    return (
        <div className="wrapper">
            <div className="paddings innerWidth property-container">
                <Link to="/properties" className="property-back">
                    <MdArrowBack aria-hidden="true" /> All properties
                </Link>
                <div className="property-media">
                    <img src={propertyImageUrl(data?.image, "detail")} alt={data?.title} onError={showPlaceholderOnError} />
                    <Heart id={id} className="property-heart" />
                </div>
                <div className="property-details">
                    <div className="property-info">
                        <div className="property-head">
                            <h1 className='primaryText'>{data?.title}</h1>
                            <span className='property-price'>{formatPrice(data?.price)}</span>
                        </div>
                        <ul className="facilities">
                            <li className="facility">
                                <MdMeetingRoom size={20} aria-hidden="true" />
                                <span>{plural(facilities.bedrooms ?? 0, 'bedroom')}</span>
                            </li>
                            <li className="facility">
                                <FaShower size={18} aria-hidden="true" />
                                <span>{plural(facilities.bathrooms ?? 0, 'bathroom')}</span>
                            </li>
                            <li className="facility">
                                <AiTwotoneCar size={20} aria-hidden="true" />
                                <span>{parkingLabel(facilities.parkings)}</span>
                            </li>
                        </ul>
                        <p className="property-description">{data?.description}</p>
                        <p className="property-address">
                            <MdLocationPin size={22} aria-hidden="true" />
                            <span>{[data?.address, data?.city, data?.country].filter(Boolean).join(', ')}</span>
                        </p>

                        {booking ? (
                            <div className="property-booking">
                                <p>Your visit is booked for <strong>{formatVisitDate(booking.date)}</strong>.</p>
                                <button
                                    type="button"
                                    className="button button--subtle"
                                    onClick={() => setCancelOpened(true)}
                                >
                                    Cancel visit
                                </button>
                                <CancelVisitModal
                                    opened={cancelOpened}
                                    onClose={() => setCancelOpened(false)}
                                    propertyId={id}
                                    date={booking.date}
                                />
                            </div>
                        ) : (
                            <button
                                type="button"
                                className="button property-book"
                                onClick={() => {
                                    validateLogin(`/properties/${encodeURIComponent(id)}?book=1`) && setModalOpened(true)
                                }}
                            >
                                Book a visit
                            </button>
                        )}

                        <BookingModal
                            opened={modalOpened}
                            setOpened={setModalOpened}
                            propertyId={id}
                        />
                    </div>
                    <div className="property-map">
                        <Map address={data?.address} city={data?.city} country={data?.country}/>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Property
