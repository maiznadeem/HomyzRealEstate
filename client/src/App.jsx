import { Suspense, lazy, useState } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router'
import { QueryClient, QueryClientProvider } from 'react-query'
import { ReactQueryDevtools } from 'react-query/devtools'
import { Loader } from '@mantine/core'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'

import Layout from './components/Layout/Layout'
import ErrorBoundary from './components/ErrorBoundary/ErrorBoundary'
import Website from "./pages/Website"
import Properties from './pages/Properties/Properties'
import NotFound from './pages/NotFound/NotFound'
import UserDetailsContext from './context/UserDetailsContext'

import './App.css'

// These pages load on demand, which keeps Leaflet (the map) out of the first download.
const Property = lazy(() => import('./pages/Property/Property'))
const Bookings = lazy(() => import('./pages/Bookings/Bookings'))
const Favourites = lazy(() => import('./pages/Favourites/Favourites'))

// Created once: re-creating it would throw away the cache on every render.
const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 60 * 1000,
            retry: 1,
            refetchOnWindowFocus: false,
        },
    },
})

const PageFallback = () => (
    <div role="status" aria-label="Loading" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '40vh', padding: '4rem 1rem' }}>
        <Loader color="#4066FF" size="lg" />
    </div>
)

function App() {

    const [ userDetails, setUserDetails ] = useState({
        favourites: [],
        bookings: [],
        registered: false
    })

    return (
        <UserDetailsContext.Provider value={{ userDetails, setUserDetails }}>
            <QueryClientProvider client={queryClient}>
                <ErrorBoundary>
                    <BrowserRouter>
                        <Routes>
                            <Route element={<Layout />}>
                                <Route path="/" element={<Website />} />
                                <Route path='/properties' >
                                    <Route index element={<Properties />} />
                                    <Route path=":propertyID" element={<Suspense fallback={<PageFallback />}><Property /></Suspense>} />
                                </Route>
                                <Route path="/bookings" element={<Suspense fallback={<PageFallback />}><Bookings /></Suspense>} />
                                <Route path="/favourites" element={<Suspense fallback={<PageFallback />}><Favourites /></Suspense>} />
                                <Route path="*" element={<NotFound />} />
                            </Route>
                        </Routes>
                    </BrowserRouter>
                </ErrorBoundary>
                <ToastContainer />
                {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
            </QueryClientProvider>
        </UserDetailsContext.Provider>
    )
}

export default App
