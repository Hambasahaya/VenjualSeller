const PASSWORD_POLICY_REGEX =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/;

export const PASSWORD_POLICY_MESSAGE =
  "Password minimal 8 karakter dan wajib mengandung huruf besar, huruf kecil, angka, serta karakter spesial.";

export function validatePasswordPolicy(password: string): string | null {
  if (!password) {
    return "Password wajib diisi.";
  }

  if (!PASSWORD_POLICY_REGEX.test(password)) {
    return PASSWORD_POLICY_MESSAGE;
  }

  return null;
}

export function isPasswordPolicyValid(password: string): boolean {
  return validatePasswordPolicy(password) === null;
}
