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

const GeoCoderMarker = ({ address }) => {
    
    const map = useMap()
    const [position, setPosition] = useState([60, 19])

    useEffect (() => {
        if (!address) return
        ELG.geocode().text(address).run((err, results) => {
            const match = results?.results?.[0]?.latlng
            if (!err && match) {
                setPosition([match.lat, match.lng])
                map.flyTo([match.lat, match.lng], 6)
            }
        })
    }, [address, map])

    return (
        <Marker position={position} icon={defaultIcon} >
            <Popup />
        </Marker>
    )
}

export default GeoCoderMarker