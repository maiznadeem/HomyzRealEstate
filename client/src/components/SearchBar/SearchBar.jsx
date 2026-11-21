import React from 'react'
import { HiLocationMarker, HiSearch } from 'react-icons/hi'
import { useMediaQuery } from '@mantine/hooks'

import './SearchBar.css'

// Search form used on the home page (submits to Properties) and on listing pages (filters as you type).
// On phones the pin is hidden and the button shows only an icon, so the placeholder has room.
const SearchBar = ({ value, onChange, onSubmit, className = '' }) => {
    const tiny = useMediaQuery('(max-width: 369px)')
    return (
        <form
            className={`search-bar ${className}`}
            role="search"
            onSubmit={(e) => {
                e.preventDefault()
                onSubmit?.(value.trim())
            }}
        >
            <HiLocationMarker className="search-bar-pin" size={22} color="var(--blue)" aria-hidden="true" />
            <input
                type="search"
                aria-label="Search properties by title, city or country"
                placeholder={tiny ? 'City, country or title' : 'Search by title, city or country'}
                value={value}
                onChange={(e) => onChange(e.target.value)}
            />
            <button className="button" type="submit">
                <HiSearch className="search-bar-icon" size={20} aria-hidden="true" />
                <span className="search-bar-label">Search</span>
            </button>
        </form>
    )
}

export default SearchBar
