import { useRef, useState } from 'react';

// Editing text in place: tapping a text clip focuses a hidden, always-mounted textarea right away
// (phones only open the keyboard for a focus inside the tap), and typing updates the clip.
// Returns the clip being edited (or null), startEditing(item), and the textarea's props.
export function useTextEditing(updateItem) {
  const inputRef = useRef(null);
  const [editingId, setEditingId] = useState(null);

  const startEditing = (item) => {
    setEditingId(item.id);
    if (inputRef.current) {
      inputRef.current.value = item.text !== undefined ? item.text : 'Sample Text';
      inputRef.current.focus();
    }
  };

  const inputProps = {
    ref: inputRef,
    onChange: (e) => {
      if (editingId) updateItem(editingId, { text: e.target.value });
    },
    onBlur: (e) => {
      if (editingId) {
        updateItem(editingId, { text: e.target.value });
        setEditingId(null);
      }
    },
  };

  return { editingId, startEditing, inputProps };
}
