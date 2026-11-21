import React from 'react'
import { useForm } from '@mantine/form'
import { Select, TextInput } from '@mantine/core'

import Map from '../Map/Map'
import StepHeader from '../AddPropertyModal/StepHeader'
import StepActions from '../AddPropertyModal/StepActions'
import { validateString } from '../../utils/common'
import useCountries from '../../hooks/useCountries'

const AddLocation = ({ propertyDetails, setPropertyDetails, nextStep }) => {

    const { getAllCountries } = useCountries()

    const form = useForm({
        initialValues: {
            country: propertyDetails?.country,
            city: propertyDetails?.city,
            address: propertyDetails?.address,
        },
        validate: {
            country: value => validateString(value),
            city: value => validateString(value),
            address: value => validateString(value),
        }
    })

    const { country, city, address } = form.values

    const handleSubmit = () => {
        const { hasErrors } = form.validate()
        if (!hasErrors) {
            setPropertyDetails( prev => ({ ...prev, country, city, address }) )
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
                        { ...form.getInputProps("city", {type: "input"}) }
                    />
                    <TextInput
                        withAsterisk
                        label="Address"
                        placeholder="Street and number"
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
