import React, { useState } from 'react'
import { Modal, Stepper } from '@mantine/core'
import { useMediaQuery } from '@mantine/hooks'

import AddLocation from '../AddLocation/AddLocation';
import UploadImage from '../UploadImage/UploadImage';
import BasicDetails from '../BasicDetails/BasicDetails';
import Facilities from '../Facilities/Facilities';

import './AddPropertyModal.css'

const AddPropertyModal = ({ opened, setOpened }) => {

    const [active, setActive] = useState(0);
    const nextStep = () => setActive((current) => (current < 4 ? current + 1 : current));
    const prevStep = () => setActive((current) => (current > 0 ? current - 1 : current));
    const isPhone = useMediaQuery('(max-width: 36em)')

    const [propertyDetails, setPropertyDetails] = useState({
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

    return (
        <Modal
            opened={opened}
            onClose={() => setOpened(false)}
            title={<span className="apm-title">Add a property</span>}
            size="56rem"
            radius="md"
            centered={!isPhone}
            fullScreen={isPhone}
            padding={isPhone ? "md" : "xl"}
        >
            <div className="apm-body">

                <Stepper
                    className="apm-stepper"
                    active={active}
                    onStepClick={setActive}
                    breakpoint={0}
                    size="sm"
                    allowNextStepsSelect={false}
                >
                    <Stepper.Step label="Location" description="Where it is">
                        <AddLocation
                            nextStep={nextStep}
                            propertyDetails={propertyDetails}
                            setPropertyDetails={setPropertyDetails}
                        />
                    </Stepper.Step>
                    <Stepper.Step label="Cover photo" description="Main image">
                        <UploadImage
                            prevStep={prevStep}
                            nextStep={nextStep}
                            propertyDetails={propertyDetails}
                            setPropertyDetails={setPropertyDetails}
                        />
                    </Stepper.Step>
                    <Stepper.Step label="Details" description="Title and price">
                        <BasicDetails
                            prevStep={prevStep}
                            nextStep={nextStep}
                            propertyDetails={propertyDetails}
                            setPropertyDetails={setPropertyDetails}
                        />
                    </Stepper.Step>
                    <Stepper.Step label="Rooms" description="Beds and baths">
                        <Facilities
                            prevStep={prevStep}
                            propertyDetails={propertyDetails}
                            setPropertyDetails={setPropertyDetails}
                            setOpened={setOpened}
                            setActiveStep={setActive}
                        />
                    </Stepper.Step>
                    <Stepper.Completed>
                        <p className="apm-done">All steps are done. Use Back to review an earlier step.</p>
                    </Stepper.Completed>
                </Stepper>

            </div>
        </Modal>
    )
}

export default AddPropertyModal
