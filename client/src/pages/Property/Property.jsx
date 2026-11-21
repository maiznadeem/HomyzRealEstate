import React, { useContext, useState } from 'react'
import { useMutation, useQuery } from 'react-query'
import { Link, useParams } from 'react-router-dom'
import { FaShower } from 'react-icons/fa'
import { MdMeetingRoom, MdLocationPin, MdOutlineHomeWork, MdArrowBack } from 'react-icons/md'
import { AiTwotoneCar } from 'react-icons/ai'
import { toast } from 'react-toastify'

import Map from '../../components/Map/Map'
import useAuthCheck from '../../hooks/useAuthCheck'
import useDocumentTitle from '../../hooks/useDocumentTitle'
import BookingModal from '../../components/BookingModal/BookingModal'
import EmptyState from '../../components/EmptyState/EmptyState'
import { Loading } from '../../components/ListingsPage/ListingsPage'
import UserDetailsContext from '../../context/UserDetailsContext'
import { cancelBooking, getProperty } from '../../utils/api'
import Heart from '../../components/Heart/Heart'
import { propertyImageUrl, showPlaceholderOnError } from '../../utils/images'
import { formatPrice, formatVisitDate, plural } from '../../utils/format'

import './Property.css'

const parkingLabel = (count) => {
    const n = Number(count) || 0
    return n === 0 ? 'No parking' : plural(n, 'parking space')
}

const Property = () => {

    const { propertyID: id } = useParams()
    const { data, isLoading, isError } = useQuery(["residency", id], () => getProperty(id), { retry: false })
    useDocumentTitle(data?.title ?? (isError ? 'Property not found' : 'Property'))

    const [ modalOpened, setModalOpened ] = useState(false)
    const { validateLogin } = useAuthCheck()

    const { userDetails: { bookings }, setUserDetails } = useContext(UserDetailsContext)
    const booking = bookings?.find((b) => b?.id === id)

    const { mutate: removeBooking, isLoading: removing } = useMutation({
        mutationFn: () => cancelBooking(id),
        onSuccess: () => {
            setUserDetails( prev => ({
                ...prev,
                bookings: prev.bookings.filter(b => b?.id !== id)
            }))
            toast.success("Visit cancelled.", { position: "bottom-right" })
        }
    })

    if (isLoading) {
        return <div className="wrapper"><Loading /></div>
    }

    if (isError) {
        return (
            <div className="wrapper">
                <EmptyState
                    icon={<MdOutlineHomeWork />}
                    title="This property isn't available"
                    action={{ label: 'Browse properties', to: '/properties' }}
                >
                    It may have been removed, or the link may be wrong.
                </EmptyState>
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
                                    className="button button--outline-danger"
                                    onClick={() => removeBooking()}
                                    disabled={removing}
                                >
                                    {removing ? 'Cancelling…' : 'Cancel visit'}
                                </button>
                            </div>
                        ) : (
                            <button
                                type="button"
                                className="button property-book"
                                onClick={() => {
                                    validateLogin() && setModalOpened(true)
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
