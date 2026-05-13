function StepExplanation({ algorithmDescription, algorithmName, currentStep, hasStarted }) {
  const visitedNodes = currentStep?.visitedNodes ?? [];

  return (
    <section className="info-panel">
      <p className="eyebrow">{hasStarted ? 'Step explanation' : 'Algorithm overview'}</p>
      <h3>{hasStarted ? `${algorithmName} walkthrough` : `Before you start: ${algorithmName}`}</h3>
      <p className="explanation-copy">
        {hasStarted
          ? currentStep.explanation
          : algorithmDescription}
      </p>
      {!hasStarted && <p className="start-hint">Press Start to begin the step-by-step visualization.</p>}

      {hasStarted && (
        <div className="step-details">
          <p>
            <strong>Current node:</strong> {currentStep.currentNode ?? 'None'}
          </p>
          {currentStep.intermediateNode && (
            <p>
              <strong>Intermediate node:</strong> {currentStep.intermediateNode}
            </p>
          )}
          {currentStep.updatedCell && (
            <p>
              <strong>Updated cell:</strong> {currentStep.updatedCell.from}
              {' -> '}
              {currentStep.updatedCell.to}
            </p>
          )}
          <p>
            <strong>Visited nodes:</strong>{' '}
            {visitedNodes.length ? visitedNodes.join(', ') : 'None'}
          </p>
          <p>
            <strong>Current edge:</strong> {currentStep.currentEdge ?? 'None'}
          </p>
        </div>
      )}
    </section>
  );
}

export default StepExplanation;
