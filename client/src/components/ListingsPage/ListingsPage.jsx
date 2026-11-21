import React, { useContext, useMemo } from 'react'
import { useAuth0 } from '@auth0/auth0-react'
import { useSearchParams } from 'react-router-dom'
import { PuffLoader } from 'react-spinners'
import { MdOutlineSearchOff, MdOutlineErrorOutline, MdLockOutline } from 'react-icons/md'

import SearchBar from '../SearchBar/SearchBar'
import PropertyCard from '../PropertyCard/PropertyCard'
import EmptyState from '../EmptyState/EmptyState'
import useProperties from '../../hooks/useProperties'
import useLogin from '../../hooks/useLogin'
import useDocumentTitle from '../../hooks/useDocumentTitle'
import UserDetailsContext from '../../context/UserDetailsContext'
import { plural } from '../../utils/format'

import './ListingsPage.css'

const matches = (property, query) => {
    const q = query.trim().toLowerCase()
    if (!q) return true
    return [property.title, property.city, property.country].some((field) => field?.toLowerCase().includes(q))
}

export const Loading = () => (
    <div className="listings-loading" role="status" aria-label="Loading">
        <PuffLoader color="#4066FF" size={70} />
    </div>
)

/**
 * Properties, Favourites and Bookings share this page.
 * - selectIds: limits the list to these property IDs (from the signed-in user's data); omit for all properties.
 * - account: { loadedKey, loginTitle, loginText } for pages that need a login.
 * - countNoun: [singular, plural] for the count above the grid.
 */
const ListingsPage = ({ title, intro, account, selectIds, noteFor, empty, countNoun = ['property', 'properties'] }) => {
    useDocumentTitle(title)
    const { data, isError, isLoading, refetch } = useProperties()
    const { isAuthenticated, isLoading: authLoading } = useAuth0()
    const login = useLogin()
    const { userDetails } = useContext(UserDetailsContext)
    const [searchParams, setSearchParams] = useSearchParams()
    const query = searchParams.get('search') ?? ''
    const setQuery = (value) => setSearchParams(value ? { search: value } : {}, { replace: true })

    const ids = selectIds?.(userDetails)
    const listings = useMemo(
        () => (data ?? []).filter((p) => !ids || ids.includes(p.id)),
        [data, ids],
    )
    const shown = listings.filter((p) => matches(p, query))

    const header = (
        <header className="listings-header">
            <div>
                <h1 className="listings-title">{title}</h1>
                <p className="listings-intro">{intro}</p>
            </div>
            {listings.length > 0 && (
                <SearchBar className="listings-search" value={query} onChange={setQuery} onSubmit={setQuery} />
            )}
        </header>
    )

    let body
    if (account && (authLoading || (isAuthenticated && !userDetails[account.loadedKey]))) {
        body = <Loading />
    } else if (account && !isAuthenticated) {
        body = (
            <EmptyState icon={<MdLockOutline />} title={account.loginTitle} action={{ label: 'Log in', onClick: login }}>
                {account.loginText}
            </EmptyState>
        )
    } else if (isLoading) {
        body = <Loading />
    } else if (isError) {
        body = (
            <EmptyState icon={<MdOutlineErrorOutline />} title="Properties couldn't be loaded" action={{ label: 'Try again', onClick: () => refetch() }}>
                Check your connection and try again.
            </EmptyState>
        )
    } else if (listings.length === 0) {
        body = <EmptyState icon={empty.icon} title={empty.title} action={empty.action}>{empty.text}</EmptyState>
    } else if (shown.length === 0) {
        body = (
            <EmptyState icon={<MdOutlineSearchOff />} title={`No properties match "${query}"`} action={{ label: 'Clear search', onClick: () => setQuery('') }}>
                Try a different title, city or country.
            </EmptyState>
        )
    } else {
        body = (
            <>
                <p className="listings-count" aria-live="polite">
                    {query ? `${plural(shown.length, 'result')} for "${query}"` : plural(shown.length, ...countNoun)}
                </p>
                <div className="listings-grid">
                    {shown.map((card) => <PropertyCard card={card} key={card.id} note={noteFor?.(card, userDetails)} />)}
                </div>
            </>
        )
    }

    return (
        <div className="wrapper">
            <div className="paddings innerWidth listings">
                {header}
                {body}
            </div>
        </div>
    )
}

export default ListingsPage
