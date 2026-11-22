import React, { useEffect } from 'react'
import { useForm } from '@mantine/form'
import { Alert, Select, TextInput } from '@mantine/core'

import Map from '../Map/Map'
import StepHeader from '../AddPropertyModal/StepHeader'
import StepActions from '../AddPropertyModal/StepActions'
import { validateString } from '../../utils/common'
import useCountries from '../../hooks/useCountries'

const AddLocation = ({ propertyDetails, setPropertyDetails, nextStep, locationError, setLocationError }) => {

    const { getAllCountries } = useCountries()

    const form = useForm({
        initialValues: {
            country: propertyDetails?.country,
            city: propertyDetails?.city,
            address: propertyDetails?.address,
        },
        validate: {
            country: value => value ? null : "Choose a country",
            city: value => validateString(value?.trim()),
            address: value => validateString(value?.trim()),
        }
    })

    const { country, city, address } = form.values

    // Keep the draft current so closing and reopening the modal doesn't lose what was typed.
    useEffect(() => {
        setPropertyDetails( prev => ({ ...prev, country: country ?? "", city, address }) )
    }, [country, city, address, setPropertyDetails])

    const handleSubmit = () => {
        const { hasErrors } = form.validate()
        if (!hasErrors) {
            setPropertyDetails( prev => ({ ...prev, country, city, address }) )
            setLocationError(null)
            nextStep()
        }
    }

    return (
        <form
            onSubmit={(e) => {
                e.preventDefault()
                handleSubmit()
            }}
        >
            <StepHeader title="Where is the property?" help="The map moves to the address as you type." />
            {locationError && (
                <Alert color="red" mb="md" role="alert">{locationError}</Alert>
            )}
            <div className="apm-location">
                <div className="apm-fields">
                    <Select
                        withAsterisk
                        label="Country"
                        placeholder="Choose a country"
                        clearable
                        searchable
                        data={getAllCountries()}
                        { ...form.getInputProps("country", {type: "input"}) }
                    />
                    <TextInput
                        withAsterisk
                        label="City"
                        placeholder="For example, Toronto"
                        maxLength={100}
                        { ...form.getInputProps("city", {type: "input"}) }
                    />
                    <TextInput
                        withAsterisk
                        label="Address"
                        placeholder="Street and number"
                        maxLength={200}
                        { ...form.getInputProps("address", {type: "input"}) }
                    />
                </div>
                <div className="apm-map">
                    <Map
                        address={address}
                        city={city}
                        country={country}
                        height="100%"
                    />
                </div>
            </div>
            <StepActions nextType="submit" />
        </form>
    )
}

export default AddLocation
