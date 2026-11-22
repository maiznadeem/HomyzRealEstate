import React from 'react'

// Last line of defence: if a page crashes (or a page file can't be fetched after a new
// deploy), show a way out instead of a blank screen.
class ErrorBoundary extends React.Component {

    constructor(props) {
        super(props)
        this.state = { failed: false }
    }

    static getDerivedStateFromError() {
        return { failed: true }
    }

    componentDidCatch(error, info) {
        console.error('Homyz crashed:', error, info?.componentStack)
    }

    render() {
        if (!this.state.failed) return this.props.children
        return (
            <div role="alert" style={{ maxWidth: '32rem', margin: '6rem auto', padding: '0 1rem', textAlign: 'center' }}>
                <h1 className="primaryText" style={{ fontSize: '1.75rem' }}>Something went wrong</h1>
                <p className="secondaryText" style={{ margin: '1rem 0 1.5rem' }}>
                    Reload the page to try again. If you just opened Homyz in an old tab, a reload loads the latest version.
                </p>
                <button type="button" className="button" onClick={() => window.location.reload()}>Reload page</button>
            </div>
        )
    }
}

export default ErrorBoundary
