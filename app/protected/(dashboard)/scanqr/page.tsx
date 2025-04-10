"use client";

import { useState, useRef, useEffect } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";
import { toast } from "sonner";
import { Toaster } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import {
  useCheckDailyAttendance,
  useCreateAttendance,
} from "@/utils/queries/attendanceQueries";
import { useStudentDetails } from "@/utils/queries/studentQueries";

interface ScanRecord {
  id: string;
  name: string;
  success: boolean;
  message: string;
  timestamp: string;
}

const QRScanner = () => {
  const queryClient = useQueryClient();
  const [scanning, setScanning] = useState(false);
  const [scanStatus, setScanStatus] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [scanHistory, setScanHistory] = useState<ScanRecord[]>([]);
  const [currentStudentId, setCurrentStudentId] = useState<string | null>(null);

  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const lastScannedRef = useRef<{ id: string; timestamp: number } | null>(null);

  // Queries y mutaciones
  const { data: studentDetails, error: studentError } = useStudentDetails(
    currentStudentId || ""
  );
  const { data: attendanceExists, error: attendanceError } =
    useCheckDailyAttendance(currentStudentId || "");
  const { mutateAsync: createAttendance, error: createError } =
    useCreateAttendance();

  const clearScanner = () => {
    if (scannerRef.current) {
      scannerRef.current.clear().catch(console.error);
      scannerRef.current = null;
    }
    setIsProcessing(false);
    setScanStatus("");
  };

  const handleScanSuccess = async (decodedText: string) => {
    const now = Date.now();

    // Evitar escaneos duplicados en un periodo corto
    if (
      lastScannedRef.current?.id === decodedText &&
      now - lastScannedRef.current.timestamp < 5000
    ) {
      return;
    }

    setIsProcessing(true);
    setScanStatus("Procesando...");
    lastScannedRef.current = { id: decodedText, timestamp: now };
    setCurrentStudentId(decodedText);
  };

  useEffect(() => {
    if (!studentDetails || !currentStudentId) return;

    const processAttendance = async () => {
      try {
        // Validar formato del ID
        if (!currentStudentId.match(/^[a-zA-Z0-9-]+$/)) {
          throw new Error("Código QR inválido");
        }

        // Verificar si el estudiante existe
        if (studentError) {
          throw new Error("Estudiante no registrado");
        }

        // Verificar asistencia existente
        if (attendanceError) {
          throw new Error("Error al verificar asistencia");
        }

        if (attendanceExists) {
          throw new Error(`${studentDetails.name} ya registró asistencia hoy`);
        }

        // Registrar nueva asistencia
        await createAttendance({
          studentId: currentStudentId,
          date: new Date().toISOString(),
          present: true,
          lessonId: undefined, // Opcional, según tu schema
        });

        // Actualizar historial
        const formattedDate = new Date().toLocaleString("es-ES", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        });

        const newRecord: ScanRecord = {
          id: studentDetails.id,
          name: `${studentDetails.name} ${studentDetails.surname}`,
          success: true,
          message: "Asistencia registrada",
          timestamp: formattedDate,
        };

        setScanHistory((prev) => [newRecord, ...prev.slice(0, 9)]);
        setScanStatus("✅ Registro exitoso");
        toast.success(
          `Asistencia registrada para ${studentDetails.name} ${studentDetails.surname}`
        );
      } catch (error: any) {
        console.error("Error en el escaneo:", error);

        const errorRecord: ScanRecord = {
          id: currentStudentId || "unknown",
          name: studentDetails
            ? `${studentDetails.name} ${studentDetails.surname}`
            : "Desconocido",
          success: false,
          message: error.message,
          timestamp: new Date().toLocaleString(),
        };

        setScanHistory((prev) => [errorRecord, ...prev.slice(0, 9)]);
        toast.error(error.message);
        setScanStatus(`Error: ${error.message}`);
      } finally {
        setIsProcessing(false);
        setCurrentStudentId(null);
        // Invalidar queries relacionadas
        queryClient.invalidateQueries({
          queryKey: ["attendance", "daily-check", currentStudentId],
        });
        queryClient.invalidateQueries({
          queryKey: ["attendance", "list"],
        });
      }
    };

    processAttendance();
  }, [studentDetails, attendanceExists, currentStudentId]);

  useEffect(() => {
    if (!scanning) {
      clearScanner();
      return;
    }

    if (scannerRef.current) return;

    const scanner = new Html5QrcodeScanner(
      "qr-reader",
      {
        fps: 10,
        qrbox: 250,
        rememberLastUsedCamera: true,
      },
      false
    );

    const handleError = (error: string) => {
      if (!error.includes("NotFoundException")) {
        console.error("Error del scanner:", error);
        setScanStatus(`Error: ${error}`);
      }
    };

    scanner.render(handleScanSuccess, handleError);
    scannerRef.current = scanner;
    setScanStatus("Escáner listo - Mostrando cámara");

    return () => {
      clearScanner();
    };
  }, [scanning]);

  return (
    <div className="bg-white p-6 rounded-lg shadow-md max-w-md mx-auto">
      <h2 className="text-2xl font-bold mb-4 text-center">
        Registro de Asistencia QR
      </h2>
      <Toaster position="top-center" richColors />

      <div className="flex flex-col items-center gap-4">
        <button
          onClick={() => setScanning(!scanning)}
          disabled={isProcessing}
          className={`px-6 py-3 rounded-lg text-white font-medium ${
            scanning
              ? "bg-red-600 hover:bg-red-700"
              : "bg-blue-600 hover:bg-blue-700"
          } transition-colors disabled:opacity-70 w-full`}
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
              className={`p-3 rounded-lg text-center w-full ${
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
              id="qr-reader"
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
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium">{record.name}</p>
                      <p className="text-sm">{record.message}</p>
                    </div>
                    <span className="text-xs text-gray-500 whitespace-nowrap">
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
