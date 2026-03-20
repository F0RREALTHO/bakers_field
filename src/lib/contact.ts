const RAW_WHATSAPP_NUMBER =
  import.meta.env.VITE_WHATSAPP_NUMBER ?? "";
const RAW_COUNTRY_CODE = import.meta.env.VITE_WHATSAPP_COUNTRY_CODE ?? "91";

const normalizePhone = (value: string) => value.replace(/[^0-9]/g, "");

const withCountryCode = (value: string) => {
  const normalized = normalizePhone(value);
  if (!normalized) {
    return "";
  }
  if (normalized.length <= 10) {
    return `${normalizePhone(RAW_COUNTRY_CODE)}${normalized}`;
  }
  return normalized;
};

export const WHATSAPP_NUMBER = withCountryCode(RAW_WHATSAPP_NUMBER);

export const buildWhatsAppUrl = (message: string) => {
  const encoded = encodeURIComponent(message);
  return `https://api.whatsapp.com/send?phone=${WHATSAPP_NUMBER}&text=${encoded}`;
};

export const openWhatsAppChat = (message: string) => {
  const url = buildWhatsAppUrl(message);
  window.open(url, "_blank", "noopener,noreferrer");
};
