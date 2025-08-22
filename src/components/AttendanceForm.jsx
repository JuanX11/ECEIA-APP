import { useState } from 'react';

export default function AttendanceForm({ onAdd }) {
  const [name, setName] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name) return;
    onAdd(name);
    setName('');
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 mt-4">
      <input
        type="text"
        placeholder="Nombre del estudiante"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="border p-2 rounded w-full"
      />
      <button className="bg-blue-600 text-white px-4 py-2 rounded">
        Marcar
      </button>
    </form>
  );
}
