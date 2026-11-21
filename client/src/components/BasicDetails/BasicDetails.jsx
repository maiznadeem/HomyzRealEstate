import React from "react";
import { TextInput, Textarea, NumberInput } from "@mantine/core";
import { useForm } from "@mantine/form";

import StepHeader from "../AddPropertyModal/StepHeader";
import StepActions from "../AddPropertyModal/StepActions";
import { validateString } from "../../utils/common";

const BasicDetails = ({ prevStep, nextStep, propertyDetails, setPropertyDetails }) => {

    const form = useForm({
        initialValues: {
            title: propertyDetails.title,
            description: propertyDetails.description,
            price: propertyDetails.price,
        },
        validate: {
            title: (value) => validateString(value),
            description: (value) => validateString(value),
            price: (value) =>
                value < 1000 ? "Must be at least 1,000" : null,
        }
    });

    const { title, description, price } = form.values

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
                    description="Minimum 1,000"
                    placeholder="250000"
                    min={0}
                    max={1000000000}
                    { ...form.getInputProps("price") }
                />
            </div>
            <StepActions onBack={prevStep} nextType="submit" />
        </form>
    );
};

export default BasicDetails;
