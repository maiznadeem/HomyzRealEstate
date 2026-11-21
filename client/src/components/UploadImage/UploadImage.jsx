import React, { useEffect, useRef, useState } from 'react'
import { AiOutlineCloudUpload } from 'react-icons/ai'
import { Button, Group } from '@mantine/core'
import { toast } from 'react-toastify'

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
        <div className="flexColCenter uploadWrapper">
            {
                !imageURL ? (
                    <div 
                        className="flexColCenter uploadZone"
                        onClick={openWidget}
                    >
                        <AiOutlineCloudUpload size={50} color='grey' />
                        <span>Upload Image</span>
                    </div>
                ) : (
                    <div 
                        className="uploadedImage"
                        onClick={openWidget}
                    >
                        <img src={imageURL} alt="House Image" />
                    </div>
                )
            }
            <Group position="center" mt="xl">
                <Button variant='default' onClick={prevStep}>Back</Button>
                <Button onClick={handleNext} disabled={!imageURL}>Next</Button>
            </Group>
        </div>
    )
}

export default UploadImage