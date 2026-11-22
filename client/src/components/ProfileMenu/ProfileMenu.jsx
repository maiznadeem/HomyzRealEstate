import React from 'react'
import { Avatar, Menu, UnstyledButton } from '@mantine/core'
import { Link } from 'react-router'

const ProfileMenu = ({user, logout}) => (
    <Menu position="bottom-end">
        <Menu.Target>
            <UnstyledButton className="h-avatar-button" aria-label="Account menu">
                <Avatar src={user?.picture} alt={user?.name ?? ''} radius="xl" />
            </UnstyledButton>
        </Menu.Target>
        <Menu.Dropdown>
            {(user?.name || user?.email) && (
                <Menu.Label>{user?.name ?? user?.email}</Menu.Label>
            )}
            <Menu.Item component={Link} to="/favourites">Favourites</Menu.Item>
            <Menu.Item component={Link} to="/bookings">Bookings</Menu.Item>
            <Menu.Item onClick={() => {
                logout({ logoutParams: { returnTo: window.location.origin } })
            }}>Log out</Menu.Item>
        </Menu.Dropdown>
    </Menu>
)

export default ProfileMenu
