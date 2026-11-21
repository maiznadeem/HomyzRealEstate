import React from "react"
import { Link } from "react-router-dom"

import "./EmptyState.css"

// A message for a page or section with nothing to show, plus the one thing to do next.
const EmptyState = ({ icon, title, children, action }) => (
    <div className="empty-state" role="status">
        {icon && <div className="empty-state-icon" aria-hidden="true">{icon}</div>}
        <h2 className="empty-state-title">{title}</h2>
        {children && <p className="empty-state-text">{children}</p>}
        {action?.to && <Link className="button" to={action.to}>{action.label}</Link>}
        {action?.onClick && <button type="button" className="button" onClick={action.onClick}>{action.label}</button>}
    </div>
)

export default EmptyState
