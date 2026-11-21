import React, { useEffect, useRef, useState } from 'react'
import { AiOutlineCloudUpload } from 'react-icons/ai'
import { Button } from '@mantine/core'
import { toast } from 'react-toastify'

import StepHeader from '../AddPropertyModal/StepHeader'
import StepActions from '../AddPropertyModal/StepActions'
import config from '../../../config'
import { errorMessage, signUpload } from '../../utils/api'

import './UploadImage.css'

const UploadImage = ({ propertyDetails, setPropertyDetails, nextStep, prevStep }) => {

    const [imageURL, setImageURL] = useState(propertyDetails.image)

    const cloudinaryRef = useRef()
    const widgetRef = useRef()

    const handleNext = () => {
        setPropertyDetails( prev => ({ ...prev, image: imageURL }) )
        nextStep()
    }

    // Each upload gets a fresh random id; the API signs any id only once, so a signature can't be reused.
    const openWidget = () => {
        const bytes = crypto.getRandomValues(new Uint8Array(12))
        const publicId = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("")
        widgetRef.current?.update({ publicId })
        widgetRef.current?.open()
    }

    useEffect(()=> {
        cloudinaryRef.current = window.cloudinary
        widgetRef.current = cloudinaryRef.current.createUploadWidget({
            cloudName: config.cloudName,
            apiKey: config.cloudinaryApiKey,
            uploadPreset: config.uploadPreset,
            folder: config.uploadFolder,
            // Every upload is signed by the API, which checks the user is logged in and rate-limits them.
            uploadSignature: (callback, paramsToSign) => {
                signUpload(paramsToSign)
                    .then(callback)
                    .catch((err) => toast.error(errorMessage(err, "Could not start the upload. Please try again."), { position: "bottom-right" }))
            },
            sources: ["local", "camera"],
            multiple: false,
            maxFiles: 1,
            clientAllowedFormats: ["jpg", "jpeg", "png", "webp"],
            maxFileSize: 5 * 1024 * 1024,
        }, (err, result) => {
            if (result?.event === "success") {
                setImageURL(result.info.secure_url)
            }
        })
    }, [])

    return (
        <div>
            <StepHeader title="Add a cover photo" help="This is the main image people see. Use a JPG, PNG or WebP file up to 5 MB." />
            {
                !imageURL ? (
                    <button type="button" className="upload-zone" onClick={openWidget}>
                        <AiOutlineCloudUpload size={44} className="upload-zone-icon" />
                        <span className="upload-zone-title">Upload a photo</span>
                        <span className="upload-zone-hint">Choose a file or take a picture</span>
                    </button>
                ) : (
                    <div className="upload-preview">
                        <img src={imageURL} alt="Cover of the property" />
                    </div>
                )
            }
            <StepActions
                onBack={prevStep}
                onNext={handleNext}
                nextDisabled={!imageURL}
                extra={imageURL ? <Button variant="subtle" onClick={openWidget}>Replace photo</Button> : null}
            />
        </div>
    )
}

export default UploadImage
