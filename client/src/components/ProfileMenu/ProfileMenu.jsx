import React from 'react'
import { Avatar, Menu } from '@mantine/core'
import { useNavigate } from 'react-router'

const ProfileMenu = ({user, logout}) => {

    const navigate = useNavigate()

    return (
        <Menu>
            <Menu.Target>
                <Avatar src={user?.picture} alt='User Image' radius={"xl"} />
            </Menu.Target>
            <Menu.Dropdown>
                <Menu.Item onClick={() => {
                    navigate("/favourites")
                }} >Favourites</Menu.Item>
                <Menu.Item onClick={() => {
                    navigate("/bookings")
                }} >Bookings</Menu.Item>
                <Menu.Item onClick={() => {
                    logout({ logoutParams: { returnTo: window.location.origin } })
                }}>Logout</Menu.Item>
            </Menu.Dropdown>
        </Menu>
    )
}

export default ProfileMenu