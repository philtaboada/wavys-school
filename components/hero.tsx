export default function Header() {
  return (
    <div className="flex flex-col items-center bg-teal-500 text-white py-16 relative overflow-hidden">
      {/* Elementos decorativos */}
      <div className="absolute top-10 right-20 w-8 h-8 rotate-12 text-yellow-300 text-3xl">★</div>
      <div className="absolute bottom-40 left-20 w-24 h-24 border-2 border-teal-300 rounded-full opacity-30"></div>
      <div className="absolute top-40 right-40 w-16 h-16 border-2 border-teal-300 rounded-full opacity-30"></div>
      
      {/* Logo y navegación */}
      <div className="w-full max-w-6xl flex justify-between items-center mb-12 px-4">
        <a
          href="https://www.wavys-technologies.com/"
          target="_blank"
          rel="noreferrer"
          className="font-bold text-2xl"
        >
          Wavys College
        </a>
        
        <div className="flex items-center gap-4">
          <nav className="hidden md:flex gap-6 mr-6">
            <a href="#inicio" className="hover:text-yellow-200 transition-colors">Inicio</a>
            <a href="#funciones" className="hover:text-yellow-200 transition-colors">Funciones</a>
            <a href="#precios" className="hover:text-yellow-200 transition-colors">Precios</a>
            <a href="#contacto" className="hover:text-yellow-200 transition-colors">Contacto</a>
          </nav>
          <a href="/sign-in" className="bg-white text-teal-600 px-4 py-2 rounded-lg font-medium hover:bg-yellow-100 transition-colors">
            Iniciar Sesión
          </a>
        </div>
      </div>
      
      {/* Título principal */}
      <h1 className="text-5xl font-bold text-center mb-6">
        Sistema Integral Para<br/>Administración Escolar
      </h1>
      
      {/* Botones de acción */}
      <div className="flex gap-4 mb-16">
        <a href="#contacto" className="bg-yellow-400 text-teal-800 px-6 py-3 rounded-full font-bold hover:bg-yellow-300">
          Solicitar Demo
        </a>
        <a href="#contacto" className="bg-transparent border-2 border-white text-white px-6 py-3 rounded-full font-bold hover:bg-white/10">
          Contactar
        </a>
      </div>
      
      {/* Fotos de estudiantes en arcos */}
      <div className="flex flex-wrap justify-center gap-4 mb-12 relative">
        <div className="w-64 h-80 bg-purple-300 rounded-t-full overflow-hidden flex items-end">
          <img 
            src="https://images.unsplash.com/photo-1617774541075-9b8b05e18885?q=80&w=500&auto=format&fit=crop"
            alt="Estudiante" 
            className="object-cover w-full"
          />
        </div>
        <div className="w-64 h-80 bg-yellow-300 rounded-t-full overflow-hidden flex items-end">
          <img 
            src="https://images.unsplash.com/photo-1520923642038-b4259acecbd7?q=80&w=500&auto=format&fit=crop"
            alt="Estudiante" 
            className="object-cover w-full"
          />
        </div>
        <div className="w-64 h-80 bg-blue-300 rounded-t-full overflow-hidden flex items-end">
          <img 
            src="https://images.unsplash.com/photo-1484820540004-14229fe36ca4?q=80&w=500&auto=format&fit=crop"
            alt="Estudiante" 
            className="object-cover w-full"
          />
        </div>
      </div>
      
      {/* Servicios con iconos */}
      <div className="flex flex-wrap justify-center gap-6 max-w-6xl mb-16">
        <div className="bg-white text-gray-800 p-6 rounded-lg w-52 flex flex-col items-center">
          <div className="bg-teal-100 p-3 rounded-lg mb-4">
            <img src="https://cdn-icons-png.flaticon.com/512/2232/2232688.png" alt="Lenguaje" className="w-12 h-12" />
          </div>
          <h3 className="text-xl font-bold mb-2 text-center">Asistencia</h3>
          <p className="text-center text-sm">Control digital de asistencia automático</p>
          <a href="#asistencia" className="mt-4 text-teal-600 font-medium text-sm">Conocer más</a>
        </div>
        
        <div className="bg-yellow-300 text-gray-800 p-6 rounded-lg w-52 flex flex-col items-center">
          <div className="bg-yellow-100 p-3 rounded-lg mb-4">
            <img src="https://cdn-icons-png.flaticon.com/512/2232/2232451.png" alt="Matemáticas" className="w-12 h-12" />
          </div>
          <h3 className="text-xl font-bold mb-2 text-center">Calificaciones</h3>
          <p className="text-center text-sm">Sistema intuitivo de evaluación y reportes</p>
          <a href="#calificaciones" className="mt-4 text-teal-600 font-medium text-sm">Conocer más</a>
        </div>
        
        <div className="bg-white text-gray-800 p-6 rounded-lg w-52 flex flex-col items-center">
          <div className="bg-teal-100 p-3 rounded-lg mb-4">
            <img src="https://cdn-icons-png.flaticon.com/512/2232/2232652.png" alt="Educación" className="w-12 h-12" />
          </div>
          <h3 className="text-xl font-bold mb-2 text-center">Comunicación</h3>
          <p className="text-center text-sm">Mensajería integrada entre padres y profesores</p>
          <a href="#comunicacion" className="mt-4 text-teal-600 font-medium text-sm">Conocer más</a>
        </div>
        
        <div className="bg-white text-gray-800 p-6 rounded-lg w-52 flex flex-col items-center">
          <div className="bg-teal-100 p-3 rounded-lg mb-4">
            <img src="https://cdn-icons-png.flaticon.com/512/2232/2232551.png" alt="Juegos" className="w-12 h-12" />
          </div>
          <h3 className="text-xl font-bold mb-2 text-center">Administración</h3>
          <p className="text-center text-sm">Gestión completa de recursos y pagos</p>
          <a href="#administracion" className="mt-4 text-teal-600 font-medium text-sm">Conocer más</a>
        </div>
      </div>
      
      {/* Sección adicional */}
      <div className="bg-teal-400 rounded-2xl p-4 sm:p-6 md:p-8 w-[90%] max-w-4xl flex flex-col md:flex-row items-center gap-6 md:gap-8 relative mx-4">
        <div className="absolute top-2 right-2 text-yellow-300 text-2xl">★</div>
        <div className="w-full md:w-1/3 bg-teal-200 p-2 rounded-2xl">
          <img 
            src="https://images.unsplash.com/photo-1503676260728-1c00da094a0b?q=80&w=500&auto=format&fit=crop"
            alt="Estudiante feliz" 
            className="rounded-xl w-full h-auto"
          />
        </div>
        <div className="w-full md:w-2/3">
          <h2 className="text-2xl sm:text-3xl font-bold mb-2 sm:mb-3">La mejor plataforma para gestionar tu colegio</h2>
          <p className="text-sm sm:text-base mb-3 sm:mb-4">Nuestro sistema integral te permite administrar todos los aspectos de tu institución educativa de manera eficiente y sencilla, ahorrando tiempo y mejorando la comunicación.</p>
          
          <div className="grid grid-cols-1 xs:grid-cols-2 gap-2 sm:gap-4 mb-4 sm:mb-6 text-sm sm:text-base">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-white flex items-center justify-center text-teal-500 flex-shrink-0">✓</div>
              <span>Control de Asistencia</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-white flex items-center justify-center text-teal-500 flex-shrink-0">✓</div>
              <span>App para Dispositivos</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-white flex items-center justify-center text-teal-500 flex-shrink-0">✓</div>
              <span>Panel de Padres</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-white flex items-center justify-center text-teal-500 flex-shrink-0">✓</div>
              <span>Notificaciones Automáticas</span>
            </div>
          </div>
          
          <a href="#contacto" className="bg-teal-600 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg inline-block text-sm sm:text-base font-medium hover:bg-teal-700 w-full sm:w-auto text-center">
            Solicitar Información
          </a>
        </div>
      </div>
    </div>
  );
}
