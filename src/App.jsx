import { useState } from 'react';
import Navbar from './components/Navbar';
import AttendanceForm from './components/AttendanceForm';
import AttendanceList from './components/AttendanceList';

function App() {
  const [students, setStudents] = useState([]);

  const handleAddStudent = (name) => {
    setStudents([...students, name]);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />
      <div className="p-4 max-w-md mx-auto">
        <h2 className="text-xl font-bold mb-2">Registro de asistencia</h2>
        <AttendanceForm onAdd={handleAddStudent} />
        <AttendanceList students={students} />
      </div>
    </div>
  );
}

export default App;
