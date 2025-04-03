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

type Html5QrcodeScannerType = {
  clear: () => Promise<void>;
  render: (
    onSuccess: (decodedText: string) => void,
    onError: (errorMessage: string) => void
  ) => void;
};

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
  const scannerRef = useRef<Html5QrcodeScannerType | null>(null);
  const router = useRouter();

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
        throw error;
      }
      return !!data?.length;
    } catch (error) {
      const err = error as SupabaseError;
      console.error("Error al verificar asistencia:", err.message);
      toast.error("Error al verificar asistencia existente");
      return false;
    }
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
    if (!scanning || !lessonId) {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(() => {});
        scannerRef.current = null;
      }
      return;
    }

    if (scannerRef.current || isProcessing) return;

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
      if (isProcessing || lastScannedId === decodedText) {
        toast.info("Espera antes de escanear de nuevo");
        return;
      }

      setIsProcessing(true);
      setScanStatus("Procesando código QR...");

      try {
        // Verificar estudiante
        const { data: student, error: studentError } = await supabase
          .from("Student")
          .select("id")
          .eq("id", decodedText)
          .single();

        if (studentError || !student) {
          throw new Error("Estudiante no registrado");
        }

        // Verificar asistencia existente
        const alreadyRegistered = await checkExistingAttendance(
          decodedText,
          lessonId
        );
        if (alreadyRegistered) {
          throw new Error("El estudiante ya tiene asistencia registrada hoy");
        }

        // Registrar asistencia
        const { error } = await supabase.from("Attendance").insert({
          studentId: decodedText,
          lessonId: lessonId,
          date: new Date().toISOString(),
          present: true,
        });

        if (error) throw error;

        setLastScannedId(decodedText);
        setScanStatus("Asistencia registrada correctamente");

        toast.success(
          <div>
            <p className="font-bold">Asistencia registrada</p>
            <p>Estudiante: {decodedText}</p>
            <p>Lección: {lessons.find((l) => l.id === lessonId)?.name}</p>
          </div>,
          { autoClose: 5000 }
        );
      } catch (error) {
        const err = error as CustomError;
        console.error("Error:", err.message);
        toast.error(err.message);
        setScanStatus("Error al procesar el código QR");
      } finally {
        setTimeout(() => {
          setIsProcessing(false);
          setScanning(false);
          setScanStatus("");
          scannerRef.current?.clear().then(() => {
            scannerRef.current = null;
          });
        }, 2000);
      }
    };

    scanner.render(handleScan, (errorMessage) => {
      if (!errorMessage.includes("NotFoundException")) {
        console.log("Error de escaneo:", errorMessage);
        setScanStatus(`Error: ${errorMessage}`);
      }
    });

    scannerRef.current = scanner;
    setScanStatus("Escáner listo - Mostrando cámara");

    return () => {
      scannerRef.current?.clear().catch(() => {});
    };
  }, [scanning, lessonId, lastScannedId, lessons, isProcessing]);

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
              }}
              value={lessonId || ""}
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
              <div className="p-2 bg-blue-50 text-blue-700 rounded text-center">
                {scanStatus || "Acerca el código QR a la cámara"}
              </div>
              <div
                id="reader"
                className="border-2 border-dashed border-gray-300 rounded-lg"
              ></div>
              <button
                onClick={() => setScanning(false)}
                className="w-full py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors"
              >
                Detener escaneo
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="text-center p-4 bg-gray-50 text-gray-600 rounded-lg">
          No hay lecciones disponibles
        </div>
      )}
    </div>
  );
};

export default QRScanner;
