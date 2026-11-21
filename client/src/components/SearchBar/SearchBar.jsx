import React from 'react'
import { HiLocationMarker } from 'react-icons/hi'

import './SearchBar.css'

// Search form used on the home page (submits to Properties) and on listing pages (filters as you type).
const SearchBar = ({ value, onChange, onSubmit, className = '' }) => (
    <form
        className={`search-bar ${className}`}
        role="search"
        onSubmit={(e) => {
            e.preventDefault()
            onSubmit?.(value.trim())
        }}
    >
        <HiLocationMarker size={22} color="var(--blue)" aria-hidden="true" />
        <input
            type="search"
            aria-label="Search properties by title, city or country"
            placeholder="Search by title, city or country"
            value={value}
            onChange={(e) => onChange(e.target.value)}
        />
        <button className="button" type="submit">Search</button>
    </form>
)

export default SearchBar
