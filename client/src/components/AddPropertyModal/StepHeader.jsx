import React from 'react'

const StepHeader = ({ title, help }) => (
    <div className="apm-head">
        <h3 className="apm-heading">{title}</h3>
        <p className="apm-help">{help}</p>
    </div>
)

export default StepHeader
