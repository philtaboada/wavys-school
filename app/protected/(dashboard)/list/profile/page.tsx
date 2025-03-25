import React from 'react';
import Image from "next/image";
import { createClient } from "@/utils/supabase/server";
import Link from "next/link";
import FormContainer from "@/components/FormContainer";

// Enum para los tipos de sexo
enum UserSex {
  MALE = "MALE",
  FEMALE = "FEMALE"
}

// Tipos para las entidades
interface Subject {
  id: number;
  name: string;
}

interface Class {
  id: number;
  name: string;
}

interface Grade {
  id: number;
  level: number;
}

interface Parent {
  id: string;
  name: string;
  surname: string;
}

interface Student {
  id: string;
  name: string;
  surname: string;
  img?: string;
}

// Icono de lápiz para edición
const EditIcon = () => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width="16" 
    height="16" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className="text-blue-600"
  >
    <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path>
  </svg>
);

// Tipo para la tabla en el FormContainer (según el componente)
type TableType = "student" | "class" | "subject" | "teacher" | "parent" | "lesson" | "exam" | "assignment" | "result" | "attendance" | "event" | "announcement";

const ProfilePage = async () => {
  // Obtener información del usuario autenticado
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return (
      <div className="p-4">
        <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-md flex items-center gap-3">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
          <span>No se encontró información de usuario. Por favor, inicia sesión nuevamente.</span>
        </div>
      </div>
    );
  }
  
  // Obtener el rol del usuario
  const role = (user?.user_metadata as { role?: string })?.role || 'student';
  
  // Variables para almacenar los datos según el rol
  let userData: any = null;
  let table: TableType | null = null;
  
  // Consultar datos según el rol
  switch(role) {
    case 'admin':
      // Para administradores, no usamos FormContainer (no es un tipo válido)
      const { data: adminData } = await supabase
        .from('Admin')
        .select('*')
        .eq('authId', user.id)
        .single();
      userData = adminData;
      break;
      
    case 'teacher':
      table = 'teacher';
      const { data: teacherData } = await supabase
        .from('Teacher')
        .select('*, classes:Class(*), subjects:Subject(*)')
        .eq('authId', user.id)
        .single();
      userData = teacherData;
      break;
      
    case 'parent':
      table = 'parent';
      const { data: parentData } = await supabase
        .from('Parent')
        .select('*, students:Student(*)')
        .eq('authId', user.id)
        .single();
      userData = parentData;
      break;
      
    case 'student':
    default:
      table = 'student';
      const { data: studentData } = await supabase
        .from('Student')
        .select('*, class:Class(*), grade:Grade(*), parent:Parent(*)')
        .eq('authId', user.id)
        .single();
      userData = studentData;
      break;
  }

  return (
    <div className="flex-1 p-4 flex flex-col gap-4">
      {/* Cabecera de la página */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-4 rounded-lg">
        <h1 className="text-xl font-semibold text-white">
          Mi Perfil
        </h1>
      </div>
      
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Tarjeta de perfil principal */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 flex-1">
          <div className="flex flex-col md:flex-row gap-6">
            {/* Foto de perfil - Solo para estudiantes y profesores */}
            {(role === 'student' || role === 'teacher') && (
              <div className="flex flex-col items-center gap-4">
                <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-purple-100">
                  <Image
                    src={userData?.img || "/noAvatar.png"}
                    alt="Foto de perfil"
                    width={128}
                    height={128}
                    className="w-full h-full object-cover"
                  />
                </div>
                
                {/* Botón para editar perfil - Solo si hay tabla válida */}
                {userData && table && (
                  <FormContainer 
                    table={table} 
                    type="update" 
                    data={userData} 
                  />
                )}
              </div>
            )}
            
            {/* Información principal */}
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-800">
                  {userData && 'name' in userData ? `${userData.name} ${userData.surname}` : (userData?.username || user.email)}
                </h2>
                
                {/* Botón para editar perfil completo */}
                {userData && table && (
                  <div className="p-2 hover:bg-gray-100 rounded-full cursor-pointer transition-colors">
                    <FormContainer 
                      table={table} 
                      type="update" 
                      data={userData} 
                    />
                  </div>
                )}
              </div>
              
              {/* Información específica según rol */}
              {role === 'student' && userData?.class && (
                <p className="text-purple-600 font-medium mt-1">
                  {userData.class.name} - Grado {userData.grade?.level || ''}
                </p>
              )}
              
              {role === 'teacher' && userData?.classes && (
                <p className="text-purple-600 font-medium mt-1">
                  Profesor - {userData.classes.length} clases asignadas
                </p>
              )}
              
              {role === 'parent' && userData?.students && (
                <p className="text-purple-600 font-medium mt-1">
                  Padre/Madre - {userData.students.length} estudiantes
                </p>
              )}
              
              <div className="mt-4 inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-50 text-blue-700">
                {role === 'admin' ? 'Administrador' : 
                 role === 'teacher' ? 'Profesor' : 
                 role === 'parent' ? 'Padre/Madre' : 'Estudiante'}
              </div>
              
              {/* Información de autenticación - Para todos */}
              <div className="mt-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-700 flex items-center gap-2 mb-4">
                    <div className="p-2 rounded-full bg-blue-100">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-500"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                    </div>
                    Información de autenticación
                  </h3>
                  
                  {/* Botón para editar información de autenticación */}
                  {userData && table && (
                    <div className="p-2 hover:bg-gray-100 rounded-full cursor-pointer transition-colors">
                      <FormContainer 
                        table={table} 
                        type="update" 
                        data={{
                          id: userData.id,
                          username: userData.username,
                          email: userData.email,
                          password: '' // Campo vacío para la contraseña
                        }} 
                      />
                    </div>
                  )}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1">
                    <span className="text-sm text-gray-500">Nombre de usuario</span>
                    <span className="text-gray-700 font-medium">{userData?.username || user.email}</span>
                  </div>
                  
                  <div className="flex flex-col gap-1">
                    <span className="text-sm text-gray-500">Correo electrónico</span>
                    <span className="text-gray-700 font-medium">{userData?.email || user.email}</span>
                  </div>
                  
                  <div className="flex flex-col gap-1">
                    <span className="text-sm text-gray-500">Contraseña</span>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-700">••••••••</span>
                      <Link 
                        href="/auth/reset-password"
                        className="text-xs text-blue-600 hover:text-blue-800 transition-colors"
                      >
                        Cambiar contraseña
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Sección de información personal para estudiantes */}
      {role === 'student' && userData && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-700 flex items-center gap-2 mb-4">
              <div className="p-2 rounded-full bg-green-100">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-500"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
              </div>
              Información personal
            </h3>
            
            {/* Botón para editar información personal */}
            <div className="p-2 hover:bg-gray-100 rounded-full cursor-pointer transition-colors">
              <FormContainer 
                table="student" 
                type="update" 
                data={{
                  id: userData.id,
                  phone: userData.phone,
                  address: userData.address,
                  bloodType: userData.bloodType,
                  sex: userData.sex,
                  birthday: userData.birthday,
                }} 
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="flex flex-col gap-1">
              <span className="text-sm text-gray-500">Teléfono</span>
              <span className="text-gray-700 font-medium">{userData.phone || "No disponible"}</span>
            </div>
            
            <div className="flex flex-col gap-1">
              <span className="text-sm text-gray-500">Dirección</span>
              <span className="text-gray-700 font-medium">{userData.address}</span>
            </div>
            
            <div className="flex flex-col gap-1">
              <span className="text-sm text-gray-500">Fecha de nacimiento</span>
              <span className="text-gray-700 font-medium">
                {new Date(userData.birthday).toLocaleDateString()}
              </span>
            </div>
            
            <div className="flex flex-col gap-1">
              <span className="text-sm text-gray-500">Tipo de sangre</span>
              <span className="text-gray-700 font-medium">{userData.bloodType}</span>
            </div>
            
            <div className="flex flex-col gap-1">
              <span className="text-sm text-gray-500">Sexo</span>
              <span className="text-gray-700 font-medium">
                {userData.sex === UserSex.MALE ? "Masculino" : "Femenino"}
              </span>
            </div>
            
            <div className="flex flex-col gap-1">
              <span className="text-sm text-gray-500">Padre/Madre</span>
              <span className="text-gray-700 font-medium">
                {userData.parent ? `${userData.parent.name} ${userData.parent.surname}` : "No disponible"}
              </span>
            </div>
          </div>
        </div>
      )}
      
      {/* Sección de información personal para profesores */}
      {role === 'teacher' && userData && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-700 flex items-center gap-2 mb-4">
              <div className="p-2 rounded-full bg-green-100">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-500"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
              </div>
              Información personal
            </h3>
            
            {/* Botón para editar información personal del profesor */}
            <div className="p-2 hover:bg-gray-100 rounded-full cursor-pointer transition-colors">
              <FormContainer 
                table="teacher" 
                type="update" 
                data={{
                  id: userData.id,
                  phone: userData.phone,
                  address: userData.address,
                  bloodType: userData.bloodType,
                  sex: userData.sex,
                  birthday: userData.birthday,
                  description: userData.description
                }} 
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="flex flex-col gap-1">
              <span className="text-sm text-gray-500">Teléfono</span>
              <span className="text-gray-700 font-medium">{userData.phone || "No disponible"}</span>
            </div>
            
            <div className="flex flex-col gap-1">
              <span className="text-sm text-gray-500">Dirección</span>
              <span className="text-gray-700 font-medium">{userData.address}</span>
            </div>
            
            <div className="flex flex-col gap-1">
              <span className="text-sm text-gray-500">Fecha de nacimiento</span>
              <span className="text-gray-700 font-medium">
                {new Date(userData.birthday).toLocaleDateString()}
              </span>
            </div>
            
            <div className="flex flex-col gap-1">
              <span className="text-sm text-gray-500">Tipo de sangre</span>
              <span className="text-gray-700 font-medium">{userData.bloodType}</span>
            </div>
            
            <div className="flex flex-col gap-1">
              <span className="text-sm text-gray-500">Sexo</span>
              <span className="text-gray-700 font-medium">
                {userData.sex === UserSex.MALE ? "Masculino" : "Femenino"}
              </span>
            </div>
            
            <div className="flex flex-col gap-1">
              <span className="text-sm text-gray-500">Descripción</span>
              <span className="text-gray-700 font-medium">{userData.description || "No disponible"}</span>
            </div>
          </div>
          
          {userData.subjects && userData.subjects.length > 0 && (
            <div className="mt-6">
              <div className="flex items-center justify-between">
                <h4 className="text-md font-semibold text-gray-700 mb-3">Asignaturas</h4>
                
                {/* Botón para editar asignaturas */}
                <div className="p-2 hover:bg-gray-100 rounded-full cursor-pointer transition-colors">
                  <FormContainer 
                    table="teacher" 
                    type="update" 
                    data={{
                      id: userData.id,
                      subjects: userData.subjects
                    }} 
                  />
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {userData.subjects.map((subject: Subject) => (
                  <span key={subject.id} className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm">
                    {subject.name}
                  </span>
                ))}
              </div>
            </div>
          )}
          
          {userData.classes && userData.classes.length > 0 && (
            <div className="mt-6">
              <div className="flex items-center justify-between">
                <h4 className="text-md font-semibold text-gray-700 mb-3">Clases</h4>
                
                {/* Botón para editar clases */}
                <div className="p-2 hover:bg-gray-100 rounded-full cursor-pointer transition-colors">
                  <FormContainer 
                    table="teacher" 
                    type="update" 
                    data={{
                      id: userData.id,
                      classes: userData.classes
                    }} 
                  />
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {userData.classes.map((classItem: Class) => (
                  <span key={classItem.id} className="px-3 py-1 bg-purple-50 text-purple-700 rounded-full text-sm">
                    {classItem.name}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
      
      {/* Sección de información personal para padres */}
      {role === 'parent' && userData && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-700 flex items-center gap-2 mb-4">
              <div className="p-2 rounded-full bg-green-100">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-500"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
              </div>
              Información personal
            </h3>
            
            {/* Botón para editar información personal del padre/madre */}
            <div className="p-2 hover:bg-gray-100 rounded-full cursor-pointer transition-colors">
              <FormContainer 
                table="parent" 
                type="update" 
                data={{
                  id: userData.id,
                  phone: userData.phone,
                  address: userData.address
                }} 
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="flex flex-col gap-1">
              <span className="text-sm text-gray-500">Teléfono</span>
              <span className="text-gray-700 font-medium">{userData.phone || "No disponible"}</span>
            </div>
            
            <div className="flex flex-col gap-1">
              <span className="text-sm text-gray-500">Dirección</span>
              <span className="text-gray-700 font-medium">{userData.address}</span>
            </div>
          </div>
          
          {userData.students && userData.students.length > 0 && (
            <div className="mt-6">
              <div className="flex items-center justify-between">
                <h4 className="text-md font-semibold text-gray-700 mb-3">Mis estudiantes</h4>
                
                {/* El listado de estudiantes no es editable directamente desde aquí */}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {userData.students.map((student: Student) => (
                  <div key={student.id} className="flex items-center gap-3 p-3 rounded-lg border border-gray-100 hover:bg-gray-50">
                    <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-100">
                      <Image
                        src={student.img || "/noAvatar.png"}
                        alt={student.name}
                        width={40}
                        height={40}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-800">{student.name} {student.surname}</p>
                      <Link 
                        href={`/protected/list/students/${student.id}`}
                        className="text-xs text-blue-600 hover:text-blue-800 transition-colors"
                      >
                        Ver perfil
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
      
      {/* Sección de información para administradores */}
      {role === 'admin' && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-700 flex items-center gap-2 mb-4">
              <div className="p-2 rounded-full bg-yellow-100">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-yellow-600"><path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z"></path><path d="M12 16v-4"></path><path d="M12 8h.01"></path></svg>
              </div>
              Acceso administrativo
            </h3>
          </div>
          
          <div className="text-gray-700">
            <p>Como administrador, tienes acceso a todas las funciones de gestión del sistema.</p>
            <p className="mt-2">Puedes administrar usuarios, clases, cursos y todas las configuraciones del sistema desde el panel de administración.</p>
          </div>
        </div>
      )}
      
      {/* Enlaces rápidos según el rol */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-gray-700 mb-4">Accesos directos</h3>
        
        <div className="flex gap-4 flex-wrap">
          {/* Enlaces para estudiantes */}
          {role === 'student' && (
            <>
              <Link
                className="p-3 rounded-md bg-lamaSkyLight text-gray-700 hover:bg-blue-100 transition-colors"
                href="/protected/list/lessons"
              >
                Mis lecciones
              </Link>
              
              <Link
                className="p-3 rounded-md bg-lamaPurpleLight text-gray-700 hover:bg-purple-100 transition-colors"
                href="/protected/list/assignments"
              >
                Mis tareas
              </Link>
              
              <Link
                className="p-3 rounded-md bg-pink-50 text-gray-700 hover:bg-pink-100 transition-colors"
                href="/protected/list/results"
              >
                Mis resultados
              </Link>
            </>
          )}
          
          {/* Enlaces para profesores */}
          {role === 'teacher' && (
            <>
              <Link
                className="p-3 rounded-md bg-lamaSkyLight text-gray-700 hover:bg-blue-100 transition-colors"
                href="/protected/list/lessons"
              >
                Mis lecciones
              </Link>
              
              <Link
                className="p-3 rounded-md bg-lamaPurpleLight text-gray-700 hover:bg-purple-100 transition-colors"
                href="/protected/list/assignments"
              >
                Asignaciones
              </Link>
              
              <Link
                className="p-3 rounded-md bg-pink-50 text-gray-700 hover:bg-pink-100 transition-colors"
                href="/protected/list/students"
              >
                Estudiantes
              </Link>
              
              <Link
                className="p-3 rounded-md bg-green-50 text-gray-700 hover:bg-green-100 transition-colors"
                href="/protected/list/exams"
              >
                Exámenes
              </Link>
            </>
          )}
          
          {/* Enlaces para padres */}
          {role === 'parent' && (
            <>
              <Link
                className="p-3 rounded-md bg-lamaSkyLight text-gray-700 hover:bg-blue-100 transition-colors"
                href="/protected/list/students"
              >
                Mis estudiantes
              </Link>
              
              <Link
                className="p-3 rounded-md bg-lamaPurpleLight text-gray-700 hover:bg-purple-100 transition-colors"
                href="/protected/list/results"
              >
                Resultados
              </Link>
              
              <Link
                className="p-3 rounded-md bg-pink-50 text-gray-700 hover:bg-pink-100 transition-colors"
                href="/protected/list/attendance"
              >
                Asistencia
              </Link>
            </>
          )}
          
          {/* Enlaces para administradores */}
          {role === 'admin' && (
            <>
              <Link
                className="p-3 rounded-md bg-lamaSkyLight text-gray-700 hover:bg-blue-100 transition-colors"
                href="/protected/list/students"
              >
                Gestionar estudiantes
              </Link>
              
              <Link
                className="p-3 rounded-md bg-lamaPurpleLight text-gray-700 hover:bg-purple-100 transition-colors"
                href="/protected/list/teachers"
              >
                Gestionar profesores
              </Link>
              
              <Link
                className="p-3 rounded-md bg-pink-50 text-gray-700 hover:bg-pink-100 transition-colors"
                href="/protected/list/parents"
              >
                Gestionar padres
              </Link>
              
              <Link
                className="p-3 rounded-md bg-green-50 text-gray-700 hover:bg-green-100 transition-colors"
                href="/protected/list/classes"
              >
                Gestionar clases
              </Link>
              
              <Link
                className="p-3 rounded-md bg-yellow-50 text-gray-700 hover:bg-yellow-100 transition-colors"
                href="/protected/list/grades"
              >
                Gestionar grados
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;