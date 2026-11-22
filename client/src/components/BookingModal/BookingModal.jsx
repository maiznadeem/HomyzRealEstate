import React, { useState, useContext, useEffect } from 'react'
import { Alert, Modal, Button } from '@mantine/core'
import { DatePicker } from '@mantine/dates'
import { useMutation } from 'react-query'
import { toast } from 'react-toastify'
import dayjs from 'dayjs'

import { bookVisit, errorMessage } from '../../utils/api'
import UserDetailsContext from '../../context/UserDetailsContext'

const BookingModal = ({ opened, setOpened, propertyId }) => {

    const { setUserDetails } = useContext(UserDetailsContext)
    const [value, setValue] = useState(null)

    const { mutate, isLoading, isError, error, reset } = useMutation({
        mutationFn: (date) => bookVisit(date, propertyId),
        onSuccess: (_, date) => {
            toast.success("Visit booked.", { position: "bottom-right" })
            setUserDetails( prev => ({
                ...prev,
                bookings: [
                    ...(prev.bookings ?? []),
                    { id: propertyId, date: dayjs(date).format("DD/MM/YYYY") }
                ]
            }))
            setOpened(false)
        }
        // On error the modal stays open with the message below and the chosen date.
    })

    // Start fresh each time the modal opens.
    useEffect(() => {
        if (!opened) {
            setValue(null)
            reset()
        }
    }, [opened, reset])

    const close = () => !isLoading && setOpened(false)

    return (
        <Modal
            opened={opened}
            onClose={close}
            title="Choose a date for your visit"
            centered
        >
            <div className="flexColCenter" style={{ gap: "1rem" }} >
                <DatePicker
                    value={value}
                    onChange={(date) => { setValue(date); reset() }}
                    minDate={new Date()}
                    maxDate={dayjs().add(3, 'month').toDate()}
                    previousLabel="Previous month"
                    nextLabel="Next month"
                />
                {isError && (
                    <Alert color="red" role="alert" style={{ width: "100%" }}>
                        {errorMessage(error, "Could not book the visit. Please try again.")}
                    </Alert>
                )}
                <Button
                    disabled={!value || isLoading}
                    onClick={() => mutate(value)}
                >{isLoading ? "Booking…" : "Book visit"}</Button>
            </div>
        </Modal>
    )
}

export default BookingModal
