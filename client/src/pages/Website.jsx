import React from 'react'

import useDocumentTitle from "../hooks/useDocumentTitle"

import Hero from "../components/Hero/Hero"
import Residencies from "../components/Residencies/Residencies"
import Value from "../components/Value/Value"
import Contact from "../components/Contact/Contact"
import GetStarted from "../components/GetStarted/GetStarted"

const Website = () => {
    useDocumentTitle(null)
    return (
        <div className="App">
            <div>
                <div className="white-gradient" />
                <Hero />
            </div>
            <Residencies />
            <Value />
            <Contact />
            <GetStarted />
        </div>   
    )
}

export default Website