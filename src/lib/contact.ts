const RAW_WHATSAPP_NUMBER =
  import.meta.env.VITE_WHATSAPP_NUMBER ?? "8828094471";

const normalizePhone = (value: string) => value.replace(/[^0-9]/g, "");

export const WHATSAPP_NUMBER = normalizePhone(RAW_WHATSAPP_NUMBER);

export const buildWhatsAppUrl = (message: string) => {
  const encoded = encodeURIComponent(message);
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encoded}`;
};

export const openWhatsAppChat = (message: string) => {
  const url = buildWhatsAppUrl(message);
  window.open(url, "_blank", "noopener,noreferrer");
};
