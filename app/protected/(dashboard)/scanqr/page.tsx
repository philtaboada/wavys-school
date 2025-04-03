"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { Html5QrcodeScanner } from "html5-qrcode";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

type SupabaseError = {
  message: string;
  code?: string;
  details?: string;
  hint?: string;
};

type Html5QrcodeScannerType = {
  clear: () => Promise<void>;
  render: (
    onSuccess: (decodedText: string) => void,
    onError: (errorMessage: string) => void
  ) => void;
};

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

interface Subject {
  id: string;
  name: string;
}

interface Lesson {
  id: string;
  name: string;
  subjectId: string;
}

const QRScanner: React.FC = () => {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [filteredLessons, setFilteredLessons] = useState<Lesson[]>([]);
  const [subjectId, setSubjectId] = useState<string | null>(null);
  const [lessonId, setLessonId] = useState<string | null>(null);
  const [scanning, setScanning] = useState<boolean>(false);
  const [loadingSubjects, setLoadingSubjects] = useState<boolean>(true);
  const [loadingLessons, setLoadingLessons] = useState<boolean>(false);
  const [errorLoading, setErrorLoading] = useState<string | null>(null);
  const [scanStatus, setScanStatus] = useState<string>("");
  const [lastScannedId, setLastScannedId] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [errorType, setErrorType] = useState<ErrorType | null>(null);
  const [scanHistory, setScanHistory] = useState<
    Array<{ id: string; success: boolean; message: string; timestamp: Date }>
  >([]);
  const scannerRef = useRef<Html5QrcodeScannerType | null>(null);
  const router = useRouter();

  const handleError = (error: any, type: ErrorType = ErrorType.UNKNOWN) => {
    let errorMessage = "Error desconocido";

    if (typeof error === "string") {
      errorMessage = error;
    } else if (error?.message) {
      errorMessage = error.message;
    }

    switch (type) {
      case ErrorType.STUDENT_NOT_FOUND:
        errorMessage = "Estudiante no encontrado. Verifica el código QR.";
        break;
      case ErrorType.ALREADY_REGISTERED:
        errorMessage = "Asistencia ya registrada hoy para esta lección.";
        break;
      case ErrorType.DATABASE:
        errorMessage = `Error en la base de datos: ${errorMessage}`;
        break;
      case ErrorType.NETWORK:
        errorMessage = "Error de conexión. Verifica tu Internet.";
        break;
      case ErrorType.CAMERA:
        errorMessage = "Error de acceso a la cámara. Verifica permisos.";
        break;
    }

    setErrorType(type);
    console.error(`[${type}] Error:`, errorMessage);
    toast.error(errorMessage);
    setScanStatus(`Error: ${errorMessage}`);
    return errorMessage;
  };

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

      if (error) throw { message: error.message, type: ErrorType.DATABASE };
      return !!data?.length;
    } catch (error: any) {
      handleError(error, error.type || ErrorType.DATABASE);
      return false;
    }
  };

  const checkStudentExists = async (studentId: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase
        .from("Student")
        .select("id")
        .eq("id", studentId)
        .single();

      if (error?.code === "PGRST116") return false;
      if (error) throw { message: error.message, type: ErrorType.DATABASE };
      return !!data;
    } catch (error: any) {
      handleError(error, error.type || ErrorType.DATABASE);
      return false;
    }
  };

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

      if (error) throw { message: error.message, type: ErrorType.DATABASE };
      return true;
    } catch (error: any) {
      handleError(error, error.type || ErrorType.DATABASE);
      return false;
    }
  };

  const clearScanner = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.clear();
      } catch (error) {
        console.error("Error al limpiar el scanner:", error);
      }
      scannerRef.current = null;
    }
    setIsProcessing(false);
  };

  const resetError = () => {
    setErrorType(null);
    setScanStatus("");
  };

  const fetchLessonsBySubject = async (subjectId: string) => {
    setLoadingLessons(true);
    try {
      const { data, error } = await supabase
        .from("Lesson")
        .select("*")
        .eq("subjectId", subjectId);

      if (error) throw error;
      setFilteredLessons(data || []);
    } catch (error) {
      const err = error as SupabaseError;
      console.error("Error al cargar lecciones:", err.message);
      toast.error("Error al cargar lecciones");
    } finally {
      setLoadingLessons(false);
    }
  };

  useEffect(() => {
    const fetchSubjects = async () => {
      setLoadingSubjects(true);
      try {
        const { data, error } = await supabase.from("Subject").select("*");
        if (error) throw error;
        setSubjects(data || []);
      } catch (error) {
        const err = error as SupabaseError;
        console.error("Error al cargar materias:", err.message);
        toast.error("Error al cargar materias");
      } finally {
        setLoadingSubjects(false);
      }
    };

    fetchSubjects();
  }, []);

  useEffect(() => {
    if (subjectId) {
      fetchLessonsBySubject(subjectId);
      setLessonId(null);
      setScanning(false);
      clearScanner();
    } else {
      setFilteredLessons([]);
    }
  }, [subjectId]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (isProcessing) {
        setIsProcessing(false);
        toast.warn("Procesamiento tardó demasiado. Intenta nuevamente.");
      }
    }, 10000);

    return () => clearTimeout(timer);
  }, [isProcessing]);

  useEffect(() => {
    if (!scanning || !lessonId) {
      clearScanner();
      return;
    }

    if (scannerRef.current || isProcessing) return;

    const scanner = new Html5QrcodeScanner(
      "reader",
      { fps: 10, qrbox: 250, rememberLastUsedCamera: true },
      false
    ) as unknown as Html5QrcodeScannerType;

    const handleScan = async (decodedText: string) => {
      if (isProcessing || !scannerRef.current) return;
      if (lastScannedId === decodedText) {
        toast.info("Código ya escaneado. Intenta con otro estudiante.");
        return;
      }

      setIsProcessing(true);
      setScanStatus("Procesando código QR...");
      resetError();

      try {
        if (!decodedText.match(/^[A-Za-z0-9-]+$/)) {
          throw {
            message: "Formato de código QR inválido",
            type: ErrorType.UNKNOWN,
          };
        }

        const studentExists = await checkStudentExists(decodedText);
        if (!studentExists) {
          throw {
            message: "Estudiante no registrado",
            type: ErrorType.STUDENT_NOT_FOUND,
          };
        }

        const alreadyRegistered = await checkExistingAttendance(
          decodedText,
          lessonId
        );
        if (alreadyRegistered) {
          throw {
            message: "Asistencia ya registrada hoy",
            type: ErrorType.ALREADY_REGISTERED,
          };
        }

        const success = await registerAttendance(decodedText, lessonId);
        if (!success) {
          throw { message: "Error al registrar", type: ErrorType.DATABASE };
        }

        setScanHistory((prev) => [
          {
            id: decodedText,
            success: true,
            message: "Asistencia registrada",
            timestamp: new Date(),
          },
          ...prev.slice(0, 9),
        ]);

        setLastScannedId(decodedText);
        setScanStatus("✅ Asistencia registrada");

        const currentSubject = subjects.find((s) => s.id === subjectId);
        toast.success(
          <div>
            <p className="font-bold">Asistencia registrada</p>
            <p>Estudiante: {decodedText}</p>
            <p>Materia: {currentSubject?.name}</p>
            <p>Fecha: {new Date().toLocaleString()}</p>
          </div>,
          { autoClose: 5000 }
        );
      } catch (error: any) {
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
        setIsProcessing(false);
      }
    };

    scanner.render(handleScan, (errorMessage) => {
      if (!errorMessage.includes("NotFoundException")) {
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

    return () => {
      clearScanner();
    };
  }, [scanning, lessonId, subjectId, subjects, isProcessing]);

  useEffect(() => {
    if (lastScannedId) {
      const timer = setTimeout(() => setLastScannedId(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [lastScannedId]);

  const getStatusClass = () => {
    if (errorType) return "p-2 bg-red-50 text-red-700 rounded text-center";
    if (scanStatus.includes("registrada"))
      return "p-2 bg-green-50 text-green-700 rounded text-center";
    return "p-2 bg-blue-50 text-blue-700 rounded text-center";
  };

  const handleSubjectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSubjectId(e.target.value);
  };

  const handleLessonChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setLessonId(e.target.value);
    setScanning(true);
    resetError();
  };

  return (
    <div className="max-w-md mx-auto p-4 space-y-4">
      <h2 className="text-xl font-bold text-center">
        Registro de Asistencia por QR
      </h2>

      {loadingSubjects ? (
        <div className="flex flex-col items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <p className="mt-2">Cargando materias...</p>
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
      ) : subjects.length > 0 ? (
        <>
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">
              Selecciona una materia
            </label>
            <select
              className="w-full p-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
              onChange={handleSubjectChange}
              value={subjectId || ""}
              disabled={isProcessing}
            >
              <option value="" disabled>
                Selecciona una materia
              </option>
              {subjects.map((subject) => (
                <option key={subject.id} value={subject.id}>
                  {subject.name}
                </option>
              ))}
            </select>
          </div>

          {subjectId && (
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">
                Selecciona una lección
              </label>
              {loadingLessons ? (
                <div className="flex items-center py-2">
                  <div className="animate-spin mr-2 h-4 w-4 border-b-2 border-blue-500"></div>
                  <p className="text-sm text-gray-500">Cargando lecciones...</p>
                </div>
              ) : filteredLessons.length > 0 ? (
                <select
                  className="w-full p-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
                  onChange={handleLessonChange}
                  value={lessonId || ""}
                  disabled={isProcessing}
                >
                  <option value="" disabled>
                    Selecciona una lección
                  </option>
                  {filteredLessons.map((lesson) => (
                    <option key={lesson.id} value={lesson.id}>
                      {lesson.name}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="p-2 bg-yellow-50 text-yellow-700 rounded text-center text-sm">
                  No hay lecciones disponibles para esta materia
                </div>
              )}
            </div>
          )}

          {scanning && lessonId && (
            <div className="space-y-3">
              <div className={getStatusClass()}>
                {scanStatus || "Acerca el código QR a la cámara"}
              </div>
              <div
                id="reader"
                className="border-2 border-dashed border-gray-300 rounded-lg"
              ></div>

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
                      clearScanner();
                      setScanning(true);
                    }}
                    className="flex-1 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
                  >
                    Reintentar
                  </button>
                )}
              </div>

              <div className="p-2 bg-gray-50 rounded border border-gray-200 text-sm">
                <p>
                  <span className="font-medium">Materia:</span>{" "}
                  {subjects.find((s) => s.id === subjectId)?.name}
                </p>
                <p>
                  <span className="font-medium">Lección:</span>{" "}
                  {filteredLessons.find((l) => l.id === lessonId)?.name}
                </p>
              </div>

              {scanHistory.length > 0 && (
                <div className="mt-4">
                  <h3 className="text-sm font-medium text-gray-700 mb-2">
                    Últimos escaneos:
                  </h3>
                  <div className="text-xs max-h-40 overflow-y-auto border rounded p-2">
                    {scanHistory.map((scan, index) => (
                      <div
                        key={index}
                        className={`py-1 ${index > 0 ? "border-t" : ""} ${
                          scan.success ? "text-green-700" : "text-red-700"
                        }`}
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
          <p>No hay materias disponibles</p>
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
