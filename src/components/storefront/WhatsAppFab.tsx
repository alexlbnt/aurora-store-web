import { DEFAULT_WHATSAPP_MESSAGE, whatsappLink } from "@/lib/contact";

// Botão fixo no canto da tela para chamar a equipe no WhatsApp.
// Link simples (sem JavaScript). Fica abaixo do menu lateral (z-40) para não cobri-lo.
export default function WhatsAppFab({ message = DEFAULT_WHATSAPP_MESSAGE }: { message?: string }) {
  return (
    <a
      href={whatsappLink(message)}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Falar com a equipe no WhatsApp (abre em nova aba)"
      className="print:hidden fixed z-30 right-4 bottom-[max(1rem,env(safe-area-inset-bottom))] sm:right-6 sm:bottom-6 inline-flex items-center gap-2 min-h-14 min-w-14 justify-center rounded-full bg-[#1f7a4d] hover:bg-[#17603c] text-white shadow-lg shadow-black/20 px-4 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1f7a4d]"
    >
      <svg viewBox="0 0 24 24" aria-hidden="true" className="size-6 fill-current">
        <path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm0 18.2a8.2 8.2 0 0 1-4.2-1.1l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2Zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8s-.4-.1-.6.1-.7.8-.8 1-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.3-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.8 11.9 11.9 0 0 0 4.6 4c1.7.7 2.4.8 3.2.7a2.8 2.8 0 0 0 1.8-1.3 2.3 2.3 0 0 0 .2-1.3c-.1-.1-.3-.2-.5-.3Z" />
      </svg>
      <span className="hidden sm:inline text-sm font-semibold">WhatsApp</span>
    </a>
  );
}
