"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { Html5QrcodeScanner } from "html5-qrcode";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// Definición de tipos
type SupabaseError = {
  message: string;
  code?: string;
  details?: string;
  hint?: string;
};

type CustomError = {
  message: string;
};

// Definición mejorada del tipo Html5QrcodeScanner
type Html5QrcodeScannerType = {
  clear: () => Promise<void>;
  render: (
    onSuccess: (decodedText: string) => void,
    onError: (errorMessage: string) => void
  ) => void;
};

// Enum para categorizar errores
enum ErrorType {
  DATABASE = "DATABASE",
  STUDENT_NOT_FOUND = "STUDENT_NOT_FOUND",
  ALREADY_REGISTERED = "ALREADY_REGISTERED",
  NETWORK = "NETWORK",
  CAMERA = "CAMERA",
  UNKNOWN = "UNKNOWN",
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface Lesson {
  id: string;
  name: string;
}

interface Attendance {
  studentId: string;
  lessonId: string;
  date: string;
  present: boolean;
}

const QRScanner: React.FC = () => {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [lessonId, setLessonId] = useState<string | null>(null);
  const [scanning, setScanning] = useState<boolean>(false);
  const [loadingLessons, setLoadingLessons] = useState<boolean>(true);
  const [errorLoading, setErrorLoading] = useState<string | null>(null);
  const [scanStatus, setScanStatus] = useState<string>("");
  const [lastScannedId, setLastScannedId] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [errorType, setErrorType] = useState<ErrorType | null>(null);
  const [scanHistory, setScanHistory] = useState<
    Array<{ id: string; success: boolean; message: string; timestamp: Date }>
  >([]);
  const scannerRef = useRef<Html5QrcodeScannerType | null>(null);
  const scannerDivRef = useRef<HTMLDivElement | null>(null);
  const router = useRouter();

  // Función para manejar errores de forma centralizada
  const handleError = (error: any, type: ErrorType = ErrorType.UNKNOWN) => {
    let errorMessage = "Error desconocido";

    if (typeof error === "string") {
      errorMessage = error;
    } else if (error?.message) {
      errorMessage = error.message;
    }

    // Personalizar mensajes según el tipo de error
    switch (type) {
      case ErrorType.STUDENT_NOT_FOUND:
        errorMessage =
          "Estudiante no encontrado. Verifica que el código QR sea válido.";
        break;
      case ErrorType.ALREADY_REGISTERED:
        errorMessage =
          "Este estudiante ya registró su asistencia hoy para esta lección.";
        break;
      case ErrorType.DATABASE:
        errorMessage = `Error en la base de datos: ${errorMessage}`;
        break;
      case ErrorType.NETWORK:
        errorMessage = "Error de conexión. Verifica tu conexión a Internet.";
        break;
      case ErrorType.CAMERA:
        errorMessage = "Error de acceso a la cámara. Verifica los permisos.";
        break;
    }

    setErrorType(type);
    console.error(`[${type}] Error:`, errorMessage);
    toast.error(errorMessage);
    setScanStatus(`Error: ${errorMessage}`);

    return errorMessage;
  };

  // Función mejorada para verificar asistencia existente
  const checkExistingAttendance = async (
    studentId: string,
    lessonId: string
  ): Promise<boolean> => {
    const today = new Date().toISOString().split("T")[0];
    try {
      const { data, error } = await supabase
        .from("Attendance")
        .select("*")
        .eq("studentId", studentId)
        .eq("lessonId", lessonId)
        .gte("date", `${today}T00:00:00`)
        .lte("date", `${today}T23:59:59`);

      if (error) {
        throw { message: error.message, type: ErrorType.DATABASE };
      }
      return !!data?.length;
    } catch (error: any) {
      const errorMessage = handleError(error, error.type || ErrorType.DATABASE);
      return false;
    }
  };

  // Función para verificar si un estudiante existe
  const checkStudentExists = async (studentId: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase
        .from("Student")
        .select("id")
        .eq("id", studentId)
        .single();

      if (error) {
        if (error.code === "PGRST116") {
          // Error específico cuando no se encuentra un registro
          return false;
        }
        throw { message: error.message, type: ErrorType.DATABASE };
      }

      return !!data;
    } catch (error: any) {
      handleError(error, error.type || ErrorType.DATABASE);
      return false;
    }
  };

  // Función para registrar asistencia
  const registerAttendance = async (
    studentId: string,
    lessonId: string
  ): Promise<boolean> => {
    try {
      const { error } = await supabase.from("Attendance").insert({
        studentId,
        lessonId,
        date: new Date().toISOString(),
        present: true,
      });

      if (error) {
        throw { message: error.message, type: ErrorType.DATABASE };
      }

      return true;
    } catch (error: any) {
      handleError(error, error.type || ErrorType.DATABASE);
      return false;
    }
  };

  // Función para limpiar el scanner de forma segura
  const clearScanner = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.clear();
      } catch (error) {
        console.error("Error al limpiar el scanner:", error);
      }
      scannerRef.current = null;
    }
  };

  // Función para reiniciar el estado de error
  const resetError = () => {
    setErrorType(null);
    setScanStatus("");
  };

  useEffect(() => {
    const fetchLessons = async () => {
      setLoadingLessons(true);
      setErrorLoading(null);
      try {
        const { data, error } = await supabase.from("Lesson").select("*");
        if (error) throw error;
        setLessons(data || []);
      } catch (error) {
        const err = error as SupabaseError;
        console.error("Error al cargar lecciones:", err.message);
        setErrorLoading("Error al cargar las lecciones");
        toast.error(err.message || "Error al cargar lecciones");
      } finally {
        setLoadingLessons(false);
      }
    };

    fetchLessons();
  }, []);

  useEffect(() => {
    // Si no estamos escaneando o no hay lección seleccionada, limpiamos el scanner
    if (!scanning || !lessonId) {
      clearScanner();
      return;
    }

    // No inicializamos un nuevo scanner si ya hay uno o si estamos procesando
    if (scannerRef.current || isProcessing) return;

    // Inicializamos el scanner
    const scanner = new Html5QrcodeScanner(
      "reader",
      {
        fps: 10,
        qrbox: 250,
        rememberLastUsedCamera: true,
      },
      false
    ) as unknown as Html5QrcodeScannerType;

    const handleScan = async (decodedText: string) => {
      // Evitamos procesamiento duplicado
      if (isProcessing) {
        return;
      }

      // Evitamos escanear el mismo QR consecutivamente
      if (lastScannedId === decodedText) {
        toast.info("Código ya escaneado. Intenta con otro estudiante.");
        return;
      }

      setIsProcessing(true);
      setScanStatus("Procesando código QR...");
      resetError();

      try {
        // Verificar formato de ID
        if (!decodedText.match(/^[A-Za-z0-9-]+$/)) {
          throw {
            message: "Formato de código QR inválido",
            type: ErrorType.UNKNOWN,
          };
        }

        // Verificar estudiante
        const studentExists = await checkStudentExists(decodedText);
        if (!studentExists) {
          throw {
            message: "Estudiante no registrado en el sistema",
            type: ErrorType.STUDENT_NOT_FOUND,
          };
        }

        // Verificar asistencia existente
        const alreadyRegistered = await checkExistingAttendance(
          decodedText,
          lessonId
        );

        if (alreadyRegistered) {
          throw {
            message: "El estudiante ya tiene asistencia registrada hoy",
            type: ErrorType.ALREADY_REGISTERED,
          };
        }

        // Registrar asistencia
        const success = await registerAttendance(decodedText, lessonId);

        if (!success) {
          throw {
            message: "Error al registrar asistencia",
            type: ErrorType.DATABASE,
          };
        }

        // Actualizar historial de escaneos
        setScanHistory((prev) => [
          {
            id: decodedText,
            success: true,
            message: "Asistencia registrada",
            timestamp: new Date(),
          },
          ...prev.slice(0, 9), // Mantener solo los últimos 10 registros
        ]);

        setLastScannedId(decodedText);
        setScanStatus("✅ Asistencia registrada correctamente");

        toast.success(
          <div>
            <p className="font-bold">Asistencia registrada</p>
            <p>Estudiante: {decodedText}</p>
            <p>Lección: {lessons.find((l) => l.id === lessonId)?.name}</p>
            <p>Fecha: {new Date().toLocaleString()}</p>
          </div>,
          { autoClose: 5000 }
        );
      } catch (error: any) {
        // Actualizar historial de escaneos con error
        setScanHistory((prev) => [
          {
            id: decodedText,
            success: false,
            message: error.message || "Error desconocido",
            timestamp: new Date(),
          },
          ...prev.slice(0, 9),
        ]);

        handleError(error, error.type);
      } finally {
        setTimeout(() => {
          setIsProcessing(false);
          // No limpiamos el estado de error aquí para que el usuario pueda ver el mensaje
        }, 2000);
      }
    };

    scanner.render(handleScan, (errorMessage) => {
      // Filtramos mensajes de error comunes de la cámara buscando QR
      if (!errorMessage.includes("NotFoundException")) {
        console.log("Error de escaneo:", errorMessage);

        // Manejar específicamente errores de cámara
        if (
          errorMessage.includes("NotAllowedError") ||
          errorMessage.includes("NotFoundError")
        ) {
          handleError(errorMessage, ErrorType.CAMERA);
        } else {
          setScanStatus(`Error: ${errorMessage}`);
        }
      }
    });

    scannerRef.current = scanner;
    setScanStatus("Escáner listo - Mostrando cámara");

    // Limpieza al desmontar
    return () => {
      clearScanner();
    };
  }, [scanning, lessonId, lessons, isProcessing]);

  // Efecto específico para manejar el cambio de lastScannedId
  useEffect(() => {
    // Reiniciar el lastScannedId después de un tiempo
    if (lastScannedId) {
      const timer = setTimeout(() => {
        setLastScannedId(null);
      }, 5000); // 5 segundos de cooldown

      return () => clearTimeout(timer);
    }
  }, [lastScannedId]);

  // Función para obtener clase CSS según tipo de error
  const getStatusClass = () => {
    if (errorType) {
      return "p-2 bg-red-50 text-red-700 rounded text-center";
    }
    if (scanStatus.includes("registrada correctamente")) {
      return "p-2 bg-green-50 text-green-700 rounded text-center";
    }
    return "p-2 bg-blue-50 text-blue-700 rounded text-center";
  };

  return (
    <div className="max-w-md mx-auto p-4 space-y-4">
      <h2 className="text-xl font-bold text-center">
        Registro de Asistencia por QR
      </h2>

      {loadingLessons ? (
        <div className="flex flex-col items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <p className="mt-2">Cargando lecciones...</p>
        </div>
      ) : errorLoading ? (
        <div className="text-center p-4 bg-red-50 text-red-600 rounded-lg">
          <p>{errorLoading}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Reintentar
          </button>
        </div>
      ) : lessons.length > 0 ? (
        <>
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">
              Selecciona una lección
            </label>
            <select
              className="w-full p-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
              onChange={(e) => {
                setLessonId(e.target.value);
                setScanning(true);
                resetError();
              }}
              value={lessonId || ""}
              disabled={isProcessing}
            >
              <option value="" disabled>
                Selecciona una lección
              </option>
              {lessons.map((lesson) => (
                <option key={lesson.id} value={lesson.id}>
                  {lesson.name}
                </option>
              ))}
            </select>
          </div>

          {scanning && (
            <div className="space-y-3">
              <div className={getStatusClass()}>
                {scanStatus || "Acerca el código QR a la cámara"}
              </div>
              <div
                id="reader"
                ref={scannerDivRef}
                className="border-2 border-dashed border-gray-300 rounded-lg"
              ></div>

              {/* Botones de acción */}
              <div className="flex space-x-2">
                <button
                  onClick={() => {
                    setScanning(false);
                    clearScanner();
                    resetError();
                  }}
                  disabled={isProcessing}
                  className="flex-1 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors disabled:bg-gray-400"
                >
                  {isProcessing ? "Procesando..." : "Detener escaneo"}
                </button>

                {errorType && (
                  <button
                    onClick={() => {
                      resetError();
                      // Reiniciar el escáner si hay un error
                      clearScanner();
                      setScanning(true);
                    }}
                    className="flex-1 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
                  >
                    Reintentar
                  </button>
                )}
              </div>

              {/* Historial de escaneos recientes */}
              {scanHistory.length > 0 && (
                <div className="mt-4">
                  <h3 className="text-sm font-medium text-gray-700 mb-2">
                    Últimos escaneos:
                  </h3>
                  <div className="text-xs max-h-40 overflow-y-auto border rounded p-2">
                    {scanHistory.map((scan, index) => (
                      <div
                        key={index}
                        className={`py-1 ${index > 0 ? "border-t" : ""} ${scan.success ? "text-green-700" : "text-red-700"}`}
                      >
                        <span className="font-medium">{scan.id}</span>:{" "}
                        {scan.message}
                        <span className="text-gray-500 ml-1">
                          ({scan.timestamp.toLocaleTimeString()})
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      ) : (
        <div className="text-center p-4 bg-gray-50 text-gray-600 rounded-lg">
          <p>No hay lecciones disponibles</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Refrescar
          </button>
        </div>
      )}
    </div>
  );
};

export default QRScanner;
