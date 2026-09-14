import React from 'react'

const Controls = ({ 
  topText, setTopText, 
  bottomText, setBottomText, 
  onDownload, onReset 
}) => {
  return (
    <div className="controls-panel glass-panel">
      <div className="control-group">
        <label>Top Text</label>
        <input 
          type="text" 
          placeholder="Enter top text..." 
          value={topText}
          onChange={(e) => setTopText(e.target.value)}
        />
      </div>
      
      <div className="control-group">
        <label>Bottom Text</label>
        <input 
          type="text" 
          placeholder="Enter bottom text..." 
          value={bottomText}
          onChange={(e) => setBottomText(e.target.value)}
        />
      </div>

      <div className="action-bar">
        <button className="btn-secondary" onClick={onReset}>
          <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
          Reset
        </button>
        <button onClick={onDownload}>
          <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Save
        </button>
      </div>
    </div>
  )
}

export default Controls
