import React from 'react'
import { NumberInput } from '@mantine/core';
import { useForm } from '@mantine/form';
import { useMutation } from 'react-query';
import { toast } from 'react-toastify';

import StepHeader from '../AddPropertyModal/StepHeader';
import StepActions from '../AddPropertyModal/StepActions';
import { createResidency, errorMessage } from '../../utils/api';
import useProperties from '../../hooks/useProperties'

const Facilities = ({ prevStep, propertyDetails, setPropertyDetails, setOpened, setActiveStep }) => {

    const form = useForm({
        initialValues: {
            bedrooms: propertyDetails.facilities.bedrooms,
            parkings: propertyDetails.facilities.parkings,
            bathrooms: propertyDetails.facilities.bathrooms,
        },
        validate: {
            bedrooms: value => value < 1 ? "Must have at least one room" : null,
            bathrooms: value => value < 1 ? "Must have at least one bathroom" : null,
        },
    });

    const { bedrooms, parkings, bathrooms } = form.values;

    const handleSubmit = () => {
        const { hasErrors } = form.validate();
        if (!hasErrors) {
            setPropertyDetails( prev => ({
                ...prev,
                facilities: { bedrooms, parkings, bathrooms },
            }));
            mutate();
        }
    };

    const { refetch: refetchProperties } = useProperties()

    const { mutate, isLoading } = useMutation({
        mutationFn: () => createResidency({
            ...propertyDetails, facilities: { bedrooms, parkings, bathrooms },
        }),
        onError: (err) => toast.error(errorMessage(err, "Could not add the property. Please try again."), {position: "bottom-right"}),
        onSuccess: ()=> {
            toast.success("Property Added Successfully", {position: "bottom-right"});
            setPropertyDetails({
                    title: "",
                    description: "",
                    price: 0,
                    country: "",
                    city: "",
                    address: "",
                    image: null,
                    facilities: {
                    bedrooms: 0,
                    parkings: 0,
                    bathrooms: 0,
                },
            })
            setOpened(false)
            setActiveStep(0)
            refetchProperties()
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
            <div className="apm-grid-3">
                <NumberInput
                    withAsterisk
                    label="Bedrooms"
                    min={0}
                    max={50}
                    {...form.getInputProps("bedrooms")}
                />
                <NumberInput
                    withAsterisk
                    label="Bathrooms"
                    min={0}
                    max={50}
                    {...form.getInputProps("bathrooms")}
                />
                <NumberInput
                    label="Parking spaces"
                    min={0}
                    max={50}
                    {...form.getInputProps("parkings")}
                />
            </div>
            <StepActions
                onBack={prevStep}
                nextType="submit"
                nextLabel={isLoading ? "Adding" : "Add property"}
                nextDisabled={isLoading}
            />
        </form>
    )
}

export default Facilities
