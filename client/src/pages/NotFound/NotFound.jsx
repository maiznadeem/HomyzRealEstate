import React from 'react'
import { MdOutlineExplore } from 'react-icons/md'

import EmptyState from '../../components/EmptyState/EmptyState'
import useDocumentTitle from '../../hooks/useDocumentTitle'

const NotFound = () => {
    useDocumentTitle('Page not found')
    return (
        <div className="wrapper">
            <EmptyState icon={<MdOutlineExplore />} title="Page not found" action={{ label: 'Go to the home page', to: '/' }}>
                The page you’re looking for doesn’t exist or has moved.
            </EmptyState>
        </div>
    )
}

export default NotFound
