import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Política de Privacidad — Axis: The Life RPG",
  description: "Política de privacidad de Axis: The Life RPG",
};

const LAST_UPDATED = "14 de mayo de 2026";
const CONTACT_EMAIL = "javii278278@gmail.com";
const APP_NAME = "Axis: The Life RPG";
const COMPANY = "Axis RPG";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0f] text-gray-200">
      <div className="max-w-3xl mx-auto px-6 py-16">
        {/* Header */}
        <div className="mb-12">
          <Link href="/" className="text-purple-400 hover:text-purple-300 text-sm mb-8 inline-block">
            ← Volver a Axis
          </Link>
          <h1 className="text-4xl font-bold text-white mt-4 mb-2">Política de Privacidad</h1>
          <p className="text-gray-400 text-sm">Última actualización: {LAST_UPDATED}</p>
        </div>

        <div className="prose prose-invert max-w-none space-y-8 text-gray-300 leading-relaxed">

          <section>
            <p>
              Esta Política de Privacidad describe cómo <strong>{COMPANY}</strong> (&quot;nosotros&quot;, &quot;nuestro&quot;)
              recopila, usa y protege la información personal cuando utilizas la aplicación{" "}
              <strong>{APP_NAME}</strong> (la &quot;App&quot;), disponible en{" "}
              <a href="https://axisrpg.tech" className="text-purple-400 hover:text-purple-300">axisrpg.tech</a>.
            </p>
            <p className="mt-4">
              Al usar la App, aceptas las prácticas descritas en esta política. Si no estás de acuerdo,
              por favor no utilices la App.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">1. Información que recopilamos</h2>

            <h3 className="text-lg font-semibold text-purple-300 mb-2">1.1 Información que tú nos proporcionas</h3>
            <ul className="list-disc list-inside space-y-2 ml-2">
              <li><strong>Nombre de usuario y contraseña</strong> — para crear y acceder a tu cuenta.</li>
              <li><strong>Datos de hábitos</strong> — hábitos que creas, completas y registras.</li>
              <li><strong>Metas personales</strong> — objetivos de vida, trimestrales, semanales y diarios que defines.</li>
              <li><strong>Sesiones de foco</strong> — duración y registros de tus sesiones de trabajo profundo.</li>
              <li><strong>Nombre del personaje</strong> — el nombre que eliges para tu personaje RPG.</li>
            </ul>

            <h3 className="text-lg font-semibold text-purple-300 mb-2 mt-6">1.2 Información recopilada automáticamente</h3>
            <ul className="list-disc list-inside space-y-2 ml-2">
              <li><strong>Datos de uso</strong> — páginas visitadas dentro de la App, funciones utilizadas.</li>
              <li><strong>Información del dispositivo</strong> — tipo de dispositivo, sistema operativo y navegador.</li>
              <li><strong>Registros del servidor</strong> — dirección IP, fecha y hora de acceso (retenidos por un máximo de 30 días).</li>
            </ul>

            <h3 className="text-lg font-semibold text-purple-300 mb-2 mt-6">1.3 Información que NO recopilamos</h3>
            <ul className="list-disc list-inside space-y-2 ml-2">
              <li>No recopilamos información de pago (la App es gratuita).</li>
              <li>No accedemos a tu cámara, micrófono, contactos ni galería de fotos.</li>
              <li>No recopilamos datos de ubicación.</li>
              <li>No usamos cookies de seguimiento de terceros.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">2. Cómo usamos tu información</h2>
            <p>Usamos la información recopilada exclusivamente para:</p>
            <ul className="list-disc list-inside space-y-2 ml-2 mt-3">
              <li>Proporcionar y mantener la funcionalidad de la App.</li>
              <li>Calcular los stats de tu personaje RPG basados en tus hábitos.</li>
              <li>Generar análisis y reportes dentro de la App para tu propio uso.</li>
              <li>Generar respuestas del Coach IA personalizadas a tu contexto (usando la API de Anthropic).</li>
              <li>Mejorar la experiencia de la App y corregir errores.</li>
              <li>Enviarte notificaciones de la App que tú mismo configures (recordatorios de hábitos).</li>
            </ul>
            <p className="mt-4">
              <strong>Nunca vendemos ni alquilamos tus datos personales a terceros.</strong>
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">3. Compartición de datos</h2>
            <p>Solo compartimos datos con los siguientes terceros, estrictamente necesarios para el funcionamiento:</p>

            <div className="mt-4 space-y-4">
              <div className="bg-[#12121a] rounded-lg p-4 border border-gray-800">
                <p className="font-semibold text-white">Anthropic (Coach IA)</p>
                <p className="text-sm text-gray-400 mt-1">
                  Cuando usas el Coach IA, enviamos a la API de Anthropic el contexto de tu personaje
                  (stats, hábitos recientes, nivel) para generar respuestas personalizadas.
                  Los datos enviados no incluyen información de identificación personal más allá del nombre de tu personaje.
                  Política de privacidad de Anthropic:{" "}
                  <a href="https://www.anthropic.com/privacy" className="text-purple-400 hover:text-purple-300" target="_blank" rel="noopener noreferrer">
                    anthropic.com/privacy
                  </a>
                </p>
              </div>

              <div className="bg-[#12121a] rounded-lg p-4 border border-gray-800">
                <p className="font-semibold text-white">Infraestructura de alojamiento</p>
                <p className="text-sm text-gray-400 mt-1">
                  La App se aloja en servidores propios. Los datos se almacenan en una base de datos
                  PostgreSQL en nuestro servidor privado. No utilizamos servicios de terceros para
                  el almacenamiento de datos de usuario.
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">4. Seguridad de los datos</h2>
            <ul className="list-disc list-inside space-y-2 ml-2">
              <li>Las contraseñas se almacenan cifradas usando bcrypt (nunca en texto plano).</li>
              <li>Toda la comunicación entre la App y el servidor usa HTTPS/TLS.</li>
              <li>El acceso a la base de datos está restringido y no es público.</li>
              <li>Los tokens de sesión (JWT) expiran automáticamente.</li>
            </ul>
            <p className="mt-4">
              Aunque implementamos medidas de seguridad razonables, ningún sistema es 100% seguro.
              Te recomendamos usar una contraseña única para esta App.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">5. Retención de datos</h2>
            <p>
              Conservamos tus datos mientras tu cuenta esté activa. Si solicitas la eliminación de tu cuenta,
              borraremos todos tus datos en un plazo máximo de 30 días, salvo que la ley nos obligue
              a conservarlos por más tiempo.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">6. Tus derechos</h2>
            <p>Tienes derecho a:</p>
            <ul className="list-disc list-inside space-y-2 ml-2 mt-3">
              <li><strong>Acceder</strong> a los datos personales que tenemos sobre ti.</li>
              <li><strong>Rectificar</strong> información incorrecta o desactualizada.</li>
              <li><strong>Eliminar</strong> tu cuenta y todos los datos asociados.</li>
              <li><strong>Exportar</strong> tus datos en formato legible (disponible próximamente).</li>
              <li><strong>Oponerte</strong> al procesamiento de tus datos.</li>
            </ul>
            <p className="mt-4">
              Para ejercer cualquiera de estos derechos, contacta con nosotros en{" "}
              <a href={`mailto:${CONTACT_EMAIL}`} className="text-purple-400 hover:text-purple-300">
                {CONTACT_EMAIL}
              </a>
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">7. Menores de edad</h2>
            <p>
              La App no está dirigida a personas menores de 13 años. No recopilamos conscientemente
              información de menores de 13 años. Si eres padre/madre y crees que tu hijo ha proporcionado
              datos personales, contáctanos para eliminarlos.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">8. Notificaciones push</h2>
            <p>
              La App puede solicitar permiso para enviar notificaciones locales (recordatorios de hábitos).
              Estas notificaciones se generan en tu propio dispositivo y no implican el envío de
              datos a ningún servidor externo. Puedes desactivarlas en cualquier momento desde la
              configuración de tu dispositivo o desde la sección Ajustes de la App.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">9. Cambios en esta política</h2>
            <p>
              Podemos actualizar esta política ocasionalmente. Cuando lo hagamos, actualizaremos la
              fecha de &quot;Última actualización&quot; en la parte superior de esta página. Te notificaremos
              de cambios significativos mediante un aviso visible en la App.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">10. Contacto</h2>
            <p>Si tienes preguntas sobre esta Política de Privacidad, puedes contactarnos en:</p>
            <div className="mt-4 bg-[#12121a] rounded-lg p-4 border border-gray-800">
              <p><strong>{COMPANY}</strong></p>
              <p>
                Email:{" "}
                <a href={`mailto:${CONTACT_EMAIL}`} className="text-purple-400 hover:text-purple-300">
                  {CONTACT_EMAIL}
                </a>
              </p>
              <p>
                Web:{" "}
                <a href="https://axisrpg.tech" className="text-purple-400 hover:text-purple-300">
                  axisrpg.tech
                </a>
              </p>
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}
