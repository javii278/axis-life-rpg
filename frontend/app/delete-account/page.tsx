import Link from "next/link";

export const metadata = {
  title: "Borrar cuenta — Axis: The Life RPG",
  description: "Solicita la eliminación de tu cuenta y datos personales de Axis.",
};

export default function DeleteAccountPage() {
  return (
    <div className="min-h-screen bg-[#0d0d18] text-gray-300 px-6 py-16 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold text-white mb-2">Eliminar cuenta y datos</h1>
      <p className="text-gray-500 text-sm mb-10">Axis: The Life RPG</p>

      <section className="space-y-6 text-sm leading-relaxed">
        <p>
          Puedes solicitar la eliminación completa de tu cuenta y todos los datos asociados
          (personaje, hábitos, metas, sesiones de foco, logros y misiones) en cualquier momento.
        </p>

        <div className="bg-[#1a1a2e] border border-[#2d2d4a] rounded-2xl p-6 space-y-4">
          <h2 className="text-white font-semibold text-base">Opción 1 — Desde la app</h2>
          <ol className="list-decimal list-inside space-y-2 text-gray-400">
            <li>Inicia sesión en tu cuenta</li>
            <li>Ve a <strong className="text-white">Ajustes</strong></li>
            <li>Pulsa <strong className="text-white">Cerrar sesión</strong> y luego contacta con nosotros para confirmar el borrado</li>
          </ol>
        </div>

        <div className="bg-[#1a1a2e] border border-[#2d2d4a] rounded-2xl p-6 space-y-4">
          <h2 className="text-white font-semibold text-base">Opción 2 — Por email</h2>
          <p className="text-gray-400">
            Envía un email a{" "}
            <a
              href="mailto:javii278278@gmail.com"
              className="text-purple-400 hover:text-purple-300 underline"
            >
              javii278278@gmail.com
            </a>{" "}
            con el asunto <strong className="text-white">"Borrar cuenta Axis"</strong> e incluye
            el email con el que creaste tu cuenta.
          </p>
          <p className="text-gray-400">
            Procesaremos la solicitud en un plazo máximo de <strong className="text-white">30 días</strong>.
            Recibirás confirmación por email cuando tus datos hayan sido eliminados.
          </p>
        </div>

        <div className="bg-[#1a1a2e] border border-[#2d2d4a] rounded-2xl p-6 space-y-2">
          <h2 className="text-white font-semibold text-base">Datos que se eliminan</h2>
          <ul className="list-disc list-inside space-y-1 text-gray-400">
            <li>Cuenta de usuario (email y contraseña)</li>
            <li>Personaje y estadísticas</li>
            <li>Hábitos y rachas</li>
            <li>Metas y misiones</li>
            <li>Sesiones de foco</li>
            <li>Logros y monedas</li>
          </ul>
        </div>

        <p className="text-gray-600 text-xs">
          Para más información consulta nuestra{" "}
          <Link href="/privacy" className="text-purple-400 hover:text-purple-300 underline">
            Política de Privacidad
          </Link>.
        </p>
      </section>
    </div>
  );
}
