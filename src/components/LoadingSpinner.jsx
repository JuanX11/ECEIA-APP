function LoadingSpinner() {
  return (
    <div className="flex flex-col items-center justify-center h-screen w-screen bg-white gap-2">
      <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
    <div>Cargando...</div>
    </div>
  );
}
export default LoadingSpinner;