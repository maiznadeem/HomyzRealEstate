import React from 'react'
import { Button } from '@mantine/core'

// Back on the left, the primary action on the right; stacked with the primary on top on phones.
const StepActions = ({ onBack, nextLabel = "Next", nextType = "button", onNext, nextDisabled = false, extra = null }) => (
    <div className="apm-actions">
        {onBack && <Button variant="default" onClick={onBack}>Back</Button>}
        {extra}
        <Button
            className="apm-next"
            type={nextType}
            onClick={onNext}
            disabled={nextDisabled}
        >
            {nextLabel}
        </Button>
    </div>
)

export default StepActions
