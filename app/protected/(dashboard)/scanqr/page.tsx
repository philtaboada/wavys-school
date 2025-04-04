"use client";

import { useState, useRef, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import { Html5QrcodeScanner } from "html5-qrcode";
import { toast } from "sonner";
import { Toaster } from "sonner";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface Student {
  id: string;
  name: string;
}

interface ScanRecord {
  id: string;
  name: string;
  success: boolean;
  message: string;
  timestamp: string;
}

const QRScanner: React.FC = () => {
  const [scanning, setScanning] = useState<boolean>(false);
  const [scanStatus, setScanStatus] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [scanHistory, setScanHistory] = useState<ScanRecord[]>([]);
  const scannerRef = useRef<any>(null);
  const lastScannedRef = useRef<{ id: string; timestamp: number } | null>(null);

  // Función para limpiar completamente el scanner
  const clearScanner = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.clear();
      } catch (error) {
        console.error("Error al limpiar scanner:", error);
      }
      scannerRef.current = null;
    }
    setIsProcessing(false);
    setScanStatus("");
  };

  const getStudentInfo = async (studentId: string): Promise<Student | null> => {
    try {
      const { data, error } = await supabase
        .from("Student")
        .select("id, name")
        .eq("id", studentId)
        .single();

      if (error || !data) {
        throw error || new Error("Estudiante no encontrado");
      }
      return data;
    } catch (error) {
      console.error("Error al buscar estudiante:", error);
      return null;
    }
  };

  const registerAttendance = async (studentId: string): Promise<boolean> => {
    try {
      const { error } = await supabase.from("Attendance").insert({
        studentId,
        date: new Date().toISOString(),
        present: true,
      });

      if (error) throw error;
      return true;
    } catch (error) {
      console.error("Error al registrar asistencia:", error);
      return false;
    }
  };

  useEffect(() => {
    if (!scanning) {
      clearScanner();
      return;
    }

    // Evitar múltiples instancias
    if (scannerRef.current) return;

    const scanner = new Html5QrcodeScanner(
      "reader",
      {
        fps: 10,
        qrbox: 250,
        rememberLastUsedCamera: true,
      },
      false
    );

    const handleScan = async (decodedText: string) => {
      // Bloquear múltiples escaneos simultáneos
      if (isProcessing) return;

      // Verificar si ya se escaneó recientemente (5 segundos de cooldown)
      const now = Date.now();
      if (
        lastScannedRef.current &&
        lastScannedRef.current.id === decodedText &&
        now - lastScannedRef.current.timestamp < 5000
      ) {
        return;
      }

      setIsProcessing(true);
      setScanStatus("Procesando...");
      lastScannedRef.current = { id: decodedText, timestamp: now };

      try {
        // Validación básica del ID
        if (!decodedText.match(/^[a-zA-Z0-9-]+$/)) {
          throw new Error("Código QR inválido");
        }

        const student = await getStudentInfo(decodedText);
        if (!student) {
          throw new Error("Estudiante no registrado");
        }

        const success = await registerAttendance(student.id);
        if (!success) {
          throw new Error("Error al registrar asistencia");
        }

        // Formatear fecha legible
        const formattedDate = new Date().toLocaleString("es-ES", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        });

        const newRecord: ScanRecord = {
          id: student.id,
          name: student.name,
          success: true,
          message: "Asistencia registrada",
          timestamp: formattedDate,
        };

        setScanHistory((prev) => [newRecord, ...prev.slice(0, 9)]);
        setScanStatus("Registro exitoso ✓");

        // Mostrar notificación única
        toast.success(`Asistencia registrada para ${student.name}`, {
          description: formattedDate,
        });
      } catch (error: any) {
        console.error("Error en el escaneo:", error);
        setScanStatus(`Error: ${error.message}`);

        const student = await getStudentInfo(decodedText);
        const errorRecord: ScanRecord = {
          id: decodedText,
          name: student?.name || "Desconocido",
          success: false,
          message: error.message,
          timestamp: new Date().toLocaleString(),
        };

        setScanHistory((prev) => [errorRecord, ...prev.slice(0, 9)]);
        toast.error(error.message);
      } finally {
        // Resetear después de un breve delay
        setTimeout(() => {
          setIsProcessing(false);
          setScanStatus(scanning ? "Listo para escanear" : "");
        }, 1000);
      }
    };

    scanner.render(
      (decodedText) => handleScan(decodedText),
      (error) => {
        if (!error.includes("NotFoundException")) {
          console.error("Error del scanner:", error);
        }
      }
    );

    scannerRef.current = scanner;
    setScanStatus("Escáner listo");

    return () => {
      clearScanner();
    };
  }, [scanning]);

  return (
    <div className="max-w-md mx-auto p-4 space-y-6">
      <h1 className="text-2xl font-bold text-center">Registro de Asistencia</h1>
      <Toaster position="top-center" />

      <div className="flex flex-col items-center gap-4">
        <button
          onClick={() => setScanning(!scanning)}
          disabled={isProcessing}
          className={`px-6 py-3 rounded-lg text-white font-medium ${
            scanning
              ? "bg-red-600 hover:bg-red-700"
              : "bg-blue-600 hover:bg-blue-700"
          } transition-colors disabled:opacity-70`}
        >
          {scanning
            ? isProcessing
              ? "Procesando..."
              : "Detener escaneo"
            : "Iniciar escaneo"}
        </button>

        {scanning && (
          <>
            <div
              className={`p-3 rounded-lg text-center ${
                scanStatus.includes("Error")
                  ? "bg-red-100 text-red-800"
                  : scanStatus.includes("✓")
                    ? "bg-green-100 text-green-800"
                    : "bg-blue-100 text-blue-800"
              }`}
            >
              {scanStatus || "Preparando escáner..."}
            </div>

            <div
              id="reader"
              className="w-full border-2 border-gray-300 rounded-lg overflow-hidden"
            ></div>
          </>
        )}

        {scanHistory.length > 0 && (
          <div className="w-full mt-4">
            <h3 className="text-lg font-semibold mb-2">Registros recientes</h3>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {scanHistory.map((record, index) => (
                <div
                  key={index}
                  className={`p-3 rounded-lg border ${
                    record.success
                      ? "bg-green-50 border-green-200"
                      : "bg-red-50 border-red-200"
                  }`}
                >
                  <div className="flex justify-between">
                    <div>
                      <p className="font-medium">{record.name}</p>
                      <p className="text-sm">{record.message}</p>
                    </div>
                    <span className="text-xs text-gray-500">
                      {record.timestamp}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default QRScanner;
