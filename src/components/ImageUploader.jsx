import React from 'react'

const ImageUploader = ({ onUpload }) => {
  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (event) => {
        onUpload(event.target.result)
      }
      reader.readAsDataURL(file)
    }
  }

  return (
    <div className="empty-state glass-panel">
      <h2>Start Creating</h2>
      <p>Upload an image from your device to get started</p>
      
      <div className="file-input-wrapper">
        <button>
          <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
          </svg>
          Upload Image
        </button>
        <input type="file" accept="image/png, image/jpeg, image/webp" onChange={handleFileChange} />
      </div>
    </div>
  )
}

export default ImageUploader
