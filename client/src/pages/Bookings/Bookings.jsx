import React, { useState } from 'react'
import { MdOutlineEventAvailable } from 'react-icons/md'

import ListingsPage from '../../components/ListingsPage/ListingsPage'
import CancelVisitModal from '../../components/BookingModal/CancelVisitModal'
import { formatVisitDate } from '../../utils/format'
import { isPastVisit, parseVisitDate } from '../../utils/common'

const visitOf = (card, user) => user.bookings?.find((b) => b.id === card.id)
const visitTime = (card, user) => parseVisitDate(visitOf(card, user)?.date)?.getTime() ?? Infinity

const Bookings = () => {
    // The visit being cancelled: { id, date }
    const [cancelling, setCancelling] = useState(null)

    return (
        <>
            <ListingsPage
                title="Your bookings"
                intro="Visits you've booked, soonest first."
                account={{
                    loadedKey: 'bookingsLoaded',
                    errorKey: 'bookingsError',
                    queryKey: 'allBookings',
                    loginTitle: 'Log in to see your bookings',
                    loginText: 'Book visits to homes you like and keep track of them here.',
                }}
                selectIds={(user) => (user.bookings ?? []).map((b) => b.id)}
                countNoun={['visit', 'visits']}
                sortCards={(cards, user) => [...cards].sort((a, b) => visitTime(a, user) - visitTime(b, user))}
                noteFor={(card, user) => {
                    const visit = visitOf(card, user)
                    if (!visit) return null
                    return `${isPastVisit(visit.date) ? 'Visited' : 'Visit on'} ${formatVisitDate(visit.date)}`
                }}
                isMuted={(card, user) => isPastVisit(visitOf(card, user)?.date)}
                renderActions={(card, user) => {
                    const visit = visitOf(card, user)
                    return visit && (
                        <button
                            type="button"
                            className="button button--subtle"
                            onClick={() => setCancelling({ id: card.id, date: visit.date, past: isPastVisit(visit.date) })}
                        >
                            {isPastVisit(visit.date) ? 'Remove' : 'Cancel visit'}
                        </button>
                    )
                }}
                empty={{
                    icon: <MdOutlineEventAvailable />,
                    title: 'No visits booked',
                    text: 'Open any listing and choose "Book a visit" to schedule a viewing.',
                    action: { label: 'Browse properties', to: '/properties' },
                }}
            />
            <CancelVisitModal
                opened={Boolean(cancelling)}
                onClose={() => setCancelling(null)}
                propertyId={cancelling?.id}
                date={cancelling?.date}
                past={cancelling?.past}
            />
        </>
    )
}

export default Bookings
