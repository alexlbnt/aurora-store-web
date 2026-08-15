export const formatPhone = (value: string) => {
  if (!value) return "";
  let v = value.replace(/\D/g, "").slice(0, 11);
  if (v.length > 10) {
    return `(${v.slice(0, 2)}) ${v.slice(2, 7)}-${v.slice(7)}`;
  } else if (v.length > 6) {
    return `(${v.slice(0, 2)}) ${v.slice(2, 6)}-${v.slice(6)}`;
  } else if (v.length > 2) {
    return `(${v.slice(0, 2)}) ${v.slice(2)}`;
  }
  return v;
};
