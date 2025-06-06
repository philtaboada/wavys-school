'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Table from "@/components/Table";
import TableSearch from "@/components/TableSearch";
import Pagination from "@/components/Pagination";
import FormContainerTQ from "@/components/FormContainerTQ";
import { useSubjectList } from '@/utils/queries/subjectQueries';
import { useUser } from '@/utils/hooks/useUser';
import { ArrowDownNarrowWide, ListFilterPlus } from 'lucide-react';
import { Subject } from '@/utils/types/subject';
import Loading from '../loading';
import { useTeacherList } from '@/utils/queries/teacherQueries';

interface SubjectClientTQProps {
  initialRole?: string;
  initialUserId?: string;
}

export default function SubjectClientTQ({ initialRole, initialUserId }: SubjectClientTQProps) {
  const searchParams = useSearchParams();
  const router = useRouter();

  // Estado local para la búsqueda
  const [searchValue, setSearchValue] = useState(searchParams.get('search') || '');
  // Estado para controlar si los datos se han inicializado
  const [isInitialized, setIsInitialized] = useState(false);
  // Estado para controlar si ha ocurrido un timeout
  const [hasTimedOut, setHasTimedOut] = useState(false);
  // Estado para contar intentos de refetch
  const [refetchAttempts, setRefetchAttempts] = useState(0);
  // Datos de fallback para usar cuando hay timeout
  const fallbackData = {
    data: [
      {
        id: 1,
        name: "Matemáticas",
        teachers: [{ name: "Profesor", surname: "Demo" }]
      },
      {
        id: 2,
        name: "Ciencias",
        teachers: [{ name: "Profesora", surname: "Ejemplo" }]
      }
    ],
    count: 2
  };

  // Obtener datos del usuario desde el caché
  const { user } = useUser(initialRole, initialUserId);
  const userRole = user?.user_metadata?.role || initialRole;
  const userId = user?.id || initialUserId;

  // Logs para depuración
  useEffect(() => {
    console.log("SubjectClientTQ - Montado");
    console.log("User data:", { user, userRole, userId, initialRole, initialUserId });
    return () => {
      console.log("SubjectClientTQ - Desmontado");
    };
  }, [user, userRole, userId, initialRole, initialUserId]);

  // Obtener valores de los parámetros de la URL
  const pageNum = searchParams.get('page') ? parseInt(searchParams.get('page') as string, 10) : 1;
  const teacherId = searchParams.get('teacherId') || undefined;
  
  // Usar el hook de TanStack Query para obtener los datos
  const { data, isLoading, error, refetch } = useSubjectList({
    page: pageNum,
    search: searchValue || undefined,
    teacherId,
    userRole,
    userId
  });

  // Añadir este hook para cargar los profesores
  const { data: teachersData, isLoading: teachersLoading } = useTeacherList({
    page: 1,
    search: ''
  });

  const handleCreateSubject = () => {
    console.log('handleCreateSubject - Datos de profesores disponibles:', teachersData?.data || []);

    return (
      <FormContainerTQ
        table="subject"
        type="create"
        extraProps={{
          relatedData: {
            teachers: teachersData?.data || []
          }
        }}
      />
    );
  };

  // Función para intentar cargar los datos nuevamente sin recargar la página
  const handleRefetch = async () => {
    console.log("Intentando refetch de datos...");
    setHasTimedOut(false);
    setIsInitialized(false);
    setRefetchAttempts(prev => prev + 1);
    try {
      await refetch();
    } catch (err) {
      console.error("Error en refetch:", err);
    }
  };

  // Aplicar un timeout para evitar espera infinita
  useEffect(() => {
    if (isLoading && !isInitialized && !hasTimedOut) {
      const timeoutId = setTimeout(() => {
        console.log("Timeout alcanzado para la carga de datos");
        setHasTimedOut(true);
        setIsInitialized(true);
      }, 5000); // 5 segundos de timeout

      return () => clearTimeout(timeoutId);
    }
  }, [isLoading, isInitialized, hasTimedOut]);

  // Intentar refetch automático una vez si hay timeout
  useEffect(() => {
    if (hasTimedOut && refetchAttempts === 0) {
      console.log("Intentando refetch automático después del timeout");
      handleRefetch();
    }
  }, [hasTimedOut, refetchAttempts]);

  // Marcar como inicializado cuando los datos estén listos
  useEffect(() => {
    if (data || error) {
      console.log("Datos recibidos:", { data, error, isLoading });
      setIsInitialized(true);
    }
  }, [data, error, isLoading]);

  // Definir las columnas de la tabla
  const columns = [
    {
      header: "Asignatura",
      accessor: "name",
    },
    {
      header: "Profesores",
      accessor: "teachers",
      className: "hidden md:table-cell",
    },
    ...(userRole === "admin"
      ? [
        {
          header: "Acciones",
          accessor: "action",
        },
      ]
      : []),
  ];

  // Función para renderizar cada fila
  const renderRow = (item: Subject) => {
    return (
      <tr
        key={item.id}
        className="border-b border-gray-200 even:bg-slate-50 text-sm hover:bg-lamaPurpleLight"
      >
        <td className="flex items-center gap-4 p-4">{item.name}</td>
        <td className="hidden md:table-cell">
          {item.teachers && item.teachers.length > 0 
            ? item.teachers.map(teacher => `${teacher.name} ${teacher.surname}`).join(", ")
            : "Sin profesores asignados"}
        </td>
        {userRole === "admin" && (
          <td>
            <div className="flex items-center gap-2">
              <FormContainerTQ table="subject" type="update" data={item as any} />
              <FormContainerTQ table="subject" type="delete" id={Number(item.id)} />
            </div>
          </td>
        )}
      </tr>
    );
  };

  // Manejar el cambio en la búsqueda
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchValue(e.target.value);
  };

  // Manejar el envío del formulario de búsqueda
  const handleSearch = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('search', searchValue);
    params.set('page', '1'); // Resetear a la primera página al buscar
    router.push(`?${params.toString()}`);
  };

  // Mostrar mensaje de error si ocurre
  if (error) {
    console.error("Error en SubjectClientTQ:", error);
    return (
      <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0">
        <h1 className="text-lg font-semibold mb-4">Error en Lista de Asignaturas</h1>
        <p>Se produjo un error al obtener los datos</p>
        <pre className="bg-red-50 p-2 mt-2 rounded text-xs overflow-auto">
          {error.message}
        </pre>
      </div>
    );
  }

  // Mostrar mensaje si ha ocurrido un timeout
  if (hasTimedOut) {
    return (
      <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0">
        <h1 className="text-lg font-semibold mb-4">Problemas de conexión</h1>
        <div className="bg-yellow-50 p-3 rounded border border-yellow-200 mb-4">
          <p className="text-yellow-800">
            Estamos experimentando problemas para cargar los datos completos. 
            Se muestran datos de demostración temporalmente.
          </p>
          <div className="mt-2 flex gap-2">
            <button 
              onClick={handleRefetch} 
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
            >
              Actualizar datos
            </button>
            <button 
              onClick={() => window.location.reload()} 
              className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 text-sm"
            >
              Recargar página
            </button>
          </div>
        </div>
        
        <div className="mt-4">
          <h2 className="text-lg font-medium mb-2">Asignaturas (datos de demostración)</h2>
          <Table 
            columns={columns} 
            renderRow={renderRow} 
            data={fallbackData.data} 
          />
        </div>
      </div>
    );
  }

  // Mostrar mensaje específico para roles no-admin sin asignaturas
  if (isInitialized && (userRole === "student" || userRole === "parent" || userRole === "teacher") && !isLoading && (!data?.data || data.data.length === 0)) {
    let message = "No tienes asignaturas disponibles.";
    if (userRole === "student") {
      message = "No tienes asignaturas asignadas a tu clase.";
    } else if (userRole === "parent") {
      message = "Tus hijos no tienen asignaturas asignadas.";
    } else if (userRole === "teacher") {
      message = "No tienes asignaturas asignadas.";
    }
    
    return (
      <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0">
        <h1 className="text-lg font-semibold mb-4">Asignaturas</h1>
        <p>{message}</p>
      </div>
    );
  }

  return (
    <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0">
      {/* TOP */}
      <div className="flex items-center justify-between">
        <h1 className="hidden md:block text-lg font-semibold">
          Todas las asignaturas
        </h1>
        <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
          <TableSearch
            value={searchValue}
            onChange={handleSearchChange}
            onSearch={handleSearch}
          />
          <div className="flex items-center gap-4 self-end">
            <button 
              onClick={handleRefetch}
              className="w-8 h-8 flex items-center justify-center rounded-full bg-blue-500 hover:bg-blue-600 text-white transition-all cursor-pointer" 
              title="Actualizar datos"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 2v6h-6"></path>
                <path d="M3 12a9 9 0 0 1 15-6.7L21 8"></path>
                <path d="M3 22v-6h6"></path>
                <path d="M21 12a9 9 0 0 1-15 6.7L3 16"></path>
              </svg>
            </button>
            <button className="w-8 h-8 flex items-center justify-center rounded-full bg-lamaYellow hover:bg-lamaYellowLight transition-all cursor-pointer">
              <ListFilterPlus className="w-4 h-4" />
            </button>
            {userRole === "admin" && (
              <FormContainerTQ table="subject" type="create" />
            )}
          </div>
        </div>
      </div>

      {/* ESTADO DE CARGA */}
      {isLoading && !hasTimedOut ? (
        <div className="py-8 text-center">
          <p>Cargando asignaturas...</p>
          <Loading />
          <p className="text-sm text-gray-500 mt-2">
            Si la carga tarda demasiado, la página se recargará automáticamente en unos segundos.
          </p>
        </div>
      ) : !data?.data || data.data.length === 0 ? (
        <div className="py-4 text-center">
          <p>No se encontraron asignaturas.</p>
        </div>
      ) : (
        <>
          <div className="py-2 text-sm text-green-600">
            Se encontraron {data.count} asignaturas
          </div>
          <Table columns={columns} renderRow={renderRow} data={data.data} />
        </>
      )}

      {/* PAGINATION */}
      {data && data.count > 0 && (
        <Pagination page={pageNum} count={data?.count ?? 0} />
      )}

      {/* Panel de depuración */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mt-4 border-t pt-2 text-xs">
          <details>
            <summary className="cursor-pointer text-gray-500">Debug info</summary>
            <div className="mt-2 bg-gray-100 p-2 rounded">
              <p><strong>User Role:</strong> {userRole || 'No disponible'}</p>
              <p><strong>User ID:</strong> {userId || 'No disponible'}</p>
              <p><strong>Initial Role:</strong> {initialRole || 'No disponible'}</p>
              <p><strong>Initial User ID:</strong> {initialUserId || 'No disponible'}</p>
              <p><strong>Page:</strong> {pageNum}</p>
              <p><strong>Search:</strong> {searchValue || 'No disponible'}</p>
              <p><strong>Teacher ID:</strong> {teacherId || 'No disponible'}</p>
              <p><strong>Subjects count:</strong> {data?.count || 0}</p>
              <p><strong>Is Loading:</strong> {isLoading ? 'Sí' : 'No'}</p>
              <p><strong>Is Initialized:</strong> {isInitialized ? 'Sí' : 'No'}</p>
              <p><strong>Has Timed Out:</strong> {hasTimedOut ? 'Sí' : 'No'}</p>
              <p><strong>Refetch Attempts:</strong> {refetchAttempts}</p>
            </div>
          </details>
        </div>
      )}
    </div>
  );
} 