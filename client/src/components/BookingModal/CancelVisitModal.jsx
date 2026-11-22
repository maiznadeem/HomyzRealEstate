import React, { useContext } from 'react'
import { Button, Group, Modal, Text } from '@mantine/core'
import { useMutation } from 'react-query'
import { toast } from 'react-toastify'

import UserDetailsContext from '../../context/UserDetailsContext'
import { cancelBooking } from '../../utils/api'
import { formatVisitDate } from '../../utils/format'

import './CancelVisit.css'

// Asks before cancelling a booked visit, then cancels it. Used on the property page and on /bookings.
// For a visit that already happened (`past`), it removes it from Bookings instead.
const CancelVisitModal = ({ opened, onClose, propertyId, date, past = false }) => {

    const { setUserDetails } = useContext(UserDetailsContext)

    const { mutate, isLoading } = useMutation({
        mutationFn: () => cancelBooking(propertyId),
        onSuccess: () => {
            setUserDetails((prev) => ({
                ...prev,
                bookings: (prev.bookings ?? []).filter((b) => b?.id !== propertyId)
            }))
            toast.success(past ? "Visit removed." : "Visit cancelled.", { position: "bottom-right" })
            onClose()
        }
        // cancelBooking already shows the server's message; the modal stays open so the person can retry.
    })

    return (
        <Modal
            opened={opened}
            onClose={() => !isLoading && onClose()}
            title={past ? `Remove your visit on ${formatVisitDate(date)} from Bookings?` : `Cancel your visit on ${formatVisitDate(date)}?`}
            centered
        >
            <Text size="sm" color="dimmed">{past ? "It will no longer be listed under Bookings." : "You can book another visit any time."}</Text>
            <Group position="right" mt="lg">
                <Button variant="default" onClick={onClose} disabled={isLoading}>Keep visit</Button>
                <Button color="red" onClick={() => mutate()} loading={isLoading}>{past ? "Remove" : "Cancel visit"}</Button>
            </Group>
        </Modal>
    )
}

export default CancelVisitModal
