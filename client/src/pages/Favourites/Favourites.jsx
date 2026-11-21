import React from 'react'
import { AiOutlineHeart } from 'react-icons/ai'

import ListingsPage from '../../components/ListingsPage/ListingsPage'

const Favourites = () => (
    <ListingsPage
        title="Your favourites"
        intro="Homes you've saved. Tap the heart on any listing to add or remove it."
        account={{
            loadedKey: 'favouritesLoaded',
            loginTitle: 'Log in to see your favourites',
            loginText: 'Save homes you like and find them here on any device.',
        }}
        selectIds={(user) => user.favourites ?? []}
        empty={{
            icon: <AiOutlineHeart />,
            title: 'No favourites yet',
            text: 'Tap the heart on any listing to save it here.',
            action: { label: 'Browse properties', to: '/properties' },
        }}
    />
)

export default Favourites
