import React, { useEffect, useState } from 'react'
import { Alert, NumberInput } from '@mantine/core';
import { useForm } from '@mantine/form';
import { useMutation, useQueryClient } from 'react-query';
import { useNavigate } from 'react-router';
import { toast } from 'react-toastify';

import StepHeader from '../AddPropertyModal/StepHeader';
import StepActions from '../AddPropertyModal/StepActions';
import { createResidency, errorMessage } from '../../utils/api';

const countError = (value, min, message) =>
    !Number.isInteger(value) || value < min || value > 50 ? message : null

const Facilities = ({ prevStep, propertyDetails, setPropertyDetails, setOpened, setActiveStep, setLocationError }) => {

    const navigate = useNavigate()
    const queryClient = useQueryClient()
    const [submitError, setSubmitError] = useState(null)

    const form = useForm({
        initialValues: {
            bedrooms: propertyDetails.facilities.bedrooms,
            parkings: propertyDetails.facilities.parkings,
            bathrooms: propertyDetails.facilities.bathrooms,
        },
        validate: {
            bedrooms: value => countError(value, 1, "Enter at least one bedroom (up to 50)"),
            bathrooms: value => countError(value, 1, "Enter at least one bathroom (up to 50)"),
            parkings: value => countError(value, 0, "Enter a number of parking spaces from 0 to 50"),
        },
    });

    const { bedrooms, parkings, bathrooms } = form.values;

    // Keep the draft current so closing and reopening the modal doesn't lose what was typed.
    useEffect(() => {
        setPropertyDetails( prev => ({ ...prev, facilities: { bedrooms, parkings, bathrooms } }) )
    }, [bedrooms, parkings, bathrooms, setPropertyDetails])

    const handleSubmit = () => {
        const { hasErrors } = form.validate();
        if (!hasErrors) {
            setPropertyDetails( prev => ({
                ...prev,
                facilities: { bedrooms, parkings, bathrooms },
            }));
            setSubmitError(null)
            mutate();
        }
    };

    const { mutate, isLoading } = useMutation({
        // The API returns the created residency, so its page can be opened.
        mutationFn: () => createResidency({
            ...propertyDetails, facilities: { bedrooms, parkings, bathrooms },
        }),
        onError: (err) => {
            const message = errorMessage(err, "Could not add the property. Please try again.")
            if (err?.response?.status === 409) {
                // A duplicate address: send the user back to fix it.
                setLocationError(message)
                setActiveStep(0)
            } else {
                setSubmitError(message)
            }
        },
        onSuccess: (residency)=> {
            toast.success("Property added.", {position: "bottom-right"});
            setPropertyDetails({
                    title: "",
                    description: "",
                    price: 0,
                    country: "",
                    city: "",
                    address: "",
                    image: null,
                    facilities: {
                    bedrooms: 1,
                    parkings: 0,
                    bathrooms: 1,
                },
            })
            setOpened(false)
            setActiveStep(0)
            queryClient.invalidateQueries("allProperties")
            if (residency?.id) navigate(`/properties/${residency.id}`)
        }
    })

    return (
        <form
            className="apm-narrow"
            onSubmit={(e) => {
                e.preventDefault();
                handleSubmit();
            }}
        >
            <StepHeader title="Rooms and parking" help="Enter whole numbers. You need at least one bedroom and one bathroom." />
            {submitError && <Alert color="red" mb="md" role="alert">{submitError}</Alert>}
            <div className="apm-grid-3">
                <NumberInput
                    withAsterisk
                    label="Bedrooms"
                    precision={0}
                    min={1}
                    max={50}
                    {...form.getInputProps("bedrooms")}
                />
                <NumberInput
                    withAsterisk
                    label="Bathrooms"
                    precision={0}
                    min={1}
                    max={50}
                    {...form.getInputProps("bathrooms")}
                />
                <NumberInput
                    label="Parking spaces"
                    precision={0}
                    min={0}
                    max={50}
                    {...form.getInputProps("parkings")}
                />
            </div>
            <StepActions
                onBack={prevStep}
                nextType="submit"
                nextLabel={isLoading ? "Adding…" : "Add property"}
                nextDisabled={isLoading}
            />
        </form>
    )
}

export default Facilities
