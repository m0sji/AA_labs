const autoPlaySpeedOptions = [
  { label: 'Slow', value: 1500 },
  { label: 'Normal', value: 1000 },
  { label: 'Fast', value: 500 },
  { label: 'Very Fast', value: 250 },
];

function AlgorithmControls({
  autoPlayDelay,
  hasStarted,
  isAutoPlaying,
  isLastStep,
  onAutoPlayDelayChange,
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
      {/* Auto Play advances one step at the selected speed until stopped or finished. */}
      <button disabled={!hasStarted || isLastStep} onClick={onToggleAutoPlay} type="button">
        {isAutoPlaying ? 'Stop' : 'Auto Play'}
      </button>
      <label className="speed-control" htmlFor="auto-play-speed">
        Auto speed
        <select
          id="auto-play-speed"
          onChange={(event) => onAutoPlayDelayChange(Number(event.target.value))}
          value={autoPlayDelay}
        >
          {autoPlaySpeedOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
      {/* Reset clears the current highlights and explanation. */}
      <button disabled={!hasStarted} onClick={onReset} type="button">
        Reset
      </button>
    </div>
  );
}

export default AlgorithmControls;
