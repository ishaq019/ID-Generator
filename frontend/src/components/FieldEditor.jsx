function FieldEditor({ fields, setFields }) {
  const updateField = (index, key, value) => {
    const updatedFields = [...fields];
    updatedFields[index] = {
      ...updatedFields[index],
      [key]: value
    };
    setFields(updatedFields);
  };

  const removeField = index => {
    setFields(fields.filter((_, fieldIndex) => fieldIndex !== index));
  };

  return (
    <div className="field-editor">
      {fields.length === 0 && <div className="empty-box">No fields added yet. Add fields to build your card.</div>}

      {fields.map((field, index) => (
        <div className="field-card" key={index}>
          <div className="grid-4">
            <label>
              Label
              <input
                value={field.label}
                onChange={event => updateField(index, "label", event.target.value)}
                placeholder="Field Label"
              />
            </label>

            <label>
              Unique Key
              <input
                value={field.key}
                onChange={event => updateField(index, "key", event.target.value.trim().replace(/\s+/g, ""))}
                placeholder="name"
              />
            </label>

            <label>
              Type
              <select value={field.type} onChange={event => updateField(index, "type", event.target.value)}>
                <option value="text">Text</option>
                <option value="number">Number</option>
                <option value="date">Date</option>
                <option value="email">Email</option>
                <option value="phone">Phone</option>
                <option value="textarea">Textarea</option>
                <option value="image">Image</option>
                <option value="qr">QR</option>
              </select>
            </label>

            <label>
              Side
              <select value={field.side} onChange={event => updateField(index, "side", event.target.value)}>
                <option value="front">Front</option>
                <option value="back">Back</option>
              </select>
            </label>
          </div>

          <div className="grid-4">
            <label>
              X
              <input type="number" value={field.x} onChange={event => updateField(index, "x", Number(event.target.value))} />
            </label>
            <label>
              Y
              <input type="number" value={field.y} onChange={event => updateField(index, "y", Number(event.target.value))} />
            </label>
            <label>
              Width
              <input type="number" value={field.width} onChange={event => updateField(index, "width", Number(event.target.value))} />
            </label>
            <label>
              Height
              <input type="number" value={field.height} onChange={event => updateField(index, "height", Number(event.target.value))} />
            </label>
          </div>

          <div className="grid-4">
            <label>
              Font Size
              <input type="number" value={field.fontSize} onChange={event => updateField(index, "fontSize", Number(event.target.value))} />
            </label>

            <label>
              Font Color
              <input type="color" value={field.fontColor} onChange={event => updateField(index, "fontColor", event.target.value)} />
            </label>

            <label>
              Align
              <select value={field.align} onChange={event => updateField(index, "align", event.target.value)}>
                <option value="left">Left</option>
                <option value="center">Center</option>
                <option value="right">Right</option>
              </select>
            </label>

            <label>
              Image Shape
              <select value={field.imageShape} onChange={event => updateField(index, "imageShape", event.target.value)}>
                <option value="square">Square</option>
                <option value="rounded">Rounded</option>
                <option value="circle">Circle</option>
              </select>
            </label>
          </div>

          <label>
            Default Value
            <input
              value={field.defaultValue}
              onChange={event => updateField(index, "defaultValue", event.target.value)}
              placeholder="Optional default value"
            />
          </label>

          <div className="check-row">
            <label><input type="checkbox" checked={field.required} onChange={event => updateField(index, "required", event.target.checked)} /> Required</label>
            <label><input type="checkbox" checked={field.bold} onChange={event => updateField(index, "bold", event.target.checked)} /> Bold</label>
            <label><input type="checkbox" checked={field.italic} onChange={event => updateField(index, "italic", event.target.checked)} /> Italic</label>
            <label><input type="checkbox" checked={field.underline} onChange={event => updateField(index, "underline", event.target.checked)} /> Underline</label>
            <label><input type="checkbox" checked={field.show} onChange={event => updateField(index, "show", event.target.checked)} /> Show</label>

            <button type="button" className="btn danger small" onClick={() => removeField(index)}>Remove</button>
          </div>
        </div>
      ))}
    </div>
  );
}

export default FieldEditor;
