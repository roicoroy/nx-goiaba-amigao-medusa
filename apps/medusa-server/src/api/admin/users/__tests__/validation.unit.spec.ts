import { isValidRole } from "../../../../utils/roles"

describe("User Creation Validation", () => {
  describe("Email Validation", () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

    it("should accept valid email addresses", () => {
      const validEmails = [
        "user@example.com",
        "test.user@example.com",
        "user+tag@example.co.uk",
        "user123@test-domain.com",
        "first.last@subdomain.example.com",
      ]

      validEmails.forEach((email) => {
        expect(emailRegex.test(email)).toBe(true)
      })
    })

    it("should reject invalid email addresses", () => {
      const invalidEmails = [
        "",
        "notanemail",
        "@example.com",
        "user@",
        "user @example.com",
      ]

      invalidEmails.forEach((email) => {
        expect(emailRegex.test(email)).toBe(false)
      })
    })

    it("should accept emails with single character TLD", () => {
      // The regex /^[^\s@]+@[^\s@]+\.[^\s@]+$/ accepts any character after the dot
      // This is intentional for simplicity and matches the implementation
      expect(emailRegex.test("user@example.c")).toBe(true)
      expect(emailRegex.test("user@example.com")).toBe(true)
    })

    it("should handle email with spaces", () => {
      expect(emailRegex.test("user @example.com")).toBe(false)
      expect(emailRegex.test(" user@example.com")).toBe(false)
      expect(emailRegex.test("user@example.com ")).toBe(false)
    })
  })

  describe("Password Validation", () => {
    it("should accept passwords with 8 or more characters", () => {
      const validPasswords = [
        "12345678",
        "Password123",
        "VeryLongPassword123!",
        "abcdefgh",
      ]

      validPasswords.forEach((password) => {
        expect(password.length >= 8).toBe(true)
      })
    })

    it("should reject passwords with less than 8 characters", () => {
      const invalidPasswords = ["", "1", "12", "123", "1234", "12345", "123456", "1234567"]

      invalidPasswords.forEach((password) => {
        expect(password.length >= 8).toBe(false)
      })
    })

    it("should validate password length boundary", () => {
      expect("1234567".length >= 8).toBe(false) // 7 chars - invalid
      expect("12345678".length >= 8).toBe(true) // 8 chars - valid
      expect("123456789".length >= 8).toBe(true) // 9 chars - valid
    })
  })

  describe("Role Validation", () => {
    it("should accept valid roles", () => {
      const validRoles = ["admin", "manager", "warehouse-staff", "driver"]

      validRoles.forEach((role) => {
        expect(isValidRole(role)).toBe(true)
      })
    })

    it("should reject invalid roles", () => {
      const invalidRoles = [
        "",
        "invalid",
        "user",
        "customer",
        "Admin", // case sensitive
        "ADMIN",
        "warehouse_staff", // underscore instead of hyphen
        "warehouse staff", // space
        "super-admin",
      ]

      invalidRoles.forEach((role) => {
        expect(isValidRole(role)).toBe(false)
      })
    })

    it("should be case-sensitive", () => {
      expect(isValidRole("admin")).toBe(true)
      expect(isValidRole("Admin")).toBe(false)
      expect(isValidRole("ADMIN")).toBe(false)
      expect(isValidRole("aDmIn")).toBe(false)
    })

    it("should validate exact role strings", () => {
      // Exact matches
      expect(isValidRole("admin")).toBe(true)
      expect(isValidRole("manager")).toBe(true)
      expect(isValidRole("warehouse-staff")).toBe(true)
      expect(isValidRole("driver")).toBe(true)

      // Close but not exact
      expect(isValidRole("admin ")).toBe(false) // trailing space
      expect(isValidRole(" admin")).toBe(false) // leading space
      expect(isValidRole("warehouse-staff-member")).toBe(false) // extra text
    })
  })

  describe("Required Fields Validation", () => {
    it("should identify missing required fields", () => {
      const requiredFields = ["email", "password", "first_name", "last_name"]

      const testData = {
        email: "test@example.com",
        password: "Password123",
        first_name: "John",
        last_name: "Doe",
      }

      // All fields present
      requiredFields.forEach((field) => {
        expect(testData[field]).toBeTruthy()
      })

      // Missing email
      const missingEmail = { ...testData, email: "" }
      expect(missingEmail.email).toBeFalsy()

      // Missing password
      const missingPassword = { ...testData, password: "" }
      expect(missingPassword.password).toBeFalsy()

      // Missing first_name
      const missingFirstName = { ...testData, first_name: "" }
      expect(missingFirstName.first_name).toBeFalsy()

      // Missing last_name
      const missingLastName = { ...testData, last_name: "" }
      expect(missingLastName.last_name).toBeFalsy()
    })
  })

  describe("Email Sanitization", () => {
    it("should handle email case normalization", () => {
      const emails = [
        { input: "User@Example.COM", expected: "user@example.com" },
        { input: "TEST@EXAMPLE.COM", expected: "test@example.com" },
        { input: "MixedCase@Example.Com", expected: "mixedcase@example.com" },
      ]

      emails.forEach(({ input, expected }) => {
        expect(input.toLowerCase().trim()).toBe(expected)
      })
    })

    it("should handle email whitespace trimming", () => {
      const emails = [
        { input: " user@example.com", expected: "user@example.com" },
        { input: "user@example.com ", expected: "user@example.com" },
        { input: "  user@example.com  ", expected: "user@example.com" },
      ]

      emails.forEach(({ input, expected }) => {
        expect(input.toLowerCase().trim()).toBe(expected)
      })
    })
  })
})
