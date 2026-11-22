import React, { useEffect } from "react";
import { TextInput, Textarea, NumberInput } from "@mantine/core";
import { useForm } from "@mantine/form";

import StepHeader from "../AddPropertyModal/StepHeader";
import StepActions from "../AddPropertyModal/StepActions";
import { validateString } from "../../utils/common";

const MIN_PRICE = 1000
const MAX_PRICE = 1_000_000_000

const BasicDetails = ({ prevStep, nextStep, propertyDetails, setPropertyDetails }) => {

    const form = useForm({
        initialValues: {
            title: propertyDetails.title,
            description: propertyDetails.description,
            price: propertyDetails.price,
        },
        validate: {
            title: (value) => validateString(value?.trim()),
            description: (value) => validateString(value?.trim()),
            price: (value) =>
                !Number.isInteger(value) || value < MIN_PRICE || value > MAX_PRICE
                    ? "Enter a whole-number price from 1,000 to 1,000,000,000"
                    : null,
        }
    });

    const { title, description, price } = form.values

    // Keep the draft current so closing and reopening the modal doesn't lose what was typed.
    useEffect(() => {
        setPropertyDetails( prev => ({ ...prev, title, description, price }) )
    }, [title, description, price, setPropertyDetails])

    const handleSubmit = () => {
        const { hasErrors } = form.validate()
        if (!hasErrors) {
            setPropertyDetails( prev => ({...prev, title, description, price}) )
            nextStep()
        }
    }

    return (
        <form
            className="apm-narrow"
            onSubmit={(e) => {
                e.preventDefault();
                handleSubmit();
            }}
        >
            <StepHeader title="Describe the property" help="A clear title and a few details help buyers find it." />
            <div className="apm-fields">
                <TextInput
                    withAsterisk
                    label="Title"
                    placeholder="For example, Sunny family home"
                    maxLength={100}
                    { ...form.getInputProps("title") }
                />
                <Textarea
                    withAsterisk
                    label="Description"
                    placeholder="What makes this property special?"
                    minRows={4}
                    autosize
                    maxLength={2000}
                    { ...form.getInputProps("description") }
                />
                <NumberInput
                    withAsterisk
                    label="Price (USD)"
                    description="Whole dollars, from 1,000"
                    placeholder="250000"
                    precision={0}
                    min={MIN_PRICE}
                    max={MAX_PRICE}
                    { ...form.getInputProps("price") }
                />
            </div>
            <StepActions onBack={prevStep} nextType="submit" />
        </form>
    );
};

export default BasicDetails;
