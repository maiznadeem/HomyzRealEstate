import React, { useEffect, useState } from 'react'
import { Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import * as ELG from 'esri-leaflet-geocoder'

import "leaflet/dist/leaflet.css"
import icon from "leaflet/dist/images/marker-icon.png"
import iconShadow from "leaflet/dist/images/marker-shadow.png"

let defaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow
})
L.Marker.prototype.options.icon = defaultIcon

const STREET_ZOOM = 15

const GeoCoderMarker = ({ address }) => {

    const map = useMap()
    // null until geocoding finds a match; `failed` is true once a lookup came back empty or errored.
    const [position, setPosition] = useState(null)
    const [failed, setFailed] = useState(false)

    useEffect (() => {
        if (!address) {
            setPosition(null)
            setFailed(false)
            return
        }
        let cancelled = false
        // Wait for typing to pause so the geocoder isn't called on every keystroke.
        const timer = setTimeout(() => {
            ELG.geocode().text(address).run((err, results) => {
                if (cancelled) return
                const match = results?.results?.[0]?.latlng
                if (!err && match) {
                    setPosition([match.lat, match.lng])
                    setFailed(false)
                    map.flyTo([match.lat, match.lng], STREET_ZOOM)
                } else {
                    setPosition(null)
                    setFailed(true)
                }
            })
        }, 500)
        return () => {
            cancelled = true
            clearTimeout(timer)
        }
    }, [address, map])

    return (
        <>
            {position && (
                <Marker position={position} icon={defaultIcon} >
                    <Popup>{address}</Popup>
                </Marker>
            )}
            {failed && (
                <div
                    role="status"
                    style={{
                        position: "absolute",
                        left: "0.5rem",
                        bottom: "1.5rem",
                        zIndex: 1000,
                        padding: "0.25rem 0.6rem",
                        borderRadius: 6,
                        background: "rgba(255, 255, 255, 0.92)",
                        color: "#1f3e72",
                        fontSize: "0.8rem",
                        pointerEvents: "none",
                    }}
                >
                    Map location unavailable for this address
                </div>
            )}
        </>
    )
}

export default GeoCoderMarker
