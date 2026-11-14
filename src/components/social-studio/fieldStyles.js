// The look of Social Cards Studio's text fields, with their focus and blur handlers.
export const inputStyle = {
  width: '100%',
  height: '42px',
  fontSize: '0.88rem',
  fontWeight: 500,
  background: '#16181f',
  borderRadius: '9999px',
  border: '1px solid rgba(255, 255, 255, 0.14)',
  padding: '0 16px',
  color: '#ffffff',
  outline: 'none',
  boxShadow: '0 3px 10px rgba(0, 0, 0, 0.35)',
  transition: 'all 0.22s cubic-bezier(0.16, 1, 0.3, 1)',
  fontFamily: 'inherit',
  boxSizing: 'border-box'
};

export const textareaStyle = {
  ...inputStyle,
  height: 'auto',
  minHeight: '72px',
  borderRadius: '18px',
  padding: '12px 16px',
  lineHeight: 1.45,
  resize: 'vertical'
};

export const inputFocusHandler = (e) => {
  e.target.style.borderColor = '#ff5e36';
  e.target.style.background = '#1a1c24';
  e.target.style.boxShadow = '0 0 0 3px rgba(255, 94, 54, 0.22), 0 4px 14px rgba(0, 0, 0, 0.35)';
};
export const inputBlurHandler = (e) => {
  e.target.style.borderColor = 'rgba(255, 255, 255, 0.14)';
  e.target.style.background = '#16181f';
  e.target.style.boxShadow = '0 3px 10px rgba(0, 0, 0, 0.35)';
};
