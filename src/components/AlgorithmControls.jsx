function AlgorithmControls({
  hasStarted,
  isAutoPlaying,
  isLastStep,
  onNextStep,
  onReset,
  onStart,
  onToggleAutoPlay,
}) {
  return (
    <div className="control-group" aria-label="Algorithm controls">
      {/* Start rebuilds the step list from the currently selected algorithm. */}
      <button className="primary-button" onClick={onStart} type="button">
        Start
      </button>
      {/* Next Step is only useful after Start and before the last step. */}
      <button disabled={!hasStarted || isLastStep || isAutoPlaying} onClick={onNextStep} type="button">
        Next Step
      </button>
      {/* Auto Play advances one step every second until stopped or finished. */}
      <button disabled={!hasStarted || isLastStep} onClick={onToggleAutoPlay} type="button">
        {isAutoPlaying ? 'Stop' : 'Auto Play'}
      </button>
      {/* Reset clears the current highlights and explanation. */}
      <button disabled={!hasStarted} onClick={onReset} type="button">
        Reset
      </button>
    </div>
  );
}

export default AlgorithmControls;
