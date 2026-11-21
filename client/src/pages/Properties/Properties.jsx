import React from 'react'
import { MdOutlineHomeWork } from 'react-icons/md'

import ListingsPage from '../../components/ListingsPage/ListingsPage'

const Properties = () => (
    <ListingsPage
        title="Properties"
        intro="Every home listed on Homyz. Search by title, city or country."
        empty={{ icon: <MdOutlineHomeWork />, title: 'No properties listed yet', text: 'New homes will appear here as soon as they are listed.' }}
    />
)

export default Properties
