import StudentCard from './StudentCard';

export default function AttendanceList({ students }) {
  if (students.length === 0) {
    return <p className="text-gray-500 mt-4">No hay asistencia aún</p>;
  }

  return (
    <ul className="mt-4 border rounded">
      {students.map((s, i) => (
        <StudentCard key={i} student={s} />
      ))}
    </ul>
  );
}
