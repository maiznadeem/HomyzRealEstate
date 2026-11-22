import React, { useEffect, useRef, useState } from 'react'
import { AiOutlineCloudUpload } from 'react-icons/ai'
import { Alert, Button } from '@mantine/core'
import { toast } from 'react-toastify'

import StepHeader from '../AddPropertyModal/StepHeader'
import StepActions from '../AddPropertyModal/StepActions'
import config from '../../../config'
import { errorMessage, signUpload } from '../../utils/api'

import './UploadImage.css'

const UploadImage = ({ propertyDetails, setPropertyDetails, nextStep, prevStep }) => {

    const [imageURL, setImageURL] = useState(propertyDetails.image)

    const [uploadError, setUploadError] = useState(null)

    const widgetRef = useRef()

    const handleNext = () => {
        setPropertyDetails( prev => ({ ...prev, image: imageURL }) )
        nextStep()
    }

    // Matches the app's blue and navy (client/src/index.css).
    const palette = {
        window: "#FFFFFF",
        windowBorder: "#b9c4f5",
        tabIcon: "#4066ff",
        menuIcons: "#1f3e72",
        textDark: "#131110",
        textLight: "#FFFFFF",
        link: "#4066ff",
        action: "#4066ff",
        inactiveTabIcon: "#6b6f7b",
        error: "#fa3e5f",
        inProgress: "#4066ff",
        complete: "#2949c6",
        sourceBg: "#eeeeff",
    }

    const createWidget = () => {
        if (!window.cloudinary) {
            setUploadError("The image uploader couldn't load. Check your connection and reload the page.")
            return null
        }
        return window.cloudinary.createUploadWidget({
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
            styles: { palette },
        }, (err, result) => {
            if (err) {
                setUploadError(err.statusText || err.message || "The upload failed. Please try again.")
                return
            }
            if (result?.event === "success") {
                setUploadError(null)
                setImageURL(result.info.secure_url)
                setPropertyDetails( prev => ({ ...prev, image: result.info.secure_url }) )
            }
        })
    }

    // Each upload gets a fresh random id; the API signs any id only once, so a signature can't be reused.
    const openWidget = () => {
        // The script may have loaded after this step mounted, so try again here.
        widgetRef.current = widgetRef.current ?? createWidget()
        if (!widgetRef.current) return
        setUploadError(null)
        const bytes = crypto.getRandomValues(new Uint8Array(12))
        const publicId = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("")
        widgetRef.current.update({ publicId })
        widgetRef.current.open()
    }

    useEffect(()=> {
        widgetRef.current = createWidget()
        return () => {
            widgetRef.current?.destroy?.()
            widgetRef.current = null
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
            {uploadError && <Alert color="red" mt="md" role="alert">{uploadError}</Alert>}
            <StepActions
                onBack={prevStep}
                onNext={handleNext}
                nextDisabled={!imageURL}
                extra={imageURL ? <Button variant="subtle" onClick={openWidget}>Replace photo</Button> : null}
            />
            {!imageURL && <p className="apm-hint">Upload a cover photo to continue</p>}
        </div>
    )
}

export default UploadImage
