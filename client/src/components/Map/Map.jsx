import React from 'react'
import { MapContainer, TileLayer } from 'react-leaflet'
import L from 'leaflet'

import GeoCoderMarker from '../GeoCoderMarker/GeoCoderMarker'

// Phones and tablets (a finger as the main pointer, or Leaflet's own mobile check): one-finger
// drag would trap page scrolling over the map, so only pinch zoom is left on.
const TOUCH_FIRST = L.Browser.mobile || (typeof window !== 'undefined' && window.matchMedia?.('(pointer: coarse)').matches)

const OSM_ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'

const Map = ({ address, city, country, height = "min(26rem, 50vh)" }) => {
    return (
        <MapContainer
            center={[53.35, 18.8]}
            zoom={1}
            scrollWheelZoom={false}
            dragging={!TOUCH_FIRST}
            style={{
                height,
                width: "100%",
                zIndex: 0,
            }}
        >
            <TileLayer
                url='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
                attribution={OSM_ATTRIBUTION}
            />
            <GeoCoderMarker address={[address, city, country].filter(Boolean).join(', ')} />
        </MapContainer>
    )
}

export default Map
