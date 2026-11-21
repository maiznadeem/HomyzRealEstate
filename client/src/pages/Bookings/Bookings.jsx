import React from 'react'
import { MdOutlineEventAvailable } from 'react-icons/md'

import ListingsPage from '../../components/ListingsPage/ListingsPage'
import { formatVisitDate } from '../../utils/format'

const Bookings = () => (
    <ListingsPage
        title="Your bookings"
        intro="Visits you've booked. Open a listing to cancel a visit."
        account={{
            loadedKey: 'bookingsLoaded',
            loginTitle: 'Log in to see your bookings',
            loginText: 'Book visits to homes you like and keep track of them here.',
        }}
        selectIds={(user) => (user.bookings ?? []).map((b) => b.id)}
        countNoun={['visit', 'visits']}
        noteFor={(card, user) => {
            const visit = user.bookings?.find((b) => b.id === card.id)
            return visit ? `Visit on ${formatVisitDate(visit.date)}` : null
        }}
        empty={{
            icon: <MdOutlineEventAvailable />,
            title: 'No visits booked',
            text: 'Open any listing and choose "Book a visit" to schedule a viewing.',
            action: { label: 'Browse properties', to: '/properties' },
        }}
    />
)

export default Bookings
