export default function AdminBooksLoading() {
  return (
    <div className="min-h-screen bg-gray-100">
      <div className="dashboard">
        {/* Заголовок админки */}
        <div className="animate-pulse mb-8">
          <div className="h-10 bg-gray-300 rounded w-80 mb-4"></div>
          <div className="h-6 bg-gray-200 rounded w-96"></div>
        </div>
        
        {/* Кнопки действий */}
        <div className="flex gap-4 mb-8">
          <div className="h-12 bg-gray-200 rounded w-40 animate-pulse"></div>
          <div className="h-12 bg-gray-200 rounded w-32 animate-pulse"></div>
          <div className="h-12 bg-gray-200 rounded w-36 animate-pulse"></div>
        </div>
        
        {/* Поиск и фильтры */}
        <div className="bg-white rounded-lg border-2 border-blue-500 p-6 mb-8">
          <div className="animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-32 mb-4"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="h-12 bg-gray-200 rounded"></div>
              <div className="h-12 bg-gray-200 rounded"></div>
              <div className="h-12 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
        
        {/* Таблица книг */}
        <div className="bg-white rounded-lg border-2 border-blue-500 overflow-hidden">
          <div className="p-6">
            <div className="animate-pulse">
              {/* Заголовки таблицы */}
              <div className="grid grid-cols-6 gap-4 pb-4 border-b">
                <div className="h-4 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded"></div>
              </div>
              
              {/* Строки таблицы */}
              {Array.from({ length: 8 }).map((_, index) => (
                <div key={index} className="grid grid-cols-6 gap-4 py-4 border-b">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-16 bg-gray-200 rounded"></div>
                    <div>
                      <div className="h-4 bg-gray-200 rounded w-32 mb-2"></div>
                      <div className="h-3 bg-gray-100 rounded w-24"></div>
                    </div>
                  </div>
                  <div className="h-4 bg-gray-200 rounded w-20"></div>
                  <div className="h-4 bg-gray-200 rounded w-16"></div>
                  <div className="h-4 bg-gray-200 rounded w-12"></div>
                  <div className="h-4 bg-gray-200 rounded w-24"></div>
                  <div className="flex gap-2">
                    <div className="h-8 w-8 bg-gray-200 rounded"></div>
                    <div className="h-8 w-8 bg-gray-200 rounded"></div>
                    <div className="h-8 w-8 bg-gray-200 rounded"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        {/* Пагинация */}
        <div className="flex justify-center items-center gap-4 mt-8 animate-pulse">
          <div className="h-10 w-10 bg-gray-200 rounded"></div>
          <div className="h-10 w-10 bg-gray-200 rounded"></div>
          <div className="h-10 w-10 bg-gray-200 rounded"></div>
          <div className="h-6 w-20 bg-gray-200 rounded"></div>
          <div className="h-10 w-10 bg-gray-200 rounded"></div>
          <div className="h-10 w-10 bg-gray-200 rounded"></div>
          <div className="h-10 w-10 bg-gray-200 rounded"></div>
        </div>
      </div>
    </div>
  );
} 