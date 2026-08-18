export const isValidGmail = (email: string) => /^[^\s@]+@gmail\.com$/.test(email)

const SPECIAL_CHAR_REGEX = /[!@#$%^&*()_+\-={}\[\]|\\:;"'<>,.?/~`]/

export type PasswordRuleId =
  | 'minLength'
  | 'upperAndLower'
  | 'digit'
  | 'specialChar'
  | 'noSpace'

export type PasswordRule = {
  id: PasswordRuleId
  label: string
  test: (password: string) => boolean
}

export const PASSWORD_RULES: PasswordRule[] = [
  {
    id: 'minLength',
    label: 'Có độ dài tối thiểu 8 ký tự.',
    test: (password) => password.length >= 8,
  },
  {
    id: 'upperAndLower',
    label: 'Có ít nhất 1 ký tự viết hoa (A-Z) & 1 ký tự viết thường (a-z).',
    test: (password) => /[A-Z]/.test(password) && /[a-z]/.test(password),
  },
  {
    id: 'digit',
    label: 'Có ít nhất 1 chữ số (0-9).',
    test: (password) => /\d/.test(password),
  },
  {
    id: 'specialChar',
    label:
      'Có ít nhất 1 ký tự đặc biệt (!, @, #, $, %, ^, &, *, (, ), _, +, -, =, {, }, [, ], |, \\, :, ;, ", \', <, >, ,, ., ?, /, ~, `).',
    test: (password) => SPECIAL_CHAR_REGEX.test(password),
  },
  {
    id: 'noSpace',
    label: 'Không sử dụng dấu cách.',
    test: (password) => !/\s/.test(password),
  },
]

export function getPasswordRuleResults(password: string) {
  return PASSWORD_RULES.map((rule) => ({
    ...rule,
    passed: rule.test(password),
  }))
}

export const isPasswordValid = (password: string) =>
  PASSWORD_RULES.every((rule) => rule.test(password))
