export default function StudentCard({ student }) {
  return (
    <li className="p-2 border-b flex justify-between">
      <span>{student}</span>
      <span className="text-green-600 font-bold">✔</span>
    </li>
  );
}
